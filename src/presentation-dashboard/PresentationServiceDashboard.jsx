import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaListAlt, FaCalendarCheck, FaComments, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logohoriz copy.jpg';
import '../app.css';

// --- Leaflet Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function PresentationServiceDashboard() {
    const navigate = useNavigate();

    // --- Scroll to Top on Page Load ---
    useEffect(() => {
        window.scrollTo(0, 0); // Rola para o topo da página ao carregar
    }, []);

    // --- Handlers ---
    const handleBackToMain = () => {
        navigate('/'); // Redireciona para a página inicial (Home.jsx)
    };

    const handleSignUp = () => {
        navigate('/signup'); // Redireciona para a página de signup
    };

    return (
        <div className="service-dashboard-page">
            {/* Navbar */}
            <Navbar bg="light" variant="light" expand="lg" fixed="top" className="mb-4 service-navbar">
                <Container>
                    <Navbar.Brand>
                        <img
                            src={logohori}
                            alt="Autisconnect Logo"
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
            <div className="hero-section mb-5" style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80)`,
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
            }}>
                <div>
                    <h1 className="display-4 fw-bold mb-3">Bem-vindo à Autisconnect</h1>
                    <p className="lead mb-4 text-white">
                        Una-se a uma plataforma que amplia a visibilidade dos seus serviços inclusivos, conectando-os a clientes que valorizam acessibilidade e qualidade.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <Container fluid className="px-md-5">
                <Row className="mb-5">
                    <Col>
                        <h2 className="text-center mb-4">O que a Autisconnect oferece aos seus serviços</h2>
                        <p className="text-center text-muted mb-5">
                            Nossa plataforma foi projetada para ajudar serviços inclusivos, como clínicas, restaurantes e espaços terapêuticos, a promoverem suas plataformas com eficiência.
                        </p>
                    </Col>
                </Row>

                {/* Funcionalidades */}
                <Row className="mb-5">
                    <Col md={6} className="mb-4">
                        <Card className="card h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <FaListAlt className="text-primary me-3" size={30} />
                                    <h4>Visão Geral</h4>
                                </div>
                                <p className="feature-paragraph">
                                    Apresente seu serviço com uma vitrine completa: exiba nome, segmento, descrição detalhada, horários, menu ou serviços oferecidos, certificados de inclusão e contatos. Inclua um mapa interativo para destacar sua localização e atrair clientes com facilidade.
                                </p>
                                <Image
                                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    fluid
                                    rounded
                                    className="mt-3 feature-image"
                                    alt="Visão geral do serviço"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="card h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <FaCalendarCheck className="text-success me-3" size={30} />
                                    <h4>Gestão de Reservas</h4>
                                </div>
                                <p className="feature-paragraph">
                                    Simplifique a gestão de agendamentos com um sistema intuitivo. Permita que clientes reservem horários diretamente na plataforma, gerencie reservas ativas e receba notificações de cancelamentos, otimizando sua operação e melhorando a experiência do cliente.
                                </p>
                                <Image
                                    src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    fluid
                                    rounded
                                    className="mt-3 feature-image"
                                    alt="Sistema de reservas"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="card h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <FaComments className="text-warning me-3" size={30} />
                                    <h4>Avaliações</h4>
                                </div>
                                <p className="feature-paragraph">
                                    Construa credibilidade exibindo avaliações de clientes. Mostre a média de notas e comentários positivos para atrair novos clientes, e use o feedback para aprimorar seus serviços, fortalecendo sua reputação na comunidade.
                                </p>
                                <Image
                                    src="https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    fluid
                                    rounded
                                    className="mt-3 feature-image"
                                    alt="Avaliações de usuários"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="card h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <FaMapMarkerAlt className="text-info me-3" size={30} />
                                    <h4>Design e Navegação</h4>
                                </div>
                                <p className="feature-paragraph">
                                    Destaque seu serviço em uma plataforma moderna e responsiva, com design acessível para todos os dispositivos. A interface intuitiva e mapas interativos garantem que clientes encontrem e conheçam seus serviços rapidamente, aumentando seu alcance.
                                </p>
                                <Image
                                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                    fluid
                                    rounded
                                    className="mt-3 feature-image"
                                    alt="Design da plataforma"
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Mapa de Exemplo */}
                <Row className="mb-5">
                    <Col>
                        <h3 className="text-center mb-4">Mostre sua Localização com Facilidade</h3>
                        <Card className="shadow-sm" style={{ height: '400px' }}>
                            <MapContainer
                                center={[-8.047562, -34.877]} // Coordenadas de exemplo (Recife, PE)
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <Marker position={[-8.047562, -34.877]}>
                                    <Popup>Exemplo: Clínica Bem-Estar</Popup>
                                </Marker>
                            </MapContainer>
                        </Card>
                    </Col>
                </Row>

                {/* Chamada para Ação */}
                <Row className="mb-5 text-center">
                    <Col>
                        <h3>Junte-se à Autisconnect</h3>
                        <p className="text-muted mb-4">
                            Amplie a visibilidade do seu serviço e conecte-se com clientes que buscam experiências inclusivas. Cadastre-se agora e comece a destacar seu negócio!
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

export default PresentationServiceDashboard;