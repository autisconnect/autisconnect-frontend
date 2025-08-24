// src/presentation-dashboard/PresentationServiceCertification.jsx
import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { FaCertificate, FaCheckCircle, FaUsers, FaBuilding, FaLightbulb } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logohoriz.jpg';
import '../App.css';

function PresentationServiceCertification() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleBackToHome = () => navigate('/');
    const handleSignUp = () => navigate('/signup');

    return (
        <div className="certification-page">
        <Navbar bg="light" variant="light" expand="lg" fixed="top" className="mb-4 service-navbar">
            <Container>
            <Navbar.Brand>
                <img src={logohori} alt="AutisConnect Logo" className="d-inline-block align-top logo" />
            </Navbar.Brand>
            <div className="ms-auto">
                <Button variant="danger" onClick={handleBackToHome}
                style={{ backgroundColor: '#007bff', borderColor: '#007bff', boxShadow: '0 6px 8px rgba(107, 97, 97, 0.1)' }}>
                    Voltar
                </Button>
            </div>
            </Container>
        </Navbar>

        <div
            className="hero-section mb-5"
            style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHlv7hDywiV-XzJ9Bu5kXv0RatS_og4kkgkA&s)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#343a40', // Fallback
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white', // Aplica a cor branca a todos os textos dentro da Hero
            textAlign: 'center',
            padding: '20px',
            borderRadius: '10px',
            }}
        >
            <div>
            <h1 className="display-4 fw-bold mb-3">Certificação de Serviços AutisConnect</h1>
            <p className="lead mb-4" style={{ color: 'white' }}>
                Reconhecemos estabelecimentos que oferecem ambientes inclusivos e adequados para pessoas autistas, promovendo acessibilidade e bem-estar.
            </p>
            </div>
        </div>

        <Container fluid className="px-md-5">
            <Row className="mb-5">
            <Col>
                <h2 className="text-center mb-4">Como a Certificação de Serviços Funciona</h2>
                <p className="text-center text-muted mb-5">
                Nosso programa avalia e certifica estabelecimentos que atendem aos padrões de acessibilidade e inclusão para pessoas no espectro autista.
                </p>
            </Col>
            </Row>

            <Row className="mb-5">
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaCertificate className="text-primary me-3" size={30} />
                    <h4>Avaliação de Acessibilidade</h4>
                    </div>
                    <p className="feature-paragraph">
                    Realizamos avaliações detalhadas para garantir que o ambiente seja seguro, acolhedor e adaptado para pessoas autistas.
                    </p>
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTy2wyCVAYszv6VgEsj7XBNzjcP8rYVsJfTDA&s"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Avaliação de acessibilidade"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaCheckCircle className="text-success me-3" size={30} />
                    <h4>Certificação Oficial</h4>
                    </div>
                    <p className="feature-paragraph">
                    Estabelecimentos aprovados recebem um selo de certificação AutisConnect, reconhecido por famílias e comunidades.
                    </p>
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGAq-OiFTSb5VtFyOpWT1U-CbgZOO-_X5ULA&s"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Certificação oficial"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaUsers className="text-warning me-3" size={30} />
                    <h4>Treinamento de Equipe</h4>
                    </div>
                    <p className="feature-paragraph">
                    Oferecemos treinamentos para equipes, capacitando-as a atender pessoas autistas com empatia e competência.
                    </p>
                    <Image
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Treinamento de equipe"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaBuilding className="text-info me-3" size={30} />
                    <h4>Suporte Contínuo</h4>
                    </div>
                    <p className="feature-paragraph">
                    Fornecemos suporte e atualizações regulares para manter os padrões de acessibilidade e inclusão nos estabelecimentos certificados.
                    </p>
                    <Image
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Suporte contínuo"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaLightbulb className="text-primary me-3" size={30} />
                    <h4>Reconhecimento na Comunidade</h4>
                    </div>
                    <p className="feature-paragraph">
                    Estabelecimentos certificados ganham visibilidade na plataforma AutisConnect, atraindo famílias que buscam ambientes inclusivos.
                    </p>
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLa0Vz145pseHVmsuI056beeKv5hWj5mehug&s"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Reconhecimento na comunidade"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            </Row>

            <Row className="mb-5 text-center">
            <Col>
                <h3>Participe do Programa de Certificação</h3>
                <p className="text-muted mb-4">
                Torne seu estabelecimento um espaço inclusivo e receba o selo AutisConnect. Cadastre-se agora!
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

export default PresentationServiceCertification;