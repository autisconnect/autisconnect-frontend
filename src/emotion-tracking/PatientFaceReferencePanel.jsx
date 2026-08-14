import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import {
    ArrowClockwise,
    CameraVideoFill,
    Cpu,
    ShieldCheck,
    Trash3,
    Upload
} from 'react-bootstrap-icons';
import {
    deletePatientFaceReference,
    fetchPatientFaceReference,
    resolveEmotionServiceErrorMessage,
    savePatientFaceReference
} from './emotionService';
import {
    DETECTION_CONFIG,
    formatConfidence,
    normalizeFaceDescriptor
} from './emotionUtils';
import './PatientFaceReferencePanel.css';

let sharedModelsReady = false;
let sharedModelLoadPromise = null;
let sharedProcessingMode = '';
const RECOGNITION_MODEL_TIMEOUT_MS = 20000;
const CAMERA_BOOT_TIMEOUT_MS = 8000;

function createEmptyFaceReferenceState() {
    return {
        hasReference: false,
        descriptor: null,
        referenceImageData: null,
        captureMode: 'upload',
        faceConfidence: null,
        matchThreshold: DETECTION_CONFIG.faceMatchThreshold,
        createdAt: null,
        updatedAt: null
    };
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem selecionada.'));
        reader.readAsDataURL(file);
    });
}

function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Nao foi possivel carregar a imagem enviada.'));
        image.src = src;
    });
}

function buildReferencePreview(image) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        return null;
    }

    const maxSide = 320;
    const scale = Math.min(maxSide / image.width, maxSide / image.height, 1);
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    return canvas.toDataURL('image/jpeg', 0.86);
}

function mapFaceReferencePayload(payload, fallback = {}) {
    if (!payload?.hasReference) {
        return createEmptyFaceReferenceState();
    }

    const descriptor = normalizeFaceDescriptor(payload.descriptor || fallback.descriptor);

    return {
        hasReference: true,
        descriptor,
        referenceImageData: payload.referenceImageData || fallback.referenceImageData || null,
        captureMode: payload.captureMode || fallback.captureMode || 'upload',
        faceConfidence: Number.isFinite(Number(payload.faceConfidence))
            ? Number(payload.faceConfidence)
            : (Number.isFinite(Number(fallback.faceConfidence)) ? Number(fallback.faceConfidence) : null),
        matchThreshold: Number.isFinite(Number(payload.matchThreshold))
            ? Number(payload.matchThreshold)
            : DETECTION_CONFIG.faceMatchThreshold,
        createdAt: payload.createdAt || fallback.createdAt || null,
        updatedAt: payload.updatedAt || fallback.updatedAt || null
    };
}

function areRecognitionModelsLoaded(faceapi) {
    return Boolean(
        faceapi?.nets?.tinyFaceDetector?.isLoaded
        && faceapi?.nets?.faceLandmark68Net?.isLoaded
        && faceapi?.nets?.faceRecognitionNet?.isLoaded
    );
}

function withTimeout(promise, timeoutMs, message) {
    return new Promise((resolve, reject) => {
        const timerId = window.setTimeout(() => {
            reject(new Error(message));
        }, timeoutMs);

        Promise.resolve(promise)
            .then((result) => {
                window.clearTimeout(timerId);
                resolve(result);
            })
            .catch((error) => {
                window.clearTimeout(timerId);
                reject(error);
            });
    });
}

function waitForVideoReadiness(videoElement) {
    return withTimeout(
        new Promise((resolve, reject) => {
            if (!videoElement) {
                reject(new Error('Nao foi possivel preparar a visualizacao da camera.'));
                return;
            }

            const handleReady = () => {
                if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                    cleanup();
                    resolve();
                }
            };

            const handleError = () => {
                cleanup();
                reject(new Error('Nao foi possivel exibir a imagem da camera.'));
            };

            const cleanup = () => {
                videoElement.removeEventListener('loadeddata', handleReady);
                videoElement.removeEventListener('canplay', handleReady);
                videoElement.removeEventListener('error', handleError);
            };

            if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
                && videoElement.videoWidth > 0
                && videoElement.videoHeight > 0) {
                resolve();
                return;
            }

            videoElement.addEventListener('loadeddata', handleReady);
            videoElement.addEventListener('canplay', handleReady);
            videoElement.addEventListener('error', handleError);
        }),
        CAMERA_BOOT_TIMEOUT_MS,
        'A camera demorou para exibir imagem. Feche outras abas ou aplicativos que usem a webcam e tente novamente.'
    );
}

function convertCanvasToJpegFile(canvas, fileName) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Nao foi possivel gerar a foto capturada.'));
                return;
            }

            resolve(new File([blob], fileName, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.92);
    });
}

function mapCameraCaptureError(error) {
    const errorName = error?.name || '';

    if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
        return 'Permissao de camera negada. Autorize o acesso e tente novamente.';
    }

    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        return 'Nenhuma camera disponivel foi encontrada neste dispositivo.';
    }

    if (errorName === 'NotReadableError' || errorName === 'TrackStartError' || errorName === 'AbortError') {
        return 'A camera esta em uso por outro aplicativo ou aba. Feche outros acessos a webcam e tente novamente.';
    }

    if (errorName === 'OverconstrainedError') {
        return 'Nao foi possivel iniciar a camera com esta configuracao. Tente novamente.';
    }

    return error?.message || 'Nao foi possivel iniciar a camera para capturar a foto.';
}

async function loadFaceApiNetIfNeeded(net, timeoutMessage) {
    if (!net) {
        throw new Error('O modelo facial necessario nao esta disponivel nesta pagina.');
    }

    if (net.isLoaded) {
        return;
    }

    await withTimeout(
        net.loadFromUri('/models'),
        RECOGNITION_MODEL_TIMEOUT_MS,
        timeoutMessage
    );
}

async function ensureRecognitionModelsLoaded() {
    const tf = window.tf;
    const faceapi = window.faceapi;

    if (!tf || !faceapi) {
        throw new Error('As bibliotecas de IA facial nao foram carregadas nesta pagina.');
    }

    if (sharedModelsReady || areRecognitionModelsLoaded(faceapi)) {
        sharedModelsReady = true;
        if (!sharedProcessingMode) {
            sharedProcessingMode = tf.getBackend?.() === 'webgl'
                ? 'Processamento acelerado'
                : 'Modo compatibilidade';
        }

        return {
            processingMode: sharedProcessingMode
        };
    }

    if (!sharedModelLoadPromise) {
        sharedModelLoadPromise = (async () => {
            try {
                let processingMode = 'Processamento acelerado';

                try {
                    await tf.setBackend('webgl');
                    await tf.ready();
                } catch (backendError) {
                    await tf.setBackend('cpu');
                    await tf.ready();
                    processingMode = 'Modo compatibilidade';
                }

                await loadFaceApiNetIfNeeded(
                    faceapi.nets.tinyFaceDetector,
                    'O detector facial demorou para responder. Tente novamente em alguns segundos.'
                );
                await loadFaceApiNetIfNeeded(
                    faceapi.nets.faceLandmark68Net,
                    'Os pontos faciais demoraram para carregar. Recarregue a pagina e tente novamente.'
                );
                await loadFaceApiNetIfNeeded(
                    faceapi.nets.faceRecognitionNet,
                    'O reconhecimento facial demorou para iniciar. Recarregue a pagina e tente novamente.'
                );

                sharedModelsReady = true;
                sharedProcessingMode = processingMode;

                return {
                    processingMode
                };
            } catch (error) {
                sharedModelsReady = false;
                sharedProcessingMode = '';
                throw new Error('Nao foi possivel preparar os modelos faciais. Recarregue a pagina e tente novamente.');
            } finally {
                sharedModelLoadPromise = null;
            }
        })();
    }

    return sharedModelLoadPromise;
}

const PatientFaceReferencePanel = ({
    patientId,
    onOpenMonitor = null,
    onReferenceChange = null,
    openMonitorLabel = 'Abrir detector emocional',
    title = 'Referencia facial do paciente',
    description = 'Cadastre uma foto frontal e bem iluminada para que o monitoramento emocional reconheca apenas a pessoa correta.'
}) => {
    const mountedRef = useRef(true);
    const inputRef = useRef(null);
    const cameraVideoRef = useRef(null);
    const cameraCanvasRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const referenceRequestVersionRef = useRef(0);
    const cameraRequestVersionRef = useRef(0);
    const [faceReference, setFaceReference] = useState(createEmptyFaceReferenceState);
    const [modelsReady, setModelsReady] = useState(sharedModelsReady);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [processingMode, setProcessingMode] = useState(sharedProcessingMode);
    const [referenceLoading, setReferenceLoading] = useState(false);
    const [referenceSaving, setReferenceSaving] = useState(false);
    const [showCameraCapture, setShowCameraCapture] = useState(false);
    const [cameraStarting, setCameraStarting] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');

    const stopCameraCaptureStream = useCallback((resetState = true) => {
        const activeStream = cameraStreamRef.current;
        cameraStreamRef.current = null;

        if (activeStream?.getTracks) {
            activeStream.getTracks().forEach((track) => {
                try {
                    track.stop();
                } catch (streamError) {
                    /* noop */
                }
            });
        }

        const videoElement = cameraVideoRef.current;

        if (videoElement) {
            try {
                videoElement.pause();
            } catch (videoError) {
                /* noop */
            }

            videoElement.srcObject = null;
        }

        if (resetState && mountedRef.current) {
            setCameraStarting(false);
            setCameraReady(false);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            stopCameraCaptureStream(false);
        };
    }, [stopCameraCaptureStream]);

    const emitReferenceChange = useCallback((nextReference) => {
        if (typeof onReferenceChange === 'function') {
            onReferenceChange(nextReference);
        }
    }, [onReferenceChange]);

    const loadModels = useCallback(async () => {
        if (sharedModelsReady) {
            setModelsReady(true);

            if (sharedProcessingMode) {
                setProcessingMode(sharedProcessingMode);
            }

            return true;
        }

        setModelsLoading(true);
        setError('');

        try {
            const result = await ensureRecognitionModelsLoaded();

            if (!mountedRef.current) {
                return false;
            }

            setModelsReady(true);
            setProcessingMode(result.processingMode || sharedProcessingMode);
            return true;
        } catch (loadError) {
            if (mountedRef.current) {
                setModelsReady(false);
                setError(loadError.message || 'Nao foi possivel preparar os modelos faciais.');
            }

            return false;
        } finally {
            if (mountedRef.current) {
                setModelsLoading(false);
            }
        }
    }, []);

    const loadReference = useCallback(async () => {
        if (!patientId) {
            setFaceReference(createEmptyFaceReferenceState());
            setError('');
            setInfoMessage('');
            return;
        }

        const requestVersion = referenceRequestVersionRef.current + 1;
        referenceRequestVersionRef.current = requestVersion;
        setReferenceLoading(true);
        setError('');
        setInfoMessage('');

        try {
            const payload = await fetchPatientFaceReference(patientId);

            if (!mountedRef.current || requestVersion !== referenceRequestVersionRef.current) {
                return;
            }

            const nextReference = mapFaceReferencePayload(payload);
            setFaceReference(nextReference);
            emitReferenceChange(nextReference);
        } catch (loadError) {
            if (!mountedRef.current || requestVersion !== referenceRequestVersionRef.current) {
                return;
            }

            setFaceReference(createEmptyFaceReferenceState());
            setError(resolveEmotionServiceErrorMessage(loadError, {
                timeoutMessage: 'A referencia facial demorou para responder. Tente novamente em alguns instantes.',
                networkMessage: 'Nao foi possivel carregar a referencia facial porque o servidor nao respondeu.',
                fallbackMessage: 'Nao foi possivel carregar a referencia facial deste paciente.'
            }));
        } finally {
            if (mountedRef.current) {
                setReferenceLoading(false);
            }
        }
    }, [emitReferenceChange, patientId]);

    useEffect(() => {
        void loadReference();
    }, [loadReference]);

    const saveFaceReferenceFromFile = useCallback(async (file, captureMode = 'upload') => {
        if (!file || !patientId) {
            return { success: false, message: '' };
        }

        const ready = modelsReady ? true : await loadModels();

        if (!ready) {
            return { success: false, message: 'Nao foi possivel preparar os modelos faciais para validar a foto.' };
        }

        const faceapi = window.faceapi;

        if (!faceapi) {
            setError('A biblioteca de reconhecimento facial nao esta disponivel nesta pagina.');
            return {
                success: false,
                message: 'A biblioteca de reconhecimento facial nao esta disponivel nesta pagina.'
            };
        }

        setReferenceSaving(true);
        setError('');
        setInfoMessage('');
        referenceRequestVersionRef.current += 1;

        if (captureMode === 'camera') {
            setCameraError('');
        }

        try {
            const sourceDataUrl = await readFileAsDataUrl(file);
            const image = await loadImageElement(sourceDataUrl);
            const detections = await faceapi
                .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,
                    scoreThreshold: Math.max(0.3, DETECTION_CONFIG.minFaceConfidence - 0.15)
                }))
                .withFaceLandmarks()
                .withFaceDescriptors();

            if (!Array.isArray(detections) || detections.length === 0) {
                throw new Error('Nenhuma face foi encontrada na foto enviada. Use uma imagem frontal e bem iluminada.');
            }

            if (detections.length > 1) {
                throw new Error('A foto de referencia deve conter apenas uma pessoa. Remova outras faces e tente novamente.');
            }

            const descriptor = Array.from(detections[0].descriptor || []);
            const previewDataUrl = buildReferencePreview(image) || sourceDataUrl;
            const payload = await savePatientFaceReference(patientId, {
                descriptor,
                referenceImageData: previewDataUrl,
                captureMode,
                faceConfidence: detections[0]?.detection?.score || null,
                matchThreshold: DETECTION_CONFIG.faceMatchThreshold
            });

            if (!mountedRef.current) {
                return;
            }

            const nextReference = mapFaceReferencePayload(payload, {
                descriptor,
                referenceImageData: previewDataUrl,
                captureMode,
                faceConfidence: detections[0]?.detection?.score || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            setFaceReference(nextReference);
            emitReferenceChange(nextReference);
            setInfoMessage(
                captureMode === 'camera'
                    ? 'Foto capturada e referencia facial salvas com sucesso.'
                    : 'Referencia facial salva com sucesso. O monitoramento agora procurara exatamente a face cadastrada.'
            );
            return { success: true, message: '' };
        } catch (saveError) {
            const message = resolveEmotionServiceErrorMessage(saveError, {
                timeoutMessage: 'O salvamento da referencia facial demorou mais do que o esperado. Tente novamente.',
                networkMessage: 'Nao foi possivel salvar a referencia facial porque o servidor nao respondeu.',
                fallbackMessage: 'Nao foi possivel salvar a referencia facial do paciente.'
            });

            if (mountedRef.current) {
                if (captureMode === 'camera') {
                    setCameraError(message);
                } else {
                    setError(message);
                }
            }

            return { success: false, message };
        } finally {
            if (mountedRef.current) {
                setReferenceSaving(false);
            }

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    }, [emitReferenceChange, loadModels, modelsReady, patientId]);

    const handleFileChange = useCallback(async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        await saveFaceReferenceFromFile(file);
    }, [saveFaceReferenceFromFile]);

    const handleRemove = useCallback(async () => {
        if (!patientId) {
            return;
        }

        setReferenceSaving(true);
        setError('');
        setInfoMessage('');
        referenceRequestVersionRef.current += 1;

        try {
            await deletePatientFaceReference(patientId);

            if (!mountedRef.current) {
                return;
            }

            const emptyReference = createEmptyFaceReferenceState();
            setFaceReference(emptyReference);
            emitReferenceChange(emptyReference);
            setInfoMessage('Referencia facial removida. Cadastre uma nova foto antes do proximo monitoramento.');
        } catch (removeError) {
            if (mountedRef.current) {
                setError(resolveEmotionServiceErrorMessage(removeError, {
                    timeoutMessage: 'A remocao da referencia facial demorou mais do que o esperado. Tente novamente.',
                    networkMessage: 'Nao foi possivel remover a referencia facial porque o servidor nao respondeu.',
                    fallbackMessage: 'Nao foi possivel remover a referencia facial deste paciente.'
                }));
            }
        } finally {
            if (mountedRef.current) {
                setReferenceSaving(false);
            }

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    }, [emitReferenceChange, patientId]);

    const startCameraCapture = useCallback(async () => {
        if (!patientId) {
            return;
        }

        if (!navigator?.mediaDevices?.getUserMedia) {
            setCameraError('Este navegador nao oferece suporte a captura por camera.');
            return;
        }

        const requestVersion = cameraRequestVersionRef.current + 1;
        cameraRequestVersionRef.current = requestVersion;
        stopCameraCaptureStream();
        setCameraStarting(true);
        setCameraReady(false);
        setCameraError('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            if (!mountedRef.current || requestVersion !== cameraRequestVersionRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            cameraStreamRef.current = stream;

            const videoElement = cameraVideoRef.current;

            if (!videoElement) {
                throw new Error('Nao foi possivel preparar a visualizacao da camera.');
            }

            videoElement.srcObject = stream;
            videoElement.muted = true;
            videoElement.playsInline = true;

            try {
                await videoElement.play();
            } catch (playError) {
                /* alguns navegadores liberam a imagem mesmo sem play explicito */
            }

            await waitForVideoReadiness(videoElement);

            if (!mountedRef.current || requestVersion !== cameraRequestVersionRef.current) {
                stopCameraCaptureStream(false);
                return;
            }

            setCameraReady(true);
        } catch (cameraOpenError) {
            stopCameraCaptureStream();

            if (mountedRef.current) {
                setCameraError(mapCameraCaptureError(cameraOpenError));
            }
        } finally {
            if (mountedRef.current) {
                setCameraStarting(false);
            }
        }
    }, [patientId, stopCameraCaptureStream]);

    const openCameraCapture = useCallback(() => {
        if (!patientId) {
            return;
        }

        setShowCameraCapture(true);
        setCameraReady(false);
        setCameraError('');
        setError('');
        setInfoMessage('');
    }, [patientId]);

    const closeCameraCapture = useCallback(() => {
        cameraRequestVersionRef.current += 1;
        stopCameraCaptureStream();
        setShowCameraCapture(false);
        setCameraError('');
    }, [stopCameraCaptureStream]);

    const handleCapturePhoto = useCallback(async () => {
        if (!patientId) {
            return;
        }

        const videoElement = cameraVideoRef.current;
        const canvasElement = cameraCanvasRef.current;

        if (!videoElement || !canvasElement) {
            setCameraError('Nao foi possivel acessar a imagem da camera para capturar a foto.');
            return;
        }

        const width = videoElement.videoWidth;
        const height = videoElement.videoHeight;

        if (!width || !height) {
            setCameraError('A imagem da camera ainda nao esta pronta para captura.');
            return;
        }

        const context = canvasElement.getContext('2d');

        if (!context) {
            setCameraError('Nao foi possivel preparar a foto capturada.');
            return;
        }

        canvasElement.width = width;
        canvasElement.height = height;
        context.drawImage(videoElement, 0, 0, width, height);

        try {
            const file = await convertCanvasToJpegFile(
                canvasElement,
                `patient-face-reference-${patientId}-${Date.now()}.jpg`
            );

            const result = await saveFaceReferenceFromFile(file, 'camera');

            if (result?.success) {
                closeCameraCapture();
            } else if (mountedRef.current && result?.message) {
                setCameraError(result.message);
            }
        } catch (captureError) {
            if (mountedRef.current) {
                setCameraError(captureError.message || 'Nao foi possivel capturar a foto do paciente.');
            }
        }
    }, [closeCameraCapture, patientId, saveFaceReferenceFromFile]);

    const lastUpdatedLabel = useMemo(() => {
        const baseDate = faceReference.updatedAt || faceReference.createdAt;
        return baseDate ? new Date(baseDate).toLocaleString('pt-BR') : 'Ainda nao cadastrada';
    }, [faceReference.createdAt, faceReference.updatedAt]);

    const isActionBusy = referenceSaving || modelsLoading || cameraStarting;
    const isRefreshBusy = isActionBusy || referenceLoading;

    return (
        <div className="patient-face-reference-panel">
            {error ? <Alert variant="danger" className="patient-face-reference-panel__alert">{error}</Alert> : null}
            {infoMessage ? <Alert variant="success" className="patient-face-reference-panel__alert">{infoMessage}</Alert> : null}

            <div className="patient-face-reference-panel__surface">
                <div className="patient-face-reference-panel__preview">
                    {faceReference.referenceImageData ? (
                        <img src={faceReference.referenceImageData} alt="Referencia facial do paciente" />
                    ) : (
                        <div className="patient-face-reference-panel__placeholder">
                            <CameraVideoFill size={22} />
                            <span>Sem foto cadastrada</span>
                        </div>
                    )}

                    {referenceLoading ? (
                        <div className="patient-face-reference-panel__preview-busy">
                            <Spinner animation="border" size="sm" />
                            <span>Carregando referencia...</span>
                        </div>
                    ) : null}
                </div>

                <div className="patient-face-reference-panel__content">
                    <div className="patient-face-reference-panel__header">
                        <div>
                            <h4>{title}</h4>
                            <p>{description}</p>
                        </div>
                        <div className="patient-face-reference-panel__chips">
                            <span className={`patient-face-reference-panel__chip ${faceReference.hasReference ? 'is-ready' : 'is-pending'}`}>
                                <ShieldCheck size={14} />
                                {faceReference.hasReference ? 'Referencia pronta' : 'Cadastro pendente'}
                            </span>
                            {processingMode ? (
                                <span className="patient-face-reference-panel__chip is-mode">
                                    <Cpu size={14} />
                                    {processingMode}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="patient-face-reference-panel__meta">
                        <div className="patient-face-reference-panel__meta-item">
                            <span>Status</span>
                            <strong>{faceReference.hasReference ? 'Referencia valida' : 'Aguardando foto'}</strong>
                        </div>
                        <div className="patient-face-reference-panel__meta-item">
                            <span>Confianca inicial</span>
                            <strong>{faceReference.faceConfidence !== null ? formatConfidence(faceReference.faceConfidence) : 'N/A'}</strong>
                        </div>
                        <div className="patient-face-reference-panel__meta-item">
                            <span>Atualizada em</span>
                            <strong>{lastUpdatedLabel}</strong>
                        </div>
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="patient-face-reference-panel__input"
                        onChange={handleFileChange}
                        disabled={referenceSaving}
                        hidden
                        aria-hidden="true"
                        tabIndex={-1}
                    />

                    <div className="patient-face-reference-panel__actions">
                        <Button
                            variant="outline-primary"
                            onClick={() => void openCameraCapture()}
                            disabled={isActionBusy || !patientId}
                        >
                            <CameraVideoFill className="me-2" />
                            Tirar foto
                        </Button>

                        <Button
                            variant="primary"
                            onClick={() => inputRef.current?.click()}
                            disabled={isActionBusy || !patientId}
                        >
                            <Upload className="me-2" />
                            {faceReference.hasReference ? 'Substituir foto' : 'Cadastrar foto'}
                        </Button>

                        <Button
                            variant="outline-secondary"
                            onClick={() => void loadReference()}
                            disabled={isRefreshBusy || !patientId}
                        >
                            <ArrowClockwise className="me-2" />
                            Atualizar
                        </Button>

                        {typeof onOpenMonitor === 'function' ? (
                            <Button
                                variant="outline-primary"
                                onClick={onOpenMonitor}
                                disabled={isActionBusy || !patientId}
                            >
                                <CameraVideoFill className="me-2" />
                                {openMonitorLabel}
                            </Button>
                        ) : null}

                        <Button
                            variant="outline-danger"
                            onClick={() => void handleRemove()}
                            disabled={!faceReference.hasReference || isActionBusy}
                        >
                            <Trash3 className="me-2" />
                            Remover
                        </Button>
                    </div>

                    <div className="patient-face-reference-panel__helper">
                        <span>Use uma foto frontal, com boa iluminacao e apenas uma pessoa enquadrada.</span>
                        {modelsLoading ? (
                            <span className="patient-face-reference-panel__busy">
                                <Spinner animation="border" size="sm" />
                                Preparando reconhecimento facial...
                            </span>
                        ) : null}
                        {referenceLoading ? (
                            <span className="patient-face-reference-panel__busy">
                                <Spinner animation="border" size="sm" />
                                Atualizando referencia...
                            </span>
                        ) : null}
                        {referenceSaving ? (
                            <span className="patient-face-reference-panel__busy">
                                <Spinner animation="border" size="sm" />
                                Salvando referencia facial...
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            <Modal
                show={showCameraCapture}
                onHide={closeCameraCapture}
                onEntered={() => {
                    void startCameraCapture();
                }}
                centered
                size="lg"
                className="patient-face-reference-panel__modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Capturar foto do paciente</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="patient-face-reference-panel__camera-shell">
                        <div className="patient-face-reference-panel__camera-frame">
                            <video
                                ref={cameraVideoRef}
                                className="patient-face-reference-panel__camera-video"
                                autoPlay
                                muted
                                playsInline
                            />
                            <div className="patient-face-reference-panel__camera-target" />
                            {!cameraReady ? (
                                <div className="patient-face-reference-panel__camera-overlay">
                                    <Spinner animation="border" />
                                    <span>{cameraStarting ? 'Abrindo camera...' : 'Aguardando imagem da camera...'}</span>
                                </div>
                            ) : (
                                <div className="patient-face-reference-panel__camera-guide">
                                    Centralize apenas o rosto do paciente dentro da area destacada.
                                </div>
                            )}
                        </div>

                        <canvas ref={cameraCanvasRef} className="patient-face-reference-panel__camera-canvas" />

                        {cameraError ? (
                            <Alert variant="danger" className="patient-face-reference-panel__alert">
                                {cameraError}
                            </Alert>
                        ) : null}

                        <p className="patient-face-reference-panel__camera-tip">
                            Capture a foto de frente, com boa iluminacao e sem outras pessoas no enquadramento.
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="outline-secondary"
                        onClick={closeCameraCapture}
                        disabled={referenceSaving}
                    >
                        Cancelar
                    </Button>

                    {cameraError ? (
                        <Button
                            variant="outline-primary"
                            onClick={() => void startCameraCapture()}
                            disabled={cameraStarting || referenceSaving}
                        >
                            <ArrowClockwise className="me-2" />
                            Tentar novamente
                        </Button>
                    ) : null}

                    <Button
                        variant="primary"
                        onClick={() => void handleCapturePhoto()}
                        disabled={!cameraReady || cameraStarting || referenceSaving}
                    >
                        {referenceSaving ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <CameraVideoFill className="me-2" />
                                Capturar e salvar
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default PatientFaceReferencePanel;
