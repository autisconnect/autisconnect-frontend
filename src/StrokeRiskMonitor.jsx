import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Alert, Form, Button } from 'react-bootstrap'; // Adicionado Button
import * as faceapi from 'face-api.js';
import axios from 'axios'; // Importar axios para chamadas de API
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
    Filler,
} from 'chart.js';
import { X } from 'react-bootstrap-icons';
import logohori from './assets/logohoriz.jpg';
import './App.css';

// Registrar os componentes do Chart.js
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

const StrokeRiskMonitor = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectionIntervalRef = useRef(null);
    
    // Estados
    const [patientId, setPatientId] = useState(null);
    const [isDetecting, setIsDetecting] = useState(true);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [asymmetryScore, setAsymmetryScore] = useState('Detectando...');
    const [riskLevel, setRiskLevel] = useState('N/A');
    const [facialAsymmetryData, setFacialAsymmetryData] = useState([]);
    const [riskDistribution, setRiskDistribution] = useState({ Baixo: 0, Médio: 0, Alto: 0 });
    const [error, setError] = useState(null);
    const [periodFilter, setPeriodFilter] = useState('today');
    const [dateFilter, setDateFilter] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    // Efeito para ler o ID do paciente da URL
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('patientId');
        if (id) {
            setPatientId(id);
        } else {
            setError("ID do paciente não encontrado na URL. Os dados não serão salvos.");
            setIsDetecting(false);
        }
    }, [location]);

    // Função para iniciar o vídeo
    const startVideo = () => {
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
    };

    // Função para carregar os modelos
    const loadModels = async () => {
        try {
            setError(null);
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);
            console.log("Modelos carregados com sucesso");
            setIsModelsLoaded(true);
        } catch (err) {
            console.error('Erro ao carregar modelos:', err);
            setError('Falha ao carregar modelos de detecção facial.');
        }
    };

    // Função para salvar os dados no backend
    const saveStrokeRiskToDB = async (asymmetry, risk) => {
        if (!patientId) return;

        const token = localStorage.getItem('token');
        if (!token) {
            setError("Token não encontrado. Faça login novamente.");
            setIsDetecting(false);
            return;
        }

        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/stroke-risk', {
                patient_id: patientId,
                asymmetry_index: asymmetry,
                risk_level: risk,
                observations: 'Detecção automática via monitor'
            }, config);
        } catch (err) {
            console.error("Erro ao salvar risco de AVC:", err);
            setError("Falha ao comunicar com o servidor para salvar os dados.");
        }
    };

    // Função para calcular características de um lado do rosto
    const calculateSideFeatures = (eye, nose, mouthPart) => {
        let sum = 0;
        for (let i = 0; i < eye.length; i++) {
            for (let j = i + 1; j < eye.length; j++) {
                sum += Math.sqrt(
                    Math.pow(eye[i].x - eye[j].x, 2) +
                    Math.pow(eye[i].y - eye[j].y, 2)
                );
            }
        }

        for (let i = 0; i < eye.length; i++) {
            for (let j = 0; j < nose.length; j++) {
                sum += Math.sqrt(
                    Math.pow(eye[i].x - nose[j].x, 2) +
                    Math.pow(eye[i].y - nose[j].y, 2)
                );
            }
        }

        for (let i = 0; i < eye.length; i++) {
            for (let j = 0; j < mouthPart.length; j++) {
                sum += Math.sqrt(
                    Math.pow(eye[i].x - mouthPart[j].x, 2) +
                    Math.pow(eye[i].y - mouthPart[j].y, 2)
                );
            }
        }

        return sum;
    };

    // Função para processar o vídeo e detectar assimetria facial
    const runDetection = () => {
        if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

        detectionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || !isDetecting) return;

            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
                faceapi.matchDimensions(canvas, displaySize);
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (detections && detections.length > 0) {
                    faceapi.draw.drawDetections(canvas, detections);
                    faceapi.draw.drawFaceLandmarks(canvas, detections);
                }
            }

            if (detections && detections.length > 0) {
                const landmarks = detections[0].landmarks;
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();
                const nose = landmarks.getNose();
                const mouth = landmarks.getMouth();

                const leftSide = calculateSideFeatures(leftEye, nose, mouth.slice(0, Math.floor(mouth.length / 2)));
                const rightSide = calculateSideFeatures(rightEye, nose, mouth.slice(Math.ceil(mouth.length / 2)));

                const asymmetry = Math.abs(leftSide - rightSide) / Math.max(leftSide, rightSide);
                const currentRisk = asymmetry > 0.3 ? 'Alto' : asymmetry > 0.15 ? 'Médio' : 'Baixo';

                setAsymmetryScore(asymmetry.toFixed(2));
                setRiskLevel(currentRisk);

                const newData = { timestamp: new Date().toISOString(), asymmetryScore: asymmetry, riskLevel: currentRisk };
                setFacialAsymmetryData(prev => [...prev, newData].slice(-20));
                updateRiskDistribution(currentRisk);

                // Salvar no banco de dados
                saveStrokeRiskToDB(asymmetry, currentRisk);
            } else {
                console.log("Nenhuma face detectada");
            }
        }, 2000); // Intervalo de 2 segundos
    };

    // Lógica de controle para iniciar e parar a detecção
    useEffect(() => {
        loadModels();
        return () => {
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (isModelsLoaded) startVideo();
    }, [isModelsLoaded]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (isDetecting && patientId && isModelsLoaded && videoElement) {
            const handleReady = () => runDetection();
            if (videoElement.readyState >= 1) {
                handleReady();
            } else {
                videoElement.addEventListener('loadeddata', handleReady);
                return () => videoElement.removeEventListener('loadeddata', handleReady);
            }
        } else {
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
        }
    }, [isDetecting, patientId, isModelsLoaded]);

    // Função para atualizar a distribuição de risco
    const updateRiskDistribution = (newRiskLevel) => {
        setRiskDistribution(prev => ({ ...prev, [newRiskLevel]: (prev[newRiskLevel] || 0) + 1 }));
    };

    // Função para formatar dados para o gráfico de linha com filtro por período
    const formatChartData = () => {
        if (!facialAsymmetryData || facialAsymmetryData.length === 0) {
            console.log("Sem dados de assimetria para o gráfico");
            return {
                labels: [],
                datasets: [
                    {
                        label: 'Assimetria Facial',
                        data: [],
                        borderColor: 'rgb(53, 162, 235)',
                        backgroundColor: 'rgba(53, 162, 235, 0.5)',
                        fill: false,
                        tension: 0.4
                    }
                ]
            };
        }

        // Filtrar dados com base no período selecionado
        let filteredData = facialAsymmetryData;
        const now = new Date();

        if (periodFilter === 'today') {
            filteredData = facialAsymmetryData.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate.toDateString() === now.toDateString();
            });
        } else if (periodFilter === 'week') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredData = facialAsymmetryData.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate >= oneWeekAgo;
            });
        } else if (periodFilter === 'month') {
            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filteredData = facialAsymmetryData.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate >= oneMonthAgo;
            });
        } else if (periodFilter === 'custom' && dateFilter) {
            const selectedDate = new Date(dateFilter);
            filteredData = facialAsymmetryData.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate.toDateString() === selectedDate.toDateString();
            });
        }

        if (filteredData.length === 0) {
            console.log("Nenhum dado após filtragem para o período:", periodFilter);
            return {
                labels: [],
                datasets: [
                    {
                        label: 'Assimetria Facial',
                        data: [],
                        borderColor: 'rgb(53, 162, 235)',
                        backgroundColor: 'rgba(53, 162, 235, 0.5)',
                        fill: false,
                        tension: 0.4
                    }
                ]
            };
        }

        const labels = filteredData.map(item => {
            const date = new Date(item.timestamp);
            return periodFilter === 'today'
                ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
                : `${date.getDate()}/${date.getMonth() + 1}`;
        });

        const asymmetryValues = filteredData.map(item => item.asymmetryScore);

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Assimetria Facial',
                    data: asymmetryValues,
                    borderColor: 'rgb(53, 162, 235)',
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    fill: false,
                    tension: 0.4
                }
            ]
        };
    };

    // Função para formatar dados para o gráfico de barras
    const formatBarChartData = () => {
        return {
            labels: ['Baixo', 'Médio', 'Alto'],
            datasets: [
                {
                    label: 'Distribuição de Níveis de Risco',
                    data: [
                        riskDistribution.Baixo || 0,
                        riskDistribution.Médio || 0,
                        riskDistribution.Alto || 0
                    ],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(255, 99, 132, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }
            ]
        };
    };

    // Opções para o gráfico de linha
    const lineOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Assimetria Facial ao Longo do Tempo'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Índice de Assimetria'
                }
            },
            x: {
                title: {
                    display: true,
                    text: periodFilter === 'today' ? 'Hora' : 'Data'
                }
            }
        }
    };

    // Opções para o gráfico de barras
    const barOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Distribuição de Níveis de Risco'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Frequência'
                }
            }
        }
    };

    // Função para alternar a detecção
    const toggleDetection = () => setIsDetecting(prev => !prev);

    // Carregar dados iniciais (simulados ou do backend)
    useEffect(() => {
        const now = new Date();
        const mockData = [
            {
                timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
                asymmetryScore: 0.12,
                riskLevel: 'Baixo'
            },
            {
                timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hora atrás
                asymmetryScore: 0.18,
                riskLevel: 'Médio'
            },
            {
                timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutos atrás
                asymmetryScore: 0.10,
                riskLevel: 'Baixo'
            }
        ];

        setFacialAsymmetryData(mockData);
        console.log("Dados carregados:", mockData);

        const initialDistribution = { Baixo: 0, Médio: 0, Alto: 0 };
        mockData.forEach(item => {
            initialDistribution[item.riskLevel] = (initialDistribution[item.riskLevel] || 0) + 1;
        });
        setRiskDistribution(initialDistribution);
    }, []);

    // Funções para lidar com mudanças nos filtros
    const handlePeriodChange = (e) => {
        setPeriodFilter(e.target.value);
    };

    const handleDateChange = (e) => {
        setDateFilter(e.target.value);
    };

    return (
        <Container fluid className="py-4 stroke-risk-monitor-page">
            <Row className="professional-header-row mb-4 align-items-center">

                <Col className="text-center">
                    <img src={logohori} alt="AutisConnect Logo" className="details-logo" />
                    <h1 className="professional-name mb-0 mt-2">Monitor de Risco de AVC</h1>
                </Col>
                <Col xs="auto">
                    <Button
                        variant="outline-primary"
                        onClick={() => window.close()}
                        className="back-button-standalone"
                    >
                        <X /> Sair
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>Detecção Facial em Tempo Real</span>
                            <Button
                                variant={isDetecting ? 'danger' : 'success'}
                                onClick={toggleDetection}
                                disabled={!isModelsLoaded}
                            >
                                {isDetecting ? 'Parar Detecção' : 'Iniciar Detecção'}
                            </Button>
                        </Card.Header>
                        <Card.Body className="text-center">
                            <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    width="100%"
                                    height="auto"
                                    style={{ borderRadius: '8px' }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%'
                                    }}
                                />
                            </div>
                            <p className="mt-3">
                                {!isModelsLoaded ? 'Carregando modelos...' : (isDetecting ? 'Detecção ativa...' : 'Detecção Pausada')}
                            </p>
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Header>Resultados da Análise</Card.Header>
                        <Card.Body>
                            <p><strong>Escore de Assimetria:</strong> {asymmetryScore}</p>
                            <p>
                                <strong>Nível de Risco:</strong>{' '}
                                <span className={`text-${
                                    riskLevel === 'Alto' ? 'danger' :
                                    riskLevel === 'Médio' ? 'warning' :
                                    riskLevel === 'Baixo' ? 'success' : 'secondary'
                                }`}>
                                    {riskLevel}
                                </span>
                            </p>

                            {riskLevel === 'Alto' && (
                                <Alert variant="danger">
                                    <strong>Atenção!</strong> Alto nível de assimetria facial detectado.
                                    Considere consultar um médico para avaliação.
                                </Alert>
                            )}

                            {riskLevel === 'Médio' && (
                                <Alert variant="warning">
                                    <strong>Atenção!</strong> Nível médio de assimetria facial detectado.
                                    Monitore seus sintomas e considere uma avaliação médica.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <span>Assimetria Facial ao Longo do Tempo</span>
                                <div className="d-flex">
                                    <Form.Select
                                        size="sm"
                                        value={periodFilter}
                                        onChange={handlePeriodChange}
                                        className="me-2"
                                        style={{ width: 'auto' }}
                                    >
                                        <option value="today">Hoje</option>
                                        <option value="week">Última Semana</option>
                                        <option value="month">Último Mês</option>
                                        <option value="custom">Data Específica</option>
                                    </Form.Select>

                                    {periodFilter === 'custom' && (
                                        <Form.Control
                                            type="date"
                                            size="sm"
                                            value={dateFilter}
                                            onChange={handleDateChange}
                                            style={{ width: 'auto' }}
                                        />
                                    )}
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {formatChartData().labels.length === 0 ? (
                                <Alert variant="info">
                                    Nenhum dado disponível para o período selecionado.
                                </Alert>
                            ) : (
                                <Line data={formatChartData()} options={lineOptions} />
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Header>Distribuição de Níveis de Risco</Card.Header>
                        <Card.Body>
                            <Bar data={formatBarChartData()} options={barOptions} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="mb-4">
                <Card.Header>Informações sobre AVC e Assimetria Facial</Card.Header>
                <Card.Body>
                    <h5>O que é assimetria facial?</h5>
                    <p>
                        A assimetria facial é uma diferença na aparência entre os lados direito e esquerdo do rosto.
                        Embora um certo grau de assimetria seja normal, uma assimetria súbita ou acentuada pode ser
                        um sinal de AVC.
                    </p>

                    <h5>Sinais de alerta para AVC:</h5>
                    <ul>
                        <li>Fraqueza súbita ou dormência no rosto, braço ou perna, especialmente em um lado do corpo</li>
                        <li>Confusão súbita, dificuldade para falar ou entender</li>
                        <li>Dificuldade súbita para enxergar com um ou ambos os olhos</li>
                        <li>Dificuldade súbita para andar, tontura, perda de equilíbrio ou coordenação</li>
                        <li>Dor de cabeça súbita e intensa sem causa conhecida</li>
                    </ul>

                    <Alert variant="info">
                        <strong>Lembre-se:</strong> Se você ou alguém próximo apresentar sinais de AVC,
                        ligue imediatamente para o serviço de emergência (SAMU 192). O tempo é crucial no tratamento do AVC.
                    </Alert>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default StrokeRiskMonitor;