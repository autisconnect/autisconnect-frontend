import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Spinner
} from 'react-bootstrap';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import {
    Activity,
    ArrowClockwise,
    BarChartLine,
    CameraVideoFill,
    ClockHistory,
    Cpu,
    ExclamationTriangleFill,
    PauseCircleFill,
    PersonBoundingBox,
    PersonCheckFill,
    ShieldCheck,
    Stars,
    StopCircleFill,
    Trash3,
    Upload
} from 'react-bootstrap-icons';
import logonovo from '../assets/logonovo.png';
import {
    deletePatientFaceReference,
    fetchEmotionHistory,
    fetchPatientFaceReference,
    saveEmotionRecord,
    savePatientFaceReference
} from './emotionService';
import {
    buildCompatibilityPayload,
    buildEmotionEvent,
    buildPositioningWarnings,
    calculateDescriptorDistance,
    calculateDetectionQuality,
    calculateEmotionStability,
    calculateSessionMetrics,
    DETECTION_CONFIG,
    EMOTION_COLORS,
    EMOTION_TRANSLATIONS,
    formatConfidence,
    formatDuration,
    formatTimestamp,
    generateSessionInsights,
    getDominantEmotion,
    getEmotionLabel,
    groupRecordsIntoSessions,
    normalizeFaceDescriptor,
    normalizeEmotionRecord,
    selectFaceByReference,
    updateEmotionBuffer,
    VALID_EMOTIONS
} from './emotionUtils';
import '../App.css';
import './EmotionDetector.css';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const STATUS_LABELS = {
    idle: 'Pronto para iniciar',
    'loading-models': 'Preparando inteligência artificial...',
    ready: 'IA pronta',
    'starting-camera': 'Ativando câmera...',
    'searching-face': 'Procurando face...',
    stabilizing: 'Estabilizando análise...',
    monitoring: 'Análise estável',
    'face-lost': 'Face perdida...',
    paused: 'Monitoramento pausado',
    error: 'Erro no monitoramento'
};

function createEmptyEmotionState() {
    return {
        key: null,
        label: 'Aguardando análise',
        confidence: 0,
        stable: false,
        since: null
    };
}

function createEmptyRawEmotionState() {
    return {
        key: null,
        label: 'Aguardando análise',
        confidence: 0,
        inconclusive: true
    };
}

function createEmptyFaceState() {
    return {
        mode: 'searching-face',
        multipleFaces: false,
        message: 'Procurando pessoa monitorada...',
        quality: {
            label: 'Regular',
            tone: 'regular',
            score: 0
        },
        warnings: []
    };
}

function mapCameraError(error) {
    switch (error?.name) {
    case 'NotAllowedError':
        return 'Câmera bloqueada. Autorize o acesso à câmera para iniciar o monitoramento.';
    case 'NotFoundError':
        return 'Nenhuma câmera encontrada neste dispositivo.';
    case 'NotReadableError':
        return 'A câmera está em uso por outro aplicativo ou não pôde ser acessada.';
    case 'OverconstrainedError':
        return 'A câmera disponível não atende às configurações necessárias para o monitoramento.';
    default:
        return 'Não foi possível acessar a webcam. Verifique as permissões do navegador e tente novamente.';
    }
}

function dedupeRecords(records = []) {
    const map = new Map();

    records
        .map(normalizeEmotionRecord)
        .filter(Boolean)
        .forEach((record) => {
            const key = `${record.timestamp}-${record.emotion}`;
            const existing = map.get(key);

            if (!existing || record.source === 'session') {
                map.set(key, record);
            }
        });

    return [...map.values()].sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
}

function recordFromEvent(event) {
    return normalizeEmotionRecord({
        id: event.id,
        emotion: event.emotion,
        timestamp: event.startedAt,
        confidence: event.averageConfidence,
        durationMs: event.durationMs,
        source: event.source || 'session'
    });
}

function calculateMonitoredDuration(session, nowMs) {
    if (!session?.startedAt) {
        return 0;
    }

    const startedAtMs = new Date(session.startedAt).getTime();
    const pausedAtMs = session.pausedAt ? new Date(session.pausedAt).getTime() : null;
    const endedAtMs = session.endedAt ? new Date(session.endedAt).getTime() : null;
    const activeBoundaryMs = session.status === 'active'
        ? nowMs
        : session.status === 'paused'
            ? pausedAtMs
            : endedAtMs;

    if (!activeBoundaryMs) {
        return 0;
    }

    return Math.max(0, activeBoundaryMs - startedAtMs - (session.totalPausedMs || 0));
}

function buildChartScopeLabel(periodFilter) {
    switch (periodFilter) {
    case 'session':
        return 'Sessão atual';
    case 'today':
        return 'Hoje';
    case 'week':
        return 'Últimos 7 dias';
    case 'month':
        return 'Últimos 30 dias';
    case 'custom':
        return 'Data específica';
    default:
        return 'Histórico';
    }
}

function buildSessionLabel(session, index) {
    const baseDate = new Date(session.startedAt).toLocaleDateString('pt-BR');
    if (index === 0) {
        return 'Sessão atual';
    }

    return `${baseDate} • ${formatTimestamp(session.startedAt)}`;
}

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
        image.onerror = () => reject(new Error('Nao foi possivel carregar a imagem de referencia.'));
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

const EmotionDetector = () => {
    const location = useLocation();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const loopFrameRef = useRef(null);
    const lastInferenceAtRef = useRef(0);
    const isInferenceRunningRef = useRef(false);
    const monitoringEnabledRef = useRef(false);
    const lightingCanvasRef = useRef(null);
    const modelsLoadedRef = useRef(false);
    const sessionRef = useRef(null);
    const targetFaceRef = useRef(null);
    const lastTargetBoxRef = useRef(null);
    const targetLostFramesRef = useRef(0);
    const emotionBufferRef = useRef([]);
    const activeEmotionRef = useRef(null);
    const pendingEmotionRef = useRef(null);
    const currentEventRef = useRef(null);
    const persistenceQueueRef = useRef([]);
    const persistenceTimerRef = useRef(null);
    const persistenceInFlightRef = useRef(false);
    const patientReferenceDescriptorRef = useRef(null);
    const referenceInputRef = useRef(null);

    const [patientId, setPatientId] = useState(null);
    const [error, setError] = useState('');
    const [syncWarning, setSyncWarning] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [detectionStatus, setDetectionStatus] = useState('idle');
    const [modelStatus, setModelStatus] = useState({
        detector: false,
        landmarks: false,
        expressions: false,
        recognition: false
    });
    const [processingMode, setProcessingMode] = useState('');
    const [modelsReady, setModelsReady] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [rawEmotion, setRawEmotion] = useState(createEmptyRawEmotionState);
    const [currentEmotion, setCurrentEmotion] = useState(createEmptyEmotionState);
    const [faceState, setFaceState] = useState(createEmptyFaceState);
    const [session, setSession] = useState(null);
    const [sessionClock, setSessionClock] = useState(Date.now());
    const [historyRecords, setHistoryRecords] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [periodFilter, setPeriodFilter] = useState('session');
    const [dateFilter, setDateFilter] = useState('');
    const [emotionFilter, setEmotionFilter] = useState('all');
    const [pendingPersistCount, setPendingPersistCount] = useState(0);
    const [faceReference, setFaceReference] = useState(createEmptyFaceReferenceState);
    const [faceReferenceLoading, setFaceReferenceLoading] = useState(false);
    const [faceReferenceSaving, setFaceReferenceSaving] = useState(false);

    const syncCanvasSize = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) {
            return;
        }

        const { videoWidth, videoHeight } = videoRef.current;

        if (!videoWidth || !videoHeight) {
            return;
        }

        if (canvasRef.current.width !== videoWidth) {
            canvasRef.current.width = videoWidth;
        }

        if (canvasRef.current.height !== videoHeight) {
            canvasRef.current.height = videoHeight;
        }
    }, []);

    const clearPersistenceTimer = useCallback(() => {
        if (persistenceTimerRef.current) {
            window.clearTimeout(persistenceTimerRef.current);
            persistenceTimerRef.current = null;
        }
    }, []);

    const resetAnalysisState = useCallback((nextStatus = 'ready') => {
        targetFaceRef.current = null;
        lastTargetBoxRef.current = null;
        targetLostFramesRef.current = 0;
        emotionBufferRef.current = [];
        activeEmotionRef.current = null;
        pendingEmotionRef.current = null;
        currentEventRef.current = null;
        setRawEmotion(createEmptyRawEmotionState());
        setCurrentEmotion(createEmptyEmotionState());
        setFaceState(createEmptyFaceState());

        if (nextStatus) {
            setDetectionStatus(nextStatus);
        }
    }, []);

    const stopDetectionLoop = useCallback(() => {
        monitoringEnabledRef.current = false;
        isInferenceRunningRef.current = false;
        lastInferenceAtRef.current = 0;

        if (loopFrameRef.current) {
            window.cancelAnimationFrame(loopFrameRef.current);
            loopFrameRef.current = null;
        }
    }, []);

    const stopCameraStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }

        setCameraReady(false);
    }, []);

    const appendSessionEvent = useCallback((event) => {
        if (!sessionRef.current) {
            return;
        }

        const nextEvents = [...(sessionRef.current.events || []), event].slice(-DETECTION_CONFIG.maxLocalHistory);
        const nextMetrics = calculateSessionMetrics(nextEvents, {
            startedAt: sessionRef.current.startedAt,
            endedAt: sessionRef.current.endedAt
        });
        const nextSession = {
            ...sessionRef.current,
            events: nextEvents,
            metrics: nextMetrics,
            insights: generateSessionInsights(nextMetrics)
        };

        sessionRef.current = nextSession;
        setSession(nextSession);
    }, []);

    const finalizeCurrentEvent = useCallback((endedAt = new Date().toISOString()) => {
        const openEvent = currentEventRef.current;

        if (!openEvent) {
            return null;
        }

        const finalizedEvent = buildEmotionEvent({
            emotionKey: openEvent.emotionKey,
            startedAt: openEvent.startedAt,
            endedAt,
            confidenceSamples: openEvent.confidenceSamples,
            source: 'session'
        });

        currentEventRef.current = null;
        appendSessionEvent(finalizedEvent);
        return finalizedEvent;
    }, [appendSessionEvent]);

    const flushPersistenceQueue = useCallback(async () => {
        if (persistenceInFlightRef.current || persistenceQueueRef.current.length === 0) {
            return;
        }

        clearPersistenceTimer();
        persistenceInFlightRef.current = true;
        const nextItem = persistenceQueueRef.current[0];

        try {
            await saveEmotionRecord(nextItem.payload);
            persistenceQueueRef.current.shift();
            setPendingPersistCount(persistenceQueueRef.current.length);

            if (persistenceQueueRef.current.length === 0) {
                setSyncWarning('');
            }
        } catch (requestError) {
            const updatedItem = {
                ...nextItem,
                attempts: (nextItem.attempts || 0) + 1
            };

            if (updatedItem.attempts >= DETECTION_CONFIG.maxRetryAttempts) {
                persistenceQueueRef.current.shift();
            } else {
                persistenceQueueRef.current[0] = updatedItem;
            }

            setPendingPersistCount(persistenceQueueRef.current.length);
            setSyncWarning('Não foi possível salvar um evento. A análise continuará localmente e novas tentativas serão feitas de forma controlada.');
        } finally {
            persistenceInFlightRef.current = false;

            if (persistenceQueueRef.current.length > 0 && !persistenceTimerRef.current) {
                persistenceTimerRef.current = window.setTimeout(() => {
                    persistenceTimerRef.current = null;
                    void flushPersistenceQueue();
                }, DETECTION_CONFIG.retryDelayMs);
            }
        }
    }, [clearPersistenceTimer]);

    const enqueuePersistence = useCallback((payload) => {
        const dedupeKey = `${payload.patient_id}-${payload.emotion}-${payload.timestamp}`;
        const alreadyQueued = persistenceQueueRef.current.some((item) => item.key === dedupeKey);

        if (alreadyQueued) {
            return;
        }

        persistenceQueueRef.current.push({
            key: dedupeKey,
            payload,
            attempts: 0
        });
        setPendingPersistCount(persistenceQueueRef.current.length);
        void flushPersistenceQueue();
    }, [flushPersistenceQueue]);

    const activateStableEmotion = useCallback((stableEmotion, observedAt) => {
        const activeEmotion = activeEmotionRef.current;
        const timestamp = new Date(observedAt).toISOString();

        if (activeEmotion?.key && activeEmotion.key !== stableEmotion.key) {
            finalizeCurrentEvent(timestamp);
        }

        if (!activeEmotion || activeEmotion.key !== stableEmotion.key) {
            currentEventRef.current = {
                emotionKey: stableEmotion.key,
                startedAt: timestamp,
                confidenceSamples: [stableEmotion.confidence]
            };
            activeEmotionRef.current = {
                key: stableEmotion.key,
                since: timestamp,
                confidence: stableEmotion.confidence
            };
            enqueuePersistence(buildCompatibilityPayload(patientId, {
                emotion: stableEmotion.key,
                startedAt: timestamp
            }));
        } else if (currentEventRef.current) {
            currentEventRef.current.confidenceSamples.push(stableEmotion.confidence);
        }

        pendingEmotionRef.current = null;
        setCurrentEmotion({
            key: stableEmotion.key,
            label: getEmotionLabel(stableEmotion.key),
            confidence: stableEmotion.confidence,
            stable: true,
            since: activeEmotion?.key === stableEmotion.key ? activeEmotion.since : timestamp
        });
        setDetectionStatus('monitoring');
    }, [enqueuePersistence, finalizeCurrentEvent, patientId]);

    const loadModels = useCallback(async () => {
        if (modelsLoadedRef.current) {
            setModelsReady(true);
            setDetectionStatus('ready');
            return;
        }

        const tf = window.tf;
        const faceapi = window.faceapi;

        if (!tf || !faceapi) {
            setError('As bibliotecas de IA não foram carregadas. Verifique os scripts de TensorFlow.js e face-api antes de iniciar o monitoramento.');
            setDetectionStatus('error');
            return;
        }

        setError('');
        setDetectionStatus('loading-models');

        try {
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                setProcessingMode('Processamento acelerado');
            } catch (backendError) {
                await tf.setBackend('cpu');
                await tf.ready();
                setProcessingMode('Modo compatibilidade');
            }

            const loaders = [
                { key: 'detector', promise: faceapi.nets.tinyFaceDetector.loadFromUri('/models') },
                { key: 'landmarks', promise: faceapi.nets.faceLandmark68Net.loadFromUri('/models') },
                { key: 'expressions', promise: faceapi.nets.faceExpressionNet.loadFromUri('/models') },
                { key: 'recognition', promise: faceapi.nets.faceRecognitionNet.loadFromUri('/models') }
            ];
            const results = await Promise.allSettled(loaders.map((loader) => loader.promise));

            const nextModelStatus = {
                detector: false,
                landmarks: false,
                expressions: false,
                recognition: false
            };

            results.forEach((result, index) => {
                nextModelStatus[loaders[index].key] = result.status === 'fulfilled';
            });

            setModelStatus(nextModelStatus);

            if (!nextModelStatus.detector || !nextModelStatus.landmarks || !nextModelStatus.expressions) {
                throw new Error('Os modelos essenciais de detecção não puderam ser carregados.');
            }

            modelsLoadedRef.current = true;
            setModelsReady(true);
            setDetectionStatus('ready');
        } catch (loadError) {
            setError('Não foi possível carregar os modelos de IA. Recarregue a página e tente novamente.');
            setDetectionStatus('error');
        }
    }, []);

    const loadHistory = useCallback(async (resolvedPatientId) => {
        if (!resolvedPatientId) {
            setHistoryRecords([]);
            return;
        }

        setHistoryLoading(true);

        try {
            const history = await fetchEmotionHistory(resolvedPatientId);
            setHistoryRecords(dedupeRecords(history));
        } catch (historyError) {
            setHistoryRecords([]);
            setSyncWarning('Não foi possível carregar o histórico anterior do paciente. O monitoramento atual continuará disponível normalmente.');
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    const loadFaceReference = useCallback(async (resolvedPatientId) => {
        if (!resolvedPatientId) {
            patientReferenceDescriptorRef.current = null;
            setFaceReference(createEmptyFaceReferenceState());
            return;
        }

        setFaceReferenceLoading(true);

        try {
            const response = await fetchPatientFaceReference(resolvedPatientId);
            const normalizedDescriptor = normalizeFaceDescriptor(response?.descriptor);
            const nextFaceReference = response?.hasReference && normalizedDescriptor
                ? {
                    hasReference: true,
                    descriptor: normalizedDescriptor,
                    referenceImageData: response.referenceImageData || null,
                    captureMode: response.captureMode || 'upload',
                    faceConfidence: Number.isFinite(Number(response.faceConfidence)) ? Number(response.faceConfidence) : null,
                    matchThreshold: Number.isFinite(Number(response.matchThreshold))
                        ? Number(response.matchThreshold)
                        : DETECTION_CONFIG.faceMatchThreshold,
                    createdAt: response.createdAt || null,
                    updatedAt: response.updatedAt || null
                }
                : createEmptyFaceReferenceState();

            patientReferenceDescriptorRef.current = nextFaceReference.descriptor;
            setFaceReference(nextFaceReference);
        } catch (referenceError) {
            patientReferenceDescriptorRef.current = null;
            setFaceReference(createEmptyFaceReferenceState());
            setSyncWarning('Nao foi possivel carregar a referencia facial deste paciente. O monitoramento ficara bloqueado ate a referencia ser lida novamente.');
        } finally {
            setFaceReferenceLoading(false);
        }
    }, []);

    const saveFaceReferenceFromFile = useCallback(async (file) => {
        if (!file || !patientId) {
            return;
        }

        if (!modelsReady) {
            await loadModels();

            if (!modelsLoadedRef.current) {
                return;
            }
        }

        const faceapi = window.faceapi;

        if (!faceapi) {
            setError('A biblioteca de reconhecimento facial nao esta disponivel para cadastrar a referencia do paciente.');
            return;
        }

        setFaceReferenceSaving(true);
        setError('');
        setInfoMessage('');

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
                throw new Error('Nenhuma face foi encontrada na foto enviada. Use uma imagem frontal, com boa iluminacao.');
            }

            if (detections.length > 1) {
                throw new Error('A foto de referencia deve conter apenas uma face. Remova outras pessoas da imagem e tente novamente.');
            }

            const descriptor = Array.from(detections[0].descriptor || []);
            const previewDataUrl = buildReferencePreview(image) || sourceDataUrl;

            const response = await savePatientFaceReference(patientId, {
                descriptor,
                referenceImageData: previewDataUrl,
                captureMode: 'upload',
                faceConfidence: detections[0]?.detection?.score || null,
                matchThreshold: DETECTION_CONFIG.faceMatchThreshold
            });

            const normalizedDescriptor = normalizeFaceDescriptor(response?.descriptor || descriptor);
            const nextFaceReference = {
                hasReference: true,
                descriptor: normalizedDescriptor,
                referenceImageData: response?.referenceImageData || previewDataUrl,
                captureMode: response?.captureMode || 'upload',
                faceConfidence: Number.isFinite(Number(response?.faceConfidence))
                    ? Number(response.faceConfidence)
                    : (detections[0]?.detection?.score || null),
                matchThreshold: Number.isFinite(Number(response?.matchThreshold))
                    ? Number(response.matchThreshold)
                    : DETECTION_CONFIG.faceMatchThreshold,
                createdAt: response?.createdAt || new Date().toISOString(),
                updatedAt: response?.updatedAt || new Date().toISOString()
            };

            patientReferenceDescriptorRef.current = normalizedDescriptor;
            setFaceReference(nextFaceReference);
            setInfoMessage('Referencia facial do paciente salva com sucesso. O monitoramento agora exigira confirmacao dessa face antes de registrar emocoes.');
            setSyncWarning('');
        } catch (saveError) {
            setError(saveError.response?.data?.error || saveError.message || 'Nao foi possivel salvar a referencia facial do paciente.');
        } finally {
            setFaceReferenceSaving(false);

            if (referenceInputRef.current) {
                referenceInputRef.current.value = '';
            }
        }
    }, [loadModels, modelsReady, patientId]);

    const handleFaceReferenceFileChange = useCallback(async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        await saveFaceReferenceFromFile(file);
    }, [saveFaceReferenceFromFile]);

    const handleRemoveFaceReference = useCallback(async () => {
        if (!patientId) {
            return;
        }

        setFaceReferenceSaving(true);
        setError('');

        try {
            await deletePatientFaceReference(patientId);
            patientReferenceDescriptorRef.current = null;
            setFaceReference(createEmptyFaceReferenceState());
            setInfoMessage('Referencia facial removida. Cadastre uma nova foto antes de reiniciar o monitoramento.');
            endMonitoring();
        } catch (removeError) {
            setError(removeError.response?.data?.error || 'Nao foi possivel remover a referencia facial do paciente.');
        } finally {
            setFaceReferenceSaving(false);

            if (referenceInputRef.current) {
                referenceInputRef.current.value = '';
            }
        }
    }, [endMonitoring, patientId]);

    const estimateBrightness = useCallback((box) => {
        const video = videoRef.current;

        if (!video || !box || !video.videoWidth || !video.videoHeight) {
            return 0.5;
        }

        if (!lightingCanvasRef.current) {
            lightingCanvasRef.current = document.createElement('canvas');
        }

        const sampleCanvas = lightingCanvasRef.current;
        const context = sampleCanvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
            return 0.5;
        }

        const sampleWidth = 32;
        const sampleHeight = 32;
        const sx = Math.max(0, Math.floor(box.x));
        const sy = Math.max(0, Math.floor(box.y));
        const sw = Math.max(1, Math.floor(box.width));
        const sh = Math.max(1, Math.floor(box.height));

        sampleCanvas.width = sampleWidth;
        sampleCanvas.height = sampleHeight;
        context.drawImage(video, sx, sy, sw, sh, 0, 0, sampleWidth, sampleHeight);

        const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
        let brightnessSum = 0;
        let samples = 0;

        for (let index = 0; index < imageData.length; index += 4) {
            const red = imageData[index];
            const green = imageData[index + 1];
            const blue = imageData[index + 2];
            brightnessSum += ((red * 0.299) + (green * 0.587) + (blue * 0.114)) / 255;
            samples += 1;
        }

        return samples > 0 ? brightnessSum / samples : 0.5;
    }, []);

    const drawOverlay = useCallback((detections, selectedIndex, labelData = {}) => {
        if (!canvasRef.current) {
            return;
        }

        syncCanvasSize();
        const context = canvasRef.current.getContext('2d');

        if (!context) {
            return;
        }

        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        detections.forEach((detection, index) => {
            const box = detection?.detection?.box;

            if (!box) {
                return;
            }

            const isSelected = index === selectedIndex;
            const strokeColor = isSelected ? '#0ea5e9' : 'rgba(148, 163, 184, 0.9)';
            const fillColor = isSelected ? 'rgba(14, 165, 233, 0.18)' : 'rgba(148, 163, 184, 0.12)';
            const labelLines = isSelected
                ? [
                    'Paciente monitorado',
                    labelData.label
                        ? `${labelData.label} • ${formatConfidence(labelData.confidence || 0)}`
                        : 'Análise em estabilização'
                ]
                : ['Face não monitorada'];

            context.save();
            context.setLineDash(isSelected ? [] : [6, 4]);
            context.lineWidth = isSelected ? 3 : 1.5;
            context.strokeStyle = strokeColor;
            context.fillStyle = fillColor;
            context.beginPath();
            context.rect(box.x, box.y, box.width, box.height);
            context.fill();
            context.stroke();
            context.restore();

            const labelWidth = Math.min(260, Math.max(150, ...labelLines.map((line) => context.measureText(line).width + 20)));
            const labelHeight = 24 + (labelLines.length * 18);
            const labelX = box.x;
            const labelY = Math.max(8, box.y - labelHeight - 10);

            context.save();
            context.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.88)' : 'rgba(71, 85, 105, 0.85)';
            context.fillRect(labelX, labelY, labelWidth, labelHeight);
            context.fillStyle = '#f8fafc';
            context.font = '600 12px "Segoe UI"';
            labelLines.forEach((line, lineIndex) => {
                context.fillText(line, labelX + 10, labelY + 18 + (lineIndex * 18));
            });
            context.restore();
        });
    }, [syncCanvasSize]);

    const processFrame = useCallback(async () => {
        const faceapi = window.faceapi;
        const video = videoRef.current;

        if (!faceapi || !video || !video.videoWidth || !video.videoHeight) {
            return;
        }

        const detections = await faceapi
            .detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416,
                    scoreThreshold: Math.max(0.3, DETECTION_CONFIG.minFaceConfidence - 0.15)
                })
            )
            .withFaceLandmarks()
            .withFaceExpressions()
            .withFaceDescriptors();

        const displaySize = {
            width: video.videoWidth,
            height: video.videoHeight
        };
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const selection = selectFaceByReference(detections, {
            referenceDescriptor: patientReferenceDescriptorRef.current,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            lastTargetBox: lastTargetBoxRef.current
        });
        const observedAt = new Date().toISOString();

        if (!selection.selectedDetection) {
            targetFaceRef.current = null;
            lastTargetBoxRef.current = null;
            targetLostFramesRef.current += 1;

            const shouldCloseActiveEvent = targetLostFramesRef.current >= DETECTION_CONFIG.maxTargetLostFrames;
            const isAmbiguousReference = selection.faceState === 'ambiguous-match';
            const isUnconfirmedReference = selection.faceState === 'unconfirmed';

            if (shouldCloseActiveEvent) {
                finalizeCurrentEvent(observedAt);
                activeEmotionRef.current = null;
                pendingEmotionRef.current = null;
                emotionBufferRef.current = [];
                setCurrentEmotion(createEmptyEmotionState());
                setRawEmotion(createEmptyRawEmotionState());
                setDetectionStatus(isAmbiguousReference || isUnconfirmedReference ? 'searching-face' : 'face-lost');
            } else {
                setDetectionStatus(isAmbiguousReference || isUnconfirmedReference ? 'searching-face' : 'stabilizing');
            }

            const selectionMessage = isAmbiguousReference
                ? 'Mais de uma face semelhante a referencia foi encontrada.'
                : isUnconfirmedReference
                    ? 'Paciente monitorado ainda nao foi reconhecido na imagem.'
                    : selection.faceState === 'ambiguous'
                        ? 'Face-alvo nÃ£o confirmada.'
                        : targetLostFramesRef.current > 0
                            ? 'Face monitorada temporariamente perdida.'
                            : 'Procurando pessoa monitorada...';

            setFaceState({
                mode: selection.faceState,
                multipleFaces: selection.multipleFaces,
                message: selection.faceState === 'ambiguous'
                    ? 'Face-alvo não confirmada.'
                    : targetLostFramesRef.current > 0
                        ? 'Face monitorada temporariamente perdida.'
                        : 'Procurando pessoa monitorada...',
                quality: {
                    label: 'Ruim',
                    tone: 'poor',
                    score: 0.2
                },
                warnings: buildPositioningWarnings({
                    faceState: selection.faceState,
                    multipleFaces: selection.multipleFaces,
                    selectedMetrics: selection.metrics,
                    brightness: 0.5,
                    lostFrames: targetLostFramesRef.current
                })
            });
            drawOverlay(resizedDetections, -1, {});
            return;
        }

        targetLostFramesRef.current = 0;
        targetFaceRef.current = selection.selectedDetection;
        lastTargetBoxRef.current = { ...selection.selectedDetection.detection.box };

        const brightness = estimateBrightness(selection.selectedDetection.detection.box);
        const nextRawEmotion = getDominantEmotion(
            selection.selectedDetection.expressions,
            DETECTION_CONFIG.minEmotionConfidence
        );
        const nextBuffer = updateEmotionBuffer(
            emotionBufferRef.current,
            {
                key: nextRawEmotion.key,
                candidateKey: nextRawEmotion.candidateKey,
                confidence: nextRawEmotion.confidence,
                inconclusive: nextRawEmotion.inconclusive,
                timestamp: observedAt
            },
            DETECTION_CONFIG.bufferSize
        );

        emotionBufferRef.current = nextBuffer;

        const stableEmotion = calculateEmotionStability(nextBuffer, DETECTION_CONFIG);
        const quality = calculateDetectionQuality({
            faceConfidence: selection.selectedDetection.detection.score || selection.metrics?.faceConfidence || 0,
            emotionConfidence: nextRawEmotion.confidence,
            areaRatio: selection.metrics?.areaRatio || 0,
            centeredness: selection.metrics?.centeredness || 0,
            brightness,
            lostFrames: 0
        });

        const warnings = buildPositioningWarnings({
            faceState: selection.faceState,
            multipleFaces: selection.multipleFaces,
            selectedMetrics: selection.metrics,
            brightness,
            lostFrames: 0
        });

        setRawEmotion({
            key: nextRawEmotion.candidateKey || nextRawEmotion.key,
            label: nextRawEmotion.inconclusive ? 'Análise inconclusiva' : nextRawEmotion.label,
            confidence: nextRawEmotion.confidence,
            inconclusive: nextRawEmotion.inconclusive
        });

        setFaceState({
            mode: selection.faceState,
            multipleFaces: selection.multipleFaces,
            message: selection.multipleFaces
                ? 'Múltiplas faces detectadas. Apenas a face-alvo seguirá em monitoramento.'
                : 'Face identificada.',
            quality,
            warnings
        });

        drawOverlay(
            resizedDetections,
            selection.selectedIndex,
            nextRawEmotion.inconclusive
                ? {
                    label: 'Análise inconclusiva',
                    confidence: nextRawEmotion.confidence
                }
                : {
                    label: getEmotionLabel(nextRawEmotion.key),
                    confidence: nextRawEmotion.confidence
                }
        );

        if (stableEmotion.stable) {
            const activeEmotion = activeEmotionRef.current;
            const pendingEmotion = pendingEmotionRef.current;

            if (activeEmotion?.key === stableEmotion.key) {
                if (currentEventRef.current) {
                    currentEventRef.current.confidenceSamples.push(stableEmotion.confidence);
                }

                setCurrentEmotion({
                    key: stableEmotion.key,
                    label: getEmotionLabel(stableEmotion.key),
                    confidence: stableEmotion.confidence,
                    stable: true,
                    since: activeEmotion.since
                });
                setDetectionStatus('monitoring');
            } else if (!pendingEmotion || pendingEmotion.key !== stableEmotion.key) {
                pendingEmotionRef.current = {
                    key: stableEmotion.key,
                    since: observedAt,
                    confidence: stableEmotion.confidence
                };
                setDetectionStatus('stabilizing');
            } else {
                const pendingDuration = new Date(observedAt).getTime() - new Date(pendingEmotion.since).getTime();

                if (pendingDuration >= DETECTION_CONFIG.stableDurationMs) {
                    activateStableEmotion(stableEmotion, observedAt);
                } else {
                    setDetectionStatus('stabilizing');
                }
            }
        } else {
            pendingEmotionRef.current = null;
            setDetectionStatus('stabilizing');
            setCurrentEmotion((previous) => previous?.key
                ? { ...previous, stable: false }
                : createEmptyEmotionState());
        }
    }, [activateStableEmotion, drawOverlay, estimateBrightness, finalizeCurrentEvent]);

    const startDetectionLoop = useCallback(() => {
        stopDetectionLoop();
        monitoringEnabledRef.current = true;

        const step = async (frameTime) => {
            if (!monitoringEnabledRef.current) {
                return;
            }

            if (!modelsReady || !cameraReady || isInferenceRunningRef.current) {
                loopFrameRef.current = window.requestAnimationFrame(step);
                return;
            }

            if (frameTime - lastInferenceAtRef.current < DETECTION_CONFIG.inferenceIntervalMs) {
                loopFrameRef.current = window.requestAnimationFrame(step);
                return;
            }

            lastInferenceAtRef.current = frameTime;
            isInferenceRunningRef.current = true;

            try {
                await processFrame();
            } catch (frameError) {
                setError('O monitoramento encontrou uma falha inesperada durante a análise. A sessão pode ser retomada após reiniciar a câmera.');
                setDetectionStatus('error');
                stopDetectionLoop();
                stopCameraStream();
            } finally {
                isInferenceRunningRef.current = false;

                if (monitoringEnabledRef.current) {
                    loopFrameRef.current = window.requestAnimationFrame(step);
                }
            }
        };

        loopFrameRef.current = window.requestAnimationFrame(step);
    }, [cameraReady, modelsReady, processFrame, stopCameraStream, stopDetectionLoop]);

    const startCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Seu navegador não oferece suporte ao acesso à câmera.');
            setDetectionStatus('error');
            return false;
        }

        setError('');
        stopCameraStream();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                await new Promise((resolve) => {
                    if (videoRef.current.readyState >= 1) {
                        resolve();
                        return;
                    }

                    const handleLoadedMetadata = () => {
                        videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
                        resolve();
                    };

                    videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
                });

                await videoRef.current.play();
                syncCanvasSize();
            }

            setCameraReady(true);
            return true;
        } catch (cameraError) {
            setError(mapCameraError(cameraError));
            setDetectionStatus('error');
            stopCameraStream();
            return false;
        }
    }, [stopCameraStream, syncCanvasSize]);

    const startMonitoring = useCallback(async () => {
        if (!patientId) {
            setError('Paciente não identificado. Não foi possível iniciar o monitoramento porque nenhum paciente foi informado na URL.');
            return;
        }

        if (!modelsReady) {
            await loadModels();

            if (!modelsLoadedRef.current) {
                return;
            }
        }

        setInfoMessage('');
        setSyncWarning('');

        const nowIso = new Date().toISOString();
        const existingSession = sessionRef.current;

        if (!existingSession || existingSession.status === 'ended') {
            const nextSession = {
                id: `session-${Date.now()}`,
                patientId: Number(patientId),
                startedAt: nowIso,
                endedAt: null,
                pausedAt: null,
                totalPausedMs: 0,
                status: 'active',
                events: [],
                metrics: calculateSessionMetrics([]),
                insights: generateSessionInsights(calculateSessionMetrics([]))
            };

            sessionRef.current = nextSession;
            setSession(nextSession);
        } else if (existingSession.status === 'paused') {
            const pausedElapsedMs = existingSession.pausedAt
                ? Date.now() - new Date(existingSession.pausedAt).getTime()
                : 0;
            const resumedSession = {
                ...existingSession,
                status: 'active',
                pausedAt: null,
                totalPausedMs: existingSession.totalPausedMs + pausedElapsedMs
            };

            sessionRef.current = resumedSession;
            setSession(resumedSession);
        }

        resetAnalysisState('starting-camera');
        const started = await startCamera();

        if (!started) {
            return;
        }

        setSessionClock(Date.now());
        setDetectionStatus('searching-face');
        startDetectionLoop();
    }, [loadModels, modelsReady, patientId, resetAnalysisState, startCamera, startDetectionLoop]);

    const pauseMonitoring = useCallback(() => {
        if (!sessionRef.current || sessionRef.current.status !== 'active') {
            return;
        }

        const nowIso = new Date().toISOString();
        finalizeCurrentEvent(nowIso);
        stopDetectionLoop();
        stopCameraStream();
        resetAnalysisState('paused');

        const pausedSession = {
            ...sessionRef.current,
            status: 'paused',
            pausedAt: nowIso
        };

        sessionRef.current = pausedSession;
        setSession(pausedSession);
    }, [finalizeCurrentEvent, resetAnalysisState, stopCameraStream, stopDetectionLoop]);

    const endMonitoring = useCallback(() => {
        if (!sessionRef.current || sessionRef.current.status === 'ended') {
            return;
        }

        const nowIso = new Date().toISOString();
        finalizeCurrentEvent(nowIso);
        stopDetectionLoop();
        stopCameraStream();
        resetAnalysisState('ready');

        const endedSession = {
            ...sessionRef.current,
            status: 'ended',
            endedAt: nowIso,
            pausedAt: null
        };
        const endedMetrics = calculateSessionMetrics(endedSession.events || [], endedSession);
        const normalizedEndedSession = {
            ...endedSession,
            metrics: endedMetrics,
            insights: generateSessionInsights(endedMetrics)
        };

        sessionRef.current = normalizedEndedSession;
        setSession(normalizedEndedSession);
        setSessionClock(Date.now());
    }, [finalizeCurrentEvent, resetAnalysisState, stopCameraStream, stopDetectionLoop]);

    const handleRegisterContext = useCallback(() => {
        setInfoMessage('A integração de contexto com o TriggerRecorder foi preparada como próximo passo arquitetural e será conectada em uma etapa posterior.');
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const resolvedPatientId = queryParams.get('patientId');

        setPatientId(resolvedPatientId);
        setInfoMessage('');

        if (!resolvedPatientId) {
            stopDetectionLoop();
            stopCameraStream();
            resetAnalysisState('idle');
            setSession(null);
            sessionRef.current = null;
            setHistoryRecords([]);
            setError('Paciente não identificado. Não foi possível iniciar o monitoramento porque nenhum paciente foi informado.');
            return;
        }

        setError('');
        setDetectionStatus(modelsLoadedRef.current ? 'ready' : 'loading-models');
        void loadModels();
        void loadHistory(resolvedPatientId);
    }, [loadHistory, loadModels, location.search, resetAnalysisState, stopCameraStream, stopDetectionLoop]);

    useEffect(() => {
        return () => {
            clearPersistenceTimer();
            stopDetectionLoop();
            stopCameraStream();
        };
    }, [clearPersistenceTimer, stopCameraStream, stopDetectionLoop]);

    useEffect(() => {
        if (!session || (session.status !== 'active' && session.status !== 'paused')) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setSessionClock(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [session]);

    const liveSessionEvents = (() => {
        if (!session) {
            return [];
        }

        const sessionEvents = [...(session.events || [])];

        if (session.status === 'active' && currentEventRef.current) {
            sessionEvents.push(buildEmotionEvent({
                emotionKey: currentEventRef.current.emotionKey,
                startedAt: currentEventRef.current.startedAt,
                endedAt: new Date(sessionClock).toISOString(),
                confidenceSamples: currentEventRef.current.confidenceSamples,
                source: 'session'
            }));
        }

        return sessionEvents;
    })();

    const liveSessionMetrics = session
        ? calculateSessionMetrics(liveSessionEvents, {
            startedAt: session.startedAt,
            endedAt: session.endedAt
        })
        : calculateSessionMetrics([]);

    const monitoredDurationMs = session ? calculateMonitoredDuration(session, sessionClock) : 0;
    const currentSessionRecords = liveSessionEvents.map(recordFromEvent).filter(Boolean);
    const combinedRecords = dedupeRecords([...historyRecords, ...currentSessionRecords]);

    const filteredRecords = combinedRecords.filter((record) => {
        if (!record) {
            return false;
        }

        if (periodFilter === 'session') {
            if (currentSessionRecords.length === 0) {
                return false;
            }

            const isInCurrentSession = currentSessionRecords.some((sessionRecord) => (
                sessionRecord.timestamp === record.timestamp && sessionRecord.emotion === record.emotion
            ));

            if (!isInCurrentSession) {
                return false;
            }
        }

        if (periodFilter === 'today') {
            const today = new Date();
            const recordDate = new Date(record.timestamp);

            if (recordDate.toDateString() !== today.toDateString()) {
                return false;
            }
        }

        if (periodFilter === 'week') {
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

            if (new Date(record.timestamp).getTime() < oneWeekAgo) {
                return false;
            }
        }

        if (periodFilter === 'month') {
            const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

            if (new Date(record.timestamp).getTime() < oneMonthAgo) {
                return false;
            }
        }

        if (periodFilter === 'custom' && dateFilter) {
            const selectedDate = new Date(dateFilter).toDateString();

            if (new Date(record.timestamp).toDateString() !== selectedDate) {
                return false;
            }
        }

        if (emotionFilter !== 'all' && record.emotion !== emotionFilter) {
            return false;
        }

        return true;
    });

    const lineChartData = {
        labels: filteredRecords.map((record) => new Date(record.timestamp).toLocaleTimeString('pt-BR')),
        datasets: VALID_EMOTIONS.map((emotionKey) => ({
            label: getEmotionLabel(emotionKey),
            data: filteredRecords.map((record) => (
                record.emotion === emotionKey ? Number((record.confidence || 0).toFixed(2)) : null
            )),
            borderColor: EMOTION_COLORS[emotionKey],
            backgroundColor: `${EMOTION_COLORS[emotionKey]}20`,
            borderWidth: 2,
            pointRadius: 3,
            spanGaps: true,
            tension: 0.35,
            fill: true
        }))
    };

    const distributionTotals = filteredRecords.reduce((accumulator, record) => {
        accumulator[record.emotion] = (accumulator[record.emotion] || 0) + Math.max(record.durationMs || 0, 1000);
        return accumulator;
    }, {});

    const distributionChartData = {
        labels: VALID_EMOTIONS.filter((emotionKey) => distributionTotals[emotionKey] > 0).map((emotionKey) => getEmotionLabel(emotionKey)),
        datasets: [{
            label: 'Distribuição por tempo observado',
            data: VALID_EMOTIONS.filter((emotionKey) => distributionTotals[emotionKey] > 0).map((emotionKey) => (
                Math.round((distributionTotals[emotionKey] / 1000) * 10) / 10
            )),
            backgroundColor: VALID_EMOTIONS.filter((emotionKey) => distributionTotals[emotionKey] > 0).map((emotionKey) => EMOTION_COLORS[emotionKey]),
            borderWidth: 0
        }]
    };

    const historicalSessions = groupRecordsIntoSessions(historyRecords);
    const comparisonSessions = [];

    if (session && (session.events?.length || currentEventRef.current)) {
        comparisonSessions.push({
            id: session.id,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            events: liveSessionEvents,
            metrics: liveSessionMetrics
        });
    }

    comparisonSessions.push(...historicalSessions);

    const uniqueComparisonSessions = comparisonSessions
        .filter((currentSession, index, allSessions) => (
            allSessions.findIndex((candidate) => candidate.startedAt === currentSession.startedAt) === index
        ))
        .slice(0, 6);

    const sessionComparisonData = {
        labels: uniqueComparisonSessions.map((item, index) => buildSessionLabel(item, index)),
        datasets: [
            {
                label: 'Confiança média',
                data: uniqueComparisonSessions.map((item) => Math.round((item.metrics?.averageConfidence || 0) * 100)),
                backgroundColor: '#0ea5e9',
                borderRadius: 8
            },
            {
                label: 'Tempo predominante',
                data: uniqueComparisonSessions.map((item) => {
                    const key = item.metrics?.predominantEmotion;
                    return Math.round(((item.metrics?.percentagesByEmotion?.[key] || 0) * 100));
                }),
                backgroundColor: '#14b8a6',
                borderRadius: 8
            }
        ]
    };

    const timelineEvents = liveSessionEvents.length > 0
        ? liveSessionEvents
        : (historicalSessions[0]?.events || []);
    const sessionInsights = session
        ? generateSessionInsights(liveSessionMetrics)
        : (historicalSessions[0]?.metrics ? generateSessionInsights(historicalSessions[0].metrics) : generateSessionInsights(null));

    const showPatientErrorState = !patientId;
    const canStartMonitoring = Boolean(patientId) && modelsReady && detectionStatus !== 'loading-models';
    const isSessionActive = session?.status === 'active';
    const isSessionPaused = session?.status === 'paused';
    const statusLabel = STATUS_LABELS[detectionStatus] || STATUS_LABELS.idle;
    const faceStatusLabel = faceState.message || 'Procurando pessoa monitorada...';

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            },
            title: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 1,
                ticks: {
                    callback: (value) => `${Math.round(value * 100)}%`
                },
                title: {
                    display: true,
                    text: 'Confiança da expressão'
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: (value) => `${value}%`
                }
            }
        }
    };

    return (
        <div className="App bg-light min-vh-100 emotion-detector-shell">
            <nav className="top-bar fixed-top shadow-sm">
                <Container>
                    <Row className="align-items-center py-3">
                        <Col md={4} className="text-center text-md-start">
                            <img src={logonovo} alt="AutisConnect" className="top-bar-logo" />
                        </Col>
                        <Col md={4} className="text-center d-none d-md-block">
                            <span className="text-white fw-semibold">Monitoramento emocional inteligente</span>
                        </Col>
                        <Col md={4} className="text-center text-md-end">
                            <Button variant="outline-light" size="sm" onClick={() => window.close()}>
                                Fechar
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </nav>

            <div className="home-page" style={{ paddingTop: '84px' }}>
                <section className="hero-section hero-short emotion-detector-hero">
                    <Container>
                        <div className="emotion-hero-card">
                            <Row className="g-4 align-items-center">
                                <Col lg={7}>
                                    <div className="hero-content-box p-4 rounded-4">
                                        <div className="emotion-hero-kicker">Monitoramento Emocional</div>
                                        <h1 className="display-6 fw-bold text-white mb-2">Análise inteligente de expressões faciais</h1>
                                        <p className="text-white-90 mb-3">
                                            A análise considera padrões de expressão facial e funciona como ferramenta de apoio,
                                            não como avaliação clínica isolada.
                                        </p>
                                        <div className="emotion-chip-row">
                                            <span className={`emotion-status-chip is-${detectionStatus}`}>
                                                <Activity size={14} />
                                                {statusLabel}
                                            </span>
                                            <span className="emotion-status-chip">
                                                <PersonBoundingBox size={14} />
                                                {faceStatusLabel}
                                            </span>
                                            <span className="emotion-status-chip">
                                                <Cpu size={14} />
                                                {processingMode || 'Preparando backend'}
                                            </span>
                                        </div>
                                    </div>
                                </Col>
                                <Col lg={5}>
                                    <Card className="emotion-floating-summary border-0 shadow-sm">
                                        <Card.Body>
                                            <div className="emotion-summary-title">Status do monitoramento</div>
                                            <div className="emotion-summary-grid">
                                                <div>
                                                    <span className="emotion-summary-label">Paciente</span>
                                                    <strong>{patientId ? `#${patientId}` : 'Não identificado'}</strong>
                                                </div>
                                                <div>
                                                    <span className="emotion-summary-label">Sincronização</span>
                                                    <strong>{pendingPersistCount > 0 ? `${pendingPersistCount} pendente(s)` : 'Em dia'}</strong>
                                                </div>
                                                <div>
                                                    <span className="emotion-summary-label">Sessão</span>
                                                    <strong>{session?.status === 'active' ? 'Ativa' : session?.status === 'paused' ? 'Pausada' : session?.status === 'ended' ? 'Encerrada' : 'Aguardando início'}</strong>
                                                </div>
                                                <div>
                                                    <span className="emotion-summary-label">Reconhecimento futuro</span>
                                                    <strong>{modelStatus.recognition ? 'Preparado' : 'Opcional'}</strong>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </Container>
                </section>

                <main className="dashboard-section py-4">
                    <Container fluid className="emotion-detector-page">
                        {error && <Alert variant="danger">{error}</Alert>}
                        {syncWarning && <Alert variant="warning">{syncWarning}</Alert>}
                        {infoMessage && <Alert variant="info">{infoMessage}</Alert>}

                        {showPatientErrorState ? (
                            <Card className="emotion-panel-card emotion-empty-card">
                                <Card.Body>
                                    <h3>Paciente não identificado</h3>
                                    <p className="mb-0">
                                        Não foi possível iniciar o monitoramento porque nenhum paciente foi informado.
                                        Use a rota com <code>?patientId=ID</code> para ativar a câmera com segurança.
                                    </p>
                                </Card.Body>
                            </Card>
                        ) : (
                            <>
                                <Row className="g-4 align-items-start">
                                    <Col xl={7}>
                                        <Card className="emotion-panel-card emotion-camera-card">
                                            <Card.Body>
                                                <div className="emotion-panel-header">
                                                    <div>
                                                        <div className="emotion-panel-kicker">Câmera e face-alvo</div>
                                                        <h2>Monitoramento ao vivo</h2>
                                                        <p>
                                                            Acompanhamos apenas a face-alvo confirmada. Outras pessoas no enquadramento
                                                            não têm emoção analisada nem dados salvos para o prontuário do paciente.
                                                        </p>
                                                    </div>
                                                    <div className="emotion-control-group">
                                                        <Button
                                                            variant="primary"
                                                            className="emotion-primary-button"
                                                            onClick={startMonitoring}
                                                            disabled={!canStartMonitoring || isSessionActive}
                                                        >
                                                            <CameraVideoFill size={16} />
                                                            {isSessionPaused ? 'Retomar monitoramento' : 'Iniciar monitoramento'}
                                                        </Button>
                                                        <Button
                                                            variant="outline-secondary"
                                                            className="emotion-secondary-button"
                                                            onClick={pauseMonitoring}
                                                            disabled={!isSessionActive}
                                                        >
                                                            <PauseCircleFill size={16} />
                                                            Pausar
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            className="emotion-danger-button"
                                                            onClick={endMonitoring}
                                                            disabled={!session || session.status === 'ended'}
                                                        >
                                                            <StopCircleFill size={16} />
                                                            Encerrar sessão
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="emotion-video-shell">
                                                    <div className="emotion-video-frame">
                                                        <video
                                                            ref={videoRef}
                                                            className="emotion-video"
                                                            autoPlay
                                                            muted
                                                            playsInline
                                                        />
                                                        <canvas ref={canvasRef} className="emotion-video-overlay" />
                                                        <div className="emotion-video-badges">
                                                            <span className={`emotion-inline-chip is-${isSessionActive ? 'active' : 'idle'}`}>
                                                                <Activity size={12} />
                                                                {isSessionActive ? 'Monitoramento ativo' : 'Aguardando início'}
                                                            </span>
                                                            <span className={`emotion-inline-chip is-${faceState.quality.tone}`}>
                                                                <Stars size={12} />
                                                                Qualidade {faceState.quality.label}
                                                            </span>
                                                        </div>
                                                        {!cameraReady && (
                                                            <div className="emotion-video-placeholder">
                                                                {detectionStatus === 'loading-models' ? (
                                                                    <>
                                                                        <Spinner animation="border" size="sm" />
                                                                        <span>Preparando inteligência artificial...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CameraVideoFill size={24} />
                                                                        <span>A câmera será ativada ao iniciar a sessão.</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="emotion-status-strip">
                                                        <div className="emotion-status-pill">
                                                            <strong>IA</strong>
                                                            <span>{statusLabel}</span>
                                                        </div>
                                                        <div className="emotion-status-pill">
                                                            <strong>Face</strong>
                                                            <span>{faceStatusLabel}</span>
                                                        </div>
                                                        <div className="emotion-status-pill">
                                                            <strong>Confirmação</strong>
                                                            <span>{currentEmotion.stable ? 'Análise estável' : 'Em estabilização'}</span>
                                                        </div>
                                                    </div>

                                                    {faceState.warnings.length > 0 && (
                                                        <div className="emotion-warning-list">
                                                            {faceState.warnings.map((warning) => (
                                                                <div key={warning} className="emotion-warning-item">
                                                                    <ExclamationTriangleFill size={14} />
                                                                    <span>{warning}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="emotion-kpi-grid">
                                                    <div className="emotion-kpi-card">
                                                        <span className="emotion-kpi-label">Tempo monitorado</span>
                                                        <strong>{formatDuration(monitoredDurationMs)}</strong>
                                                    </div>
                                                    <div className="emotion-kpi-card">
                                                        <span className="emotion-kpi-label">Expressão predominante</span>
                                                        <strong>{liveSessionMetrics.predominantEmotionLabel}</strong>
                                                    </div>
                                                    <div className="emotion-kpi-card">
                                                        <span className="emotion-kpi-label">Confiança média</span>
                                                        <strong>{formatConfidence(liveSessionMetrics.averageConfidence)}</strong>
                                                    </div>
                                                    <div className="emotion-kpi-card">
                                                        <span className="emotion-kpi-label">Alterações persistentes</span>
                                                        <strong>{String(liveSessionMetrics.persistentChanges).padStart(2, '0')}</strong>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    <Col xl={5}>
                                        <Card className="emotion-panel-card">
                                            <Card.Body>
                                                <div className="emotion-panel-kicker">Expressão atual</div>
                                                <h3 className="emotion-current-title">
                                                    {currentEmotion.key ? currentEmotion.label : rawEmotion.label}
                                                </h3>
                                                <div className="emotion-current-meta">
                                                    <div>
                                                        <span className="emotion-meta-label">Confiança</span>
                                                        <strong>{formatConfidence(currentEmotion.confidence || rawEmotion.confidence)}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="emotion-meta-label">Estável há</span>
                                                        <strong>{currentEmotion.since ? formatDuration(Date.now() - new Date(currentEmotion.since).getTime()) : '00:00:00'}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="emotion-meta-label">Qualidade</span>
                                                        <strong>{faceState.quality.label}</strong>
                                                    </div>
                                                </div>
                                                <Alert variant="light" className="emotion-disclaimer mt-3 mb-0">
                                                    Expressão facial predominante: {currentEmotion.key ? currentEmotion.label : rawEmotion.label}.
                                                    A interpretação permanece como apoio observacional, não como diagnóstico.
                                                </Alert>
                                            </Card.Body>
                                        </Card>

                                        <Card className="emotion-panel-card">
                                            <Card.Body>
                                                <div className="emotion-panel-kicker">Privacidade</div>
                                                <h3>Processamento em tempo real</h3>
                                                <p className="mb-0">
                                                    As imagens da câmera são processadas para análise em tempo real e não são
                                                    armazenadas por este monitoramento. Apenas eventos emocionais compatíveis
                                                    com o endpoint <code>/emotions</code> são enviados ao servidor.
                                                </p>
                                            </Card.Body>
                                        </Card>

                                        <Card className="emotion-panel-card">
                                            <Card.Body>
                                                <div className="emotion-panel-kicker">Informações técnicas</div>
                                                <div className="emotion-tech-grid">
                                                    <div>
                                                        <span>Detector facial</span>
                                                        <Badge bg={modelStatus.detector ? 'success' : 'secondary'}>{modelStatus.detector ? 'pronto' : 'pendente'}</Badge>
                                                    </div>
                                                    <div>
                                                        <span>Landmarks</span>
                                                        <Badge bg={modelStatus.landmarks ? 'success' : 'secondary'}>{modelStatus.landmarks ? 'pronto' : 'pendente'}</Badge>
                                                    </div>
                                                    <div>
                                                        <span>Expressões</span>
                                                        <Badge bg={modelStatus.expressions ? 'success' : 'secondary'}>{modelStatus.expressions ? 'pronto' : 'pendente'}</Badge>
                                                    </div>
                                                    <div>
                                                        <span>Reconhecimento futuro</span>
                                                        <Badge bg={modelStatus.recognition ? 'info' : 'secondary'}>{modelStatus.recognition ? 'carregado' : 'opcional'}</Badge>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row className="g-4 mt-1">
                                    <Col xs={12}>
                                        <Card className="emotion-panel-card">
                                            <Card.Body>
                                                <div className="emotion-panel-header emotion-panel-header-inline">
                                                    <div>
                                                        <div className="emotion-panel-kicker">Evolução das expressões</div>
                                                        <h3>Resultados estáveis ao longo do tempo</h3>
                                                    </div>
                                                    <div className="emotion-filter-row">
                                                        <Form.Select
                                                            size="sm"
                                                            value={periodFilter}
                                                            onChange={(event) => setPeriodFilter(event.target.value)}
                                                        >
                                                            <option value="session">Sessão atual</option>
                                                            <option value="today">Hoje</option>
                                                            <option value="week">Últimos 7 dias</option>
                                                            <option value="month">Últimos 30 dias</option>
                                                            <option value="custom">Data específica</option>
                                                        </Form.Select>
                                                        {periodFilter === 'custom' && (
                                                            <Form.Control
                                                                type="date"
                                                                size="sm"
                                                                value={dateFilter}
                                                                onChange={(event) => setDateFilter(event.target.value)}
                                                            />
                                                        )}
                                                        <Form.Select
                                                            size="sm"
                                                            value={emotionFilter}
                                                            onChange={(event) => setEmotionFilter(event.target.value)}
                                                        >
                                                            <option value="all">Todas as expressões</option>
                                                            {VALID_EMOTIONS.map((emotionKey) => (
                                                                <option key={emotionKey} value={emotionKey}>
                                                                    {getEmotionLabel(emotionKey)}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                    </div>
                                                </div>
                                                <p className="emotion-section-caption">
                                                    Escopo: {buildChartScopeLabel(periodFilter)}. Somente resultados válidos e estáveis entram neste gráfico.
                                                </p>
                                                <div className="emotion-chart-area">
                                                    {filteredRecords.length === 0 ? (
                                                        <div className="emotion-empty-state">
                                                            <BarChartLine size={22} />
                                                            <span>Nenhum evento estável disponível para os filtros escolhidos.</span>
                                                        </div>
                                                    ) : (
                                                        <Line data={lineChartData} options={lineOptions} />
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row className="g-4 mt-1">
                                    <Col lg={5}>
                                        <Card className="emotion-panel-card">
                                            <Card.Body>
                                                <div className="emotion-panel-kicker">Distribuição de expressões</div>
                                                <h3>Tempo observado por expressão</h3>
                                                <div className="emotion-chart-area emotion-chart-area-sm">
                                                    {distributionChartData.labels.length === 0 ? (
                                                        <div className="emotion-empty-state">
                                                            <ClockHistory size={22} />
                                                            <span>Inicie uma sessão ou carregue histórico para ver a distribuição.</span>
                                                        </div>
                                                    ) : (
                                                        <Doughnut data={distributionChartData} options={doughnutOptions} />
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    <Col lg={7}>
                                        <Card className="emotion-panel-card">
                                            <Card.Body>
                                                <div className="emotion-panel-header emotion-panel-header-inline">
                                                    <div>
                                                        <div className="emotion-panel-kicker">Eventos</div>
                                                        <h3>Timeline da sessão</h3>
                                                    </div>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={handleRegisterContext}
                                                    >
                                                        <ArrowClockwise size={14} />
                                                        Registrar contexto
                                                    </Button>
                                                </div>

                                                {timelineEvents.length === 0 ? (
                                                    <div className="emotion-empty-state">
                                                        <ClockHistory size={22} />
                                                        <span>Nenhuma sessão anterior disponível. Após concluir monitoramentos, os eventos aparecerão aqui.</span>
                                                    </div>
                                                ) : (
                                                    <div className="emotion-timeline-list">
                                                        {timelineEvents.map((event, index) => (
                                                            <div key={`${event.id}-${index}`} className="emotion-timeline-item">
                                                                <div className="emotion-timeline-time">{formatTimestamp(event.startedAt)}</div>
                                                                <div className="emotion-timeline-content">
                                                                    <strong>{event.label}</strong>
                                                                    <span>
                                                                        Duração {formatDuration(event.durationMs)} • Confiança média {formatConfidence(event.averageConfidence)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row className="g-4 mt-1">
                                    <Col lg={6}>
                                        <Card className="emotion-panel-card">
                                            <Card.Body>
                                                <div className="emotion-panel-kicker">Comparação entre sessões</div>
                                                <h3>Leitura resumida por sessão</h3>
                                                <div className="emotion-chart-area emotion-chart-area-sm">
                                                    {uniqueComparisonSessions.length === 0 ? (
                                                        <div className="emotion-empty-state">
                                                            <BarChartLine size={22} />
                                                            <span>
                                                                Nenhuma sessão anterior disponível. Após concluir monitoramentos,
                                                                as sessões aparecerão aqui para comparação.
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Bar data={sessionComparisonData} options={barOptions} />
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    <Col lg={6}>
                                        <Card className="emotion-panel-card">
                                            <Card.Body>
                                                <div className="emotion-panel-kicker">Insights da sessão</div>
                                                <h3>Leituras objetivas do monitoramento</h3>
                                                <div className="emotion-insights-list">
                                                    {sessionInsights.map((insight) => (
                                                        <div key={insight} className="emotion-insight-item">
                                                            <ShieldCheck size={16} />
                                                            <span>{insight}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row className="g-4 mt-1">
                                    <Col xs={12}>
                                        <Card className="emotion-panel-card">
                                            <Card.Body>
                                                <div className="emotion-panel-kicker">Histórico e carregamento</div>
                                                <div className="emotion-footer-info">
                                                    <div>
                                                        <strong>Histórico local controlado</strong>
                                                        <p className="mb-0">
                                                            Mantemos no máximo {DETECTION_CONFIG.maxLocalHistory} eventos estáveis em memória na sessão ativa.
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <strong>Histórico do backend</strong>
                                                        <p className="mb-0">
                                                            {historyLoading
                                                                ? 'Carregando eventos anteriores do paciente...'
                                                                : `${historyRecords.length} registro(s) compatíveis carregados do backend.`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </>
                        )}
                    </Container>
                </main>

                <footer className="footer-section py-4">
                    <Container>
                        <Row className="align-items-center">
                            <Col md={6} className="footer-left text-start">
                                <p className="mb-0">
                                    {'\u00a9'} 2026 Nf Representacoes Comerciais Ltda.<br />
                                    <small>Todos os direitos reservados.</small>
                                </p>
                            </Col>
                        </Row>
                    </Container>
                </footer>
            </div>
        </div>
    );
};

export default EmotionDetector;
