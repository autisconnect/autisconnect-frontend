// Ficheiro: src/StereotypyMonitor.jsx
// VERSÃO CORRIGIDA E COMPLETA - Reordenado para evitar TDZ

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Table, Badge, Form } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import apiClient from '@/services/api';
import logohori from '@/assets/logohoriz.jpg';
import { X } from 'react-bootstrap-icons';

import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
);

const StereotypyMonitor = () => {
    // Refs primeiro
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const lastPoseRef = useRef(null);

    // Estados
    const [patientId, setPatientId] = useState(null);
    const [error, setError] = useState(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);

    const [detectedStereotypy, setDetectedStereotypy] = useState('Nenhuma');
    const [stereotypyLog, setStereotypyLog] = useState([]);
    const [stereotypyStartTime, setStereotypyStartTime] = useState(null);

    const [periodFilter, setPeriodFilter] = useState('today');
    const [dateFilter, setDateFilter] = useState('');
    const [stereotypyFilter, setStereotypyFilter] = useState('all');

    const location = useLocation();

    // Funções movidas para o TOPO para evitar TDZ - definidas antes dos useEffects
    const startVideo = useCallback(() => {
        console.log('startVideo called'); // Debug para rastrear init
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error('Erro ao acessar a webcam:', err);
                setError('Não foi possível acessar a webcam. Verifique as permissões.');
            });
    }, [setError]); // Deps explícitas para evitar recriações

    const toggleDetection = useCallback(() => {
        setIsDetecting(prevState => {
            const newState = !prevState;
            if (!newState && videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            return newState;
        });
    }, []);

    const keypointsToObject = useCallback((keypoints) => keypoints.reduce((acc, kp) => {
        if (kp.name) acc[kp.name.replace(/\s+/g, '_').toLowerCase()] = { x: kp.x, y: kp.y, score: kp.score };
        return acc;
    }, {}), []);

    const drawKeypoints = useCallback((keypoints, ctx) => {
        keypoints.forEach(keypoint => {
            if (keypoint.score > 0.3) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = 'aqua';
                ctx.fill();
            }
        });
    }, []);

    const analyzeMovement = useCallback((keypoints) => {
        const now = Date.now();
        const currentPose = { timestamp: now, keypoints: keypointsToObject(keypoints) };

        // A função logStereotypy é definida aqui dentro, usando as variáveis do escopo.
        const logStereotypy = (endTime, type, startTime) => {
            const duration = (endTime - startTime) / 1000;
            if (duration < 0.5) return;

            const currentKeypoints = lastPoseRef.current?.keypoints;
            const relevantScores = [
                currentKeypoints?.nose?.score || 0,
                currentKeypoints?.left_wrist?.score || 0,
                currentKeypoints?.right_wrist?.score || 0,
                currentKeypoints?.left_ear?.score || 0
            ].filter(s => s > 0);
            const avgScore = relevantScores.length > 0 ? relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length : 0.5;

            const newLog = {
                id: Date.now().toString(),
                type: type,
                duration: parseFloat(duration.toFixed(1)),
                score: parseFloat(avgScore.toFixed(2)),
                context: 'Sessão de monitoramento',
                date: new Date(startTime).toISOString()
            };

            setStereotypyLog(prev => [newLog, ...prev].slice(0, 50));
            saveDetectionToDB(newLog); // saveDetectionToDB ainda é externa, mas isso é menos problemático.
        };

        let detectedType = 'Nenhuma';
        if (lastPoseRef.current) {
            const nose = currentPose.keypoints.nose;
            const lastNose = lastPoseRef.current.keypoints.nose;
            if (nose && lastNose && Math.abs(nose.y - lastNose.y) > 5) {
                detectedType = 'Balançar corpo';
            }
            const leftWrist = currentPose.keypoints.left_wrist;
            const lastLeftWrist = lastPoseRef.current.keypoints.left_wrist;
            if (leftWrist && lastLeftWrist && Math.abs(leftWrist.y - lastLeftWrist.y) > 10) {
                detectedType = 'Movimento de mãos';
            }
            const leftEar = currentPose.keypoints.left_ear;
            const lastLeftEar = lastPoseRef.current.keypoints.left_ear;
            if (leftEar && lastLeftEar && Math.abs(leftEar.x - lastLeftEar.x) > 8) {
                detectedType = 'Balançar cabeça';
            }
        }

        setDetectedStereotypy(prevDetectedStereotypy => {
            // Usamos a função de atualização do state para ter acesso ao valor mais recente
            // sem precisar declará-lo como dependência.
            setStereotypyStartTime(prevStartTime => {
                if (detectedType !== 'Nenhuma') {
                    if (prevDetectedStereotypy !== detectedType && prevDetectedStereotypy !== 'Nenhuma') {
                        if (prevStartTime) {
                            logStereotypy(now, prevDetectedStereotypy, prevStartTime);
                        }
                        return now; // Novo start time
                    }
                } else {
                    if (prevStartTime && prevDetectedStereotypy !== 'Nenhuma') {
                        logStereotypy(now, prevDetectedStereotypy, prevStartTime);
                    }
                    return null; // Reseta o start time
                }
                return prevStartTime; // Mantém o start time
            });
            return detectedType;
        });

        lastPoseRef.current = currentPose;
    }, [keypointsToObject, saveDetectionToDB]); // Agora as dependências são mais simples e não criam ciclo.


    const logStereotypy = useCallback((endTime, type, startTime) => {
        const duration = (endTime - startTime) / 1000;
        if (duration < 0.5) return; 

        const currentKeypoints = lastPoseRef.current?.keypoints;
        const relevantScores = [
            currentKeypoints?.nose?.score || 0,
            currentKeypoints?.left_wrist?.score || 0,
            currentKeypoints?.right_wrist?.score || 0,
            currentKeypoints?.left_ear?.score || 0
        ].filter(s => s > 0);
        const avgScore = relevantScores.length > 0 ? relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length : 0.5;

        const newLog = {
            id: Date.now().toString(),
            type: type,
            duration: parseFloat(duration.toFixed(1)),
            score: parseFloat(avgScore.toFixed(2)),
            context: 'Sessão de monitoramento',
            date: new Date(startTime).toISOString()
        };

        setStereotypyLog(prev => [newLog, ...prev].slice(0, 50)); 
        saveDetectionToDB(newLog);
    }, [patientId]); // Deps incluindo patientId

    const saveDetectionToDB = useCallback(async (detectionData) => {
        if (!patientId) return;
        try {
            await apiClient.post('/stereotypies', {
                patient_id: patientId,
                ...detectionData
            });
        } catch (err) {
            console.error('Erro ao salvar detecção:', err);
            setError(err.response?.data?.error || 'Erro ao salvar detecção no servidor.');
        }
    }, [patientId, setError]);

    const formatStereotypyLogData = useCallback(() => {
        let filteredData = stereotypyLog;
        const now = new Date();
        if (periodFilter === 'today') filteredData = stereotypyLog.filter(item => new Date(item.date).toDateString() === now.toDateString());
        else if (periodFilter === 'week') { const oneWeekAgo = new Date(now.getTime() - 7 * 86400000); filteredData = stereotypyLog.filter(item => new Date(item.date) >= oneWeekAgo); }
        else if (periodFilter === 'month') { 
            const oneMonthAgo = new Date(now.getTime() - 30 * 86400000); 
            filteredData = stereotypyLog.filter(item => new Date(item.date) >= oneMonthAgo); 
        }
        else if (periodFilter === 'custom' && dateFilter) { const selectedDate = new Date(dateFilter); filteredData = stereotypyLog.filter(item => new Date(item.date).toDateString() === selectedDate.toDateString()); }
        if (stereotypyFilter !== 'all') filteredData = filteredData.filter(item => item.type === stereotypyFilter);
        return filteredData;
    }, [stereotypyLog, periodFilter, dateFilter, stereotypyFilter]);

    const formatLineChartData = useCallback(() => {
        const filteredData = formatStereotypyLogData();
        const labels = filteredData.map(item => new Date(item.date).toLocaleTimeString('pt-BR'));
        const data = filteredData.map(item => parseFloat(item.score));
        return {
            labels,
            datasets: [{
                label: 'Score de Confiança',
                data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true
            }]
        };
    }, [formatStereotypyLogData]);

    const formatBarChartData = useCallback(() => {
        const filteredData = formatStereotypyLogData();
        const types = ['Balançar corpo', 'Movimento de mãos', 'Balançar cabeça'];
        const counts = types.map(type => filteredData.filter(item => item.type === type).length);
        return {
            labels: types,
            datasets: [{
                label: 'Frequência',
                data: counts,
                backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)']
            }]
        };
    }, [formatStereotypyLogData]);

    const handlePeriodChange = useCallback((e) => setPeriodFilter(e.target.value), []);
    const handleDateChange = useCallback((e) => setDateFilter(e.target.value), []);
    const handleStereotypyFilterChange = useCallback((e) => setStereotypyFilter(e.target.value), []);

    // useEffects agora, após funções estarem definidas
    // EFEITO 1: Inicialização
    useEffect(() => {
        console.log('useEffect 1: Inicialização'); // Debug
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('patientId');
        if (!id) {
            setError("ID do paciente não encontrado na URL.");
            return;
        }
        setPatientId(id);

        // Mock data compatível com 12/09/2025
        const now = new Date('2025-09-12T00:00:00Z');
        const mockLogData = [
            { id: 1, type: 'Balançar corpo', duration: 12.5, score: 0.85, date: new Date(now.getTime() - 6 * 3600000).toISOString() },
            { id: 2, type: 'Movimento de mãos', duration: 8.2, score: 0.92, date: new Date(now.getTime() - 2 * 3600000).toISOString() },
            { id: 3, type: 'Balançar corpo', duration: 15.0, score: 0.78, date: new Date(now.getTime() - 1 * 3600000).toISOString() },
        ];
        setStereotypyLog(mockLogData);

        const initializeDetector = async () => {
            setError(null);
            console.log("Iniciando carregamento do modelo...");
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                console.log(`Backend pronto: ${tf.getBackend()}`);

                const model = poseDetection.SupportedModels.MoveNet;
                const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
                const detector = await poseDetection.createDetector(model, detectorConfig);
                
                detectorRef.current = detector;
                setIsModelsLoaded(true);
                console.log("Detector de pose criado com sucesso.");
            } catch (err) {
                console.error("Erro fatal ao criar detector:", err);
                setError(`Falha ao carregar o modelo de IA. Erro: ${err.message}`);
            }
        };

        initializeDetector();
    }, [location]);

    // EFEITO 2: Loop de Detecção
    useEffect(() => {
        console.log('useEffect 2: Loop de detecção, isDetecting:', isDetecting, 'isModelsLoaded:', isModelsLoaded); // Debug
        let animationFrameId;

        const runDetectionLoop = async () => {
            const detector = detectorRef.current;
            const videoEl = videoRef.current;

            if (detector && videoEl && videoEl.readyState === 4) {
                try {
                    const poses = await detector.estimatePoses(videoEl);
                    const ctx = canvasRef.current?.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        if (poses && poses.length > 0) {
                            analyzeMovement(poses[0].keypoints);
                            drawKeypoints(poses[0].keypoints, ctx);
                        }
                    }
                } catch (err) {
                    console.error('Erro no loop de detecção:', err);
                    setIsDetecting(false);
                    setError(`Ocorreu um erro na detecção: ${err.message}`);
                    return;
                }
            }
            animationFrameId = requestAnimationFrame(runDetectionLoop);
        };

        if (isDetecting && isModelsLoaded) {
            startVideo(); // Agora startVideo está definida antes
            const videoElement = videoRef.current;

            const handleVideoReady = () => {
                console.log("Vídeo pronto, iniciando loop de detecção.");
                if (canvasRef.current) {
                    canvasRef.current.width = videoElement.videoWidth;
                    canvasRef.current.height = videoElement.videoHeight;
                }
                runDetectionLoop();
            };
            videoElement.addEventListener('loadeddata', handleVideoReady);

            return () => {
                videoElement.removeEventListener('loadeddata', handleVideoReady);
                cancelAnimationFrame(animationFrameId);
            };
        } else {
            cancelAnimationFrame(animationFrameId);
        }
    }, [isDetecting, isModelsLoaded, startVideo, analyzeMovement, drawKeypoints]); // Deps completas

    const lineOptions = {
        responsive: true,
        plugins: { legend: { position: 'top' }, title: { display: true, text: 'Score ao Longo do Tempo' } },
        scales: { y: { beginAtZero: true, max: 1, title: { display: true, text: 'Score' } }, x: { title: { display: true, text: 'Tempo' } } }
    };

    const barOptions = {
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: 'Distribuição de Estereotipias' } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Frequência' } } }
    };

    const filteredLogs = useMemo(() => formatStereotypyLogData(), [formatStereotypyLogData]);

    return (
        <Container fluid className="py-4 stereotypy-monitor-page">
            <Row className="professional-header-row mb-4 align-items-center">
                <Col className="text-center">
                    <img src={logohori} alt="AutisConnect Logo" className="details-logo" />
                    <h1 className="professional-name mb-0 mt-2">Monitor de Estereotipias</h1>
                </Col>
                <Col xs="auto">
                    <Button variant="outline-primary" onClick={() => window.close()} className="back-button-standalone">
                        <X /> Sair
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {!isModelsLoaded ? (
                <div className="text-center py-4">
                    <Spinner animation="border" />
                    <p>Carregando modelos de IA...</p>
                </div>
            ) : (
                <Row>
                    <Col md={6}>
                        <Card className="mb-4">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <span>Detecção de Estereotipias em Tempo Real</span>
                                <Button variant={isDetecting ? 'danger' : 'success'} onClick={toggleDetection}>
                                    {isDetecting ? 'Parar Detecção' : 'Iniciar Detecção'}
                                </Button>
                            </Card.Header>
                            <Card.Body className="text-center">
                                <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                                    <video ref={videoRef} autoPlay muted playsInline width="100%" height="auto" style={{ borderRadius: '8px' }} />
                                    <canvas 
                                        ref={canvasRef} 
                                        aria-label="Overlay de keypoints da detecção de pose" 
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                                    />
                                </div>
                                <p className="mt-3">
                                    {isDetecting ? `Estereotipia Atual: ${detectedStereotypy}` : 'Detecção Pausada'}
                                </p>
                            </Card.Body>
                        </Card>
                        <Card className="mb-4">
                            <Card.Header>Indicadores de Estereotipias</Card.Header>
                            <Card.Body>
                                <div className="d-flex justify-content-around">
                                    <Badge bg="warning" className={detectedStereotypy === 'Balançar corpo' ? 'fs-5' : ''} title="Balançar Corpo">Balançar Corpo</Badge>
                                    <Badge bg="info" className={detectedStereotypy === 'Movimento de mãos' ? 'fs-5' : ''} title="Movimento de Mãos (Flapping)">Mãos (Flapping)</Badge>
                                    <Badge bg="secondary" className={detectedStereotypy === 'Balançar cabeça' ? 'fs-5' : ''} title="Balançar Cabeça">Balançar Cabeça</Badge>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="mb-4">
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span>Log de Detecções</span>
                                    <div className="d-flex">
                                        <Form.Select size="sm" value={periodFilter} onChange={handlePeriodChange} className="me-2" style={{ width: 'auto' }}>
                                            <option value="today">Hoje</option>
                                            <option value="week">Semana</option>
                                            <option value="month">Mês</option>
                                            <option value="custom">Data Específica</option>
                                        </Form.Select>
                                        {periodFilter === 'custom' && (<Form.Control type="date" size="sm" value={dateFilter} onChange={handleDateChange} style={{ width: 'auto' }} />)}
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <Table striped bordered hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Tipo</th>
                                            <th>Duração (s)</th>
                                            <th>Score</th>
                                            <th>Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogs.length > 0 ? (
                                            filteredLogs.map(log => (
                                                <tr key={log.id}>
                                                    <td><Badge bg="primary">{log.type}</Badge></td>
                                                    <td>{log.duration}</td>
                                                    <td>{log.score}</td>
                                                    <td>{new Date(log.date).toLocaleString('pt-BR')}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="text-center">Nenhuma detecção registrada.</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                                <div className="mt-3">
                                    <Form.Select size="sm" value={stereotypyFilter} onChange={handleStereotypyFilterChange} style={{ width: 'auto' }}>
                                        <option value="all">Todas</option>
                                        <option value="Balançar corpo">Balançar Corpo</option>
                                        <option value="Movimento de mãos">Mãos</option>
                                        <option value="Balançar cabeça">Cabeça</option>
                                    </Form.Select>
                                </div>
                            </Card.Body>
                        </Card>
                        <Card className="mb-4">
                            <Card.Header>Estereotipias ao Longo do Tempo</Card.Header>
                            <Card.Body>
                                <Line data={formatLineChartData()} options={lineOptions} />
                            </Card.Body>
                        </Card>
                        <Card className="mb-4">
                            <Card.Header>Distribuição de Estereotipias</Card.Header>
                            <Card.Body>
                                <Bar data={formatBarChartData()} options={barOptions} />
                            </Card.Body>
                        </Card>
                        <Card className="mb-4">
                            <Card.Header>Insights e Recomendações</Card.Header>
                            <Card.Body>
                                <h5>Padrões Detectados</h5>
                                <p>A estereotipia predominante é <strong>{detectedStereotypy}</strong>. Monitore a duração para intervenções.</p>
                                <h5>Recomendações</h5>
                                <ul>
                                    {detectedStereotypy === 'Balançar corpo' && <li>Sugira atividades sensoriais alternativas como balanço controlado.</li>}
                                    {detectedStereotypy === 'Movimento de mãos' && <li>Ofereça objetos de fidget para redirecionar o movimento.</li>}
                                    {detectedStereotypy === 'Balançar cabeça' && <li>Explore estímulos visuais para reduzir o balanço.</li>}
                                    <li>Registre sessões regulares para rastrear progresso.</li>
                                </ul>
                                <Alert variant="info">
                                    <strong>Lembrete:</strong> Esta é uma ferramenta de apoio. Consulte profissionais para avaliações clínicas.
                                </Alert>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default StereotypyMonitor;