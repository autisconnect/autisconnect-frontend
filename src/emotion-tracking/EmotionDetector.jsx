import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Alert, Button, Form } from 'react-bootstrap';
//import * as tf from '@tensorflow/tfjs'; // <-- 1. IMPORTADO O TENSORFLOW
//import * as faceapi from 'face-api.js';
import apiClient from '../services/api'; // <-- 2. USANDO apiClient EM VEZ DE AXIOS
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
import logohori from '../assets/logo.png';
import '../App.css';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    Title, Tooltip, Legend, Filler
);

const EmotionDetector = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectionIntervalRef = useRef(null);
    const [emotion, setEmotion] = useState('Detectando...');
    const [emotionsData, setEmotionsData] = useState([]);
    const [periodFilter, setPeriodFilter] = useState('today');
    const [dateFilter, setDateFilter] = useState('');
    const [emotionFilter, setEmotionFilter] = useState('all');
    const [error, setError] = useState(null);
    const [emotionCounts, setEmotionCounts] = useState({
        neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0
    });
    const [sessionData, setSessionData] = useState([]);
    const [isDetecting, setIsDetecting] = useState(true);
    const [patientId, setPatientId] = useState(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);

    const location = useLocation();

    // Extrair patientId da URL
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('patientId');
        if (id) {
            setPatientId(id);
            console.log(`Monitorando paciente com ID: ${id}`);
        } else {
            setError("ID do paciente não encontrado na URL. As emoções não serão salvas.");
        }
    }, [location]);

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
        // As bibliotecas tf e faceapi agora vêm do window
        const tf = window.tf;
        const faceapi = window.faceapi;

        if (!tf || !faceapi) {
            setError("Bibliotecas de IA não foram carregadas. Verifique os scripts no index.html.");
            setIsLoading(false);
            return;
        }

        try {
            setError(null);
            console.log("Aguardando o backend do TensorFlow.js ficar pronto...");
            await tf.ready();
            console.log(`Backend do TensorFlow.js pronto: ${tf.getBackend()}`);

            console.log("Iniciando carregamento dos modelos da face-api...");
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                faceapi.nets.faceExpressionNet.loadFromUri('/models')
            ]);
            console.log("Modelos carregados com sucesso");
            setIsModelsLoaded(true);
        } catch (err) {
            console.error('Erro ao carregar modelos:', err);
            setError(`Falha ao carregar modelos de detecção facial. Erro: ${err.message}`);
        }
    };

    // Função para salvar a emoção no banco de dados
    const saveEmotionToDB = async (dominantEmotion) => {
        if (!patientId) {
            console.warn("Não é possível salvar a emoção: ID do paciente não definido.");
            return;
        }
        try {
            await apiClient.post('/emotions', {
                user_id: patientId,
                emotion_type: dominantEmotion,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error('Erro ao salvar emoção no banco de dados:', err);
            const errorMessage = err.response?.data?.error || 'Erro ao salvar emoção no servidor.';
            setError(errorMessage);
        }
    };

    // Função para processar o vídeo e detectar emoções
    const runDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }

        detectionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !isDetecting) {
                return;
            }

            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            if (!detections || detections.length === 0) {
                return;
            }

            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
                faceapi.matchDimensions(canvas, displaySize);
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                faceapi.draw.drawDetections(canvas, detections);
                faceapi.draw.drawFaceLandmarks(canvas, detections);
                faceapi.draw.drawFaceExpressions(canvas, detections);
            }

            const expressions = detections[0].expressions;
            let dominantEmotion = 'neutral';
            let maxValue = 0;

            Object.entries(expressions).forEach(([emotion, value]) => {
                if (value > maxValue) {
                    dominantEmotion = emotion;
                    maxValue = value;
                }
            });

            setEmotion(dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1));

            const newData = {
                timestamp: new Date().toISOString(),
                emotions: expressions,
                dominantEmotion: dominantEmotion
            };

            setEmotionsData(prevData => [...prevData, newData].slice(-50));
            updateEmotionCounts(dominantEmotion);
            saveEmotionToDB(dominantEmotion);
        }, 500);
    };

    // Carregar modelos ao montar o componente
    useEffect(() => {
        loadModels();

        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
            }
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Iniciar o vídeo assim que os modelos estiverem carregados
    useEffect(() => {
        if (isModelsLoaded) {
            startVideo();
        }
    }, [isModelsLoaded]);

    // Gerenciar detecção com base em isDetecting, patientId e isModelsLoaded
    useEffect(() => {
        const videoElement = videoRef.current;

        if (isDetecting && patientId && videoElement && isModelsLoaded) {
            const handleCanPlay = () => {
                console.log("Vídeo pronto, iniciando detecção.");
                runDetection();
            };
            videoElement.addEventListener('canplay', handleCanPlay);

            return () => {
                videoElement.removeEventListener('canplay', handleCanPlay);
                if (detectionIntervalRef.current) {
                    clearInterval(detectionIntervalRef.current);
                }
            };
        } else {
            if (detectionIntervalRef.current) {
                console.log("Parando detecção.");
                clearInterval(detectionIntervalRef.current);
            }
        }
    }, [isDetecting, patientId, isModelsLoaded]);

    // Função para alternar a detecção
    const toggleDetection = () => {
        setIsDetecting(prevState => !prevState);
    };

    // Função para atualizar contagem de emoções
    const updateEmotionCounts = (dominantEmotion) => {
        setEmotionCounts(prevCounts => ({
            ...prevCounts,
            [dominantEmotion]: (prevCounts[dominantEmotion] || 0) + 1
        }));
    };

    // Carregar dados iniciais (simulados)
    useEffect(() => {
        const mockSessionData = [
            { id: 1, name: 'Sessão 1', date: '2023-01-15', metrics: { happy: 0.65, engaged: 0.70 } },
            { id: 2, name: 'Sessão 2', date: '2023-01-22', metrics: { happy: 0.75, engaged: 0.72 } },
            { id: 3, name: 'Sessão 3', date: '2023-01-29', metrics: { happy: 0.80, engaged: 0.78 } },
            { id: 4, name: 'Sessão 4', date: '2023-02-05', metrics: { happy: 0.85, engaged: 0.82 } }
        ];
        setSessionData(mockSessionData);

        const now = new Date();
        const mockEmotionsData = [];
        for (let i = 0; i < 24; i++) {
            const timestamp = new Date(now.getTime() - (24 - i) * 60 * 60 * 1000);
            const happy = Math.random() * 0.8;
            const sad = Math.random() * 0.3;
            const angry = Math.random() * 0.2;
            const fearful = Math.random() * 0.1;
            const disgusted = Math.random() * 0.1;
            const surprised = Math.random() * 0.2;
            const neutral = Math.max(0, 1 - happy - sad - angry - fearful - disgusted - surprised);

            const emotions = { happy, sad, angry, fearful, disgusted, surprised, neutral };
            let dominantEmotion = 'neutral';
            let maxValue = neutral;

            Object.entries(emotions).forEach(([emotion, value]) => {
                if (value > maxValue) {
                    dominantEmotion = emotion;
                    maxValue = value;
                }
            });

            mockEmotionsData.push({
                timestamp: timestamp.toISOString(),
                emotions,
                dominantEmotion
            });

            updateEmotionCounts(dominantEmotion);
        }
        setEmotionsData(mockEmotionsData);
    }, []);

    // Função para formatar dados para o gráfico de emoções
    const formatEmotionChartData = () => {
        if (!emotionsData || emotionsData.length === 0) {
            return {
                labels: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25'],
                datasets: [
                    {
                        label: 'Feliz',
                        data: [0.2, 0.5, 0.7, 0.6, 0.8, 0.9],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Triste',
                        data: [0.5, 0.3, 0.2, 0.1, 0.1, 0.05],
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            };
        }

        let filteredData = emotionsData;
        const now = new Date();

        if (periodFilter === 'today') {
            filteredData = emotionsData.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate.toDateString() === now.toDateString();
            });
        } else if (periodFilter === 'week') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredData = emotionsData.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate >= oneWeekAgo;
            });
        } else if (periodFilter === 'month') {
            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filteredData = emotionsData.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate >= oneMonthAgo;
            });
        } else if (periodFilter === 'custom' && dateFilter) {
            const selectedDate = new Date(dateFilter);
            filteredData = emotionsData.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate.toDateString() === selectedDate.toDateString();
            });
        }

        if (emotionFilter !== 'all') {
            filteredData = filteredData.filter(item => item.dominantEmotion === emotionFilter);
        }

        const labels = filteredData.map(item => {
            const date = new Date(item.timestamp);
            return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        });

        const emotions = ['Neutro', 'Feliz', 'Triste', 'Raiva', 'Medo', 'Nojo', 'Surpresa'];
        const colors = [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(201, 203, 207, 1)'
        ];

        const datasets = emotions.map((emotion, index) => ({
            label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
            data: filteredData.map(item => item.emotions[emotion]),
            borderColor: colors[index],
            backgroundColor: colors[index].replace('1)', '0.2)'),
            fill: true,
            tension: 0.4
        }));

        return { labels, datasets };
    };

    // Função para formatar dados para o gráfico de distribuição de emoções
    const formatEmotionDistributionData = () => ({
        labels: ['Neutro', 'Feliz', 'Triste', 'Raiva', 'Medo', 'Nojo', 'Surpresa'],
        datasets: [
            {
                label: 'Distribuição de Emoções',
                data: [
                    emotionCounts.neutral,
                    emotionCounts.happy,
                    emotionCounts.sad,
                    emotionCounts.angry,
                    emotionCounts.fearful,
                    emotionCounts.disgusted,
                    emotionCounts.surprised
                ],
                backgroundColor: [
                    'rgba(201, 203, 207, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 205, 86, 0.6)'
                ],
                borderColor: [
                    'rgba(201, 203, 207, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 205, 86, 1)'
                ],
                borderWidth: 1
            }
        ]
    });

    // Função para formatar dados para o gráfico de sessões
    const formatSessionsData = () => {
        if (!sessionData || sessionData.length === 0) {
            return {
                labels: ['Sessão 1', 'Sessão 2', 'Sessão 3', 'Sessão 4'],
                datasets: [
                    {
                        label: 'Feliz',
                        data: [65, 75, 80, 85],
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    },
                    {
                        label: 'Engajado',
                        data: [70, 72, 78, 82],
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    }
                ]
            };
        }

        const labels = sessionData.map(session => session.name);
        const happyData = sessionData.map(session => session.metrics.happy * 100);
        const engagedData = sessionData.map(session => session.metrics.engaged * 100);

        return {
            labels,
            datasets: [
                {
                    label: 'Feliz',
                    data: happyData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
                {
                    label: 'Engajado',
                    data: engagedData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                }
            ]
        };
    };

    // Opções para os gráficos
    const lineOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Emoções ao Longo do Tempo' }
        },
        scales: {
            y: { beginAtZero: true, max: 1, title: { display: true, text: 'Intensidade' } },
            x: { title: { display: true, text: 'Tempo' } }
        }
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Distribuição de Emoções' }
        },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Frequência' } } }
    };

    const sessionsOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Comparação entre Sessões' }
        },
        scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Porcentagem (%)' } } }
    };

    // Funções para lidar com filtros
    const handlePeriodChange = (e) => setPeriodFilter(e.target.value);
    const handleDateChange = (e) => setDateFilter(e.target.value);
    const handleEmotionFilterChange = (e) => setEmotionFilter(e.target.value);

    return (
        <Container fluid className="py-4 emotion-detector-page">
            <Row className="professional-header-row mb-4 align-items-center">
                <Col className="text-center">
                    <img src={logohori} alt="AutisConnect Logo" className="details-logo" />
                    <h1 className="professional-name mb-0 mt-2">Monitoramento Emocional</h1>
                </Col>
                <Col xs="auto">
                    <Button variant="outline-primary" onClick={() => window.close()} className="back-button-standalone">
                        <X /> Sair
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>Detecção de Emoções em Tempo Real</span>
                            <Button variant={isDetecting ? 'danger' : 'success'} onClick={toggleDetection} disabled={!isModelsLoaded}>
                                {isDetecting ? 'Parar Detecção' : 'Iniciar Detecção'}
                            </Button>
                        </Card.Header>
                        <Card.Body className="text-center">
                            <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                                <video ref={videoRef} autoPlay muted playsInline width="100%" height="auto" style={{ borderRadius: '8px' }} />
                                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                            </div>
                            <p className="mt-3">
                                {!isModelsLoaded ? 'Carregando modelos...' : (isDetecting ? `Emoção Atual: ${emotion}` : 'Detecção Pausada')}
                            </p>
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Header>Emoção Detectada</Card.Header>
                        <Card.Body>
                            <h3 className="text-center mb-4">{emotion}</h3>
                            <div className="emotion-indicators">
                                {['Happy', 'Sad', 'Angry', 'Fearful', 'Disgusted', 'Surprised', 'Neutral'].map((emo, idx) => (
                                    <div key={idx} className={`emotion-indicator ${emotion === emo ? 'active' : ''}`}>
                                        <span role="img" aria-label={emo.toLowerCase()}>
                                            {emo === 'Happy' ? '😊' : emo === 'Sad' ? '😢' : emo === 'Angry' ? '😠' :
                                            emo === 'Fearful' ? '😨' : emo === 'Disgusted' ? '🤢' : emo === 'Surprised' ? '😲' : '😐'}
                                        </span>
                                        <span>{emo === 'Happy' ? 'Feliz' : emo === 'Sad' ? 'Triste' : emo === 'Angry' ? 'Raiva' :
                                            emo === 'Fearful' ? 'Medo' : emo === 'Disgusted' ? 'Nojo' : emo === 'Surprised' ? 'Surpresa' : 'Neutro'}</span>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Header>Distribuição de Emoções</Card.Header>
                        <Card.Body>
                            <Bar data={formatEmotionDistributionData()} options={barOptions} />
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <span>Emoções ao Longo do Tempo</span>
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
                            <Line data={formatEmotionChartData()} options={lineOptions} />
                            <div className="mt-3">
                                <Form.Select
                                    size="sm"
                                    value={emotionFilter}
                                    onChange={handleEmotionFilterChange}
                                    style={{ width: 'auto' }}
                                >
                                    <option value="all">Todas as Emoções</option>
                                    {['Feliz', 'Triste', 'Raiva', 'Medo', 'Nojo', 'Surpresa', 'Neutro'].map(emo => (
                                        <option key={emo} value={emo}>
                                            {emo.charAt(0).toUpperCase() + emo.slice(1)}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Header>Comparação entre Sessões</Card.Header>
                        <Card.Body>
                            <Bar data={formatSessionsData()} options={sessionsOptions} />
                        </Card.Body>
                    </Card>

                    <Card className="mb-4">
                        <Card.Header>Insights e Recomendações</Card.Header>
                        <Card.Body>
                            <h5>Padrões Emocionais Detectados</h5>
                            <p>
                                Com base nas emoções detectadas, observamos que a emoção predominante é
                                <strong> {emotion}</strong>. Isso pode indicar o estado emocional atual da pessoa.
                            </p>
                            <h5>Recomendações</h5>
                            <ul>
                                {emotion === 'Happy' && <li>Continue com atividades que promovem alegria e bem-estar.</li>}
                                {emotion === 'Sad' && <li>Considere atividades que elevam o humor, como música alegre ou exercícios físicos.</li>}
                                {emotion === 'Angry' && <li>Técnicas de respiração e relaxamento podem ajudar a reduzir sentimentos de raiva.</li>}
                                {emotion === 'Fearful' && <li>Exercícios de mindfulness podem ajudar a reduzir a ansiedade e o medo.</li>}
                                <li>Monitore regularmente as emoções para identificar padrões ao longo do tempo.</li>
                                <li>Compare os resultados entre diferentes sessões para avaliar o progresso.</li>
                            </ul>
                            <Alert variant="info">
                                <strong>Lembre-se:</strong> Este detector de emoções é uma ferramenta de apoio.
                                Para avaliações clínicas precisas, consulte sempre um profissional qualificado.
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="mb-4">
                <Card.Header>Sobre a Detecção de Emoções</Card.Header>
                <Card.Body>
                    <p>
                        Este detector utiliza inteligência artificial para reconhecer expressões faciais e
                        associá-las a sete emoções básicas: felicidade, tristeza, raiva, medo, nojo, surpresa e neutralidade.
                    </p>
                    <p>
                        A tecnologia analisa pontos-chave do rosto (landmarks faciais) e identifica padrões
                        associados a diferentes expressões emocionais. Os dados coletados são apresentados em
                        tempo real e também armazenados para análise de tendências ao longo do tempo.
                    </p>
                    <p>
                        <strong>Aplicações:</strong> Esta ferramenta pode ser útil para terapeutas, educadores e
                        cuidadores que trabalham com pessoas autistas, ajudando a identificar estados emocionais
                        que podem não ser verbalizados claramente.
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EmotionDetector;