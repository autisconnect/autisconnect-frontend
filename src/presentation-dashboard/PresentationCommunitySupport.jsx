// src/presentation-dashboard/PresentationCommunitySupport.jsx
import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { FaUsers, FaComments, FaHandsHelping, FaShieldAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logohoriz.jpg';
import '../App.css';

function PresentationCommunitySupport() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleBackToHome = () => navigate('/');
    const handleSignUp = () => navigate('/signup');

    return (
        <div className="community-support-page">
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
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1600&q=80)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#343a40',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
            padding: '20px',
            borderRadius: '10px',
            }}
        >
            <div>
            <h1 className="display-4 fw-bold mb-3">Comunidade de Apoio AutisConnect</h1>
            <p className="lead mb-4" style={{ color: 'white' }}>
                Fóruns, grupos e conexões que acolhem famílias, profissionais e cuidadores em uma rede colaborativa de apoio mútuo.
            </p>
            </div>
        </div>

        <Container fluid className="px-md-5">
            <Row className="mb-5">
            <Col>
                <h2 className="text-center mb-4">Fortaleça Laços, Compartilhe Experiências</h2>
                <p className="text-center text-muted mb-5">
                Encontre um espaço seguro para expressar dúvidas, compartilhar vivências e encontrar orientação entre pessoas que entendem sua jornada.
                </p>
            </Col>
            </Row>

            <Row className="mb-5">
            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaUsers className="text-primary me-3" size={30} />
                    <h4>Grupos de Discussão Temáticos</h4>
                    </div>
                    <p className="feature-paragraph">
                    Participe de grupos focados em temas como educação, alimentação, terapias, inclusão e outros, moderados por profissionais.
                    </p>
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQM2cUCbLs9IptISthFBeiK-CjjR0tftuNcHA&s"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Grupos de Discussão"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>

            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaComments className="text-success me-3" size={30} />
                    <h4>Fóruns Abertos 24/7</h4>
                    </div>
                    <p className="feature-paragraph">
                    Tire dúvidas, compartilhe histórias e ajude outras famílias com sua experiência em um ambiente empático e sempre ativo.
                    </p>
                    <Image
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Fóruns de Discussão"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>

            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaHandsHelping className="text-warning me-3" size={30} />
                    <h4>Rede de Apoio Mútua</h4>
                    </div>
                    <p className="feature-paragraph">
                    Crie conexões com outras famílias para oferecer e receber ajuda emocional, trocar dicas práticas e construir amizades duradouras.
                    </p>
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfpJvSEhcyjgjgHJ7FbTA5aAdqksyE7KFWTg&s"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Rede de Apoio"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>

            <Col md={6} className="mb-4">
                <Card className="shadow-sm h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                    <FaShieldAlt className="text-info me-3" size={30} />
                    <h4>Ambiente Moderado e Seguro</h4>
                    </div>
                    <p className="feature-paragraph">
                    Garantimos um espaço respeitoso com moderação ativa, para proteger usuários contra desinformação, julgamentos ou agressões.
                    </p>
                    <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMNkjTkuRfCD7cFD8xEn4UZxdKoAJPads7cA&s"
                    fluid
                    rounded
                    className="mt-3 feature-image"
                    alt="Ambiente Seguro"
                    style={{ backgroundColor: '#e9ecef' }}
                    />
                </Card.Body>
                </Card>
            </Col>
            </Row>

            <Row className="mb-5 text-center">
            <Col>
                <h3>Experimente a Comunidade de Apoio</h3>
                <p className="text-muted mb-4">
                Encontre apoio em fóruns e grupos de discussão: você não está sozinho nessa jornada.
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

export default PresentationCommunitySupport;
