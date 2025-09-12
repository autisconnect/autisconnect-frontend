// Ficheiro: src/StereotypyMonitor.jsx (VERSÃO COMPLETA COM GRÁFICOS)

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import apiClient from '@/services/api'; // Usa alias @ do vite.config.js
import logohori from '@/assets/logohoriz.jpg'; // Ajuste path se necessário
import { X } from 'react-bootstrap-icons';

// --- NOVOS IMPORTS DO TENSORFLOW ---
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl'; // Importa o backend para registrá-lo



// Registra os componentes do ChartJS (uma vez, fora do componente)
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const StereotypyMonitor = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectionIntervalRef = useRef(null);
    const lastPoseRef = useRef(null);
    const detectorRef = useRef(null);

    const [patientId, setPatientId] = useState(null);
    const [error, setError] = useState(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false); // Inicia pausado, botão para ativar

    // Estados para detecção
    const [detectedStereotypy, setDetectedStereotypy] = useState('Nenhuma');
    const [stereotypyLog, setStereotypyLog] = useState([]);
    const [stereotypyStartTime, setStereotypyStartTime] = useState(null);

    // Estados dos filtros
    const [periodFilter, setPeriodFilter] = useState('today');
    const [dateFilter, setDateFilter] = useState('');
    const [stereotypyFilter, setStereotypyFilter] = useState('all');

    const location = useLocation();

    // Efeito para carregar na inicialização
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('patientId');
        if (id) {
            setPatientId(id);
            console.log(`Monitorando paciente com ID: ${id}`);
            loadModels(); // Carrega modelos assim que ID é definido
        } else {
            setError("ID do paciente não encontrado na URL. A detecção não pode iniciar.");
        }

        // Carrega dados mockados para log de sessões (substitua por fetch do DB se quiser)
        const mockLogData = [
            { id: 1, type: 'Balançar corpo', duration: 12.5, score: 0.85, date: '2025-09-12T10:00:00Z' },
            { id: 2, type: 'Movimento de mãos', duration: 8.2, score: 0.92, date: '2025-09-12T11:30:00Z' },
            { id: 3, type: 'Balançar corpo', duration: 15.0, score: 0.78, date: '2025-09-12T14:20:00Z' },
            { id: 4, type: 'Movimento de mãos', duration: 10.1, score: 0.89, date: '2025-09-12T09:45:00Z' },
            { id: 5, type: 'Balançar cabeça', duration: 5.3, score: 0.91, date: '2025-09-12T15:10:00Z' }
        ];
        setStereotypyLog(mockLogData);

        // Cleanup
        return () => {
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [location]);

    const loadModels = useCallback(async () => { // Envolvido em useCallback para estabilidade
        try {
            setError(null);
            console.log("Configurando backend do TensorFlow.js...");

            // O backend é registrado pelo import, mas setá-lo explicitamente é uma boa prática.
            await tf.setBackend('webgl');
            await tf.ready();
            console.log(`Backend pronto: ${tf.getBackend()}`);

            const model = poseDetection.SupportedModels.MoveNet;
            const detectorConfig = {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
            };
            
            // Usando a variável 'poseDetection' importada
            const poseDetector = await poseDetection.createDetector(model, detectorConfig);
            detectorRef.current = poseDetector;
            setIsModelsLoaded(true);
            console.log("Modelo de pose carregado com sucesso.");

        } catch (err) {
            console.error('Erro ao carregar modelos:', err);
            // O fallback para CPU também funcionará
            try {
                console.log("Tentando fallback para o backend CPU...");
                await tf.setBackend('cpu');
                await tf.ready();
                console.log(`Backend fallback ativado: ${tf.getBackend()}`);

                const model = poseDetection.SupportedModels.MoveNet;
                const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
                const poseDetector = await poseDetection.createDetector(model, detectorConfig);
                detectorRef.current = poseDetector; // Armazena no ref

                setIsModelsLoaded(true);
                console.log("Modelo de pose carregado com sucesso no backend CPU.");
            } catch (fallbackErr) {
                setError(`Falha ao carregar os modelos de IA. Erro: ${err.message}`);
            }
        }
    }, []);

    const startVideo = useCallback(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error('Erro ao acessar a webcam:', err);
                setError('Não foi possível acessar a webcam. Verifique as permissões do navegador.');
            });
    }, []);

    const toggleDetection = () => {
        setIsDetecting(prevState => {
            const newState = !prevState;
            if (!newState) {
                if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
                if (videoRef.current && videoRef.current.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                }
                setDetectedStereotypy('Nenhuma');
                setStereotypyStartTime(null);
            } else {
                startVideo();
            }
            return newState;
        });
    };

    useEffect(() => {
        if (isModelsLoaded && isDetecting) {
            startVideo();
            const videoElement = videoRef.current;
            if (videoElement) {
                const handlePlay = () => {
                    console.log("Vídeo pronto, iniciando detecção de estereotipias.");
                    if (canvasRef.current) {
                        canvasRef.current.width = videoElement.videoWidth;
                        canvasRef.current.height = videoElement.videoHeight;
                    }
                    lastPoseRef.current = null;
                    detectionIntervalRef.current = setInterval(runDetection, 200);
                };
                videoElement.addEventListener('play', handlePlay);
                return () => videoElement.removeEventListener('play', handlePlay);
            }
        }
    }, [isModelsLoaded, isDetecting, startVideo]);

    const runDetection = useCallback(async () => {
        const detector = detectorRef.current;
        if (!detector || !videoRef.current || videoRef.current.paused) return;

        try {
            const poses = await detector.estimatePoses(videoRef.current);
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                if (poses && poses.length > 0) {
                    drawKeypoints(poses[0].keypoints, ctx);
                    analyzeMovement(poses[0].keypoints);
                }
            }
        } catch (err) {
            console.error('Erro na detecção:', err);
        }
    }, [patientId]);

    const analyzeMovement = (keypoints) => {
        const now = Date.now();
        const currentPose = { timestamp: now, keypoints: keypointsToObject(keypoints) };
        
        let detectedType = 'Nenhuma';
        if (lastPoseRef.current) {
            // Detecção de balançar corpo: Movimento vertical da cabeça (nose y varia > 5 pixels)
            const nose = currentPose.keypoints.nose;
            const lastNose = lastPoseRef.current.keypoints.nose;
            if (nose && lastNose && Math.abs(nose.y - lastNose.y) > 5) {
                detectedType = 'Balançar corpo';
            }
            // Detecção de movimento de mãos: Movimento vertical do punho esquerdo (hand flapping)
            const leftWrist = currentPose.keypoints.left_wrist;
            const lastLeftWrist = lastPoseRef.current.keypoints.left_wrist;
            if (leftWrist && lastLeftWrist && Math.abs(leftWrist.y - lastLeftWrist.y) > 10) {
                detectedType = 'Movimento de mãos';
            }
            // Adicional: Balançar cabeça (usando left_ear e right_ear)
            const leftEar = currentPose.keypoints.left_ear;
            const lastLeftEar = lastPoseRef.current.keypoints.left_ear;
            if (leftEar && lastLeftEar && Math.abs(leftEar.x - lastLeftEar.x) > 8) {
                detectedType = 'Balançar cabeça';
            }
        }

        if (detectedType !== 'Nenhuma') {
            if (detectedStereotypy !== detectedType) {
                if (stereotypyStartTime) logStereotypy(now);
                setStereotypyStartTime(now);
                setDetectedStereotypy(detectedType);
            }
        } else {
            if (stereotypyStartTime) logStereotypy(now);
            setStereotypyStartTime(null);
            setDetectedStereotypy('Nenhuma');
        }
        lastPoseRef.current = currentPose;
    };

    const logStereotypy = (endTime) => {
        const duration = (endTime - stereotypyStartTime) / 1000;
        if (duration < 0.5) return; // Ignora detecções muito curtas
        const newLog = {
            id: Date.now().toString(), // Simple ID (substitui uuidv4)
            type: detectedStereotypy,
            duration: parseFloat(duration.toFixed(1)),
            score: (lastPoseRef.current?.keypoints?.nose?.score || 0.5).toFixed(2),
            context: 'Sessão de monitoramento',
            date: new Date(stereotypyStartTime).toISOString()
        };
        setStereotypyLog(prev => [newLog, ...prev].slice(-50)); // Limita a 50 entradas
        saveDetectionToDB(newLog);
        setStereotypyStartTime(null);
    };

    const saveDetectionToDB = async (detectionData) => {
        if (!patientId) return;
        try {
            await apiClient.post('/stereotypies', {
                patient_id: patientId,
                ...detectionData
            });
            console.log('Estereotipia salva no DB:', detectionData.type);
        } catch (err) {
            console.error('Erro ao salvar detecção:', err);
            setError(err.response?.data?.error || 'Erro ao salvar detecção no servidor.');
        }
    };

    const keypointsToObject = (keypoints) => keypoints.reduce((acc, kp) => {
        if (kp.name) acc[kp.name.replace(/\s+/g, '_').toLowerCase()] = { x: kp.x, y: kp.y, score: kp.score };
        return acc;
    }, {});

    const drawKeypoints = (keypoints, ctx) => {
        keypoints.forEach(keypoint => {
            if (keypoint.score > 0.3) {
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = 'aqua';
                ctx.fill();
                ctx.fillStyle = 'black';
                ctx.font = '10px Arial';
                ctx.fillText(keypoint.name, keypoint.x + 5, keypoint.y - 5);
            }
        });
    };

    // Funções para formatar dados para tabela e gráficos
    const formatStereotypyLogData = () => {
        let filteredData = stereotypyLog;
        const now = new Date();
        if (periodFilter === 'today') filteredData = stereotypyLog.filter(item => new Date(item.date).toDateString() === now.toDateString());
        else if (periodFilter === 'week') { const oneWeekAgo = new Date(now.getTime() - 7 * 86400000); filteredData = stereotypyLog.filter(item => new Date(item.date) >= oneWeekAgo); }
        else if (periodFilter === 'month') { const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); filteredData = stereotypyLog.filter(item => new Date(item.date) >= oneMonthAgo); }
        else if (periodFilter === 'custom' && dateFilter) { const selectedDate = new Date(dateFilter); filteredData = stereotypyLog.filter(item => new Date(item.date).toDateString() === selectedDate.toDateString()); }
        if (stereotypyFilter !== 'all') filteredData = filteredData.filter(item => item.type === stereotypyFilter);

        return filteredData;
    };

    // Formatação para Gráfico de Linha (Score ao Longo do Tempo)
    const formatLineChartData = () => {
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
    };

    const lineOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Score ao Longo do Tempo' }
        },
        scales: {
            y: { beginAtZero: true, max: 1, title: { display: true, text: 'Score' } },
            x: { title: { display: true, text: 'Tempo' } }
        }
    };

    // Formatação para Gráfico de Barras (Distribuição por Tipo)
    const formatBarChartData = () => {
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
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Distribuição de Estereotipias' }
        },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Frequência' } }
        }
    };

    const handlePeriodChange = (e) => setPeriodFilter(e.target.value);
    const handleDateChange = (e) => setDateFilter(e.target.value);
    const handleStereotypyFilterChange = (e) => setStereotypyFilter(e.target.value);

    const filteredLogs = formatStereotypyLogData();

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
                                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
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
                                    <Badge bg="warning" className={detectedStereotypy === 'Balançar corpo' ? 'fs-5' : ''}>Balançar Corpo</Badge>
                                    <Badge bg="info" className={detectedStereotypy === 'Movimento de mãos' ? 'fs-5' : ''}>Mãos (Flapping)</Badge>
                                    <Badge bg="secondary" className={detectedStereotypy === 'Balançar cabeça' ? 'fs-5' : ''}>Balançar Cabeça</Badge>
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
                        {/* Novo: Gráfico de Linha */}
                        <Card className="mb-4">
                            <Card.Header>Estereotipias ao Longo do Tempo</Card.Header>
                            <Card.Body>
                                <Line data={formatLineChartData()} options={lineOptions} />
                            </Card.Body>
                        </Card>
                        {/* Novo: Gráfico de Barras */}
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
            <Card className="mb-4">
                <Card.Header>Sobre o Monitor de Estereotipias</Card.Header>
                <Card.Body>
                    <p>Utiliza IA (TensorFlow.js com MoveNet) para detectar movimentos repetitivos como balançar corpo ou mãos, comuns em TEA.</p>
                    <p>Os dados são salvos por paciente para análise de tendências e suporte terapêutico, com gráficos para visualização.</p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default StereotypyMonitor;