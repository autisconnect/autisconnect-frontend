import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Alert, Button, Form } from 'react-bootstrap';
import apiClient from '../services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { X } from 'react-bootstrap-icons';
import logonovo from '../assets/logonovo.png';
import '../App.css';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    Title, Tooltip, Legend, Filler
);

// Objeto para tradução das emoções
const emotionTranslations = {
    neutral: 'Neutro',
    happy: 'Feliz',
    sad: 'Triste',
    angry: 'Raiva',
    fearful: 'Medo',
    disgusted: 'Nojo',
    surprised: 'Surpresa'
};

const validEmotions = Object.keys(emotionTranslations);

const EmotionDetector = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectionIntervalRef = useRef(null);

    // Estados do componente
    const [patientId, setPatientId] = useState(null);
    const [error, setError] = useState(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);
    const [isDetecting, setIsDetecting] = useState(true);
    const [backendUsed, setBackendUsed] = useState('');

    // Estados de dados
    const [emotion, setEmotion] = useState('Detectando...');
    const [emotionsData, setEmotionsData] = useState([]);
    const [emotionCounts, setEmotionCounts] = useState({
        neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0
    });
    const [sessionData, setSessionData] = useState([]);

    // Estados dos filtros
    const [periodFilter, setPeriodFilter] = useState('today');
    const [dateFilter, setDateFilter] = useState('');
    const [emotionFilter, setEmotionFilter] = useState('all');

    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('patientId');
        if (id) {
            setPatientId(id);
            console.log(`Monitorando paciente com ID: ${id}`);
            loadModels();
        } else {
            setError("ID do paciente não encontrado na URL. A detecção não pode iniciar.");
        }

        const mockSessionData = [
            { id: 1, name: 'Sessão 1', date: '2023-01-15', metrics: { happy: 0.65, engaged: 0.70 } },
            { id: 2, name: 'Sessão 2', date: '2023-01-22', metrics: { happy: 0.75, engaged: 0.72 } },
            { id: 3, name: 'Sessão 3', date: '2023-01-29', metrics: { happy: 0.80, engaged: 0.78 } },
            { id: 4, name: 'Sessão 4', date: '2023-02-05', metrics: { happy: 0.85, engaged: 0.82 } }
        ];
        setSessionData(mockSessionData);

        return () => {
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [location]);

    const loadModels = async () => {
        const tf = window.tf;
        const faceapi = window.faceapi;

        if (!tf || !faceapi) {
            setError("As bibliotecas de IA não foram carregadas. Verifique os scripts no index.html.");
            return;
        }

        try {
            setError(null);
            console.log("Configurando backend do TensorFlow.js...");

            const webglVersion = tf.ENV.get('WEBGL_VERSION');
            console.log(`Versão WebGL suportada: ${webglVersion || 'N/A'}`);
            if (!webglVersion) {
                console.warn("WebGL não suportado. Usando CPU por padrão.");
                await tf.setBackend('cpu');
                setBackendUsed('CPU (WebGL não suportado)');
            } else {
                await tf.setBackend('webgl');
                await tf.ready();
                console.log(`Backend inicial: ${tf.getBackend()}`);
                setBackendUsed('WebGL');
            }

            console.log("Iniciando carregamento dos modelos da face-api...");
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceExpressionNet.loadFromUri('/models')
            ]);
            console.log("Modelos carregados com sucesso");
            setIsModelsLoaded(true);
        } catch (err) {
            console.error('Erro ao carregar modelos ou configurar backend:', err);
            try {
                await tf.setBackend('cpu');
                await tf.ready();
                console.log(`Backend fallback: ${tf.getBackend()}`);
                setBackendUsed('CPU');
                
                console.log("Re-carregando modelos no backend CPU...");
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceExpressionNet.loadFromUri('/models')
                ]);
                setIsModelsLoaded(true);
            } catch (fallbackErr) {
                console.error('Fallback para CPU falhou:', fallbackErr);
                setError(`Falha ao carregar modelos. Erro: ${err.message}. Verifique o console e tente recarregar a página.`);
            }
        }
    };

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

    const saveEmotionToDB = async (dominantEmotion) => {
        if (!patientId || !dominantEmotion || !validEmotions.includes(dominantEmotion)) {
            console.warn('Não salvando emoção: patientId ou dominantEmotion inválido', { patientId, dominantEmotion });
            return;
        }
        try {
            const payload = {
                patient_id: parseInt(patientId),  // Garante int para o schema
                emotion: dominantEmotion,
                timestamp: new Date().toISOString()
            };
            console.log('Enviando payload para /emotions:', payload);
            await apiClient.post('/emotions', payload);
            console.log('Emoção salva no DB com sucesso:', dominantEmotion);
        } catch (err) {
            console.error('Erro ao salvar emoção no banco de dados:', err);
            if (!err.response?.data?.error.includes('obrigatórios')) {
                setError(err.response?.data?.error || 'Erro ao salvar emoção no servidor.');
            }
        }
    };

    const runDetection = useCallback(() => {
        const faceapi = window.faceapi;
        if (!faceapi) return;

        if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

        detectionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            try {
                console.log('Executando detecção... (backend atual:', window.tf?.getBackend(), ')');
                // Versão simplificada: Sem landmarks para maior estabilidade
                const detections = await faceapi
                    .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceExpressions();

                console.log('Detections length:', detections?.length || 0);

                if (canvasRef.current) {
                    const canvas = canvasRef.current;
                    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
                    if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
                        faceapi.matchDimensions(canvas, displaySize);
                    }
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    if (detections && detections.length > 0) {
                        const resizedDetections = faceapi.resizeResults(detections, displaySize);
                        faceapi.draw.drawDetections(canvas, resizedDetections);
                        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
                    }
                }

                if (detections && detections.length > 0) {
                    const firstDetection = detections[0];
                    console.log('First detection object:', firstDetection);
                    const expressions = firstDetection.expressions;
                    console.log('Expressions disponíveis:', !!expressions, expressions);

                    let dominantEmotion = 'neutral';
                    if (expressions && typeof expressions === 'object' && Object.keys(expressions).length > 0) {
                        const reduceResult = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
                        console.log('Reduce result:', reduceResult);
                        dominantEmotion = validEmotions.includes(reduceResult) ? reduceResult : 'neutral';
                    } else {
                        console.warn('Expressions undefined ou vazio, usando fallback "neutral"');
                    }

                    console.log('Dominant emotion final:', dominantEmotion);

                    const translatedEmotion = emotionTranslations[dominantEmotion] || dominantEmotion;
                    setEmotion(translatedEmotion);

                    const newData = { 
                        timestamp: new Date().toISOString(), 
                        emotions: expressions || {}, 
                        dominantEmotion 
                    };
                    setEmotionsData(prev => [...prev, newData].slice(-50));
                    
                    setEmotionCounts(prev => ({ 
                        ...prev, 
                        [dominantEmotion]: (prev[dominantEmotion] || 0) + 1 
                    }));
                    
                    await saveEmotionToDB(dominantEmotion);
                } else {
                    setEmotion('Nenhuma face detectada');
                }
            } catch (detectionErr) {
                console.error('Erro durante detecção:', detectionErr);
                setEmotion('Erro na detecção (ver console para detalhes)');
            }
        }, 2000);  // 2s para estabilidade e menos spam no DB
    }, [patientId]);

    const toggleDetection = () => {
        setIsDetecting(prevState => {
            const newState = !prevState;
            if (!newState) {
                if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
                if (videoRef.current && videoRef.current.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                }
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
                    console.log(`Vídeo pronto, iniciando detecção com backend: ${backendUsed}.`);
                    runDetection();
                };
                videoElement.addEventListener('play', handlePlay);
                return () => videoElement.removeEventListener('play', handlePlay);
            }
        }
    }, [isModelsLoaded, isDetecting, startVideo, runDetection, backendUsed]);

    // Funções para gráficos (mantidas com fallbacks)
    const formatEmotionChartData = () => {
        let filteredData = emotionsData;
        const now = new Date();
        if (periodFilter === 'today') filteredData = emotionsData.filter(item => new Date(item.timestamp).toDateString() === now.toDateString());
        else if (periodFilter === 'week') { const oneWeekAgo = new Date(now.getTime() - 7 * 86400000); filteredData = emotionsData.filter(item => new Date(item.timestamp) >= oneWeekAgo); }
        else if (periodFilter === 'month') { const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); filteredData = emotionsData.filter(item => new Date(item.timestamp) >= oneMonthAgo); }
        else if (periodFilter === 'custom' && dateFilter) { const selectedDate = new Date(dateFilter); filteredData = emotionsData.filter(item => new Date(item.timestamp).toDateString() === selectedDate.toDateString()); }
        if (emotionFilter !== 'all') filteredData = filteredData.filter(item => item.dominantEmotion === emotionFilter);

        const labels = filteredData.map(item => new Date(item.timestamp).toLocaleTimeString('pt-BR'));
        const emotionKeys = Object.keys(emotionTranslations);
        const colors = ['#C9CBCF', '#4BC0C0', '#36A2EB', '#FF6384', '#FF9F40', '#9966FF', '#FFCD56'];

        return {
            labels,
            datasets: emotionKeys.map((key, index) => ({
                label: emotionTranslations[key],
                data: filteredData.map(item => (item.emotions && item.emotions[key]) || 0),
                borderColor: colors[index],
                backgroundColor: colors[index] + '33',
                fill: true,
                tension: 0.4
            }))
        };
    };

    const formatEmotionDistributionData = () => ({
        labels: Object.values(emotionTranslations),
        datasets: [{
            label: 'Distribuição de Emoções',
            data: Object.keys(emotionTranslations).map(key => emotionCounts[key] || 0),
            backgroundColor: ['#C9CBCF', '#4BC0C0', '#36A2EB', '#FF6384', '#FF9F40', '#9966FF', '#FFCD56'],
        }]
    });

    const formatSessionsData = () => {
        const labels = sessionData.map(session => session.name);
        const happyData = sessionData.map(session => session.metrics.happy * 100);
        const engagedData = sessionData.map(session => session.metrics.engaged * 100);
        return {
            labels,
            datasets: [
                { label: 'Feliz', data: happyData, backgroundColor: 'rgba(75, 192, 192, 0.6)' },
                { label: 'Engajado', data: engagedData, backgroundColor: 'rgba(54, 162, 235, 0.6)' }
            ]
        };
    };

    const lineOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Emoções ao Longo do Tempo' } }, scales: { y: { beginAtZero: true, max: 1, title: { display: true, text: 'Intensidade' } }, x: { title: { display: true, text: 'Tempo' } } } };
    const barOptions = { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Distribuição de Emoções' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Frequência' } } } };
    const sessionsOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Comparação entre Sessões' } }, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Porcentagem (%)' } } } };

    const handlePeriodChange = (e) => setPeriodFilter(e.target.value);
    const handleDateChange = (e) => setDateFilter(e.target.value);
    const handleEmotionFilterChange = (e) => setEmotionFilter(e.target.value);

    return (
        <div className="App bg-light min-vh-100">
            <nav className="top-bar fixed-top shadow-sm">
                <Container>
                    <Row className="align-items-center py-3">
                        <Col md={4} className="text-center text-md-start">
                            <img src={logonovo} alt="AutisConnect" className="top-bar-logo" />
                        </Col>
                        <Col md={4} className="text-center d-none d-md-block">
                            <span className="text-white fw-semibold">Monitoramento Emocional</span>
                        </Col>
                        <Col md={4} className="text-center text-md-end">
                            <Button variant="outline-light" size="sm" onClick={() => window.close()}>
                                <X className="me-2" /> Fechar
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </nav>

            <div className="home-page" style={{ paddingTop: '85px' }}>
                <section className="hero-section hero-short">
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={7} className="mb-4 mb-lg-0">
                                <div className="hero-content-box p-4 rounded-4">
                                    <h2 className="display-6 fw-bold mb-2 text-white">Monitoramento Emocional</h2>
                                    <p className="text-white-90 mb-1">Analise expressoes faciais em tempo real.</p>
                                    {backendUsed && (
                                        <p className="text-white-90 mb-0">Backend usado: {backendUsed}</p>
                                    )}
                                </div>
                            </Col>
                            <Col lg={5}>
                                <Card className="shadow-sm border-0">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-2">Resumo rapido</h5>
                                        <div className="text-muted">Capture dados emocionais para apoiar a terapia.</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <main className="dashboard-section py-4">
                    <Container fluid className="emotion-detector-page">
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
                                <video ref={videoRef} autoPlay muted playsInline width="100%" height="auto" style={{ borderRadius: '8px', transform: 'scaleX(-1)' }} />
                                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
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
                                {Object.entries(emotionTranslations).map(([key, value]) => (
                                    <div key={key} className={`emotion-indicator ${emotion === value ? 'active' : ''}`}>
                                        <span role="img" aria-label={value}>
                                            {key === 'happy' ? '😊' : key === 'sad' ? '😢' : key === 'angry' ? '😠' :
                                             key === 'fearful' ? '😨' : key === 'disgusted' ? '🤢' : key === 'surprised' ? '😲' : '😐'}
                                        </span>
                                        <span>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                    <Card className="mb-4">
                        <Card.Header>Distribuição de Emoções</Card.Header>
                        <Card.Body><Bar data={formatEmotionDistributionData()} options={barOptions} /></Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <span>Emoções ao Longo do Tempo</span>
                                <div className="d-flex">
                                    <Form.Select size="sm" value={periodFilter} onChange={handlePeriodChange} className="me-2" style={{ width: 'auto' }}>
                                        <option value="today">Hoje</option>
                                        <option value="week">Última Semana</option>
                                        <option value="month">Último Mês</option>
                                        <option value="custom">Data Específica</option>
                                    </Form.Select>
                                    {periodFilter === 'custom' && (<Form.Control type="date" size="sm" value={dateFilter} onChange={handleDateChange} style={{ width: 'auto' }} />)}
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <Line data={formatEmotionChartData()} options={lineOptions} />
                            <div className="mt-3">
                                <Form.Select size="sm" value={emotionFilter} onChange={handleEmotionFilterChange} style={{ width: 'auto' }}>
                                    <option value="all">Todas as Emoções</option>
                                    {Object.keys(emotionTranslations).map(key => (<option key={key} value={key}>{emotionTranslations[key]}</option>))}
                                </Form.Select>
                            </div>
                        </Card.Body>
                    </Card>
                    <Card className="mb-4">
                        <Card.Header>Comparação entre Sessões</Card.Header>
                        <Card.Body><Bar data={formatSessionsData()} options={sessionsOptions} /></Card.Body>
                    </Card>
                    <Card className="mb-4">
                        <Card.Header>Insights e Recomendações</Card.Header>
                        <Card.Body>
                            <h5>Padrões Emocionais Detectados</h5>
                            <p>Com base nas emoções detectadas, observamos que a emoção predominante é <strong>{emotion}</strong>. Isso pode indicar o estado emocional atual da pessoa.</p>
                            <h5>Recomendações</h5>
                            <ul>
                                {emotion === 'Feliz' && <li>Continue com atividades que promovem alegria e bem-estar.</li>}
                                {emotion === 'Triste' && <li>Considere atividades que elevam o humor, como música alegre ou exercícios físicos.</li>}
                                {emotion === 'Raiva' && <li>Técnicas de respiração e relaxamento podem ajudar a reduzir sentimentos de raiva.</li>}
                                {emotion === 'Medo' && <li>Exercícios de mindfulness podem ajudar a reduzir a ansiedade e o medo.</li>}
                                <li>Monitore regularmente as emoções para identificar padrões ao longo do tempo.</li>
                                <li>Compare os resultados entre diferentes sessões para avaliar o progresso.</li>
                            </ul>
                            <Alert variant="info"><strong>Lembre-se:</strong> Este detector de emoções é uma ferramenta de apoio. Para avaliações clínicas precisas, consulte sempre um profissional qualificado.</Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Card className="mb-4">
                <Card.Header>Sobre a Detecção de Emoções</Card.Header>
                <Card.Body>
                    <p>Este detector utiliza inteligência artificial para reconhecer expressões faciais e associá-las a sete emoções básicas: felicidade, tristeza, raiva, medo, nojo, surpresa e neutralidade.</p>
                    <p>A tecnologia analisa pontos-chave do rosto (landmarks faciais) e identifica padrões associados a diferentes expressões emocionais. Os dados coletados são apresentados em tempo real e também armazenados para análise de tendências ao longo do tempo.</p>
                    <p><strong>Aplicações:</strong> Esta ferramenta pode ser útil para terapeutas, educadores e cuidadores que trabalham com pessoas autistas, ajudando a identificar estados emocionais que podem não ser verbalizados claramente.</p>
                </Card.Body>
            </Card>
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
