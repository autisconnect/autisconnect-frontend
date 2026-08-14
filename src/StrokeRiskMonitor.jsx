import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Accordion,
    Alert,
    Button,
    Card,
    Col,
    Container,
    Form,
    OverlayTrigger,
    Row,
    Spinner,
    Tooltip as BootstrapTooltip
} from 'react-bootstrap';
import apiClient from './services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend as ChartLegend,
    LineElement,
    LinearScale,
    PointElement,
    Title as ChartTitle,
    Tooltip as ChartTooltip
} from 'chart.js';
import {
    Activity,
    BarChartLine,
    CameraVideo,
    CheckCircleFill,
    ClockHistory,
    Cpu,
    ExclamationTriangleFill,
    InfoCircle,
    PauseCircle,
    PersonBoundingBox,
    PlayCircle,
    ShieldCheck,
    X
} from 'react-bootstrap-icons';
import logonovo from './assets/logonovo.png';
import { selectTargetFace } from './emotion-tracking/emotionUtils';
import './App.css';
import './StrokeRiskMonitor.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ChartTitle,
    ChartTooltip,
    ChartLegend,
    Filler
);

const RISK_LEVELS = ['Baixo', 'Médio', 'Alto'];
const CHART_GRID_COLOR = '#E2E8F0';
const CHART_TEXT_COLOR = '#64748B';

function normalizeRiskLevel(value) {
    const text = String(value || '').trim();
    const lowerText = text.toLowerCase();

    if (lowerText.includes('alto')) {
        return 'Alto';
    }

    if (lowerText.includes('baixo')) {
        return 'Baixo';
    }

    if (lowerText.includes('med') || lowerText.includes('méd') || lowerText.includes('mã©d')) {
        return 'Médio';
    }

    return text || 'N/A';
}

function formatAsymmetry(value) {
    if (!Number.isFinite(value)) {
        return '--';
    }

    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatClock(timestamp) {
    if (!timestamp) {
        return '--';
    }

    return new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTime(timestamp) {
    if (!timestamp) {
        return '--';
    }

    return new Date(timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatChartLabel(timestamp, periodFilter) {
    const date = new Date(timestamp);

    if (periodFilter === 'today' || periodFilter === 'custom') {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
    });
}

function getRiskTone(riskLevel) {
    switch (normalizeRiskLevel(riskLevel)) {
    case 'Alto':
        return 'danger';
    case 'Médio':
        return 'warning';
    case 'Baixo':
        return 'success';
    default:
        return 'neutral';
    }
}

function getStatusTone(status) {
    switch (status) {
    case 'Prontos':
    case 'Ativa':
    case 'Ativo':
    case 'Detectada':
    case 'Paciente vinculado':
        return 'success';
    case 'Carregando':
    case 'Iniciando':
    case 'Procurando':
        return 'info';
    case 'Pausado':
    case 'Aguardando':
        return 'neutral';
    case 'Indisponível':
    case 'Erro':
    case 'Não identificado':
    case 'Bloqueado':
        return 'danger';
    default:
        return 'neutral';
    }
}

function normalizeHistoryRow(row) {
    const asymmetryScore = Number(row?.asymmetry_index ?? row?.asymmetryScore);

    if (!Number.isFinite(asymmetryScore)) {
        return null;
    }

    const timestamp = row?.date || row?.timestamp || row?.created_at || new Date().toISOString();

    return {
        id: row?.id ?? `${timestamp}-${asymmetryScore}`,
        timestamp,
        asymmetryScore,
        riskLevel: normalizeRiskLevel(row?.risk_level ?? row?.riskLevel),
        observations: row?.observations || ''
    };
}

function mapCameraError(error) {
    switch (error?.name) {
    case 'NotAllowedError':
        return 'Câmera bloqueada. Autorize o acesso para iniciar o monitoramento.';
    case 'NotFoundError':
        return 'Nenhuma câmera foi encontrada neste dispositivo.';
    case 'NotReadableError':
        return 'A câmera está em uso por outro aplicativo ou não pôde ser acessada.';
    case 'OverconstrainedError':
        return 'A câmera disponível não atende aos parâmetros necessários para o monitoramento.';
    default:
        return 'Não foi possível acessar a webcam. Verifique as permissões do navegador e tente novamente.';
    }
}

function buildEmptyMessage(periodFilter, dateFilter) {
    if (periodFilter === 'custom' && !dateFilter) {
        return 'Selecione uma data para visualizar leituras anteriores.';
    }

    return 'Os dados aparecerão após o início do monitoramento.';
}

const StrokeRiskMonitor = () => {
    const location = useLocation();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectionIntervalRef = useRef(null);
    const streamRef = useRef(null);
    const lastTargetBoxRef = useRef(null);
    const lostTargetCyclesRef = useRef(0);
    const liveAnnouncementRef = useRef('');

    const [patientId, setPatientId] = useState('');
    const [patientResolved, setPatientResolved] = useState(false);
    const [isDetecting, setIsDetecting] = useState(true);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [modelStatus, setModelStatus] = useState({
        detector: false,
        landmarks: false,
        recognition: false
    });
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraState, setCameraState] = useState('idle');
    const [currentAnalysis, setCurrentAnalysis] = useState(null);
    const [latestAnalysis, setLatestAnalysis] = useState(null);
    const [facialAsymmetryData, setFacialAsymmetryData] = useState([]);
    const [faceState, setFaceState] = useState({
        detected: false,
        multipleFaces: false,
        message: 'Preparando o monitor.',
        mode: 'preparing'
    });
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyWarning, setHistoryWarning] = useState('');
    const [error, setError] = useState('');
    const [periodFilter, setPeriodFilter] = useState('today');
    const [dateFilter, setDateFilter] = useState('');
    const [liveAnnouncement, setLiveAnnouncement] = useState('');

    const announce = useCallback((message) => {
        if (!message || liveAnnouncementRef.current === message) {
            return;
        }

        liveAnnouncementRef.current = message;
        setLiveAnnouncement(message);
    }, []);

    const hasPatient = Boolean(patientId);

    const syncCanvasSize = useCallback(() => {
        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;

        if (!videoElement || !canvasElement || !videoElement.videoWidth || !videoElement.videoHeight) {
            return;
        }

        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
    }, []);

    const clearCanvas = useCallback(() => {
        const canvasElement = canvasRef.current;

        if (!canvasElement) {
            return;
        }

        const context = canvasElement.getContext('2d');
        if (!context) {
            return;
        }

        context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }, []);

    const drawDetectionOverlay = useCallback((detections, selectedIndex) => {
        const canvasElement = canvasRef.current;
        if (!canvasElement) {
            return;
        }

        const context = canvasElement.getContext('2d');
        if (!context) {
            return;
        }

        clearCanvas();

        if (!Array.isArray(detections) || detections.length === 0) {
            return;
        }

        detections.forEach((detection, index) => {
            const box = detection?.detection?.box;
            if (!box) {
                return;
            }

            const isSelected = index === selectedIndex;
            context.strokeStyle = isSelected ? '#2563EB' : 'rgba(226, 232, 240, 0.7)';
            context.lineWidth = isSelected ? 4 : 2;
            context.setLineDash(isSelected ? [] : [8, 6]);
            context.strokeRect(box.x, box.y, box.width, box.height);

            if (isSelected) {
                context.fillStyle = '#2563EB';
                context.font = '600 18px Inter, sans-serif';
                context.fillText('Face-alvo', box.x, Math.max(24, box.y - 10));
            }
        });

        context.setLineDash([]);
    }, [clearCanvas]);

    const startVideo = useCallback(async () => {
        if (streamRef.current || !hasPatient) {
            return;
        }

        const videoElement = videoRef.current;
        if (!videoElement) {
            return;
        }

        try {
            setCameraState('requesting');
            setError('');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user'
                },
                audio: false
            });

            streamRef.current = stream;
            videoElement.srcObject = stream;

            const handleMetadata = async () => {
                try {
                    await videoElement.play();
                } catch (playError) {
                    console.warn('Não foi possível iniciar a reprodução automática do vídeo:', playError);
                }

                syncCanvasSize();
                setCameraReady(true);
                setCameraState('ready');
                setFaceState((previous) => ({
                    ...previous,
                    message: 'Posicione o rosto no centro da câmera para iniciar a leitura.',
                    mode: 'ready'
                }));
                announce('Câmera ativa e pronta para o monitoramento.');
            };

            if (videoElement.readyState >= 1) {
                handleMetadata();
            } else {
                videoElement.addEventListener('loadedmetadata', handleMetadata, { once: true });
            }
        } catch (cameraError) {
            console.error('Erro ao acessar a webcam:', cameraError);
            const message = mapCameraError(cameraError);
            setCameraState('error');
            setCameraReady(false);
            setError(message);
            setFaceState({
                detected: false,
                multipleFaces: false,
                message,
                mode: 'error'
            });
            announce(message);
        }
    }, [announce, hasPatient, syncCanvasSize]);

    const loadModels = useCallback(async () => {
        const faceapi = window.faceapi;
        if (!faceapi) {
            const message = 'As bibliotecas faciais não foram carregadas. Verifique o carregamento de face-api.js.';
            setError(message);
            setFaceState({
                detected: false,
                multipleFaces: false,
                message,
                mode: 'error'
            });
            announce(message);
            return;
        }

        try {
            setError('');
            setFaceState({
                detected: false,
                multipleFaces: false,
                message: 'Carregando modelos de monitoramento facial.',
                mode: 'preparing'
            });

            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            setModelStatus((previous) => ({ ...previous, detector: true }));

            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            setModelStatus((previous) => ({ ...previous, landmarks: true }));

            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            setModelStatus((previous) => ({ ...previous, recognition: true }));

            setIsModelsLoaded(true);
            setFaceState((previous) => ({
                ...previous,
                message: 'Modelos carregados. Aguardando câmera.',
                mode: 'models-ready'
            }));
            announce('Modelos de análise facial carregados com sucesso.');
        } catch (modelError) {
            console.error('Erro ao carregar modelos:', modelError);
            const message = 'Falha ao carregar os modelos de detecção facial.';
            setError(message);
            setFaceState({
                detected: false,
                multipleFaces: false,
                message,
                mode: 'error'
            });
            announce(message);
        }
    }, [announce]);

    const saveStrokeRiskToDB = useCallback(async (asymmetryIndex, riskLevel) => {
        if (!patientId) {
            return;
        }

        try {
            await apiClient.post('/stroke-risk', {
                patient_id: patientId,
                asymmetry_index: asymmetryIndex,
                risk_level: riskLevel,
                observations: 'Monitoramento automatizado de assimetria facial.'
            });
        } catch (requestError) {
            console.error('Erro ao salvar risco de AVC:', requestError);
            const message = requestError?.response?.data?.error || 'Falha ao comunicar com o servidor para salvar os dados.';
            setError(message);
            announce(message);
        }
    }, [announce, patientId]);

    const fetchHistory = useCallback(async () => {
        if (!patientId) {
            setFacialAsymmetryData([]);
            setLatestAnalysis(null);
            return;
        }

        try {
            setHistoryLoading(true);
            setHistoryWarning('');

            const response = await apiClient.get(`/stroke-risk/${patientId}`);
            const historyRows = Array.isArray(response?.data) ? response.data : [];
            const normalizedRows = historyRows
                .map(normalizeHistoryRow)
                .filter(Boolean)
                .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));

            setFacialAsymmetryData(normalizedRows);
            setLatestAnalysis(normalizedRows[normalizedRows.length - 1] || null);
        } catch (requestError) {
            console.error('Erro ao buscar histórico de assimetria facial:', requestError);
            setHistoryWarning('Não foi possível carregar o histórico anterior. O monitoramento atual continuará disponível normalmente.');
        } finally {
            setHistoryLoading(false);
        }
    }, [patientId]);

    const calculateSideFeatures = useCallback((eye, nose, mouthPart) => {
        let sum = 0;

        for (let eyeIndex = 0; eyeIndex < eye.length; eyeIndex += 1) {
            for (let comparisonIndex = eyeIndex + 1; comparisonIndex < eye.length; comparisonIndex += 1) {
                sum += Math.sqrt(
                    ((eye[eyeIndex].x - eye[comparisonIndex].x) ** 2) +
                    ((eye[eyeIndex].y - eye[comparisonIndex].y) ** 2)
                );
            }
        }

        for (let eyeIndex = 0; eyeIndex < eye.length; eyeIndex += 1) {
            for (let noseIndex = 0; noseIndex < nose.length; noseIndex += 1) {
                sum += Math.sqrt(
                    ((eye[eyeIndex].x - nose[noseIndex].x) ** 2) +
                    ((eye[eyeIndex].y - nose[noseIndex].y) ** 2)
                );
            }
        }

        for (let eyeIndex = 0; eyeIndex < eye.length; eyeIndex += 1) {
            for (let mouthIndex = 0; mouthIndex < mouthPart.length; mouthIndex += 1) {
                sum += Math.sqrt(
                    ((eye[eyeIndex].x - mouthPart[mouthIndex].x) ** 2) +
                    ((eye[eyeIndex].y - mouthPart[mouthIndex].y) ** 2)
                );
            }
        }

        return sum;
    }, []);

    const processDetectionCycle = useCallback(async () => {
        const faceapi = window.faceapi;
        const videoElement = videoRef.current;

        if (!faceapi || !videoElement || !isDetecting || !hasPatient || !cameraReady) {
            return;
        }

        if (videoElement.readyState < 2 || !videoElement.videoWidth || !videoElement.videoHeight) {
            return;
        }

        try {
            syncCanvasSize();

            const detections = await faceapi
                .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks();

            const selection = selectTargetFace(detections, {
                videoWidth: videoElement.videoWidth,
                videoHeight: videoElement.videoHeight,
                lastTargetBox: lastTargetBoxRef.current
            });

            drawDetectionOverlay(detections, selection.selectedIndex);

            if (!selection.selectedDetection) {
                lostTargetCyclesRef.current += 1;

                if (lostTargetCyclesRef.current > 2) {
                    lastTargetBoxRef.current = null;
                }

                const message = selection.multipleFaces
                    ? 'Múltiplas faces detectadas. Somente a face-alvo será monitorada quando o enquadramento estabilizar.'
                    : 'Nenhuma face identificada. Centralize o rosto e mantenha uma distância adequada da câmera.';

                setFaceState({
                    detected: false,
                    multipleFaces: selection.multipleFaces,
                    message,
                    mode: selection.multipleFaces ? 'multiple-faces' : 'no-face'
                });
                setCurrentAnalysis(null);
                announce(selection.multipleFaces
                    ? 'Múltiplas faces detectadas. Somente a face-alvo será monitorada.'
                    : 'Nenhuma face identificada. Posicione o rosto no centro da câmera.');
                return;
            }

            lostTargetCyclesRef.current = 0;
            lastTargetBoxRef.current = selection.selectedDetection.detection.box;

            const landmarks = selection.selectedDetection.landmarks;
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            const nose = landmarks.getNose();
            const mouth = landmarks.getMouth();

            const leftSide = calculateSideFeatures(leftEye, nose, mouth.slice(0, Math.floor(mouth.length / 2)));
            const rightSide = calculateSideFeatures(rightEye, nose, mouth.slice(Math.ceil(mouth.length / 2)));
            const asymmetryIndex = Math.abs(leftSide - rightSide) / Math.max(leftSide, rightSide);
            const normalizedRiskLevel = asymmetryIndex > 0.30 ? 'Alto' : asymmetryIndex > 0.15 ? 'Médio' : 'Baixo';
            const timestamp = new Date().toISOString();

            const reading = {
                id: `${timestamp}-${asymmetryIndex}`,
                timestamp,
                asymmetryScore: asymmetryIndex,
                riskLevel: normalizedRiskLevel,
                observations: 'Leitura realizada com monitoramento facial ativo.'
            };

            setCurrentAnalysis(reading);
            setLatestAnalysis(reading);
            setFacialAsymmetryData((previous) => [...previous, reading]);
            setFaceState({
                detected: true,
                multipleFaces: selection.multipleFaces,
                message: selection.multipleFaces
                    ? 'Múltiplas faces detectadas. O sistema manteve a mesma face-alvo em monitoramento.'
                    : 'Face detectada e acompanhada pelo monitor.',
                mode: selection.multipleFaces ? 'tracked-multi' : 'detected'
            });

            await saveStrokeRiskToDB(asymmetryIndex, normalizedRiskLevel);
            announce(`Classificação atual do índice: ${normalizedRiskLevel}.`);
        } catch (cycleError) {
            console.error('Erro durante a detecção facial:', cycleError);
            const message = 'O monitoramento encontrou uma falha inesperada durante a análise.';
            setError(message);
            setFaceState({
                detected: false,
                multipleFaces: false,
                message,
                mode: 'error'
            });
            announce(message);
        }
    }, [
        announce,
        calculateSideFeatures,
        cameraReady,
        drawDetectionOverlay,
        hasPatient,
        isDetecting,
        saveStrokeRiskToDB,
        syncCanvasSize
    ]);

    const runDetection = useCallback(() => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }

        detectionIntervalRef.current = setInterval(() => {
            processDetectionCycle();
        }, 2000);
    }, [processDetectionCycle]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const currentPatientId = queryParams.get('patientId');

        setPatientId(currentPatientId || '');
        setPatientResolved(true);

        if (!currentPatientId) {
            setIsDetecting(false);
            setCurrentAnalysis(null);
            setLatestAnalysis(null);
            setFaceState({
                detected: false,
                multipleFaces: false,
                message: 'Abra esta ferramenta a partir do Dashboard do Paciente.',
                mode: 'blocked'
            });
            announce('Paciente não identificado. O monitoramento foi bloqueado.');
        }
    }, [announce, location]);

    useEffect(() => {
        loadModels();

        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, [loadModels]);

    useEffect(() => {
        if (!patientResolved || !hasPatient || !isModelsLoaded) {
            return;
        }

        startVideo();
    }, [hasPatient, isModelsLoaded, patientResolved, startVideo]);

    useEffect(() => {
        if (!patientResolved) {
            return;
        }

        fetchHistory();
    }, [fetchHistory, patientResolved]);

    useEffect(() => {
        if (isDetecting && hasPatient && isModelsLoaded && cameraReady) {
            runDetection();
            return () => {
                if (detectionIntervalRef.current) {
                    clearInterval(detectionIntervalRef.current);
                }
            };
        }

        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }
    }, [cameraReady, hasPatient, isDetecting, isModelsLoaded, runDetection]);

    useEffect(() => {
        if (isDetecting) {
            return;
        }

        setCurrentAnalysis(null);
        setFaceState((previous) => ({
            ...previous,
            detected: false,
            message: hasPatient
                ? 'Monitoramento pausado. Retome quando quiser continuar a leitura.'
                : previous.message,
            mode: hasPatient ? 'paused' : previous.mode
        }));
    }, [hasPatient, isDetecting]);

    useEffect(() => {
        window.addEventListener('resize', syncCanvasSize);
        return () => window.removeEventListener('resize', syncCanvasSize);
    }, [syncCanvasSize]);

    const filteredHistory = useMemo(() => {
        const source = [...facialAsymmetryData].sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
        const now = new Date();

        switch (periodFilter) {
        case 'today':
            return source.filter((item) => new Date(item.timestamp).toDateString() === now.toDateString());
        case 'week': {
            const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            return source.filter((item) => new Date(item.timestamp) >= oneWeekAgo);
        }
        case 'month': {
            const oneMonthAgo = new Date(now);
            oneMonthAgo.setMonth(now.getMonth() - 1);
            return source.filter((item) => new Date(item.timestamp) >= oneMonthAgo);
        }
        case 'custom':
            if (!dateFilter) {
                return [];
            }

            return source.filter((item) => {
                const itemDate = new Date(item.timestamp);
                const selectedDate = new Date(dateFilter);
                return itemDate.toDateString() === selectedDate.toDateString();
            });
        default:
            return source;
        }
    }, [dateFilter, facialAsymmetryData, periodFilter]);

    const riskDistribution = useMemo(() => (
        filteredHistory.reduce((accumulator, item) => {
            const normalizedRiskLevel = normalizeRiskLevel(item.riskLevel);
            accumulator[normalizedRiskLevel] = (accumulator[normalizedRiskLevel] || 0) + 1;
            return accumulator;
        }, { Baixo: 0, Médio: 0, Alto: 0 })
    ), [filteredHistory]);

    const predominantRisk = useMemo(() => {
        const entries = Object.entries(riskDistribution);
        const bestMatch = entries.reduce((winner, current) => (
            current[1] > winner[1] ? current : winner
        ), ['N/A', 0]);

        return bestMatch[1] > 0 ? bestMatch[0] : 'N/A';
    }, [riskDistribution]);

    const lineChartData = useMemo(() => ({
        labels: filteredHistory.map((item) => formatChartLabel(item.timestamp, periodFilter)),
        datasets: [
            {
                label: 'Índice de assimetria',
                data: filteredHistory.map((item) => Number(item.asymmetryScore)),
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.14)',
                pointBackgroundColor: '#2563EB',
                pointBorderColor: '#FFFFFF',
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBorderWidth: 2,
                tension: 0.35,
                fill: true
            }
        ]
    }), [filteredHistory, periodFilter]);

    const barChartData = useMemo(() => ({
        labels: RISK_LEVELS,
        datasets: [
            {
                label: 'Classificações registradas',
                data: RISK_LEVELS.map((riskLevel) => riskDistribution[riskLevel] || 0),
                backgroundColor: [
                    'rgba(22, 163, 74, 0.82)',
                    'rgba(245, 158, 11, 0.82)',
                    'rgba(220, 38, 38, 0.82)'
                ],
                borderColor: ['#16A34A', '#F59E0B', '#DC2626'],
                borderRadius: 10,
                borderWidth: 0
            }
        ]
    }), [riskDistribution]);

    const lineChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#07152E',
                borderColor: 'rgba(148, 163, 184, 0.18)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    title: (items) => {
                        const item = filteredHistory[items[0]?.dataIndex];
                        return item ? formatDateTime(item.timestamp) : '';
                    },
                    label: (item) => `Índice: ${formatAsymmetry(Number(item.raw))}`
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: CHART_GRID_COLOR
                },
                ticks: {
                    color: CHART_TEXT_COLOR
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: CHART_GRID_COLOR
                },
                ticks: {
                    color: CHART_TEXT_COLOR
                },
                title: {
                    display: true,
                    text: 'Índice',
                    color: CHART_TEXT_COLOR
                }
            }
        }
    }), [filteredHistory]);

    const barChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#07152E',
                borderColor: 'rgba(148, 163, 184, 0.18)',
                borderWidth: 1,
                padding: 12
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: CHART_TEXT_COLOR
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: CHART_GRID_COLOR
                },
                ticks: {
                    color: CHART_TEXT_COLOR,
                    precision: 0
                },
                title: {
                    display: true,
                    text: 'Leituras',
                    color: CHART_TEXT_COLOR
                }
            }
        }
    }), []);

    const workspaceState = useMemo(() => {
        if (error) {
            return {
                label: 'Falha no monitoramento',
                tone: 'danger'
            };
        }

        if (!patientResolved) {
            return {
                label: 'Preparando contexto',
                tone: 'info'
            };
        }

        if (!hasPatient) {
            return {
                label: 'Paciente não identificado',
                tone: 'danger'
            };
        }

        if (!isModelsLoaded) {
            return {
                label: 'Carregando modelos',
                tone: 'info'
            };
        }

        if (!cameraReady) {
            return {
                label: 'Aguardando câmera',
                tone: 'info'
            };
        }

        if (!isDetecting) {
            return {
                label: 'Monitoramento pausado',
                tone: 'neutral'
            };
        }

        if (!faceState.detected) {
            return {
                label: 'Procurando face',
                tone: faceState.multipleFaces ? 'warning' : 'info'
            };
        }

        return {
            label: `Classificação atual: ${currentAnalysis?.riskLevel || 'Baixo'}`,
            tone: getRiskTone(currentAnalysis?.riskLevel)
        };
    }, [cameraReady, currentAnalysis?.riskLevel, error, faceState.detected, faceState.multipleFaces, hasPatient, isDetecting, isModelsLoaded, patientResolved]);

    const statusCards = useMemo(() => ([
        {
            key: 'models',
            icon: <Cpu />,
            title: 'Modelos',
            value: error && !isModelsLoaded ? 'Erro' : isModelsLoaded ? 'Prontos' : 'Carregando',
            copy: 'TinyFaceDetector, landmarks e reconhecimento carregados localmente.',
            tone: error && !isModelsLoaded ? 'danger' : isModelsLoaded ? 'success' : 'info'
        },
        {
            key: 'camera',
            icon: <CameraVideo />,
            title: 'Câmera',
            value: cameraState === 'error' ? 'Indisponível' : cameraReady ? 'Ativa' : 'Iniciando',
            copy: 'Captura facial em tempo real para análise computadorizada.',
            tone: cameraState === 'error' ? 'danger' : cameraReady ? 'success' : 'info'
        },
        {
            key: 'monitoring',
            icon: <Activity />,
            title: 'Monitoramento',
            value: !hasPatient ? 'Bloqueado' : isDetecting ? 'Ativo' : 'Pausado',
            copy: 'A leitura segue o intervalo atual de 2 segundos por amostra.',
            tone: !hasPatient ? 'danger' : isDetecting ? 'success' : 'neutral'
        },
        {
            key: 'face',
            icon: <PersonBoundingBox />,
            title: 'Face',
            value: faceState.detected ? 'Detectada' : isDetecting ? 'Procurando' : 'Aguardando',
            copy: faceState.multipleFaces
                ? 'Somente a face-alvo permanece em monitoramento quando há mais pessoas no quadro.'
                : 'O sistema acompanha uma única face durante a sessão.',
            tone: faceState.detected ? 'success' : faceState.multipleFaces ? 'warning' : 'info'
        },
        {
            key: 'patient',
            icon: <ShieldCheck />,
            title: 'Paciente',
            value: hasPatient ? 'Paciente vinculado' : 'Não identificado',
            copy: hasPatient
                ? 'Persistência habilitada para o paciente informado na URL.'
                : 'Abra esta ferramenta a partir do Dashboard do Paciente.',
            tone: hasPatient ? 'success' : 'danger'
        }
    ]), [cameraReady, cameraState, error, faceState.detected, faceState.multipleFaces, hasPatient, isDetecting, isModelsLoaded]);

    const renderLiveOverlay = () => {
        if (!patientResolved) {
            return (
                <div className="ac-stroke-live-overlay">
                    <Spinner animation="border" size="sm" />
                    <strong>Preparando o contexto do monitor</strong>
                    <span>Aguarde alguns instantes enquanto validamos o paciente e os recursos da câmera.</span>
                </div>
            );
        }

        if (!hasPatient) {
            return (
                <div className="ac-stroke-live-overlay is-blocked">
                    <ShieldCheck />
                    <strong>Paciente não identificado</strong>
                    <span>Abra esta ferramenta a partir do Dashboard do Paciente.</span>
                </div>
            );
        }

        if (!isModelsLoaded) {
            return (
                <div className="ac-stroke-live-overlay">
                    <Spinner animation="border" size="sm" />
                    <strong>Carregando modelos</strong>
                    <span>Preparando a camada de detecção facial para iniciar a leitura.</span>
                </div>
            );
        }

        if (!cameraReady) {
            return (
                <div className="ac-stroke-live-overlay">
                    <Spinner animation="border" size="sm" />
                    <strong>Ativando câmera</strong>
                    <span>Conectando a captura local para iniciar a análise facial em tempo real.</span>
                </div>
            );
        }

        if (!isDetecting) {
            return (
                <div className="ac-stroke-live-overlay is-muted">
                    <PauseCircle />
                    <strong>Monitoramento pausado</strong>
                    <span>Retome a captura quando quiser continuar a leitura.</span>
                </div>
            );
        }

        if (!faceState.detected) {
            return (
                <div className="ac-stroke-live-overlay is-muted">
                    <PersonBoundingBox />
                    <strong>Nenhuma face identificada</strong>
                    <span>Centralize o rosto e mantenha uma distância adequada da câmera.</span>
                </div>
            );
        }

        return null;
    };

    const currentRiskTone = getRiskTone(currentAnalysis?.riskLevel);
    const latestRiskTone = getRiskTone(latestAnalysis?.riskLevel);
    const noHistoryAvailable = !historyLoading && filteredHistory.length === 0;

    return (
        <div className="ac-stroke-shell">
            <div className="ac-sr-only" aria-live="polite" aria-atomic="true">{liveAnnouncement}</div>

            <header className="ac-stroke-header">
                <div className="ac-stroke-container ac-stroke-header__inner">
                    <div className="ac-stroke-header__brand">
                        <img src={logonovo} alt="AutisConnect" className="ac-stroke-header__logo" />
                        <div className="ac-stroke-header__divider" />
                        <div className="ac-stroke-header__copy">
                            <span>Facial Monitoring Workspace</span>
                            <strong>Assimetria Facial</strong>
                        </div>
                    </div>

                    <div className="ac-stroke-header__actions">
                        <span className={`ac-stroke-pill is-${workspaceState.tone}`}>{workspaceState.label}</span>
                        <Button
                            variant="outline-light"
                            size="sm"
                            className="ac-stroke-close-button"
                            onClick={() => window.close()}
                        >
                            <X className="me-2" />
                            Fechar
                        </Button>
                    </div>
                </div>
            </header>

            <main className="ac-stroke-main">
                <Container fluid className="ac-stroke-container">
                    <section className="ac-stroke-page-header">
                        <div>
                            <div className="ac-stroke-page-header__eyebrow">Monitoramento de Assimetria Facial</div>
                            <h1>Análise computadorizada de simetria facial como ferramenta complementar de monitoramento.</h1>
                            <p>
                                Monitore a face em tempo real, acompanhe o índice de assimetria e consulte a evolução
                                temporal sem transformar a interface em um diagnóstico automático.
                            </p>
                        </div>

                        <div className="ac-stroke-page-header__note">
                            Este monitoramento é uma ferramenta de apoio e não substitui avaliação médica ou atendimento de emergência.
                        </div>
                    </section>

                    <section className="ac-stroke-status-grid">
                        {statusCards.map((card) => (
                            <article key={card.key} className={`ac-stroke-status-card is-${card.tone}`}>
                                <div className="ac-stroke-status-card__icon">{card.icon}</div>
                                <div className="ac-stroke-status-card__content">
                                    <span>{card.title}</span>
                                    <strong>{card.value}</strong>
                                    <small>{card.copy}</small>
                                </div>
                            </article>
                        ))}
                    </section>

                    {error ? <Alert variant="danger" className="ac-stroke-alert-banner">{error}</Alert> : null}
                    {historyWarning ? <Alert variant="warning" className="ac-stroke-alert-banner">{historyWarning}</Alert> : null}

                    <section className="ac-stroke-workspace">
                        <div className="ac-stroke-live-card">
                            <div className="ac-stroke-card-head">
                                <div>
                                    <span className="ac-stroke-card-kicker">Câmera e face-alvo</span>
                                    <h2>Monitoramento facial em tempo real</h2>
                                    <p>
                                        O cálculo de assimetria continua baseado em landmarks faciais, mas a interface agora
                                        prioriza uma única face monitorada.
                                    </p>
                                </div>

                                <div className="ac-stroke-card-head__chips">
                                    {faceState.detected ? (
                                        <span className="ac-stroke-pill is-success">
                                            <CheckCircleFill />
                                            Face detectada
                                        </span>
                                    ) : null}
                                    {faceState.multipleFaces ? (
                                        <span className="ac-stroke-pill is-warning">
                                            <ExclamationTriangleFill />
                                            Somente a face-alvo será monitorada
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <div className="ac-stroke-live-frame">
                                <video ref={videoRef} autoPlay muted playsInline className="ac-stroke-video" />
                                <canvas ref={canvasRef} className="ac-stroke-canvas" />
                                {renderLiveOverlay()}
                            </div>

                            <div className="ac-stroke-live-footer">
                                <div className="ac-stroke-inline-status">
                                    <Activity />
                                    <span>{faceState.message}</span>
                                </div>

                                <Button
                                    variant={isDetecting ? 'outline-secondary' : 'primary'}
                                    className="ac-stroke-control-button"
                                    onClick={() => {
                                        setIsDetecting((previous) => {
                                            const nextValue = !previous;
                                            announce(nextValue ? 'Monitoramento retomado.' : 'Monitoramento pausado.');
                                            return nextValue;
                                        });
                                    }}
                                    disabled={!hasPatient || !isModelsLoaded || cameraState === 'error'}
                                >
                                    {isDetecting ? (
                                        <>
                                            <PauseCircle className="me-2" />
                                            Pausar monitoramento
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle className="me-2" />
                                            Retomar monitoramento
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <aside className="ac-stroke-analysis-card">
                            <div className="ac-stroke-card-kicker">Análise Atual</div>
                            <h2>Índice e classificação em destaque</h2>
                            <p className="ac-stroke-card-copy">
                                O índice reflete a diferença relativa entre características geométricas dos dois lados da face.
                            </p>

                            <div className="ac-stroke-score-panel">
                                <div className="ac-stroke-score-value">
                                    {currentAnalysis ? formatAsymmetry(currentAnalysis.asymmetryScore) : '--'}
                                </div>
                                <div className="ac-stroke-score-copy">
                                    <div className="ac-stroke-score-label">
                                        Índice de assimetria
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={(
                                                <BootstrapTooltip id="stroke-asymmetry-tooltip">
                                                    Valor calculado a partir da diferença relativa entre características geométricas dos lados da face.
                                                </BootstrapTooltip>
                                            )}
                                        >
                                            <button type="button" className="ac-stroke-tooltip-button" aria-label="Explicação do índice de assimetria">
                                                <InfoCircle />
                                            </button>
                                        </OverlayTrigger>
                                    </div>
                                    <small>
                                        {currentAnalysis
                                            ? 'Leitura ativa da face monitorada.'
                                            : 'Aguardando uma face válida para exibir a leitura atual.'}
                                    </small>
                                </div>
                            </div>

                            <div className="ac-stroke-risk-block">
                                <span className={`ac-stroke-risk-badge is-${currentAnalysis ? currentRiskTone : latestRiskTone}`}>
                                    {currentAnalysis?.riskLevel || latestAnalysis?.riskLevel || 'Aguardando'}
                                </span>
                                <div className="ac-stroke-risk-copy">
                                    <strong>Classificação do índice</strong>
                                    <span>
                                        {currentAnalysis
                                            ? 'Resultado derivado dos limiares internos do monitoramento.'
                                            : 'A última classificação válida permanece disponível apenas como referência de histórico.'}
                                    </span>
                                </div>
                            </div>

                            <div className="ac-stroke-kpi-grid">
                                <article className="ac-stroke-kpi-card">
                                    <span>Última leitura</span>
                                    <strong>{latestAnalysis ? formatClock(latestAnalysis.timestamp) : '--'}</strong>
                                </article>
                                <article className="ac-stroke-kpi-card">
                                    <span>Leituras no filtro</span>
                                    <strong>{filteredHistory.length}</strong>
                                </article>
                                <article className="ac-stroke-kpi-card">
                                    <span>Predominância</span>
                                    <strong>{predominantRisk}</strong>
                                </article>
                            </div>

                            {currentAnalysis?.riskLevel === 'Médio' ? (
                                <Alert variant="warning" className="ac-stroke-context-alert">
                                    <strong>Assimetria moderada identificada</strong>
                                    <span>Considere observar outros sinais e buscar orientação profissional caso existam sintomas associados.</span>
                                </Alert>
                            ) : null}

                            {currentAnalysis?.riskLevel === 'Alto' ? (
                                <Alert variant="danger" className="ac-stroke-context-alert">
                                    <strong>Assimetria acentuada identificada</strong>
                                    <span>Este resultado não confirma um AVC. Caso existam sinais neurológicos súbitos, procure atendimento de emergência.</span>
                                </Alert>
                            ) : null}

                            {!currentAnalysis && latestAnalysis ? (
                                <div className="ac-stroke-last-reading">
                                    <ClockHistory />
                                    <span>
                                        Última leitura registrada em {formatDateTime(latestAnalysis.timestamp)} com classificação {latestAnalysis.riskLevel}.
                                    </span>
                                </div>
                            ) : null}
                        </aside>
                    </section>

                    <section className="ac-stroke-analytics-grid">
                        <Card className="ac-stroke-panel-card">
                            <Card.Body>
                                <div className="ac-stroke-card-head">
                                    <div>
                                        <span className="ac-stroke-card-kicker">Evolução</span>
                                        <h3>Evolução da Assimetria Facial</h3>
                                        <p className="ac-stroke-card-copy">
                                            A linha acompanha o índice salvo para o período selecionado e usa somente dados reais disponíveis.
                                        </p>
                                    </div>

                                    <div className="ac-stroke-filters">
                                        <Form.Select size="sm" value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}>
                                            <option value="today">Hoje</option>
                                            <option value="week">Últimos 7 dias</option>
                                            <option value="month">Últimos 30 dias</option>
                                            <option value="custom">Data específica</option>
                                        </Form.Select>

                                        {periodFilter === 'custom' ? (
                                            <Form.Control
                                                type="date"
                                                size="sm"
                                                value={dateFilter}
                                                onChange={(event) => setDateFilter(event.target.value)}
                                            />
                                        ) : null}
                                    </div>
                                </div>

                                <div className="ac-stroke-chart-frame">
                                    {historyLoading ? (
                                        <div className="ac-stroke-chart-empty">
                                            <Spinner animation="border" size="sm" />
                                            <strong>Carregando histórico</strong>
                                            <span>Buscando leituras anteriores deste paciente.</span>
                                        </div>
                                    ) : noHistoryAvailable ? (
                                        <div className="ac-stroke-chart-empty">
                                            <BarChartLine />
                                            <strong>Ainda não há medições para este período</strong>
                                            <span>{buildEmptyMessage(periodFilter, dateFilter)}</span>
                                        </div>
                                    ) : (
                                        <Line data={lineChartData} options={lineChartOptions} />
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="ac-stroke-panel-card">
                            <Card.Body>
                                <div className="ac-stroke-card-head">
                                    <div>
                                        <span className="ac-stroke-card-kicker">Distribuição</span>
                                        <h3>Distribuição das Classificações</h3>
                                        <p className="ac-stroke-card-copy">
                                            Os contadores mostram como as leituras se distribuíram entre os limiares internos do monitoramento.
                                        </p>
                                    </div>
                                </div>

                                <div className="ac-stroke-chart-frame">
                                    {historyLoading ? (
                                        <div className="ac-stroke-chart-empty">
                                            <Spinner animation="border" size="sm" />
                                            <strong>Carregando classificações</strong>
                                            <span>Os indicadores serão preenchidos assim que o histórico estiver disponível.</span>
                                        </div>
                                    ) : noHistoryAvailable ? (
                                        <div className="ac-stroke-chart-empty">
                                            <ShieldCheck />
                                            <strong>Nenhuma medição disponível</strong>
                                            <span>Inicie o monitoramento para gerar dados deste paciente.</span>
                                        </div>
                                    ) : (
                                        <Bar data={barChartData} options={barChartOptions} />
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </section>

                    <section className="ac-stroke-support-grid">
                        <Card className="ac-stroke-panel-card">
                            <Card.Body>
                                <div className="ac-stroke-card-kicker">Sinais de alerta</div>
                                <h3>Entenda os sinais de alerta</h3>
                                <div className="ac-stroke-guidance-list">
                                    <article className="ac-stroke-guidance-item">
                                        <ExclamationTriangleFill />
                                        <div>
                                            <strong>Fraqueza ou dormência súbita</strong>
                                            <span>No rosto, braço ou perna, especialmente em um lado do corpo.</span>
                                        </div>
                                    </article>
                                    <article className="ac-stroke-guidance-item">
                                        <ExclamationTriangleFill />
                                        <div>
                                            <strong>Alteração na fala ou compreensão</strong>
                                            <span>Confusão súbita, dificuldade para falar ou entender instruções simples.</span>
                                        </div>
                                    </article>
                                    <article className="ac-stroke-guidance-item">
                                        <ExclamationTriangleFill />
                                        <div>
                                            <strong>Alterações visuais ou motoras</strong>
                                            <span>Dificuldade para enxergar, andar, manter equilíbrio ou coordenar movimentos.</span>
                                        </div>
                                    </article>
                                    <article className="ac-stroke-guidance-item">
                                        <ExclamationTriangleFill />
                                        <div>
                                            <strong>Dor de cabeça intensa e súbita</strong>
                                            <span>Considere avaliação imediata quando surgir sem causa conhecida.</span>
                                        </div>
                                    </article>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="ac-stroke-panel-card">
                            <Card.Body>
                                <div className="ac-stroke-card-kicker">Conduta</div>
                                <h3>Quando buscar atendimento imediato</h3>
                                <Alert variant="danger" className="ac-stroke-context-alert">
                                    <strong>Procure emergência se houver sinais neurológicos súbitos</strong>
                                    <span>Este monitor não confirma AVC. Diante de sintomas agudos, procure atendimento imediatamente.</span>
                                </Alert>

                                <div className="ac-stroke-privacy-card">
                                    <div className="ac-stroke-card-kicker">Privacidade</div>
                                    <p className="ac-stroke-card-copy">
                                        A implementação observada registra índices, classificações e observações vinculadas ao paciente no backend.
                                        Este painel não deve ser interpretado isoladamente como confirmação sobre retenção ou descarte de imagens.
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card className="ac-stroke-panel-card ac-stroke-panel-card--full">
                            <Card.Body>
                                <div className="ac-stroke-card-kicker">Detalhes técnicos</div>
                                <h3>Contexto operacional do monitor</h3>
                                <Accordion className="ac-stroke-accordion">
                                    <Accordion.Item eventKey="0">
                                        <Accordion.Header>Como a leitura é produzida</Accordion.Header>
                                        <Accordion.Body>
                                            O monitor utiliza TinyFaceDetector para localizar faces, landmarks faciais para extrair
                                            pontos geométricos e mantém os limiares atuais de classificação no frontend:
                                            até 0.15 para Baixo, acima de 0.15 para Médio e acima de 0.30 para Alto.
                                        </Accordion.Body>
                                    </Accordion.Item>
                                    <Accordion.Item eventKey="1">
                                        <Accordion.Header>Persistência e frequência</Accordion.Header>
                                        <Accordion.Body>
                                            A análise roda em intervalos de 2 segundos e cada leitura válida continua enviando
                                            um POST para <code>/stroke-risk</code> com <code>patient_id</code>, <code>asymmetry_index</code>,
                                            <code>risk_level</code> e <code>observations</code>.
                                        </Accordion.Body>
                                    </Accordion.Item>
                                    <Accordion.Item eventKey="2">
                                        <Accordion.Header>Histórico e segurança de uso</Accordion.Header>
                                        <Accordion.Body>
                                            O gráfico consome o histórico real quando o endpoint <code>/stroke-risk/:patientId</code>
                                            responde. Dados simulados deixaram de ser exibidos como se fossem medições do paciente.
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>
                            </Card.Body>
                        </Card>
                    </section>
                </Container>
            </main>
        </div>
    );
};

export default StrokeRiskMonitor;
