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

// Importações do TensorFlow.js no topo para evitar múltiplas instâncias
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-webgl';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
);

const StereotypyMonitor = () => {
    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const lastPoseRef = useRef(null);
    const analyzeMovementRef = useRef();
    const lastFrameTimeRef = useRef(0); // Para controle de throttling

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

    // Funções auxiliares
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
    }, [patientId]);

    // Função de análise principal
    const analyzeMovement = useCallback((keypoints) => {
        const now = Date.now();
        const currentPose = { timestamp: now, keypoints: keypointsToObject(keypoints) };
        
        let detectedType = 'Nenhuma';
        if (lastPoseRef.current) {
            const nose = currentPose.keypoints.nose;
            const lastNose = lastPoseRef.current.keypoints.nose;
            if (nose && lastNose && Math.abs(nose.y - lastNose.y) > 5) detectedType = 'Balançar corpo';
            
            const leftWrist = currentPose.keypoints.left_wrist;
            const lastLeftWrist = lastPoseRef.current.keypoints.left_wrist;
            if (leftWrist && lastLeftWrist && Math.abs(leftWrist.y - lastLeftWrist.y) > 10) detectedType = 'Movimento de mãos';

            const leftEar = currentPose.keypoints.left_ear;
            const lastLeftEar = lastPoseRef.current.keypoints.left_ear;
            if (leftEar && lastLeftEar && Math.abs(leftEar.x - lastLeftEar.x) > 8) detectedType = 'Balançar cabeça';
        }

        setDetectedStereotypy(prevDetected => {
            if (detectedType !== 'Nenhuma' && detectedType !== prevDetected) {
                if (stereotypyStartTime && prevDetected !== 'Nenhuma') {
                    const duration = (now - stereotypyStartTime) / 1000;
                    if (duration >= 0.5) {
                        const newLog = { id: Date.now().toString(), type: prevDetected, duration: parseFloat(duration.toFixed(1)), score: 0.8, date: new Date(stereotypyStartTime).toISOString() };
                        setStereotypyLog(prevLog => [newLog, ...prevLog].slice(0, 50));
                        saveDetectionToDB(newLog);
                    }
                }
                setStereotypyStartTime(now);
            } else if (detectedType === 'Nenhuma' && prevDetected !== 'Nenhuma') {
                if (stereotypyStartTime) {
                    const duration = (now - stereotypyStartTime) / 1000;
                    if (duration >= 0.5) {
                        const newLog = { id: Date.now().toString(), type: prevDetected, duration: parseFloat(duration.toFixed(1)), score: 0.8, date: new Date(stereotypyStartTime).toISOString() };
                        setStereotypyLog(prevLog => [newLog, ...prevLog].slice(0, 50));
                        saveDetectionToDB(newLog);
                    }
                }
                setStereotypyStartTime(null);
            }
            return detectedType;
        });

        lastPoseRef.current = currentPose;
    }, [keypointsToObject, saveDetectionToDB]);

    // EFEITO 1: Atualiza o ref com a versão mais recente da função
    useEffect(() => {
        analyzeMovementRef.current = analyzeMovement;
    }, [analyzeMovement]);

    // EFEITO 2: Inicialização do componente e do modelo
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('patientId');
        if (!id) {
            setError("ID do paciente não encontrado na URL.");
            return;
        }
        setPatientId(id);

        const initializeDetector = async () => {
            try {
                // Forçar backend CPU para evitar problemas com WebGL
                await tf.setBackend('cpu');
                await tf.ready();
                
                const backend = tf.getBackend();
                console.log(`Backend do TF.js pronto: ${backend}`);
                if (backend !== 'cpu') {
                    console.warn('Backend CPU não foi definido corretamente');
                }

                const model = poseDetection.SupportedModels.MoveNet;
                const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
                const detector = await poseDetection.createDetector(model, detectorConfig);

                detectorRef.current = detector;
                setIsModelsLoaded(true);
                console.log("Detector de pose criado com sucesso. Tensores iniciais:", tf.memory().numTensors);
            } catch (err) {
                console.error("Erro fatal ao inicializar o detector:", err);
                setError(`Falha ao carregar o modelo de IA. Erro: ${err.message}`);
            }
        };

        initializeDetector();
    }, [location]);

    // EFEITO 3: Loop de Detecção
    useEffect(() => {
        let animationFrameId;
        let videoTimeout;

        const runDetectionLoop = async () => {
            const now = performance.now();
            if (now - lastFrameTimeRef.current < 100) { // Throttle: máximo 10 FPS
                animationFrameId = requestAnimationFrame(runDetectionLoop);
                return;
            }
            lastFrameTimeRef.current = now;

            const detector = detectorRef.current;
            const videoEl = videoRef.current;

            if (!videoEl) {
                console.warn("Elemento de vídeo não encontrado");
                animationFrameId = requestAnimationFrame(runDetectionLoop);
                return;
            }

            if (videoEl.readyState !== 4) {
                console.warn("Vídeo ainda não está pronto (readyState !== 4)");
                videoTimeout = setTimeout(() => {
                    console.error("Timeout: Vídeo não atingiu readyState 4");
                    setError("Não foi possível carregar o vídeo corretamente.");
                }, 10000);
                animationFrameId = requestAnimationFrame(runDetectionLoop);
                return;
            }
            clearTimeout(videoTimeout);

            if (detector && analyzeMovementRef.current) {
                try {
                    tf.engine().startScope(); // Iniciar novo escopo
                    const tensor = tf.tidy(() => tf.browser.fromPixels(videoEl));
                    console.log("Tensores ativos antes de estimatePoses:", tf.memory().numTensors);
                    
                    const poses = await detector.estimatePoses(tensor);
                    tensor.dispose(); // Liberar tensor explicitamente
                    console.log("Tensores ativos após estimatePoses:", tf.memory().numTensors);

                    const ctx = canvasRef.current?.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        if (poses && poses.length > 0) {
                            analyzeMovementRef.current(poses[0].keypoints);
                            drawKeypoints(poses[0].keypoints, ctx);
                        }
                    }
                    tf.engine().endScope(); // Finalizar escopo
                    console.log("Tensores ativos após fim do escopo:", tf.memory().numTensors);
                } catch (err) {
                    console.error("Erro durante a estimativa de pose:", err);
                    tf.engine().endScope(); // Garantir fim do escopo em caso de erro
                    setError(`Erro na detecção de pose: ${err.message}`);
                }
            }

            animationFrameId = requestAnimationFrame(runDetectionLoop);
        };

        const startDetection = async () => {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.addEventListener('loadeddata', () => {
                            if (canvasRef.current) {
                                canvasRef.current.width = videoRef.current.videoWidth;
                                canvasRef.current.height = videoRef.current.videoHeight;
                            }
                            lastFrameTimeRef.current = performance.now();
                            runDetectionLoop();
                        });
                    }
                })
                .catch(err => setError('Não foi possível acessar a webcam. Verifique as permissões.'));
        };

        if (isDetecting && isModelsLoaded) {
            startDetection();

            return () => {
                cancelAnimationFrame(animationFrameId);
                clearTimeout(videoTimeout);
                if (videoRef.current && videoRef.current.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
                tf.engine().dispose(); // Limpar todos os tensores remanescentes
                console.log("Cleanup do loop de detecção executado");
            };
        }
    }, [isDetecting, isModelsLoaded, drawKeypoints]);

    const toggleDetection = useCallback(() => setIsDetecting(p => !p), []);

    // Funções para os gráficos e filtros
    const filteredLogs = useMemo(() => {
        let filteredData = stereotypyLog;
        const now = new Date();
        if (periodFilter === 'today') filteredData = stereotypyLog.filter(item => new Date(item.date).toDateString() === now.toDateString());
        else if (periodFilter === 'week') { const oneWeekAgo = new Date(now.getTime() - 7 * 86400000); filteredData = stereotypyLog.filter(item => new Date(item.date) >= oneWeekAgo); }
        else if (periodFilter === 'month') { const oneMonthAgo = new Date(now.getTime() - 30 * 86400000); filteredData = stereotypyLog.filter(item => new Date(item.date) >= oneMonthAgo); }
        else if (periodFilter === 'custom' && dateFilter) { const selectedDate = new Date(dateFilter); filteredData = stereotypyLog.filter(item => new Date(item.date).toDateString() === selectedDate.toDateString()); }
        if (stereotypyFilter !== 'all') filteredData = filteredData.filter(item => item.type === stereotypyFilter);
        return filteredData;
    }, [stereotypyLog, periodFilter, dateFilter, stereotypyFilter]);

    const lineChartData = useMemo(() => ({
        labels: filteredLogs.map(item => new Date(item.date).toLocaleTimeString('pt-BR')).reverse(),
        datasets: [{ label: 'Score de Confiança', data: filteredLogs.map(item => item.score).reverse(), borderColor: 'rgb(75, 192, 192)', tension: 0.1 }]
    }), [filteredLogs]);

    const barChartData = useMemo(() => {
        const types = ['Balançar corpo', 'Movimento de mãos', 'Balançar cabeça'];
        return {
            labels: types,
            datasets: [{ label: 'Frequência', data: types.map(type => filteredLogs.filter(item => item.type === type).length), backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'] }]
        };
    }, [filteredLogs]);

    // Handlers para os filtros
    const handlePeriodChange = useCallback((e) => setPeriodFilter(e.target.value), []);
    const handleDateChange = useCallback((e) => setDateFilter(e.target.value), []);
    const handleStereotypyFilterChange = useCallback((e) => setStereotypyFilter(e.target.value), []);

    // Opções dos gráficos
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
                                <Line data={lineChartData} options={lineOptions} />
                            </Card.Body>
                        </Card>
                        <Card className="mb-4">
                            <Card.Header>Distribuição de Estereotipias</Card.Header>
                            <Card.Body>
                                <Bar data={barChartData} options={barOptions} />
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