import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Badge,
    Button,
    Card,
    Container,
    Form,
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
    ShieldCheck,
    Stars,
    StopCircleFill
} from 'react-bootstrap-icons';
import logonovo from '../assets/logonovo.png';
import {
    fetchEmotionHistory,
    fetchPatientFaceReference,
    resolveEmotionServiceErrorMessage,
    saveEmotionRecord
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
    formatConfidence,
    formatDuration,
    formatTimestamp,
    generateSessionInsights,
    getDominantEmotion,
    getEmotionLabel,
    groupRecordsIntoSessions,
    normalizeEmotionRecord,
    normalizeFaceDescriptor,
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
    'loading-models': 'Preparando inteligencia artificial...',
    ready: 'IA pronta',
    'starting-camera': 'Ativando camera...',
    'searching-face': 'Procurando paciente...',
    stabilizing: 'Estabilizando analise...',
    monitoring: 'Analise estavel',
    'face-lost': 'Face perdida...',
    paused: 'Monitoramento pausado',
    error: 'Erro no monitoramento'
};

const STATUS_TONES = {
    idle: 'neutral',
    'loading-models': 'info',
    ready: 'ready',
    'starting-camera': 'info',
    'searching-face': 'searching',
    stabilizing: 'warning',
    monitoring: 'success',
    'face-lost': 'danger',
    paused: 'paused',
    error: 'danger'
};

const MODEL_LOAD_TIMEOUT_MS = 20000;
const CAMERA_SIGNAL_TIMEOUT_MS = 8000;
const DISCOMFORT_EMOTION_KEYS = new Set(['angry', 'sad', 'fearful', 'disgusted']);

function createEmptyEmotionState() {
    return {
        key: null,
        label: 'Aguardando analise',
        confidence: 0,
        stable: false,
        since: null
    };
}

function createEmptyRawEmotionState() {
    return {
        key: null,
        label: 'Aguardando analise',
        confidence: 0,
        inconclusive: true
    };
}

function createEmptyFaceState() {
    return {
        mode: 'searching-face',
        multipleFaces: false,
        message: 'Cadastre uma referencia facial para iniciar com seguranca.',
        quality: {
            label: 'Regular',
            tone: 'regular',
            score: 0
        },
        warnings: []
    };
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

function mapCameraError(error) {
    switch (error?.name) {
    case 'NotAllowedError':
        return 'Camera bloqueada. Autorize o acesso a camera para iniciar o monitoramento.';
    case 'NotFoundError':
        return 'Nenhuma camera encontrada neste dispositivo.';
    case 'NotReadableError':
        return 'A camera esta em uso por outro aplicativo, aba ou monitor do navegador. Feche outras janelas que usam webcam e tente novamente.';
    case 'OverconstrainedError':
        return 'A camera disponivel nao atende as configuracoes necessarias para o monitoramento.';
    default:
        return 'Nao foi possivel acessar a webcam. Verifique as permissoes do navegador e tente novamente.';
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
        return 'Sessao atual';
    case 'today':
        return 'Hoje';
    case 'week':
        return 'Ultimos 7 dias';
    case 'month':
        return 'Ultimos 30 dias';
    case 'custom':
        return 'Data especifica';
    default:
        return 'Historico';
    }
}

function buildSessionLabel(session, index) {
    const baseDate = new Date(session.startedAt).toLocaleDateString('pt-BR');
    return index === 0 ? 'Sessao atual' : `${baseDate} - ${formatTimestamp(session.startedAt)}`;
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

async function loadFaceApiNetIfNeeded(net, timeoutMessage) {
    if (!net) {
        throw new Error('O modelo solicitado nao esta disponivel nesta pagina.');
    }

    if (net.isLoaded) {
        return;
    }

    await withTimeout(
        net.loadFromUri('/models'),
        MODEL_LOAD_TIMEOUT_MS,
        timeoutMessage
    );
}

function waitForVideoSignal(videoElement, timeoutMs = CAMERA_SIGNAL_TIMEOUT_MS) {
    if (!videoElement) {
        return Promise.reject(new Error('A camera nao esta disponivel para iniciar o monitoramento.'));
    }

    const hasVisibleFrame = () => (
        videoElement.readyState >= 2
        && videoElement.videoWidth > 0
        && videoElement.videoHeight > 0
    );

    if (hasVisibleFrame()) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const handleReady = () => {
            if (!hasVisibleFrame()) {
                return;
            }

            cleanup();
            resolve();
        };

        const cleanup = () => {
            eventNames.forEach((eventName) => videoElement.removeEventListener(eventName, handleReady));
            window.clearTimeout(timeoutId);
        };

        const eventNames = ['loadeddata', 'canplay', 'playing', 'resize'];
        eventNames.forEach((eventName) => videoElement.addEventListener(eventName, handleReady));

        const timeoutId = window.setTimeout(() => {
            cleanup();
            reject(new Error('A camera foi aberta, mas nenhum frame visivel chegou a tempo. Tente reiniciar a camera.'));
        }, timeoutMs);

        handleReady();
    });
}

function buildScopedMetricsFromRecords(records = []) {
    if (!Array.isArray(records) || records.length === 0) {
        return calculateSessionMetrics([]);
    }

    const events = records.map((record) => {
        const durationMs = Math.max(record.durationMs || 0, 1000);
        const startedAt = record.timestamp;

        return buildEmotionEvent({
            emotionKey: record.emotion,
            startedAt,
            endedAt: new Date(new Date(startedAt).getTime() + durationMs).toISOString(),
            confidenceSamples: [record.confidence || 0],
            source: record.source || 'session'
        });
    });

    return calculateSessionMetrics(events, {
        startedAt: events[0]?.startedAt || null,
        endedAt: events[events.length - 1]?.endedAt || null
    });
}

function getTrendMeta(delta) {
    if (delta >= 0.05) {
        return { label: 'Alta', variant: 'success' };
    }

    if (delta <= -0.05) {
        return { label: 'Queda', variant: 'danger' };
    }

    return { label: 'Estavel', variant: 'secondary' };
}

function shouldRetryCameraAccess(error) {
    return ['NotReadableError', 'AbortError', 'OverconstrainedError'].includes(error?.name);
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

function buildMirroredReferenceCanvas(image) {
    if (!image?.width || !image?.height) {
        return null;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        return null;
    }

    canvas.width = image.width;
    canvas.height = image.height;
    context.translate(image.width, 0);
    context.scale(-1, 1);
    context.drawImage(image, 0, 0, image.width, image.height);

    return canvas;
}

async function extractReferenceDescriptorFromSource(faceapi, source) {
    if (!faceapi || !source) {
        return null;
    }

    const detections = await faceapi
        .detectAllFaces(source, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: Math.max(0.3, DETECTION_CONFIG.minFaceConfidence - 0.15)
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();

    if (!Array.isArray(detections) || detections.length !== 1) {
        return null;
    }

    return normalizeFaceDescriptor(Array.from(detections[0].descriptor || []));
}

function appendUniqueReferenceDescriptor(collection, descriptor) {
    const normalizedDescriptor = normalizeFaceDescriptor(descriptor);

    if (!normalizedDescriptor) {
        return collection;
    }

    const alreadyIncluded = collection.some((currentDescriptor) => (
        calculateDescriptorDistance(currentDescriptor, normalizedDescriptor) <= 0.025
    ));

    if (!alreadyIncluded) {
        collection.push(normalizedDescriptor);
    }

    return collection;
}

async function buildReferenceDescriptorVariants(faceapi, referenceImageData, fallbackDescriptor) {
    const descriptors = [];
    appendUniqueReferenceDescriptor(descriptors, fallbackDescriptor);

    if (!referenceImageData) {
        return descriptors;
    }

    const referenceImage = await loadImageElement(referenceImageData);
    const mirroredReferenceCanvas = buildMirroredReferenceCanvas(referenceImage);
    const descriptorSources = [referenceImage, mirroredReferenceCanvas].filter(Boolean);

    for (const descriptorSource of descriptorSources) {
        const nextDescriptor = await extractReferenceDescriptorFromSource(faceapi, descriptorSource);
        appendUniqueReferenceDescriptor(descriptors, nextDescriptor);
    }

    return descriptors;
}

const EmotionDetectorVerified = () => {
    const location = useLocation();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const loopFrameRef = useRef(null);
    const lastInferenceAtRef = useRef(0);
    const isInferenceRunningRef = useRef(false);
    const monitoringEnabledRef = useRef(false);
    const cameraReadyRef = useRef(false);
    const lightingCanvasRef = useRef(null);
    const modelsLoadedRef = useRef(false);
    const patientReferenceDescriptorRef = useRef(null);
    const patientReferenceDescriptorSetRef = useRef([]);
    const referenceDescriptorBuildVersionRef = useRef(0);
    const sessionRef = useRef(null);
    const lastTargetBoxRef = useRef(null);
    const targetLostFramesRef = useRef(0);
    const emotionBufferRef = useRef([]);
    const activeEmotionRef = useRef(null);
    const pendingEmotionRef = useRef(null);
    const currentEventRef = useRef(null);
    const lastPersistedEmotionRef = useRef({
        key: null,
        timestampMs: 0
    });
    const persistenceQueueRef = useRef([]);
    const persistenceTimerRef = useRef(null);
    const persistenceInFlightRef = useRef(false);
    const liveAnnouncementRef = useRef('');
    const lastDebugLogAtRef = useRef(0);

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
    const [liveAnnouncement, setLiveAnnouncement] = useState('');

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

    const refreshReferenceDescriptorSet = useCallback(async (referenceState) => {
        const baseDescriptor = normalizeFaceDescriptor(referenceState?.descriptor);
        const fallbackDescriptorSet = baseDescriptor ? [baseDescriptor] : [];
        const buildVersion = referenceDescriptorBuildVersionRef.current + 1;
        referenceDescriptorBuildVersionRef.current = buildVersion;
        patientReferenceDescriptorSetRef.current = fallbackDescriptorSet;
        patientReferenceDescriptorRef.current = fallbackDescriptorSet[0] || null;

        if (!referenceState?.hasReference || !referenceState.referenceImageData || !modelsReady || !window.faceapi) {
            return fallbackDescriptorSet;
        }

        try {
            const descriptorVariants = await buildReferenceDescriptorVariants(
                window.faceapi,
                referenceState.referenceImageData,
                baseDescriptor
            );

            if (buildVersion !== referenceDescriptorBuildVersionRef.current) {
                return patientReferenceDescriptorSetRef.current;
            }

            patientReferenceDescriptorSetRef.current = descriptorVariants.length > 0
                ? descriptorVariants
                : fallbackDescriptorSet;
            patientReferenceDescriptorRef.current = patientReferenceDescriptorSetRef.current[0] || null;
            return patientReferenceDescriptorSetRef.current;
        } catch (descriptorBuildError) {
            if (buildVersion === referenceDescriptorBuildVersionRef.current) {
                patientReferenceDescriptorSetRef.current = fallbackDescriptorSet;
                patientReferenceDescriptorRef.current = fallbackDescriptorSet[0] || null;
            }

            return fallbackDescriptorSet;
        }
    }, [modelsReady]);

    const resetAnalysisState = useCallback((nextStatus = 'ready') => {
        lastTargetBoxRef.current = null;
        targetLostFramesRef.current = 0;
        emotionBufferRef.current = [];
        activeEmotionRef.current = null;
        pendingEmotionRef.current = null;
        currentEventRef.current = null;
        lastPersistedEmotionRef.current = {
            key: null,
            timestampMs: 0
        };
        setRawEmotion(createEmptyRawEmotionState());
        setCurrentEmotion(createEmptyEmotionState());
        setFaceState((previous) => ({
            ...createEmptyFaceState(),
            message: previous?.message || createEmptyFaceState().message
        }));

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

        cameraReadyRef.current = false;
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

    const closeSessionAndStop = useCallback((status = 'ready') => {
        const nowIso = new Date().toISOString();
        finalizeCurrentEvent(nowIso);
        stopDetectionLoop();
        stopCameraStream();
        resetAnalysisState(status);

        if (!sessionRef.current) {
            return;
        }

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
            setSyncWarning('Nao foi possivel salvar um evento. A analise continuara localmente e novas tentativas serao feitas de forma controlada.');
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
        const timestampMs = new Date(timestamp).getTime();

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
                since: timestamp
            };
        } else if (currentEventRef.current) {
            currentEventRef.current.confidenceSamples.push(stableEmotion.confidence);
        }

        const lastPersistedEmotion = lastPersistedEmotionRef.current;
        const shouldPersistEmotion = !lastPersistedEmotion.key
            || lastPersistedEmotion.key !== stableEmotion.key
            || (timestampMs - lastPersistedEmotion.timestampMs) >= DETECTION_CONFIG.persistenceIntervalMs;

        if (shouldPersistEmotion) {
            enqueuePersistence(buildCompatibilityPayload(patientId, {
                emotion: stableEmotion.key,
                startedAt: timestamp
            }));
            lastPersistedEmotionRef.current = {
                key: stableEmotion.key,
                timestampMs
            };
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
            setError('As bibliotecas de IA nao foram carregadas. Verifique os scripts antes de iniciar o monitoramento.');
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

            const nextStatus = {
                detector: false,
                landmarks: false,
                expressions: false,
                recognition: false
            };

            const requiredLoaders = [
                {
                    key: 'detector',
                    load: () => loadFaceApiNetIfNeeded(
                        faceapi.nets.tinyFaceDetector,
                        'O detector facial demorou para carregar. Recarregue a pagina e tente novamente.'
                    )
                },
                {
                    key: 'landmarks',
                    load: () => loadFaceApiNetIfNeeded(
                        faceapi.nets.faceLandmark68Net,
                        'O modelo de landmarks demorou para carregar. Recarregue a pagina e tente novamente.'
                    )
                },
                {
                    key: 'expressions',
                    load: () => loadFaceApiNetIfNeeded(
                        faceapi.nets.faceExpressionNet,
                        'O modelo de expressoes demorou para carregar. Recarregue a pagina e tente novamente.'
                    )
                }
            ];

            for (const loader of requiredLoaders) {
                await loader.load();
                nextStatus[loader.key] = true;
            }

            try {
                await loadFaceApiNetIfNeeded(
                    faceapi.nets.faceRecognitionNet,
                    'O modelo de reconhecimento facial demorou para responder. O monitoramento principal seguira pronto e o cadastro da foto podera ser tentado novamente.'
                );
                nextStatus.recognition = true;
            } catch (recognitionError) {
                nextStatus.recognition = Boolean(faceapi.nets.faceRecognitionNet?.isLoaded);
            }

            setModelStatus(nextStatus);
            modelsLoadedRef.current = true;
            setModelsReady(true);
            setDetectionStatus('ready');
        } catch (loadError) {
            modelsLoadedRef.current = false;
            setError('Nao foi possivel carregar os modelos de IA. Recarregue a pagina e tente novamente.');
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
            setSyncWarning('Nao foi possivel carregar o historico anterior do paciente. O monitoramento atual continuara disponivel normalmente.');
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    const loadFaceReference = useCallback(async (resolvedPatientId) => {
        if (!resolvedPatientId) {
            patientReferenceDescriptorRef.current = null;
            patientReferenceDescriptorSetRef.current = [];
            setFaceReference(createEmptyFaceReferenceState());
            return;
        }

        setFaceReferenceLoading(true);

        try {
            const response = await fetchPatientFaceReference(resolvedPatientId);
            const descriptor = normalizeFaceDescriptor(response?.descriptor);
            const nextReference = response?.hasReference && descriptor
                ? {
                    hasReference: true,
                    descriptor,
                    referenceImageData: response.referenceImageData || null,
                    captureMode: response.captureMode || 'upload',
                    faceConfidence: Number.isFinite(Number(response.faceConfidence)) ? Number(response.faceConfidence) : null,
                    matchThreshold: Number.isFinite(Number(response.matchThreshold))
                        ? Math.max(Number(response.matchThreshold), DETECTION_CONFIG.faceMatchThreshold)
                        : DETECTION_CONFIG.faceMatchThreshold,
                    createdAt: response.createdAt || null,
                    updatedAt: response.updatedAt || null
                }
                : createEmptyFaceReferenceState();

            patientReferenceDescriptorRef.current = nextReference.descriptor;
            patientReferenceDescriptorSetRef.current = nextReference.descriptor ? [nextReference.descriptor] : [];
            setFaceReference(nextReference);
            setFaceState((previous) => ({
                ...previous,
                message: nextReference.hasReference
                    ? 'Referencia facial pronta. O monitoramento so registra quando a face do paciente for confirmada.'
                    : 'Cadastre uma foto de referencia do paciente para liberar o monitoramento.'
            }));
        } catch (referenceError) {
            patientReferenceDescriptorRef.current = null;
            patientReferenceDescriptorSetRef.current = [];
            setFaceReference(createEmptyFaceReferenceState());
            setSyncWarning(resolveEmotionServiceErrorMessage(referenceError, {
                timeoutMessage: 'A referencia facial demorou para responder. Tente novamente em alguns instantes.',
                networkMessage: 'Nao foi possivel carregar a referencia facial porque o servidor nao respondeu.',
                fallbackMessage: 'Nao foi possivel carregar a referencia facial deste paciente.'
            }));
        } finally {
            setFaceReferenceLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!faceReference.hasReference || !faceReference.descriptor) {
            patientReferenceDescriptorSetRef.current = [];
            patientReferenceDescriptorRef.current = null;
            return;
        }

        void refreshReferenceDescriptorSet(faceReference);
    }, [faceReference, refreshReferenceDescriptorSet]);

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
                    'Paciente confirmado',
                    labelData.label
                        ? `${labelData.label} - ${formatConfidence(labelData.confidence || 0)}`
                        : 'Analise em estabilizacao'
                ]
                : ['Face nao monitorada'];

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

            context.save();
            context.font = '600 12px "Segoe UI"';
            const labelWidth = Math.min(280, Math.max(155, ...labelLines.map((line) => context.measureText(line).width + 20)));
            const labelHeight = 24 + (labelLines.length * 18);
            const labelX = box.x;
            const labelY = Math.max(8, box.y - labelHeight - 10);

            context.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.88)' : 'rgba(71, 85, 105, 0.85)';
            context.fillRect(labelX, labelY, labelWidth, labelHeight);
            context.fillStyle = '#f8fafc';
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

        const detectorOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: Math.max(0.3, DETECTION_CONFIG.minFaceConfidence - 0.15)
        });
        const singleDetection = await faceapi
            .detectSingleFace(video, detectorOptions)
            .withFaceLandmarks()
            .withFaceExpressions()
            .withFaceDescriptor();

        let detections = singleDetection ? [singleDetection] : [];
        let selection = singleDetection ? selectFaceByReference(detections, {
            referenceDescriptor: patientReferenceDescriptorRef.current,
            referenceDescriptors: patientReferenceDescriptorSetRef.current,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            lastTargetBox: lastTargetBoxRef.current,
            threshold: faceReference.matchThreshold || DETECTION_CONFIG.faceMatchThreshold
        }) : null;

        if (!selection?.selectedDetection) {
            detections = await faceapi
                .detectAllFaces(video, detectorOptions)
                .withFaceLandmarks()
                .withFaceExpressions()
                .withFaceDescriptors();

            selection = selectFaceByReference(detections, {
                referenceDescriptor: patientReferenceDescriptorRef.current,
                referenceDescriptors: patientReferenceDescriptorSetRef.current,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                lastTargetBox: lastTargetBoxRef.current,
                threshold: faceReference.matchThreshold || DETECTION_CONFIG.faceMatchThreshold
            });
        }

        const displaySize = {
            width: video.videoWidth,
            height: video.videoHeight
        };
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const observedAt = new Date().toISOString();
        const debugNowMs = Date.now();

        if ((debugNowMs - lastDebugLogAtRef.current) >= 1500) {
            console.info('[EMOTION_MONITOR_DEBUG]', {
                patientId,
                detections: Array.isArray(detections) ? detections.length : 0,
                selected: Boolean(selection?.selectedDetection),
                faceState: selection?.faceState || 'unknown',
                matchDistance: Number.isFinite(selection?.metrics?.matchDistance)
                    ? Number(selection.metrics.matchDistance.toFixed(4))
                    : null,
                faceConfidence: Number.isFinite(selection?.metrics?.faceConfidence)
                    ? Number(selection.metrics.faceConfidence.toFixed(4))
                    : null,
                centeredness: Number.isFinite(selection?.metrics?.centeredness)
                    ? Number(selection.metrics.centeredness.toFixed(4))
                    : null,
                areaRatio: Number.isFinite(selection?.metrics?.areaRatio)
                    ? Number(selection.metrics.areaRatio.toFixed(4))
                    : null,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight
            });
            lastDebugLogAtRef.current = debugNowMs;
        }

        if (!selection.selectedDetection) {
            lastTargetBoxRef.current = null;
            targetLostFramesRef.current += 1;

            const shouldCloseActiveEvent = targetLostFramesRef.current >= DETECTION_CONFIG.maxTargetLostFrames;

            if (shouldCloseActiveEvent) {
                finalizeCurrentEvent(observedAt);
                activeEmotionRef.current = null;
                pendingEmotionRef.current = null;
                emotionBufferRef.current = [];
                setCurrentEmotion(createEmptyEmotionState());
                setRawEmotion(createEmptyRawEmotionState());
            }

            const distanceHint = Number.isFinite(selection.metrics?.matchDistance)
                ? ` Distancia atual: ${selection.metrics.matchDistance.toFixed(2)}.`
                : '';
            const selectionMessage = selection.faceState === 'not-found'
                ? 'Nenhuma face foi detectada pela camera neste momento.'
                : selection.faceState === 'ambiguous-match'
                ? 'Mais de uma face semelhante a referencia foi encontrada.'
                : selection.faceState === 'unconfirmed'
                    ? `Paciente monitorado ainda nao foi reconhecido na imagem.${distanceHint}`
                    : targetLostFramesRef.current > 0
                        ? 'Face monitorada temporariamente perdida.'
                        : 'Procurando paciente monitorado...';

            setDetectionStatus(selection.faceState === 'unconfirmed' || selection.faceState === 'ambiguous-match'
                ? 'searching-face'
                : 'face-lost');
            setFaceState({
                mode: selection.faceState,
                multipleFaces: selection.multipleFaces,
                message: selectionMessage,
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
            label: nextRawEmotion.inconclusive ? 'Analise inconclusiva' : nextRawEmotion.label,
            confidence: nextRawEmotion.confidence,
            inconclusive: nextRawEmotion.inconclusive
        });

        setFaceState({
            mode: selection.faceState,
            multipleFaces: selection.multipleFaces,
            message: selection.multipleFaces
                ? 'Multiplas faces detectadas. Apenas a face confirmada sera monitorada.'
                : `${
                    selection.faceState === 'single-face-fallback'
                        ? 'Paciente confirmado por fallback de face unica'
                        : selection.faceState === 'soft-confirmed' || selection.faceState === 'confirmed-multi-soft'
                        ? 'Paciente confirmado por correspondencia aproximada'
                        : 'Paciente confirmado'
                }${selection.metrics?.matchDistance ? ` (distancia ${selection.metrics.matchDistance.toFixed(2)})` : ''}.`,
            quality,
            warnings
        });

        drawOverlay(
            resizedDetections,
            selection.selectedIndex,
            nextRawEmotion.inconclusive
                ? {
                    label: 'Analise inconclusiva',
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
                    since: observedAt
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
    }, [activateStableEmotion, drawOverlay, estimateBrightness, faceReference.matchThreshold, finalizeCurrentEvent]);

    const startDetectionLoop = useCallback(() => {
        stopDetectionLoop();
        monitoringEnabledRef.current = true;

        const step = async (frameTime) => {
            if (!monitoringEnabledRef.current) {
                return;
            }

            if (!modelsLoadedRef.current || !cameraReadyRef.current || isInferenceRunningRef.current) {
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
                setError('O monitoramento encontrou uma falha inesperada durante a analise. Reinicie a camera para tentar novamente.');
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
    }, [processFrame, stopCameraStream, stopDetectionLoop]);

    const startCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Seu navegador nao oferece suporte ao acesso a camera.');
            setDetectionStatus('error');
            return false;
        }

        setError('');
        stopCameraStream();

        try {
            const cameraAttempts = [
                {
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                },
                {
                    video: {
                        facingMode: 'user'
                    },
                    audio: false
                },
                {
                    video: true,
                    audio: false
                }
            ];
            let stream = null;
            let lastCameraError = null;

            for (let attemptIndex = 0; attemptIndex < cameraAttempts.length; attemptIndex += 1) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(cameraAttempts[attemptIndex]);
                    break;
                } catch (cameraAttemptError) {
                    lastCameraError = cameraAttemptError;

                    if (!shouldRetryCameraAccess(cameraAttemptError) || attemptIndex === cameraAttempts.length - 1) {
                        throw cameraAttemptError;
                    }

                    await new Promise((resolve) => window.setTimeout(resolve, 350));
                }
            }

            if (!stream) {
                throw lastCameraError || new Error('Nao foi possivel inicializar a camera.');
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.muted = true;
                videoRef.current.playsInline = true;

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
                await waitForVideoSignal(videoRef.current);
                syncCanvasSize();
            }

            cameraReadyRef.current = true;
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
            setError('Paciente nao identificado. Informe ?patientId=ID para iniciar o monitoramento.');
            return;
        }

        if (!faceReference.hasReference || patientReferenceDescriptorSetRef.current.length === 0) {
            setError('Cadastre uma foto de referencia do paciente antes de iniciar o monitoramento.');
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
        setFaceState((previous) => ({
            ...previous,
            message: 'Camera ativa. Procurando a face confirmada do paciente...'
        }));
        setDetectionStatus('searching-face');
        startDetectionLoop();
    }, [faceReference.hasReference, loadModels, modelsReady, patientId, resetAnalysisState, startCamera, startDetectionLoop]);

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

        closeSessionAndStop('ready');
    }, [closeSessionAndStop]);

    const handleRegisterContext = useCallback(() => {
        setInfoMessage('O gancho para registrar contexto foi preservado para integracao futura com o TriggerRecorder.');
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
            setFaceReference(createEmptyFaceReferenceState());
            patientReferenceDescriptorRef.current = null;
            patientReferenceDescriptorSetRef.current = [];
            setError('Paciente nao identificado. Nao foi possivel iniciar o monitoramento porque nenhum paciente foi informado.');
            return;
        }

        setError('');
        setDetectionStatus(modelsLoadedRef.current ? 'ready' : 'loading-models');
        void loadModels();
        void loadHistory(resolvedPatientId);
        void loadFaceReference(resolvedPatientId);
    }, [loadFaceReference, loadHistory, loadModels, location.search, resetAnalysisState, stopCameraStream, stopDetectionLoop]);

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

    useEffect(() => {
        let nextAnnouncement = '';

        if (error) {
            nextAnnouncement = error;
        } else if (detectionStatus === 'loading-models') {
            nextAnnouncement = 'Preparando monitoramento com os modelos de inteligencia artificial.';
        } else if (detectionStatus === 'searching-face') {
            nextAnnouncement = 'Camera ativada. Procurando a face monitorada.';
        } else if (detectionStatus === 'stabilizing') {
            nextAnnouncement = 'Leitura em estabilizacao antes de publicar a expressao predominante.';
        } else if (detectionStatus === 'monitoring') {
            nextAnnouncement = 'Monitoramento estabilizado e em andamento.';
        } else if (detectionStatus === 'face-lost') {
            nextAnnouncement = 'Face monitorada temporariamente perdida. Reposicione-se diante da camera.';
        } else if (detectionStatus === 'paused' || session?.status === 'paused') {
            nextAnnouncement = 'Monitoramento pausado.';
        } else if (session?.status === 'ended') {
            nextAnnouncement = 'Sessao encerrada. Os resultados permanecem visiveis.';
        } else if (detectionStatus === 'ready' && faceReference.hasReference) {
            nextAnnouncement = 'Sistema pronto para iniciar com a referencia facial carregada.';
        }

        if (nextAnnouncement && nextAnnouncement !== liveAnnouncementRef.current) {
            liveAnnouncementRef.current = nextAnnouncement;
            setLiveAnnouncement(nextAnnouncement);
        }
    }, [detectionStatus, error, faceReference.hasReference, session]);

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
            if (new Date(record.timestamp).toDateString() !== today.toDateString()) {
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

    const distributionKeys = VALID_EMOTIONS.filter((emotionKey) => distributionTotals[emotionKey] > 0);
    const distributionChartData = {
        labels: distributionKeys.map((emotionKey) => getEmotionLabel(emotionKey)),
        datasets: [{
            label: 'Distribuicao por tempo observado',
            data: distributionKeys.map((emotionKey) => Math.round((distributionTotals[emotionKey] / 1000) * 10) / 10),
            backgroundColor: distributionKeys.map((emotionKey) => EMOTION_COLORS[emotionKey]),
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
                label: 'Confianca media',
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

    const scopedAnalysisMetrics = filteredRecords.length > 0
        ? buildScopedMetricsFromRecords(filteredRecords)
        : session
            ? liveSessionMetrics
            : (historicalSessions[0]?.metrics || calculateSessionMetrics([]));
    const previousComparisonMetrics = uniqueComparisonSessions.length > 1
        ? uniqueComparisonSessions[1]?.metrics || null
        : null;
    const sessionInsights = generateSessionInsights(scopedAnalysisMetrics.totalDurationMs > 0 ? scopedAnalysisMetrics : null);
    const positiveRatio = scopedAnalysisMetrics.totalDurationMs > 0
        ? scopedAnalysisMetrics.positiveDurationMs / scopedAnalysisMetrics.totalDurationMs
        : 0;
    const neutralRatio = scopedAnalysisMetrics.totalDurationMs > 0
        ? scopedAnalysisMetrics.neutralDurationMs / scopedAnalysisMetrics.totalDurationMs
        : 0;
    const discomfortRatio = scopedAnalysisMetrics.totalDurationMs > 0
        ? scopedAnalysisMetrics.discomfortDurationMs / scopedAnalysisMetrics.totalDurationMs
        : 0;
    const predominantRatio = scopedAnalysisMetrics.predominantEmotion
        ? scopedAnalysisMetrics.percentagesByEmotion?.[scopedAnalysisMetrics.predominantEmotion] || 0
        : 0;
    const confidenceDelta = previousComparisonMetrics
        ? scopedAnalysisMetrics.averageConfidence - (previousComparisonMetrics.averageConfidence || 0)
        : 0;
    const scopeLabelLower = buildChartScopeLabel(periodFilter).toLowerCase();
    const levelOneDistributionRows = VALID_EMOTIONS
        .map((emotionKey) => {
            const durationMs = scopedAnalysisMetrics.durationsByEmotion?.[emotionKey] || 0;
            const percentage = scopedAnalysisMetrics.percentagesByEmotion?.[emotionKey] || 0;

            if (durationMs <= 0 && percentage <= 0) {
                return null;
            }

            const previousPercentage = previousComparisonMetrics?.percentagesByEmotion?.[emotionKey] || 0;
            const trend = getTrendMeta(percentage - previousPercentage);

            return {
                key: emotionKey,
                label: getEmotionLabel(emotionKey),
                durationMs,
                percentage,
                trendLabel: trend.label,
                trendVariant: trend.variant
            };
        })
        .filter(Boolean)
        .sort((left, right) => right.percentage - left.percentage);
    const levelOnePeakEmotion = levelOneDistributionRows.find((item) => DISCOMFORT_EMOTION_KEYS.has(item.key))
        || levelOneDistributionRows[0]
        || null;
    const levelOnePeakMessage = !levelOnePeakEmotion
        ? 'Sem eventos suficientes para destacar um pico emocional no escopo atual.'
        : DISCOMFORT_EMOTION_KEYS.has(levelOnePeakEmotion.key)
            ? `${levelOnePeakEmotion.label} concentrou ${formatConfidence(levelOnePeakEmotion.percentage)} do tempo analisado em ${scopeLabelLower}.`
            : `${levelOnePeakEmotion.label} liderou a observacao com ${formatConfidence(levelOnePeakEmotion.percentage)} do tempo analisado em ${scopeLabelLower}.`;
    const levelTwoSummary = scopedAnalysisMetrics.totalDurationMs === 0
        ? 'Ainda nao ha eventos estaveis suficientes para gerar um resumo inteligente. Assim que a sessao registrar expressoes consistentes, esta leitura sera atualizada.'
        : `No escopo de ${scopeLabelLower}, ${scopedAnalysisMetrics.predominantEmotionLabel.toLowerCase()} apareceu como estado predominante em ${formatConfidence(predominantRatio)} do tempo monitorado, com confianca media de ${formatConfidence(scopedAnalysisMetrics.averageConfidence)} e ${scopedAnalysisMetrics.persistentChanges} mudanca(s) persistente(s).`;
    const levelTwoHighlights = [
        `Estados positivos ocuparam ${formatConfidence(positiveRatio)} do tempo observado.`,
        `Neutralidade sustentou ${formatConfidence(neutralRatio)} da leitura consolidada.`,
        `Marcadores de desconforto corresponderam a ${formatConfidence(discomfortRatio)} do monitoramento filtrado.`
    ];
    const levelThreeProjectionTitle = previousComparisonMetrics
        ? confidenceDelta >= 0.05
            ? 'Tendencia de maior consistencia em relacao a sessao anterior'
            : confidenceDelta <= -0.05
                ? 'Tendencia de menor consistencia em relacao a sessao anterior'
                : 'Estabilidade semelhante a sessao anterior'
        : 'Projecoes serao refinadas com novas sessoes';
    const levelThreeProjectionText = previousComparisonMetrics
        ? confidenceDelta >= 0.05
            ? `A confianca media subiu para ${formatConfidence(scopedAnalysisMetrics.averageConfidence)} e indica um monitoramento mais estavel do que a sessao comparavel anterior.`
            : confidenceDelta <= -0.05
                ? `A confianca media caiu para ${formatConfidence(scopedAnalysisMetrics.averageConfidence)}. Vale revisar iluminacao, enquadramento e a referencia facial antes da proxima coleta.`
                : `A confianca media permaneceu proxima de ${formatConfidence(scopedAnalysisMetrics.averageConfidence)}, sugerindo um comportamento semelhante ao ultimo monitoramento comparavel.`
        : 'Com mais sessoes concluidas, o sistema podera comparar tendencias de confianca, predominancia emocional e variacoes persistentes.';
    const levelThreeAnomalyMessage = discomfortRatio >= 0.45
        ? 'Foi observada concentracao relevante de expressoes associadas a desconforto no periodo filtrado. Vale cruzar este dado com o contexto da atividade realizada.'
        : scopedAnalysisMetrics.averageConfidence > 0 && scopedAnalysisMetrics.averageConfidence < 0.55
            ? 'A confianca media da leitura ficou abaixo do ideal. Verifique posicionamento da face, iluminacao e estabilidade da camera antes da proxima sessao.'
            : scopedAnalysisMetrics.persistentChanges >= 6
                ? 'A sessao apresentou alta oscilacao de expressoes persistentes. Registrar o contexto pode ajudar a interpretar os gatilhos observados.'
                : '';

    const showPatientErrorState = !patientId;
    const canStartMonitoring = Boolean(patientId)
        && modelsReady
        && faceReference.hasReference
        && !faceReferenceLoading
        && detectionStatus !== 'loading-models';
    const isSessionActive = session?.status === 'active';
    const isSessionPaused = session?.status === 'paused';
    const statusLabel = STATUS_LABELS[detectionStatus] || STATUS_LABELS.idle;
    const faceStatusLabel = faceState.message || 'Aguardando referencia facial...';

    const sessionStatusLabel = session?.status === 'active'
        ? 'Ativa'
        : session?.status === 'paused'
            ? 'Pausada'
            : session?.status === 'ended'
                ? 'Encerrada'
                : 'Aguardando';
    const sessionStatusTone = session?.status === 'active'
        ? 'success'
        : session?.status === 'paused'
            ? 'paused'
            : session?.status === 'ended'
                ? 'neutral'
                : 'info';
    const syncStatusLabel = syncWarning
        ? 'Atencao'
        : pendingPersistCount > 0
            ? 'Sincronizando'
            : 'Sincronizado';
    const syncStatusTone = syncWarning ? 'warning' : pendingPersistCount > 0 ? 'searching' : 'success';
    const monitoringStateLabel = isSessionActive
        ? 'Monitoramento ativo'
        : isSessionPaused
            ? 'Monitoramento pausado'
            : session?.status === 'ended'
                ? 'Sessao encerrada'
                : 'Pronto para iniciar';
    const primaryEmotionKey = currentEmotion.key
        || (
            ['idle', 'ready', 'starting-camera', 'loading-models'].includes(detectionStatus)
                ? null
                : (rawEmotion.inconclusive ? 'inconclusive' : rawEmotion.key)
        )
        || 'inconclusive';
    const primaryEmotionLabel = currentEmotion.key
        ? currentEmotion.label
        : ['idle', 'ready', 'starting-camera', 'loading-models'].includes(detectionStatus)
            ? 'Aguardando analise'
            : rawEmotion.inconclusive
                ? 'Analise inconclusiva'
                : rawEmotion.label;
    const primaryEmotionConfidence = currentEmotion.key ? currentEmotion.confidence : rawEmotion.confidence;
    const stableDurationLabel = currentEmotion.since
        ? formatDuration(Math.max(0, sessionClock - new Date(currentEmotion.since).getTime()))
        : '00:00:00';
    const expressionAccent = EMOTION_COLORS[primaryEmotionKey] || EMOTION_COLORS.inconclusive;
    const shouldShowFaceLostOverlay = cameraReady && detectionStatus === 'face-lost';
    const systemStatusItems = [
        { label: 'IA', value: statusLabel, tone: STATUS_TONES[detectionStatus] || 'neutral', icon: Activity },
        { label: 'Face', value: faceStatusLabel, tone: detectionStatus === 'face-lost' ? 'danger' : detectionStatus === 'monitoring' ? 'success' : 'searching', icon: PersonBoundingBox },
        { label: 'Processamento', value: processingMode || 'Preparando ambiente', tone: 'neutral', icon: Cpu },
        { label: 'Sincronizacao', value: pendingPersistCount > 0 ? `${syncStatusLabel} · ${pendingPersistCount} pendente(s)` : syncStatusLabel, tone: syncStatusTone, icon: ArrowClockwise },
        { label: 'Sessao', value: sessionStatusLabel, tone: sessionStatusTone, icon: ClockHistory }
    ];
    const kpiItems = [
        { label: 'Tempo monitorado', value: formatDuration(monitoredDurationMs), accent: '#2563eb' },
        { label: 'Expressao predominante', value: liveSessionMetrics.predominantEmotionLabel, accent: expressionAccent },
        { label: 'Confianca media', value: formatConfidence(liveSessionMetrics.averageConfidence), accent: '#06b6d4' },
        { label: 'Alteracoes persistentes', value: String(liveSessionMetrics.persistentChanges ?? 0), accent: '#f59e0b' }
    ];
    const modelIndicatorItems = [
        { label: 'Detector facial', value: modelStatus.detector ? 'pronto' : 'pendente', variant: modelStatus.detector ? 'success' : 'secondary' },
        { label: 'Landmarks', value: modelStatus.landmarks ? 'pronto' : 'pendente', variant: modelStatus.landmarks ? 'success' : 'secondary' },
        { label: 'Expressoes', value: modelStatus.expressions ? 'pronto' : 'pendente', variant: modelStatus.expressions ? 'success' : 'secondary' },
        { label: 'Reconhecimento', value: modelStatus.recognition ? 'carregado' : 'opcional', variant: modelStatus.recognition ? 'info' : 'secondary' }
    ];
    const monitoringHelperText = !faceReference.hasReference
        ? 'Cadastre uma foto de referencia antes de iniciar o monitoramento.'
        : detectionStatus === 'loading-models'
            ? 'Os modelos essenciais estao sendo preparados antes da primeira leitura.'
            : isSessionPaused
                ? 'A sessao foi pausada e pode ser retomada sem perder o historico local.'
                : session?.status === 'ended'
                    ? 'A sessao foi encerrada e os resultados permanecem visiveis para consulta.'
                    : 'Ferramenta de apoio observacional. Os resultados nao constituem diagnostico clinico isolado.';
    const expressionHelperText = currentEmotion.key
        ? 'Expressao estabilizada da face monitorada.'
        : detectionStatus === 'stabilizing'
            ? 'Estabilizando leitura antes de consolidar a expressao predominante.'
            : rawEmotion.inconclusive
                ? 'Leitura ainda inconclusiva para evitar inferencias precipitadas.'
                : 'Aguardando uma leitura estavel da face monitorada.';
    const bannerItems = [
        error ? { tone: 'error', title: 'Erro operacional', message: error } : null,
        syncWarning ? { tone: 'warning', title: 'Sincronizacao em atencao', message: syncWarning } : null,
        infoMessage ? { tone: 'info', title: 'Atualizacao do monitoramento', message: infoMessage } : null
    ].filter(Boolean);
    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'nearest',
            intersect: false
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    boxWidth: 10,
                    padding: 18,
                    color: '#475569'
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#64748b'
                }
            },
            y: {
                beginAtZero: true,
                max: 1,
                ticks: {
                    color: '#64748b',
                    callback: (value) => `${Math.round(value * 100)}%`
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.16)'
                },
                title: {
                    display: true,
                    text: 'Confianca da expressao',
                    color: '#475569'
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    boxWidth: 10,
                    padding: 18,
                    color: '#475569'
                }
            }
        }
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    boxWidth: 10,
                    padding: 18,
                    color: '#475569'
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#64748b'
                }
            },
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    color: '#64748b',
                    callback: (value) => `${value}%`
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.16)'
                }
            }
        }
    };

    return (
        <div className="ac-emotion-shell">
            <div className="ac-sr-only" aria-live="polite" aria-atomic="true">{liveAnnouncement}</div>

            <header className="ac-emotion-tool-header">
                <Container fluid className="ac-emotion-container ac-emotion-tool-header__inner">
                    <div className="ac-emotion-tool-header__brand">
                        <img src={logonovo} alt="AutisConnect" className="ac-emotion-tool-header__logo" />
                        <span className="ac-emotion-tool-header__divider" aria-hidden="true" />
                        <div className="ac-emotion-tool-header__copy">
                            <span>AutisConnect</span>
                            <strong>Monitoramento Emocional</strong>
                        </div>
                    </div>

                    <div className="ac-emotion-tool-header__actions">
                        <span className={`ac-emotion-mini-pill is-${sessionStatusTone}`}>
                            <Activity size={14} />
                            {monitoringStateLabel}
                        </span>
                        <Button variant="outline-light" className="ac-emotion-close-button" onClick={() => window.close()}>
                            Fechar
                        </Button>
                    </div>
                </Container>
            </header>

            <main className="ac-emotion-main">
                <Container fluid className="ac-emotion-container">
                    <section className="ac-emotion-page-header">
                        <div>
                            <span className="ac-emotion-page-header__eyebrow">Central de monitoramento</span>
                            <h1>Monitoramento Emocional</h1>
                            <p>Analise de expressoes faciais em tempo real com validacao do paciente monitorado.</p>
                        </div>
                        <div className="ac-emotion-page-header__note">
                            Ferramenta de apoio observacional. Os resultados nao constituem diagnostico clinico isolado.
                        </div>
                    </section>

                    <section className="ac-emotion-status-grid" aria-label="Status operacional do monitoramento">
                        {systemStatusItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div key={item.label} className={`ac-emotion-status-card is-${item.tone}`}>
                                    <div className="ac-emotion-status-card__icon">
                                        <Icon size={16} />
                                    </div>
                                    <div className="ac-emotion-status-card__content">
                                        <span>{item.label}</span>
                                        <strong>{item.value}</strong>
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    {bannerItems.length > 0 ? (
                        <section className="ac-emotion-banner-stack">
                            {bannerItems.map((banner) => (
                                <div key={`${banner.tone}-${banner.title}`} className={`ac-emotion-banner is-${banner.tone}`}>
                                    <div className="ac-emotion-banner__icon">
                                        {banner.tone === 'warning' ? <ExclamationTriangleFill size={18} /> : <ShieldCheck size={18} />}
                                    </div>
                                    <div className="ac-emotion-banner__content">
                                        <strong>{banner.title}</strong>
                                        <span>{banner.message}</span>
                                    </div>
                                </div>
                            ))}
                        </section>
                    ) : null}

                    {showPatientErrorState ? (
                        <Card className="ac-emotion-card ac-emotion-empty-card">
                            <Card.Body>
                                <div className="ac-emotion-empty-state">
                                    <PersonBoundingBox size={24} />
                                    <strong>Paciente nao identificado</strong>
                                    <span>Abra esta ferramenta a partir do Dashboard do Paciente para iniciar um monitoramento.</span>
                                </div>
                            </Card.Body>
                        </Card>
                    ) : (
                        <>
                            <section className="ac-emotion-live-grid">
                                <Card className="ac-emotion-card ac-emotion-live-card">
                                    <Card.Body>
                                        <div className="ac-emotion-card-head">
                                            <div>
                                                <span className="ac-emotion-card-kicker">Live monitor</span>
                                                <h2 className="ac-emotion-card-title">Camera ao vivo</h2>
                                                <p className="ac-emotion-card-copy">
                                                    O monitoramento so registra expressoes quando a face de referencia do paciente e confirmada.
                                                </p>
                                            </div>

                                            <div className="ac-emotion-card-head__chips">
                                                <span className={`ac-emotion-mini-pill is-${STATUS_TONES[detectionStatus] || 'neutral'}`}>
                                                    <Activity size={14} />
                                                    {monitoringStateLabel}
                                                </span>
                                                <span className={`ac-emotion-mini-pill is-${faceState.quality.tone || 'neutral'}`}>
                                                    <Stars size={14} />
                                                    Qualidade {faceState.quality.label}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="ac-emotion-live-frame" aria-label="Monitor ao vivo da camera">
                                            <video ref={videoRef} className="ac-emotion-video" autoPlay muted playsInline />
                                            <canvas ref={canvasRef} className="ac-emotion-video-overlay" />

                                            <div className="ac-emotion-live-hud ac-emotion-live-hud--top-left">
                                                <span className={`ac-emotion-live-badge is-${isSessionActive ? 'success' : sessionStatusTone}`}>
                                                    <Activity size={12} />
                                                    {monitoringStateLabel}
                                                </span>
                                            </div>

                                            <div className="ac-emotion-live-hud ac-emotion-live-hud--top-right">
                                                <span className={`ac-emotion-live-badge is-${faceState.quality.tone || 'neutral'}`}>
                                                    <Stars size={12} />
                                                    Qualidade: {faceState.quality.label}
                                                </span>
                                            </div>

                                            <div className="ac-emotion-live-hud ac-emotion-live-hud--bottom">
                                                <span className="ac-emotion-live-badge is-searching">
                                                    <PersonBoundingBox size={12} />
                                                    {faceStatusLabel}
                                                </span>

                                                {faceState.multipleFaces ? (
                                                    <span className="ac-emotion-live-badge is-neutral">
                                                        <ShieldCheck size={12} />
                                                        Somente paciente validado monitorado
                                                    </span>
                                                ) : null}
                                            </div>

                                            {!cameraReady ? (
                                                <div className="ac-emotion-camera-placeholder">
                                                    {detectionStatus === 'loading-models' ? (
                                                        <>
                                                            <Spinner animation="border" size="sm" />
                                                            <strong>Preparando analise inteligente...</strong>
                                                            <span>Carregando os modelos necessarios para o monitoramento.</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CameraVideoFill size={28} />
                                                            <strong>Camera pronta para iniciar</strong>
                                                            <span>A camera sera ativada somente apos iniciar o monitoramento.</span>
                                                        </>
                                                    )}
                                                </div>
                                            ) : null}

                                            {shouldShowFaceLostOverlay ? (
                                                <div className="ac-emotion-overlay-message">
                                                    <strong>Face monitorada temporariamente perdida</strong>
                                                    <span>Reposicione-se diante da camera.</span>
                                                </div>
                                            ) : null}

                                            {cameraReady && detectionStatus === 'stabilizing' ? (
                                                <div className="ac-emotion-overlay-message ac-emotion-overlay-message--compact">
                                                    <strong>Estabilizando leitura...</strong>
                                                    <span>O algoritmo esta consolidando a expressao predominante.</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <div className="ac-emotion-side-stack">
                                    <Card className="ac-emotion-card ac-emotion-expression-card">
                                        <Card.Body>
                                            <span className="ac-emotion-card-kicker">Expressao atual</span>
                                            <div className="ac-emotion-expression-hero">
                                                <span className="ac-emotion-expression-hero__marker" style={{ backgroundColor: expressionAccent }} aria-hidden="true" />
                                                <div>
                                                    <h2 className="ac-emotion-expression-hero__value">{primaryEmotionLabel}</h2>
                                                    <p className="ac-emotion-expression-hero__helper">{expressionHelperText}</p>
                                                </div>
                                            </div>

                                            <div className="ac-emotion-expression-confidence">
                                                <span>Confianca da expressao detectada</span>
                                                <strong>{formatConfidence(primaryEmotionConfidence)}</strong>
                                            </div>

                                            <div className="ac-emotion-expression-metrics">
                                                <div className="ac-emotion-expression-metric">
                                                    <span>Estavel ha</span>
                                                    <strong>{stableDurationLabel}</strong>
                                                </div>
                                                <div className="ac-emotion-expression-metric">
                                                    <span>Qualidade da captura</span>
                                                    <strong>{faceState.quality.label}</strong>
                                                </div>
                                                <div className="ac-emotion-expression-metric">
                                                    <span>Validacao</span>
                                                    <strong>{faceReference.hasReference ? 'Paciente habilitado' : 'Aguardando cadastro no patient details'}</strong>
                                                </div>
                                                <div className="ac-emotion-expression-metric">
                                                    <span>Paciente</span>
                                                    <strong>Paciente vinculado</strong>
                                                </div>
                                            </div>

                                            <div className="ac-emotion-observational-note">
                                                Expressao facial predominante da pessoa monitorada. A interpretacao permanece como apoio observacional.
                                            </div>

                                            {rawEmotion.inconclusive ? (
                                                <div className="ac-emotion-inline-note is-warning">
                                                    Analise inconclusiva enquanto a leitura nao atinge consistencia suficiente.
                                                </div>
                                            ) : null}
                                        </Card.Body>
                                    </Card>

                                </div>
                            </section>

                            <section className="ac-emotion-controls-section">
                                <Card className="ac-emotion-card ac-emotion-controls-card">
                                    <Card.Body>
                                        <div className="ac-emotion-card-head ac-emotion-card-head--stack">
                                            <div>
                                                <span className="ac-emotion-card-kicker">Sessao</span>
                                                <h3 className="ac-emotion-card-title">Controles do monitoramento</h3>
                                                <p className="ac-emotion-card-copy">{monitoringHelperText}</p>
                                            </div>
                                        </div>

                                        <div className="ac-emotion-controls-row">
                                            <Button
                                                variant="primary"
                                                className="ac-emotion-primary-button"
                                                onClick={startMonitoring}
                                                disabled={!canStartMonitoring || isSessionActive}
                                            >
                                                <CameraVideoFill size={16} />
                                                {isSessionPaused ? 'Retomar monitoramento' : 'Iniciar monitoramento'}
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                className="ac-emotion-secondary-button"
                                                onClick={pauseMonitoring}
                                                disabled={!isSessionActive}
                                            >
                                                <PauseCircleFill size={16} />
                                                Pausar
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                className="ac-emotion-danger-button"
                                                onClick={endMonitoring}
                                                disabled={!session || session.status === 'ended'}
                                            >
                                                <StopCircleFill size={16} />
                                                Encerrar sessao
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                className="ac-emotion-secondary-button ac-emotion-secondary-button--ghost"
                                                onClick={handleRegisterContext}
                                            >
                                                <ArrowClockwise size={16} />
                                                Registrar contexto
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </section>

                            <section className="ac-emotion-kpi-grid" aria-label="Indicadores resumidos da sessao">
                                {kpiItems.map((item) => (
                                    <div key={item.label} className="ac-emotion-kpi-card">
                                        <span>{item.label}</span>
                                        <strong style={{ color: item.accent }}>{item.value}</strong>
                                    </div>
                                ))}
                            </section>

                            <section className="ac-emotion-guidance-section">
                                <Card className="ac-emotion-card">
                                    <Card.Body>
                                        <div className="ac-emotion-card-head">
                                            <div>
                                                <span className="ac-emotion-card-kicker">Guidance</span>
                                                <h3 className="ac-emotion-card-title">Orientacoes do enquadramento</h3>
                                                <p className="ac-emotion-card-copy">
                                                    Ajustes em tempo real para manter a leitura consistente e a privacidade do paciente monitorado.
                                                </p>
                                            </div>

                                            {faceState.multipleFaces ? (
                                                <span className="ac-emotion-mini-pill is-neutral">
                                                    <ShieldCheck size={14} />
                                                    Apenas o paciente validado entra na leitura emocional.
                                                </span>
                                            ) : null}
                                        </div>

                                        {faceState.warnings.length > 0 ? (
                                            <div className="ac-emotion-guidance-list">
                                                {faceState.warnings.map((warning) => (
                                                    <div key={warning} className="ac-emotion-guidance-item">
                                                        <ExclamationTriangleFill size={16} />
                                                        <span>{warning}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="ac-emotion-guidance-empty">
                                                <ShieldCheck size={18} />
                                                <span>Enquadramento adequado. Nenhum ajuste operacional necessario no momento.</span>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </section>

                            <section className="ac-emotion-analytics-grid">
                                <Card className="ac-emotion-card ac-emotion-analytics-card ac-emotion-analytics-card--wide">
                                    <Card.Body>
                                        <div className="ac-emotion-card-head">
                                            <div>
                                                <span className="ac-emotion-card-kicker">Evolucao das expressoes</span>
                                                <h3 className="ac-emotion-card-title">Leitura estabilizada ao longo do tempo</h3>
                                                <p className="ac-emotion-card-copy">
                                                    Escopo: {buildChartScopeLabel(periodFilter)}. Apenas eventos validos e estaveis entram nesta leitura.
                                                </p>
                                            </div>

                                            <div className="ac-emotion-filters">
                                                <Form.Select size="sm" value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}>
                                                    <option value="session">Sessao atual</option>
                                                    <option value="today">Hoje</option>
                                                    <option value="week">Ultimos 7 dias</option>
                                                    <option value="month">Ultimos 30 dias</option>
                                                    <option value="custom">Data especifica</option>
                                                </Form.Select>
                                                {periodFilter === 'custom' ? (
                                                    <Form.Control
                                                        type="date"
                                                        size="sm"
                                                        value={dateFilter}
                                                        onChange={(event) => setDateFilter(event.target.value)}
                                                    />
                                                ) : null}
                                                <Form.Select size="sm" value={emotionFilter} onChange={(event) => setEmotionFilter(event.target.value)}>
                                                    <option value="all">Todas as expressoes</option>
                                                    {VALID_EMOTIONS.map((emotionKey) => (
                                                        <option key={emotionKey} value={emotionKey}>
                                                            {getEmotionLabel(emotionKey)}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </div>
                                        </div>

                                        <div className="ac-emotion-chart-area">
                                            {filteredRecords.length === 0 ? (
                                                <div className="ac-emotion-empty-state">
                                                    <BarChartLine size={22} />
                                                    <strong>Nenhum evento estavel encontrado</strong>
                                                    <span>Refine os filtros ou conclua um monitoramento para visualizar a evolucao.</span>
                                                </div>
                                            ) : (
                                                <Line data={lineChartData} options={lineOptions} />
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="ac-emotion-card ac-emotion-analytics-card">
                                    <Card.Body>
                                        <span className="ac-emotion-card-kicker">Distribuicao</span>
                                        <h3 className="ac-emotion-card-title">Tempo observado por expressao</h3>
                                        <p className="ac-emotion-card-copy">Visualizacao consolidada dos eventos estabilizados no escopo selecionado.</p>

                                        <div className="ac-emotion-chart-area ac-emotion-chart-area--compact">
                                            {distributionChartData.labels.length === 0 ? (
                                                <div className="ac-emotion-empty-state">
                                                    <ClockHistory size={22} />
                                                    <strong>Sem distribuicao disponivel</strong>
                                                    <span>Inicie uma sessao ou carregue historico para ver a leitura proporcional.</span>
                                                </div>
                                            ) : (
                                                <Doughnut data={distributionChartData} options={doughnutOptions} />
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="ac-emotion-card ac-emotion-analytics-card">
                                    <Card.Body>
                                        <span className="ac-emotion-card-kicker">Comparacao entre sessoes</span>
                                        <h3 className="ac-emotion-card-title">Visao resumida dos monitoramentos recentes</h3>
                                        <p className="ac-emotion-card-copy">Dados objetivos de confianca media e tempo predominante nas sessoes comparaveis.</p>

                                        <div className="ac-emotion-chart-area ac-emotion-chart-area--compact">
                                            {uniqueComparisonSessions.length === 0 ? (
                                                <div className="ac-emotion-empty-state">
                                                    <BarChartLine size={22} />
                                                    <strong>Nenhuma sessao comparavel</strong>
                                                    <span>Conclua mais monitoramentos para contextualizar resultados anteriores.</span>
                                                </div>
                                            ) : (
                                                <Bar data={sessionComparisonData} options={barOptions} />
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="ac-emotion-card ac-emotion-analytics-card">
                                    <Card.Header>
                                        <span className="ac-emotion-card-kicker">IA Nivel 1</span>
                                        <h5 className="mb-0 mt-2">Analise de padroes emocionais</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="ac-emotion-card-copy">
                                            Distribuicao real das expressoes e tendencia em relacao a sessao comparavel mais recente.
                                        </p>

                                        {levelOneDistributionRows.length === 0 ? (
                                            <div className="ac-emotion-empty-state">
                                                <BarChartLine size={22} />
                                                <strong>Sem padroes suficientes ainda</strong>
                                                <span>Conclua uma sessao ou ajuste os filtros para liberar a leitura de padroes.</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="table-responsive">
                                                    <table className="table table-sm table-ia-distribution mb-0">
                                                        <tbody>
                                                            {levelOneDistributionRows.slice(0, 5).map((item) => (
                                                                <tr key={item.key}>
                                                                    <td>
                                                                        <strong>{item.label}</strong>
                                                                    </td>
                                                                    <td>{formatConfidence(item.percentage)}</td>
                                                                    <td>{formatDuration(item.durationMs)}</td>
                                                                    <td className="text-end">
                                                                        <Badge bg={item.trendVariant} pill className="badge-trend">
                                                                            {item.trendLabel}
                                                                        </Badge>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="alert-emotional-peak mt-3 mb-0">
                                                    <strong>Pico observado:</strong> {levelOnePeakMessage}
                                                </div>
                                            </>
                                        )}
                                    </Card.Body>
                                </Card>

                                <Card className="ac-emotion-card ac-emotion-analytics-card ac-emotion-analytics-card--wide ai-summary-card">
                                    <Card.Header>
                                        <span className="ac-emotion-card-kicker">IA Nivel 2</span>
                                        <h5 className="mb-0 mt-2">Resumo inteligente do periodo</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <p className="lead ai-summary">{levelTwoSummary}</p>

                                        <div className="ac-emotion-ai-highlights">
                                            {levelTwoHighlights.map((highlight) => (
                                                <div key={highlight} className="ac-emotion-insight-item">
                                                    <ShieldCheck size={16} />
                                                    <span>{highlight}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="ac-emotion-insights-list mt-3">
                                            {sessionInsights.map((insight) => (
                                                <div key={insight} className="ac-emotion-insight-item">
                                                    <ShieldCheck size={16} />
                                                    <span>{insight}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="ac-emotion-card ac-emotion-analytics-card card-ia-prediction">
                                    <Card.Header>
                                        <span className="ac-emotion-card-kicker">IA Nivel 3</span>
                                        <h5 className="mb-0 mt-2">Projecoes e anomalias observacionais</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <h6>{levelThreeProjectionTitle}</h6>
                                        <p>{levelThreeProjectionText}</p>

                                        {levelThreeAnomalyMessage ? (
                                            <div className="alert alert-anomaly mb-0">
                                                <strong>Atencao observacional:</strong> {levelThreeAnomalyMessage}
                                            </div>
                                        ) : (
                                            <div className="ac-emotion-inline-note">
                                                Nenhuma anomalia relevante foi destacada neste recorte. Continue acumulando sessoes para ampliar a sensibilidade comparativa.
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </section>

                            <section className="ac-emotion-support-grid">
                                <Card className="ac-emotion-card">
                                    <Card.Body>
                                        <span className="ac-emotion-card-kicker">Privacidade no monitoramento</span>
                                        <h3 className="ac-emotion-card-title">Processamento orientado ao paciente monitorado</h3>
                                        <p className="ac-emotion-card-copy">
                                            Apenas o paciente validado e utilizado no monitoramento emocional, mesmo quando existem outras pessoas no enquadramento.
                                        </p>

                                        <div className="ac-emotion-privacy-list">
                                            <div className="ac-emotion-privacy-item">
                                                <ShieldCheck size={16} />
                                                <span>A foto cadastrada no patient details e utilizada para validar o paciente monitorado neste modulo.</span>
                                            </div>
                                            <div className="ac-emotion-privacy-item">
                                                <ShieldCheck size={16} />
                                                <span>O fluxo sincroniza eventos emocionais compativeis com <code>/emotions</code>; os frames da camera sao processados localmente para a leitura em tempo real.</span>
                                            </div>
                                            <div className="ac-emotion-privacy-item">
                                                <ShieldCheck size={16} />
                                                <span>Os resultados servem como apoio observacional e nao substituem avaliacao clinica isolada.</span>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="ac-emotion-card">
                                    <Card.Body>
                                        <span className="ac-emotion-card-kicker">Detalhes tecnicos</span>
                                        <h3 className="ac-emotion-card-title">Integridade do sistema e historico</h3>
                                        <p className="ac-emotion-card-copy">
                                            Indicadores discretos sobre modelos, fila de persistencia, historico sincronizado e modo de processamento.
                                        </p>

                                        <details className="ac-emotion-system-details">
                                            <summary>Mostrar detalhes do sistema</summary>
                                            <div className="ac-emotion-system-grid">
                                                {modelIndicatorItems.map((item) => (
                                                    <div key={item.label} className="ac-emotion-system-row">
                                                        <span>{item.label}</span>
                                                        <Badge bg={item.variant} pill>{item.value}</Badge>
                                                    </div>
                                                ))}
                                                <div className="ac-emotion-system-row">
                                                    <span>Modo de processamento</span>
                                                    <strong>{processingMode || 'Aguardando inicializacao'}</strong>
                                                </div>
                                                <div className="ac-emotion-system-row">
                                                    <span>Historico backend</span>
                                                    <strong>{historyLoading ? 'Carregando...' : `${historyRecords.length} registro(s) sincronizados`}</strong>
                                                </div>
                                                <div className="ac-emotion-system-row">
                                                    <span>Historico local maximo</span>
                                                    <strong>{DETECTION_CONFIG.maxLocalHistory} eventos</strong>
                                                </div>
                                                <div className="ac-emotion-system-row">
                                                    <span>Fila de persistencia</span>
                                                    <strong>{pendingPersistCount > 0 ? `${pendingPersistCount} pendente(s)` : 'Fila em dia'}</strong>
                                                </div>
                                                <div className="ac-emotion-system-row">
                                                    <span>Reconhecimento facial</span>
                                                    <strong>{faceReference.hasReference ? 'Ativo para selecao da face monitorada' : 'Aguardando referencia cadastrada'}</strong>
                                                </div>
                                            </div>
                                        </details>
                                    </Card.Body>
                                </Card>
                            </section>
                        </>
                    )}
                </Container>
            </main>

            <footer className="ac-emotion-footer">
                <Container fluid className="ac-emotion-container">
                    <p>{'\u00a9'} 2026 Nf Representacoes Comerciais Ltda. Todos os direitos reservados.</p>
                </Container>
            </footer>
        </div>
    );
};

export default EmotionDetectorVerified;
