import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { FaVideo, FaChartPie, FaHistory, FaUserCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logo.png';
import './App.css';

// Importe as imagens que você vai criar
import stereotypyMain from '../assets/stereotypy-main.png';
import stereotypyDetection from '../assets/stereotypy-detection.png';
import stereotypyLog from '../assets/stereotypy-log.png';
import stereotypyDashboard from '../assets/stereotypy-dashboard.png';
import stereotypyQuantitative from '../assets/stereotypy-quantitative.png';


function PresentationStereotypyMonitor() {
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
                        <Button variant="danger" onClick={handleBackToMain} style={{ backgroundColor: '#1abc9c', borderColor: '#1abc9c' }}>Voltar</Button>
                    </div>
                </Container>
            </Navbar>

            <div 
                className="hero-section mb-5" 
                style={{ 
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${stereotypyMain})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    minHeight: '450px'
                }}
            >
                <div>
                    <h1 className="display-4 fw-bold mb-3">Monitor de Estereotipias</h1>
                    <p className="lead mb-4 text-white">Detecte e quantifique comportamentos repetitivos através da análise de pose por inteligência artificial.</p>
                </div>
            </div>

            <Container fluid className="px-md-5">
                <Row className="mb-5 text-center">
                    <Col>
                        <h2>Como o Monitor de Estereotipias Funciona</h2>
                        <p className="text-muted">Utilizando a câmera, nossa IA identifica padrões de movimento como balançar o corpo ou agitar as mãos, registrando sua frequência e duração.</p>
                    </Col>
                </Row>

                <Row className="mb-5">
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaVideo className="text-primary me-3" size={30} /><h4>Detecção por Vídeo</h4></div>
                                <p>A ferramenta analisa a pose corporal em tempo real para identificar movimentos característicos de estereotipias motoras.</p>
                                <Image src={stereotypyDetection} fluid rounded className="mt-3 feature-image" alt="Detecção por vídeo" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaHistory className="text-success me-3" size={30} /><h4>Log de Duração</h4></div>
                                <p>Cada evento detectado é registrado com seu tipo e duração em segundos, criando um histórico detalhado da sessão.</p>
                                <Image src={stereotypyLog} fluid rounded className="mt-3 feature-image" alt="Log de duração" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaChartPie className="text-warning me-3" size={30} /><h4>Relatórios Visuais</h4></div>
                                <p>Visualize a distribuição dos tipos de estereotipias em gráficos claros, ajudando a identificar os comportamentos mais frequentes.</p>
                                <Image src={stereotypyDashboard} fluid rounded className="mt-3 feature-image" alt="Relatórios visuais" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaUserCheck className="text-info me-3" size={30} /><h4>Apoio Terapêutico</h4></div>
                                <p>Os dados coletados fornecem informações objetivas para terapeutas ocupacionais e comportamentais planejarem intervenções mais eficazes.</p>
                                <Image src={stereotypyQuantitative} fluid rounded className="mt-3 feature-image" alt="Relatórios visuais" />                            
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-5 text-center">
                    <Col>
                        <h3>Entenda os Padrões Comportamentais</h3>
                        <p className="text-muted mb-4">Obtenha dados quantitativos sobre comportamentos repetitivos para um acompanhamento mais preciso.</p>
                        <Button variant="primary" size="lg" onClick={handleSignUp}>Comece a Monitorar</Button>
                    </Col>
                </Row>
            </Container>

            <footer className="bg-light py-4 mt-5">
                <Container><p className="mb-0 text-center text-muted">Nrmendfsystems. Todos os direitos reservados.</p></Container>
            </footer>
        </div>
    );
}

export default PresentationStereotypyMonitor;
