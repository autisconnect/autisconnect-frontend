import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
// Ícones atualizados para refletir as funcionalidades reais
import { FaVideo, FaChartLine, FaChartBar, FaLightbulb, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logo.png';
import '../App.css';

// Importe as novas imagens que você vai criar
import emotionHero from '../assets/emotion-hero.png';
import emotionDetection from '../assets/emotion-detection.png';
import emotionLineChart from '../assets/emotion-line-chart.png';
import emotionBarChart from '../assets/emotion-bar-chart.png';
import emotionInsights from '../assets/emotion-insights.png';

function PresentationEmotionDetector() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleBackToMain = () => navigate('/');
    const handleSignUp = () => navigate('/signup');

    return (
        <div className="presentation-page">
            <Navbar bg="light" variant="light" expand="lg" fixed="top" className="mb-4 service-navbar">
                <Container>
                    <Navbar.Brand><img src={logohori} alt="AutisConnect Logo" className="d-inline-block align-top logo" /></Navbar.Brand>
                    <div className="ms-auto">
                        <Button variant="danger" onClick={handleBackToMain} style={{ backgroundColor: '#e74c3c', borderColor: '#e74c3c' }}>Voltar</Button>
                    </div>
                </Container>
            </Navbar>

                <div 
                    className="hero-section mb-5" 
                    style={{ 
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${emotionHero})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        minHeight: '450px'
                    }}
                >
                <div>
                    <h1 className="display-4 fw-bold mb-3">Monitor de Emoções</h1>
                    <p className="lead mb-4 text-white">
                        Entenda o estado emocional através da análise de expressões faciais por inteligência artificial.
                    </p>
                </div>
            </div>

            <Container fluid className="px-md-5">
                <Row className="mb-5 text-center">
                    <Col>
                        <h2>Como o Monitor de Emoções Funciona</h2>
                        <p className="text-muted">Nossa ferramenta utiliza a câmera para detectar sete emoções básicas (Felicidade, Tristeza, Raiva, etc.), fornecendo dados valiosos para o acompanhamento terapêutico e familiar.</p>
                    </Col>
                </Row>

                <Row className="mb-5">
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaVideo className="text-primary me-3" size={30} /><h4>Detecção em Tempo Real</h4></div>
                                <p>A câmera analisa as expressões faciais ao vivo, identificando a emoção dominante e exibindo-a instantaneamente na tela.</p>
                                <Image src={emotionDetection} fluid rounded className="mt-3 feature-image" alt="Detecção de Emoções" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaChartLine className="text-success me-3" size={30} /><h4>Análise de Tendências</h4></div>
                                <p>Visualize a intensidade das emoções ao longo do tempo em um gráfico de linha. Filtre os dados por dia, semana ou mês para identificar padrões.</p>
                                <Image src={emotionLineChart} fluid rounded className="mt-3 feature-image" alt="Gráfico de Tendências Emocionais" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaChartBar className="text-warning me-3" size={30} /><h4>Distribuição Emocional</h4></div>
                                <p>Um gráfico de barras mostra a frequência de cada emoção detectada durante a sessão, oferecendo uma visão clara dos estados emocionais predominantes.</p>
                                <Image src={emotionBarChart} fluid rounded className="mt-3 feature-image" alt="Distribuição de Emoções" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaLightbulb className="text-info me-3" size={30} /><h4>Insights e Recomendações</h4></div>
                                <p>Com base na emoção predominante, a plataforma oferece sugestões e insights práticos para auxiliar pais e terapeutas nas intervenções.</p>
                                <Image src={emotionInsights} fluid rounded className="mt-3 feature-image" alt="Insights e Recomendações" />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-5">
                    <Col>
                        <Card className="shadow-sm p-4">
                            <div className="d-flex align-items-center">
                                <FaInfoCircle size={40} className="text-info me-4" />
                                <div>
                                    <h4>Ferramenta de Apoio à Comunicação</h4>
                                    <p className="mb-0">
                                        O Monitor de Emoções é uma ferramenta de apoio poderosa, projetada para ajudar a compreender emoções que podem não ser verbalizadas. Para avaliações clínicas precisas, consulte sempre um profissional qualificado.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-5 text-center">
                    <Col>
                        <h3>Compreenda Emoções, Fortaleça Vínculos</h3>
                        <p className="text-muted mb-4">Comece a usar nossa tecnologia de IA para um acompanhamento emocional mais profundo e empático.</p>
                        <Button variant="primary" size="lg" onClick={handleSignUp}>Comece a Usar Agora</Button>
                    </Col>
                </Row>
            </Container>

            <footer className="bg-light py-4 mt-5">
                <Container><p className="mb-0 text-center text-muted">Nrmendfsystems. Todos os direitos reservados.</p></Container>
            </footer>
        </div>
    );
}

export default PresentationEmotionDetector;
