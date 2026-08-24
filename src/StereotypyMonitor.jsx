import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Spinner,
    Table
} from 'react-bootstrap';
import {
    Activity,
    ArrowLeft,
    CameraVideo,
    PauseCircle,
    PlayCircle,
    Stars
} from 'react-bootstrap-icons';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
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
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api';

ChartJS.register(
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

const LAST_PATIENT_ID_STORAGE_KEY = 'ac-last-monitoring-patient-id';
const PARENT_ROLE_VALUES = ['pais_responsavel', 'pais_responsável'];
const FRAME_SAMPLE_SIZE = { width: 48, height: 36 };
const CAMERA_PREVIEW_MIN_HEIGHT = 252;
const STEREOTYPY_TYPES = [
    'Balançar corpo',
    'Movimento de mãos',
    'Balançar cabeça',
    'Movimento de pernas',
    'Agitação bilateral das mãos',
    'Mãos ao rosto',
    'Torção de tronco'
];
const STEREOTYPY_CHART_COLORS = [
    'rgba(245, 158, 11, 0.75)',
    'rgba(14, 165, 233, 0.75)',
    'rgba(124, 58, 237, 0.75)',
    'rgba(16, 185, 129, 0.75)',
    'rgba(236, 72, 153, 0.75)',
    'rgba(239, 68, 68, 0.75)',
    'rgba(59, 130, 246, 0.75)'
];
const DEFAULT_SYNC_WARNING = 'Não foi possível sincronizar o histórico com o servidor. As novas detecções continuam disponíveis nesta sessão.';

const normalizeText = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    return value.trim();
};

const normalizeRoleKey = (value) => normalizeText(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_');

const clampNumber = (value, minimum, maximum, fallback = 0) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return fallback;
    }

    return Math.min(maximum, Math.max(minimum, numericValue));
};

const parseScoreFromText = (value) => {
    const match = String(value || '').match(/([0-9]+(?:[.,][0-9]+)?)/);

    if (!match) {
        return null;
    }

    const numericValue = Number(match[1].replace(',', '.'));
    return Number.isFinite(numericValue) ? clampNumber(numericValue, 0, 1, null) : null;
};

const formatDateTime = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Sem data';
    }

    return date.toLocaleString('pt-BR');
};

const formatDuration = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return '0 s';
    }

    return `${numericValue.toFixed(numericValue < 10 ? 1 : 0)} s`;
};

const formatConfidence = (value) => `${Math.round(clampNumber(value, 0, 1, 0) * 100)}%`;

const formatMotionIntensity = (value) => `${Math.round(clampNumber(value, 0, 1, 0) * 100)}%`;

const createEmptyMotionSummary = () => ({
    head: 0,
    leftHand: 0,
    rightHand: 0,
    hands: 0,
    body: 0,
    legs: 0,
    overall: 0
});

const normalizeStereotypyRow = (row) => {
    const type = normalizeText(row?.type || row?.stereotypy_type || row?.stereotypy || '');
    const timestamp = row?.date || row?.timestamp || row?.created_at || row?.updated_at || new Date().toISOString();
    const duration = Number(row?.duration ?? row?.duration_seconds ?? row?.frequency ?? 0);
    const score = clampNumber(
        row?.score ?? row?.confidence_score ?? parseScoreFromText(row?.observations),
        0,
        1,
        0.55
    );

    if (!type || type === 'Nenhuma') {
        return null;
    }

    return {
        id: row?.id ?? row?.detection_id ?? `${type}-${timestamp}`,
        type,
        duration: Number.isFinite(duration) ? duration : 0,
        score,
        timestamp,
        context: normalizeText(row?.context || row?.observations || 'Monitoramento automatizado de movimento corporal.'),
        pendingSync: Boolean(row?.pendingSync)
    };
};

const buildStereotypyPayload = (patientId, record) => ({
    patient_id: Number(patientId),
    type: record.type,
    duration: record.duration,
    score: Number(clampNumber(record.score, 0, 1, 0.5).toFixed(2)),
    context: record.context,
    date: record.timestamp
});

const computeMotionSummary = (currentFrame, previousFrame, width, height) => {
    if (!previousFrame || previousFrame.length !== currentFrame.length) {
        return createEmptyMotionSummary();
    }

    let headTotal = 0;
    let headCount = 0;
    let leftHandTotal = 0;
    let leftHandCount = 0;
    let rightHandTotal = 0;
    let rightHandCount = 0;
    let bodyTotal = 0;
    let bodyCount = 0;
    let legsTotal = 0;
    let legsCount = 0;
    let overallTotal = 0;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const pixelIndex = (y * width) + x;
            const diff = Math.abs(currentFrame[pixelIndex] - previousFrame[pixelIndex]) / 255;

            overallTotal += diff;

            if (y < height * 0.34) {
                headTotal += diff;
                headCount += 1;
            }

            if (y >= height * 0.22 && y < height * 0.72 && x < width * 0.3) {
                leftHandTotal += diff;
                leftHandCount += 1;
            }

            if (y >= height * 0.22 && y < height * 0.72 && x > width * 0.7) {
                rightHandTotal += diff;
                rightHandCount += 1;
            }

            if (x >= width * 0.28 && x <= width * 0.72 && y >= height * 0.34 && y < height * 0.72) {
                bodyTotal += diff;
                bodyCount += 1;
            }

            if (x >= width * 0.24 && x <= width * 0.76 && y >= height * 0.72 && y < height * 0.98) {
                legsTotal += diff;
                legsCount += 1;
            }
        }
    }

    const totalPixels = width * height;
    const leftHand = leftHandCount > 0 ? leftHandTotal / leftHandCount : 0;
    const rightHand = rightHandCount > 0 ? rightHandTotal / rightHandCount : 0;

    return {
        head: headCount > 0 ? headTotal / headCount : 0,
        leftHand,
        rightHand,
        hands: (leftHand + rightHand) / 2,
        body: bodyCount > 0 ? bodyTotal / bodyCount : 0,
        legs: legsCount > 0 ? legsTotal / legsCount : 0,
        overall: totalPixels > 0 ? overallTotal / totalPixels : 0
    };
};

const averageMotionSummaries = (summaries) => {
    if (!Array.isArray(summaries) || summaries.length === 0) {
        return createEmptyMotionSummary();
    }

    const totals = summaries.reduce((accumulator, item) => ({
        head: accumulator.head + item.head,
        leftHand: accumulator.leftHand + item.leftHand,
        rightHand: accumulator.rightHand + item.rightHand,
        hands: accumulator.hands + item.hands,
        body: accumulator.body + item.body,
        legs: accumulator.legs + item.legs,
        overall: accumulator.overall + item.overall
    }), createEmptyMotionSummary());

    return {
        head: totals.head / summaries.length,
        leftHand: totals.leftHand / summaries.length,
        rightHand: totals.rightHand / summaries.length,
        hands: totals.hands / summaries.length,
        body: totals.body / summaries.length,
        legs: totals.legs / summaries.length,
        overall: totals.overall / summaries.length
    };
};

const predictStereotypy = (summary) => {
    const handBalance = 1 - (Math.abs(summary.leftHand - summary.rightHand) / Math.max(summary.hands, 0.001));

    if (summary.overall < 0.035) {
        return { type: 'Nenhuma', score: clampNumber(summary.overall * 8, 0, 0.25, 0) };
    }

    if (summary.legs > 0.082 && summary.legs > summary.body * 1.06 && summary.legs > summary.hands * 1.08) {
        return { type: 'Movimento de pernas', score: clampNumber(summary.legs * 5.4, 0, 1, 0.22) };
    }

    if (summary.hands > 0.105 && summary.leftHand > 0.085 && summary.rightHand > 0.085 && handBalance > 0.7) {
        return { type: 'Agitação bilateral das mãos', score: clampNumber(summary.hands * 5.7, 0, 1, 0.24) };
    }

    if (summary.head > 0.072 && summary.hands > 0.082 && summary.hands > summary.body * 0.92) {
        return { type: 'Mãos ao rosto', score: clampNumber(((summary.head + summary.hands) / 2) * 5.5, 0, 1, 0.22) };
    }

    if (summary.body > 0.09 && summary.head > 0.055 && summary.body > summary.legs * 1.03) {
        return { type: 'Torção de tronco', score: clampNumber(summary.body * 5.3, 0, 1, 0.22) };
    }

    if (summary.hands > 0.09 && summary.hands > summary.body * 1.08 && summary.hands > summary.head * 1.05) {
        return { type: 'Movimento de mãos', score: clampNumber(summary.hands * 5.2, 0, 1, 0.2) };
    }

    if (summary.head > 0.075 && summary.head > summary.overall * 1.05 && summary.head > summary.hands * 0.74) {
        return { type: 'Balançar cabeça', score: clampNumber(summary.head * 5.6, 0, 1, 0.2) };
    }

    if (summary.body > 0.08) {
        return { type: 'Balançar corpo', score: clampNumber(summary.body * 5.0, 0, 1, 0.2) };
    }

    if (summary.legs > 0.07) {
        return { type: 'Movimento de pernas', score: clampNumber(summary.legs * 4.8, 0, 1, 0.18) };
    }

    return { type: 'Nenhuma', score: clampNumber(summary.overall * 7, 0, 0.4, 0) };
};

const getDominantType = (records) => {
    const counters = records.reduce((accumulator, record) => {
        accumulator[record.type] = (accumulator[record.type] || 0) + 1;
        return accumulator;
    }, {});

    const sortedEntries = Object.entries(counters).sort((left, right) => right[1] - left[1]);
    return sortedEntries[0]?.[0] || 'Sem padrão dominante';
};

const getRecommendationItems = (type) => {
    switch (type) {
    case 'Movimento de mãos':
        return [
            'Ofereça um recurso sensorial de substituição, como fidget ou atividade tátil leve.',
            'Tente registrar se o padrão aumenta em momentos de espera, sobrecarga ou excitação.'
        ];
    case 'Agitação bilateral das mãos':
        return [
            'Observe se o padrão surge diante de entusiasmo intenso, antecipação ou sobrecarga sensorial.',
            'Teste uma atividade de organização motora curta antes da tarefa principal para comparar a intensidade.'
        ];
    case 'Balançar cabeça':
        return [
            'Reduza estímulos visuais intensos e observe se a frequência cai com ambiente mais previsível.',
            'Associe o registro com mudanças de rotina, transições e sinais de fadiga.'
        ];
    case 'Mãos ao rosto':
        return [
            'Verifique se há relação com ansiedade, autorregulação ou busca sensorial tátil próxima ao rosto.',
            'Compare os episódios com demandas sociais, espera prolongada ou ambientes muito estimulantes.'
        ];
    case 'Balançar corpo':
        return [
            'Avalie se pausas motoras estruturadas ou atividades proprioceptivas diminuem a repetição.',
            'Compare a duração dos episódios antes e depois de intervenções sensoriais guiadas.'
        ];
    case 'Torção de tronco':
        return [
            'Observe se mudanças posturais, desconforto na cadeira ou demanda prolongada estão associadas ao movimento.',
            'Considere pausas breves para ajuste corporal e registre se o padrão reduz após reorganização do ambiente.'
        ];
    case 'Movimento de pernas':
        return [
            'Registre se o padrão aparece em espera, ansiedade ou necessidade de descarga motora periférica.',
            'Compare a frequência antes e depois de pequenas pausas de alongamento ou deslocamento guiado.'
        ];
    default:
        return [
            'Continue registrando sessões em horários consistentes para criar uma linha de base confiável.',
            'Cruze os achados com observações clínicas e comportamentais do restante da rotina.'
        ];
    }
};

const getStatusVariant = (type) => {
    switch (type) {
    case 'Movimento de mãos':
        return 'info';
    case 'Agitação bilateral das mãos':
        return 'primary';
    case 'Balançar cabeça':
        return 'secondary';
    case 'Mãos ao rosto':
        return 'danger';
    case 'Balançar corpo':
        return 'warning';
    case 'Torção de tronco':
        return 'dark';
    case 'Movimento de pernas':
        return 'success';
    default:
        return 'light';
    }
};

const StereotypyMonitor = () => {
    const { patientId: routePatientId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useContext(AuthContext);

    const videoRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const streamRef = useRef(null);
    const samplingCanvasRef = useRef(null);
    const samplingContextRef = useRef(null);
    const detectionIntervalRef = useRef(null);
    const previousFrameRef = useRef(null);
    const motionBufferRef = useRef([]);
    const candidateRef = useRef({ type: 'Nenhuma', count: 0, score: 0 });
    const activeEventRef = useRef(null);
    const mountedRef = useRef(true);

    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState('');
    const [syncWarning, setSyncWarning] = useState('');
    const [cameraState, setCameraState] = useState('idle');
    const [isDetecting, setIsDetecting] = useState(false);
    const [currentType, setCurrentType] = useState('Nenhuma');
    const [currentScore, setCurrentScore] = useState(0);
    const [currentSummary, setCurrentSummary] = useState(createEmptyMotionSummary());
    const [periodFilter, setPeriodFilter] = useState('today');
    const [dateFilter, setDateFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const userRole = normalizeText(user?.tipo_usuario || '');
    const userRoleKey = normalizeRoleKey(userRole);
    const isParentRole = PARENT_ROLE_VALUES.includes(userRole) || userRoleKey === 'pais_responsavel';
    const routeStatePatientId = location.state?.patientId;
    const resolvedPatientId = useMemo(() => {
        const queryPatientId = searchParams.get('patientId');

        if (routePatientId) {
            return routePatientId;
        }

        if (routeStatePatientId) {
            return routeStatePatientId;
        }

        if (queryPatientId) {
            return queryPatientId;
        }

        try {
            return window.localStorage.getItem(LAST_PATIENT_ID_STORAGE_KEY) || '';
        } catch (storageError) {
            return '';
        }
    }, [routePatientId, routeStatePatientId, searchParams]);

    const syncOverlayCanvas = useCallback(() => {
        const videoElement = videoRef.current;
        const canvasElement = overlayCanvasRef.current;

        if (!videoElement || !canvasElement || !videoElement.videoWidth || !videoElement.videoHeight) {
            return;
        }

        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
    }, []);

    const drawOverlay = useCallback((summary, prediction) => {
        const videoElement = videoRef.current;
        const canvasElement = overlayCanvasRef.current;

        if (!videoElement || !canvasElement) {
            return;
        }

        syncOverlayCanvas();

        const context = canvasElement.getContext('2d');
        if (!context) {
            return;
        }

        const width = canvasElement.width;
        const height = canvasElement.height;
        const highlightedRegion = prediction?.type;

        context.clearRect(0, 0, width, height);

        const headRect = {
            x: width * 0.28,
            y: height * 0.06,
            width: width * 0.44,
            height: height * 0.24
        };
        const bodyRect = {
            x: width * 0.28,
            y: height * 0.34,
            width: width * 0.44,
            height: height * 0.38
        };
        const legsRect = {
            x: width * 0.24,
            y: height * 0.72,
            width: width * 0.52,
            height: height * 0.24
        };
        const leftHandRect = {
            x: width * 0.04,
            y: height * 0.24,
            width: width * 0.2,
            height: height * 0.48
        };
        const rightHandRect = {
            x: width * 0.76,
            y: height * 0.24,
            width: width * 0.2,
            height: height * 0.48
        };

        const paintRegion = (rect, tone, isActive) => {
            context.save();
            context.lineWidth = isActive ? 4 : 2;
            context.strokeStyle = isActive ? tone : 'rgba(255, 255, 255, 0.6)';
            context.setLineDash(isActive ? [] : [8, 6]);
            context.strokeRect(rect.x, rect.y, rect.width, rect.height);
            context.restore();
        };

        const isActiveRegion = (region) => {
            switch (highlightedRegion) {
            case 'Balançar cabeça':
                return region === 'head';
            case 'Movimento de mãos':
            case 'Agitação bilateral das mãos':
                return region === 'hands';
            case 'Mãos ao rosto':
                return region === 'head' || region === 'hands';
            case 'Torção de tronco':
                return region === 'body';
            case 'Balançar corpo':
                return region === 'body' || region === 'legs';
            case 'Movimento de pernas':
                return region === 'legs';
            default:
                return false;
            }
        };

        paintRegion(headRect, '#7C3AED', isActiveRegion('head'));
        paintRegion(bodyRect, '#F59E0B', isActiveRegion('body'));
        paintRegion(legsRect, '#10B981', isActiveRegion('legs'));
        paintRegion(leftHandRect, '#0EA5E9', isActiveRegion('hands'));
        paintRegion(rightHandRect, '#0EA5E9', isActiveRegion('hands'));

        context.save();
        context.fillStyle = 'rgba(15, 23, 42, 0.72)';
        context.fillRect(16, 16, 260, 76);
        context.fillStyle = '#F8FAFC';
        context.font = '600 18px sans-serif';
        context.fillText(prediction?.type || 'Aguardando', 28, 44);
        context.font = '500 13px sans-serif';
        context.fillText(`Confiança: ${formatConfidence(prediction?.score || 0)}`, 28, 66);
        context.fillText(`Movimento geral: ${formatMotionIntensity(summary?.overall || 0)}`, 28, 86);
        context.restore();
    }, [syncOverlayCanvas]);

    const stopMediaStream = useCallback(() => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        previousFrameRef.current = null;
        motionBufferRef.current = [];
        candidateRef.current = { type: 'Nenhuma', count: 0, score: 0 };
    }, []);

    const finalizeActiveEvent = useCallback(async () => {
        const activeEvent = activeEventRef.current;
        activeEventRef.current = null;

        if (!activeEvent) {
            return;
        }

        const duration = Number(((Date.now() - activeEvent.startAt) / 1000).toFixed(1));
        if (!Number.isFinite(duration) || duration < 1.5) {
            return;
        }

        const localRecord = {
            id: `local-${activeEvent.startAt}`,
            type: activeEvent.type,
            duration,
            score: clampNumber(activeEvent.peakScore, 0, 1, 0.5),
            timestamp: new Date(activeEvent.startAt).toISOString(),
            context: 'Monitoramento heurístico de movimento corporal com foco em cabeça, mãos, tronco e pernas.',
            pendingSync: true
        };

        if (mountedRef.current) {
            setHistory((previous) => [localRecord, ...previous]);
        }

        if (!resolvedPatientId) {
            return;
        }

        try {
            await apiClient.post('/stereotypies', buildStereotypyPayload(resolvedPatientId, localRecord));

            if (mountedRef.current) {
                setHistory((previous) => previous.map((item) => (
                    item.id === localRecord.id ? { ...item, pendingSync: false } : item
                )));
            }
        } catch (requestError) {
            console.error('Erro ao salvar estereotipia:', requestError);

            if (mountedRef.current) {
                setSyncWarning(DEFAULT_SYNC_WARNING);
            }
        }
    }, [resolvedPatientId]);

    const updateDetectionState = useCallback((prediction, summary) => {
        const previousCandidate = candidateRef.current;
        const nextCandidate = previousCandidate.type === prediction.type
            ? {
                type: prediction.type,
                count: previousCandidate.count + 1,
                score: Math.max(previousCandidate.score, prediction.score)
            }
            : {
                type: prediction.type,
                count: 1,
                score: prediction.score
            };

        candidateRef.current = nextCandidate;

        if (mountedRef.current) {
            setCurrentType(prediction.type);
            setCurrentScore(prediction.score);
            setCurrentSummary(summary);
        }

        if (nextCandidate.count < 2) {
            return;
        }

        const stableType = nextCandidate.type;
        const activeEvent = activeEventRef.current;

        if (stableType === 'Nenhuma') {
            if (activeEvent) {
                void finalizeActiveEvent();
            }
            return;
        }

        if (!activeEvent || activeEvent.type !== stableType) {
            if (activeEvent) {
                void finalizeActiveEvent();
            }

            activeEventRef.current = {
                type: stableType,
                startAt: Date.now(),
                peakScore: nextCandidate.score
            };

            return;
        }

        activeEvent.peakScore = Math.max(activeEvent.peakScore, nextCandidate.score);
    }, [finalizeActiveEvent]);

    const processFrame = useCallback(() => {
        const videoElement = videoRef.current;

        if (!videoElement || videoElement.readyState < 2 || !videoElement.videoWidth || !videoElement.videoHeight) {
            return;
        }

        if (!samplingCanvasRef.current || !samplingContextRef.current) {
            const samplingCanvas = document.createElement('canvas');
            samplingCanvas.width = FRAME_SAMPLE_SIZE.width;
            samplingCanvas.height = FRAME_SAMPLE_SIZE.height;
            samplingCanvasRef.current = samplingCanvas;
            samplingContextRef.current = samplingCanvas.getContext('2d', { willReadFrequently: true });
        }

        const samplingContext = samplingContextRef.current;
        if (!samplingContext) {
            return;
        }

        samplingContext.drawImage(videoElement, 0, 0, FRAME_SAMPLE_SIZE.width, FRAME_SAMPLE_SIZE.height);

        const imageData = samplingContext.getImageData(0, 0, FRAME_SAMPLE_SIZE.width, FRAME_SAMPLE_SIZE.height).data;
        const grayscaleFrame = new Uint8Array(FRAME_SAMPLE_SIZE.width * FRAME_SAMPLE_SIZE.height);

        for (let sourceIndex = 0, targetIndex = 0; sourceIndex < imageData.length; sourceIndex += 4, targetIndex += 1) {
            grayscaleFrame[targetIndex] = Math.round(
                (imageData[sourceIndex] * 0.299)
                + (imageData[sourceIndex + 1] * 0.587)
                + (imageData[sourceIndex + 2] * 0.114)
            );
        }

        const hadPreviousFrame = Boolean(previousFrameRef.current);
        const summary = computeMotionSummary(
            grayscaleFrame,
            previousFrameRef.current,
            FRAME_SAMPLE_SIZE.width,
            FRAME_SAMPLE_SIZE.height
        );

        motionBufferRef.current = [...motionBufferRef.current.slice(-2), summary];
        const averagedSummary = averageMotionSummaries(motionBufferRef.current);
        const prediction = predictStereotypy(averagedSummary);

        previousFrameRef.current = grayscaleFrame;
        drawOverlay(averagedSummary, prediction);

        if (hadPreviousFrame) {
            updateDetectionState(prediction, averagedSummary);
        }
    }, [drawOverlay, updateDetectionState]);

    const loadData = useCallback(async () => {
        if (!resolvedPatientId || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const patientRequest = isParentRole
                ? apiClient.get(`/parent/patient/${resolvedPatientId}`)
                : apiClient.get(`/professional/patients/${resolvedPatientId}`);

            const [patientResult, historyResult] = await Promise.allSettled([
                patientRequest,
                apiClient.get(`/stereotypies/${resolvedPatientId}`)
            ]);

            if (patientResult.status === 'fulfilled' && mountedRef.current) {
                setPatient(patientResult.value?.data ? {
                    ...patientResult.value.data,
                    name: normalizeText(patientResult.value.data.name),
                    diagnosis: normalizeText(patientResult.value.data.diagnosis)
                } : null);
            }

            if (historyResult.status === 'fulfilled' && mountedRef.current) {
                const normalizedHistory = Array.isArray(historyResult.value?.data)
                    ? historyResult.value.data
                        .map(normalizeStereotypyRow)
                        .filter(Boolean)
                        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
                    : [];

                setHistory((previous) => {
                    const pendingLocalRecords = previous.filter((item) => item.pendingSync);
                    return [...pendingLocalRecords, ...normalizedHistory]
                        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
                });
                setSyncWarning('');
            } else if (historyResult.status === 'rejected' && mountedRef.current) {
                setSyncWarning(DEFAULT_SYNC_WARNING);
            }
        } catch (requestError) {
            console.error('Erro ao carregar monitor de estereotipias:', requestError);

            if (mountedRef.current) {
                setError(requestError.response?.data?.error || 'Não foi possível carregar o contexto do monitoramento.');
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [isParentRole, resolvedPatientId, user]);

    const startDetection = useCallback(async () => {
        if (!resolvedPatientId) {
            setError('Abra esta ferramenta a partir da tela do paciente para iniciar um monitoramento.');
            return;
        }

        if (!navigator?.mediaDevices?.getUserMedia) {
            setError('Este navegador não oferece suporte ao acesso à câmera.');
            return;
        }

        try {
            setError('');
            setCameraState('requesting');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user'
                },
                audio: false
            });

            stopMediaStream();
            streamRef.current = stream;

            const videoElement = videoRef.current;
            if (!videoElement) {
                return;
            }

            videoElement.srcObject = stream;

            await new Promise((resolve) => {
                const handleLoadedMetadata = async () => {
                    syncOverlayCanvas();

                    try {
                        await videoElement.play();
                    } catch (playError) {
                        console.warn('Não foi possível iniciar a câmera automaticamente:', playError);
                    }

                    resolve();
                };

                if (videoElement.readyState >= 1) {
                    void handleLoadedMetadata();
                    return;
                }

                videoElement.onloadedmetadata = () => {
                    void handleLoadedMetadata();
                };
            });

            previousFrameRef.current = null;
            motionBufferRef.current = [];
            candidateRef.current = { type: 'Nenhuma', count: 0, score: 0 };
            activeEventRef.current = null;
            setIsDetecting(true);
            setCameraState('active');
            drawOverlay(createEmptyMotionSummary(), { type: 'Aguardando leitura', score: 0 });

            detectionIntervalRef.current = setInterval(() => {
                processFrame();
            }, 900);
        } catch (cameraError) {
            console.error('Erro ao acessar câmera:', cameraError);
            stopMediaStream();
            setCameraState('error');
            setIsDetecting(false);
            setError('Não foi possível acessar a câmera. Verifique as permissões do navegador e tente novamente.');
        }
    }, [drawOverlay, processFrame, resolvedPatientId, stopMediaStream, syncOverlayCanvas]);

    const stopDetection = useCallback(async () => {
        setIsDetecting(false);
        await finalizeActiveEvent();
        stopMediaStream();
        drawOverlay(createEmptyMotionSummary(), { type: 'Monitoramento pausado', score: 0 });
        setCameraState('idle');
        setCurrentType('Nenhuma');
        setCurrentScore(0);
        setCurrentSummary(createEmptyMotionSummary());
    }, [drawOverlay, finalizeActiveEvent, stopMediaStream]);

    useEffect(() => {
        try {
            if (resolvedPatientId) {
                window.localStorage.setItem(LAST_PATIENT_ID_STORAGE_KEY, String(resolvedPatientId));
            }
        } catch (storageError) {
            // Ignore storage failures and keep the monitor usable.
        }
    }, [resolvedPatientId]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        window.addEventListener('resize', syncOverlayCanvas);
        return () => {
            window.removeEventListener('resize', syncOverlayCanvas);
        };
    }, [syncOverlayCanvas]);

    useEffect(() => () => {
        void finalizeActiveEvent();
        stopMediaStream();
    }, [finalizeActiveEvent, stopMediaStream]);

    const filteredHistory = useMemo(() => {
        const now = new Date();
        let records = [...history];

        if (periodFilter === 'today') {
            records = records.filter((record) => new Date(record.timestamp).toDateString() === now.toDateString());
        } else if (periodFilter === 'week') {
            const initialDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            records = records.filter((record) => new Date(record.timestamp) >= initialDate);
        } else if (periodFilter === 'month') {
            const initialDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            records = records.filter((record) => new Date(record.timestamp) >= initialDate);
        } else if (periodFilter === 'custom' && dateFilter) {
            const selectedDate = new Date(dateFilter);
            records = records.filter((record) => new Date(record.timestamp).toDateString() === selectedDate.toDateString());
        }

        if (typeFilter !== 'all') {
            records = records.filter((record) => record.type === typeFilter);
        }

        return records.sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
    }, [dateFilter, history, periodFilter, typeFilter]);

    const chartHistory = useMemo(() => (
        [...filteredHistory].sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp))
    ), [filteredHistory]);

    const totalDuration = useMemo(() => (
        filteredHistory.reduce((accumulator, record) => accumulator + Number(record.duration || 0), 0)
    ), [filteredHistory]);

    const averageConfidence = useMemo(() => {
        if (filteredHistory.length === 0) {
            return 0;
        }

        const sum = filteredHistory.reduce((accumulator, record) => accumulator + Number(record.score || 0), 0);
        return sum / filteredHistory.length;
    }, [filteredHistory]);

    const dominantType = useMemo(() => getDominantType(filteredHistory), [filteredHistory]);
    const recommendations = useMemo(() => getRecommendationItems(dominantType), [dominantType]);

    const lineChartData = useMemo(() => ({
        labels: chartHistory.map((record) => (
            periodFilter === 'today' || periodFilter === 'custom'
                ? new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : new Date(record.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        )),
        datasets: [{
            label: 'Confiança da detecção',
            data: chartHistory.map((record) => Number(record.score || 0)),
            borderColor: '#0EA5E9',
            backgroundColor: 'rgba(14, 165, 233, 0.18)',
            fill: true,
            tension: 0.35
        }]
    }), [chartHistory, periodFilter]);

    const barChartData = useMemo(() => ({
        labels: STEREOTYPY_TYPES,
        datasets: [{
            label: 'Ocorrências',
            data: STEREOTYPY_TYPES.map((type) => filteredHistory.filter((record) => record.type === type).length),
            backgroundColor: STEREOTYPY_CHART_COLORS,
            borderRadius: 12
        }]
    }), [filteredHistory]);

    const lineChartOptions = useMemo(() => ({
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            title: {
                display: true,
                text: 'Confiança das detecções ao longo do tempo'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 1
            }
        }
    }), []);

    const barChartOptions = useMemo(() => ({
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Distribuição por tipo de estereotipia'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        }
    }), []);

    const handleBack = useCallback(async () => {
        if (isDetecting) {
            await stopDetection();
        }

        if (resolvedPatientId) {
            navigate(isParentRole ? `/patient-details-parent/${resolvedPatientId}` : `/patient-details/${resolvedPatientId}`);
            return;
        }

        navigate(-1);
    }, [isDetecting, isParentRole, navigate, resolvedPatientId, stopDetection]);

    if (loading) {
        return (
            <Container fluid className="py-5">
                <div className="d-flex flex-column align-items-center justify-content-center py-5">
                    <Spinner animation="border" />
                    <p className="mt-3 mb-0">Carregando monitor de estereotipias...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <Row className="align-items-center mb-4">
                <Col lg={8}>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        <Badge bg="primary" className="px-3 py-2">
                            <Activity className="me-2" />
                            StereotypyMonitor
                        </Badge>
                        {resolvedPatientId ? (
                            <Badge bg="light" text="dark" className="px-3 py-2">
                                Paciente #{resolvedPatientId}
                            </Badge>
                        ) : null}
                        {patient?.name ? (
                            <Badge bg="light" text="dark" className="px-3 py-2">
                                {patient.name}
                            </Badge>
                        ) : null}
                    </div>
                    <h1 className="h3 mb-1">Monitor de estereotipias</h1>
                    <p className="text-muted mb-0">
                        Ferramenta complementar para observar padrões motores repetitivos por vídeo.
                        Os achados não substituem avaliação clínica.
                    </p>
                </Col>
                <Col lg={4} className="d-flex justify-content-lg-end gap-2 mt-3 mt-lg-0">
                    <Button variant="outline-secondary" onClick={loadData}>
                        Atualizar histórico
                    </Button>
                    <Button variant="outline-primary" onClick={handleBack}>
                        <ArrowLeft className="me-2" />
                        Voltar ao paciente
                    </Button>
                </Col>
            </Row>

            {error ? <Alert variant="danger">{error}</Alert> : null}
            {syncWarning ? <Alert variant="warning">{syncWarning}</Alert> : null}
            {!resolvedPatientId ? (
                <Alert variant="info">
                    Abra esta ferramenta a partir da tela do paciente para carregar automaticamente o contexto correto.
                </Alert>
            ) : null}

            <Row className="g-4">
                <Col xl={5}>
                    <Card className="shadow-sm h-100">
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <strong>Leitura em tempo real</strong>
                                <div className="text-muted small">
                                    {isDetecting ? 'A câmera está ativa e a análise ocorre a cada 0,9 s.' : 'Inicie a câmera para começar a coleta.'}
                                </div>
                            </div>
                            <div className="d-flex gap-2">
                                {!isDetecting ? (
                                    <Button variant="success" onClick={startDetection} disabled={!resolvedPatientId}>
                                        <PlayCircle className="me-2" />
                                        Iniciar monitoramento
                                    </Button>
                                ) : (
                                    <Button variant="outline-danger" onClick={stopDetection}>
                                        <PauseCircle className="me-2" />
                                        Pausar monitoramento
                                    </Button>
                                )}
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <div
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    minHeight: `${CAMERA_PREVIEW_MIN_HEIGHT}px`,
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
                                }}
                            >
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        height: '100%',
                                        minHeight: `${CAMERA_PREVIEW_MIN_HEIGHT}px`,
                                        objectFit: 'cover'
                                    }}
                                />
                                <canvas
                                    ref={overlayCanvasRef}
                                    aria-label="Overlay do monitor de estereotipias"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%'
                                    }}
                                />
                                {!isDetecting ? (
                                    <div
                                        className="d-flex flex-column align-items-center justify-content-center text-white"
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'rgba(15, 23, 42, 0.54)'
                                        }}
                                    >
                                        <CameraVideo size={36} className="mb-3" />
                                        <strong>Monitoramento em pausa</strong>
                                        <span className="small text-center px-4 mt-2">
                                            Ative a câmera para começar a análise automática do movimento corporal.
                                        </span>
                                    </div>
                                ) : null}
                            </div>

                            <Row className="g-3 mt-3">
                                <Col md={6}>
                                    <Card className="border-0 bg-light h-100">
                                        <Card.Body>
                                            <div className="text-muted small mb-2">Leitura atual</div>
                                            <div className="d-flex align-items-center justify-content-between gap-2">
                                                <Badge bg={getStatusVariant(currentType)} text={currentType === 'Nenhuma' ? 'dark' : 'light'} className="px-3 py-2">
                                                    {currentType}
                                                </Badge>
                                                <strong>{formatConfidence(currentScore)}</strong>
                                            </div>
                                            <div className="text-muted small mt-3">
                                                Estado da câmera: <strong>{cameraState === 'active' ? 'Ativa' : cameraState === 'requesting' ? 'Solicitando acesso' : cameraState === 'error' ? 'Erro' : 'Pausada'}</strong>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="border-0 bg-light h-100">
                                        <Card.Body>
                                            <div className="text-muted small mb-2">Regiões observadas</div>
                                            <div className="small d-flex flex-column gap-2">
                                                <div className="d-flex justify-content-between">
                                                    <span>Cabeça</span>
                                                    <strong>{formatMotionIntensity(currentSummary.head)}</strong>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span>Mãos</span>
                                                    <strong>{formatMotionIntensity(currentSummary.hands)}</strong>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span>Tronco</span>
                                                    <strong>{formatMotionIntensity(currentSummary.body)}</strong>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span>Pernas</span>
                                                    <strong>{formatMotionIntensity(currentSummary.legs)}</strong>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xl={7}>
                    <Row className="g-3">
                        <Col sm={6}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <div className="text-muted small mb-2">Ocorrências filtradas</div>
                                    <h2 className="h4 mb-0">{filteredHistory.length}</h2>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col sm={6}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <div className="text-muted small mb-2">Duração acumulada</div>
                                    <h2 className="h4 mb-0">{formatDuration(totalDuration)}</h2>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col sm={6}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <div className="text-muted small mb-2">Padrão dominante</div>
                                    <h2 className="h5 mb-0">{dominantType}</h2>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col sm={6}>
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <div className="text-muted small mb-2">Confiança média</div>
                                    <h2 className="h4 mb-0">{formatConfidence(averageConfidence)}</h2>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12}>
                            <Card className="shadow-sm h-100">
                                <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <strong>Filtros do histórico</strong>
                                    <div className="text-muted small">Aplique recortes para revisar sessões anteriores.</div>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Form.Select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}>
                                                <option value="today">Hoje</option>
                                                <option value="week">Última semana</option>
                                                <option value="month">Último mês</option>
                                                <option value="custom">Data específica</option>
                                            </Form.Select>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                                                <option value="all">Todos os tipos</option>
                                                {STEREOTYPY_TYPES.map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Control
                                                type="date"
                                                value={dateFilter}
                                                onChange={(event) => setDateFilter(event.target.value)}
                                                disabled={periodFilter !== 'custom'}
                                            />
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>

            <Row className="g-4 mt-1">
                <Col xl={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <Line data={lineChartData} options={lineChartOptions} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <Bar data={barChartData} options={barChartOptions} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4 mt-1">
                <Col xl={8}>
                    <Card className="shadow-sm">
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <strong>Histórico de detecções</strong>
                            <span className="text-muted small">
                                {filteredHistory.length > 0 ? `${filteredHistory.length} registro(s) exibido(s)` : 'Nenhum registro encontrado'}
                            </span>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                <Table responsive hover className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Tipo</th>
                                            <th>Duração</th>
                                            <th>Confiança</th>
                                            <th>Data</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.length > 0 ? filteredHistory.map((record) => (
                                            <tr key={record.id}>
                                                <td>
                                                    <Badge bg={getStatusVariant(record.type)} text={record.type === 'Nenhuma' ? 'dark' : 'light'}>
                                                        {record.type}
                                                    </Badge>
                                                </td>
                                                <td>{formatDuration(record.duration)}</td>
                                                <td>{formatConfidence(record.score)}</td>
                                                <td>{formatDateTime(record.timestamp)}</td>
                                                <td>
                                                    {record.pendingSync ? (
                                                        <Badge bg="warning" text="dark">Pendente</Badge>
                                                    ) : (
                                                        <Badge bg="success">Sincronizado</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4 text-muted">
                                                    Nenhuma detecção disponível para os filtros atuais.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={4}>
                    <Card className="shadow-sm h-100">
                        <Card.Header className="d-flex align-items-center gap-2">
                            <Stars />
                            <strong>Leituras rápidas</strong>
                        </Card.Header>
                        <Card.Body>
                            <p className="text-muted">
                                O monitor usa uma análise heurística de movimento para apoiar o registro da sessão.
                                O ideal é correlacionar esses dados com contexto ambiental e observações clínicas.
                            </p>
                            <div className="mb-3">
                                <div className="text-muted small mb-1">Padrão mais frequente no filtro atual</div>
                                <strong>{dominantType}</strong>
                            </div>
                            <ul className="mb-0 ps-3">
                                {recommendations.map((item) => (
                                    <li key={item} className="mb-2">{item}</li>
                                ))}
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default StereotypyMonitor;
