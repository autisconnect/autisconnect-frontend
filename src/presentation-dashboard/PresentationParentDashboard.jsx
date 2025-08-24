// src/PresentationParentDashboard.jsx
import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { FaCalendar, FaComments, FaGamepad, FaHeartbeat, FaStore, FaUserMd } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logohoriz.jpg'; // Ajuste o caminho
import '../app.css';

function PresentationParentDashboard() {
    const navigate = useNavigate();

    // Scroll to top na carga da página
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleBackToMain = () => {
        navigate('/'); // Redireciona para Home.jsx
    };

    const handleSignUp = () => {
        navigate('/signup'); // Redireciona para signup
    };

    return (
        <div className="parent-dashboard-page">
            {/* Navbar */}
            <Navbar bg="light" variant="light" expand="lg" fixed="top" className="mb-4 service-navbar">
                <Container>
                    <Navbar.Brand>
                        <img
                            src={logohori}
                            alt="AutisConnect Logo"
                            className="d-inline-block align-top logo"
                        />
                    </Navbar.Brand>
                    <div className="ms-auto">
                        <Button variant="danger" onClick={handleBackToMain}
                        style={{ backgroundColor: '#007bff', borderColor: '#007bff', boxShadow: '0 6px 8px rgba(107, 97, 97, 0.1)' }}>
                            Voltar
                        </Button>
                    </div>
                </Container>
            </Navbar>

            {/* Hero Section */}
            <div
                className="hero-section mb-5"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textAlign: 'center',
                    padding: '30px',
                    borderRadius: '10px',
                }}
            >
                <div>
                    <h1 className="display-4 fw-bold mb-3">AutisConnect para Pais e Responsáveis</h1>
                    <p className="lead mb-4 text-white">
                        Monitore o progresso de sua criança, agende consultas, conecte-se com médicos e acesse serviços inclusivos com facilidade.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <Container fluid className="px-md-5">
                <Row className="mb-5">
                    <Col>
                        <h2 className="text-center mb-4">O que a AutisConnect oferece para você</h2>
                        <p className="text-center text-muted mb-5">
                            Nossa plataforma foi projetada para ajudar pais e responsáveis a gerenciar cuidados, acessar recursos educativos e conectar-se com a comunidade.
                        </p>
                    </Col>
                </Row>

                {/* Funcionalidades */}
                <Row className="mb-5">
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <FaCalendar className="text-primary me-3" size={30} />
                                    <h4>Marcação de Consultas</h4>
                                </div>
                                <p className="feature-paragraph">
                                    Agende consultas com médicos e terapeutas de forma simples, com lembretes automáticos e histórico organizado.
                                </p>
                                <Image
                                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    fluid
                                    rounded
                                    className="mt-3 feature-image"
                                    alt="Marcação de consultas"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <FaComments className="text-success me-3" size={30} />
                                    <h4>Comunicação com Médicos</h4>
                                </div>
                                <p className="feature-paragraph">
                                    Envie mensagens e participe de videochamadas com profissionais para acompanhar o progresso da sua criança.
                                </p>
                                <Image
                                    src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    fluid
                                    rounded
                                    className="mt-3 feature-image"
                                    alt="Comunicação com médicos"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <FaGamepad className="text-warning me-3" size={30} />
                                    <h4>Jogos Interativos</h4>
                                </div>
                                <p className="feature-paragraph">
                                    Acesse jogos educativos que estimulam o desenvolvimento cognitivo e sensorial da sua criança.
                                </p>
                                <Image
                                    src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    fluid
                                    rounded
                                    className="mt-3 feature-image"
                                    alt="Jogos interativos"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <FaHeartbeat className="text-info me-3" size={30} />
                                    <h4>Monitoramento Avançado</h4>
                                </div>
                                <p className="feature-paragraph">
                                    Utilize ferramentas como monitoramento emocional, detecção de padrões repetitivos e gravação de gatilhos para acompanhar a saúde da sua criança.
                                </p>
                                <Image
                                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    fluid
                                    rounded
                                    className="mt-3 feature-image"
                                    alt="Monitoramento avançado"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <FaStore className="text-primary me-3" size={30} />
                                    <h4>Serviços Inclusivos</h4>
                                </div>
                                <p className="feature-paragraph">
                                    Encontre serviços locais adaptados, como restaurantes e salões, com filtros por segmento e avaliações de outros pais.
                                </p>
                                <Image
                                    src="https://images.unsplash.com/photo-1556740714-a8395b3bf30f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    fluid
                                    rounded
                                    className="mt-3 feature-image"
                                    alt="Serviços inclusivos"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <FaUserMd className="text-success me-3" size={30} />
                                    <h4>Histórico de Consultas</h4>
                                </div>
                                <p className="feature-paragraph">
                                    Acesse um histórico completo de consultas, prescrições e feedbacks médicos em um só lugar.
                                </p>
                                <Image
                                    src="https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    fluid
                                    rounded
                                    className="mt-3 feature-image"
                                    alt="Histórico de consultas"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Chamada para Ação */}
                <Row className="mb-5 text-center">
                    <Col>
                        <h3>Junte-se à AutisConnect</h3>
                        <p className="text-muted mb-4">
                            Comece a gerenciar o cuidado da sua criança com ferramentas simples e eficazes. Cadastre-se agora!
                        </p>
                        <Button variant="primary" size="lg" onClick={handleSignUp}>
                            Comece Agora
                        </Button>
                    </Col>
                </Row>
            </Container>

            {/* Footer */}
                <footer className="bg-light py-4 mt-5">
                    <Container>
                        <Row>
                            <Col className="text-center">
                                <p className="mb-0 text-muted">© 2025 Autisconnect. Todos os direitos reservados.</p>
                            </Col>
                        </Row>
                    </Container>
                </footer>
        </div>
    );
}

export default PresentationParentDashboard;