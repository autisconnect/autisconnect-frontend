import React, { useState, useEffect, useMemo } from 'react';
import { Container, Navbar, Card, Table, ListGroup, Nav, Tab, Row, Col, Button, Modal, Form, Image, Alert, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt, FaPhone, FaWhatsapp, FaFacebook, FaInstagram, FaClock, FaListAlt, FaCertificate, FaUsers, FaComments, FaCalendarCheck, FaStar, FaStarHalfAlt, FaRegStar, FaArrowLeft } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import logohori from '../assets/logonovo.png';
import espacoTerapeutico from '../assets/18.jpg';

// --- Leaflet Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- AutisConnect Color Palette ---
const autisConnectColors = {
    primary: '#003D7A',      // Azul Escuro
    secondary: '#DC143C',    // Vermelho/Crimson
    accent: '#FFD700',       // Amarelo/Ouro
    light: '#F8F9FA',        // Cinza muito claro
    white: '#FFFFFF',
    text: '#003D7A',
    textMuted: '#6C757D',
    border: '#E9ECEF',
    success: '#28A745',
    warning: '#FFC107',
    danger: '#DC3545',
};

// --- Custom Styles ---
const customStyles = `
    :root {
        --autisconnect-primary: ${autisConnectColors.primary};
        --autisconnect-secondary: ${autisConnectColors.secondary};
        --autisconnect-accent: ${autisConnectColors.accent};
        --autisconnect-light: ${autisConnectColors.light};
    }

    .autisconnect-navbar {
        background: linear-gradient(135deg, ${autisConnectColors.primary} 0%, #004a96 100%) !important;
        box-shadow: 0 2px 8px rgba(0, 61, 122, 0.15);
        border-bottom: 3px solid ${autisConnectColors.accent};
    }

    .autisconnect-navbar .navbar-brand {
        font-weight: 700;
        color: ${autisConnectColors.white} !important;
    }

    .autisconnect-navbar .btn-outline-light {
        border-color: ${autisConnectColors.white};
        color: ${autisConnectColors.white};
    }

    .autisconnect-navbar .btn-outline-light:hover {
        background-color: ${autisConnectColors.accent};
        border-color: ${autisConnectColors.accent};
        color: ${autisConnectColors.primary};
    }

    .autisconnect-hero {
        background-size: cover;
        background-position: center;
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 61, 122, 0.1);
    }

    .autisconnect-hero-overlay {
        background: linear-gradient(135deg, rgba(0, 61, 122, 0.85) 0%, rgba(220, 20, 60, 0.75) 100%);
        backdrop-filter: blur(4px);
        border-radius: 12px;
    }

    .autisconnect-hero h1 {
        color: ${autisConnectColors.white};
        font-weight: 800;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        letter-spacing: -0.5px;
    }

    .autisconnect-hero p {
        color: rgba(255, 255, 255, 0.95);
        font-size: 1.1rem;
        line-height: 1.6;
    }

    .autisconnect-card {
        border: none;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 61, 122, 0.08);
        transition: all 0.3s ease;
        overflow: hidden;
    }

    .autisconnect-card:hover {
        box-shadow: 0 4px 16px rgba(0, 61, 122, 0.15);
        transform: translateY(-2px);
    }

    .autisconnect-card-header {
        background: linear-gradient(135deg, ${autisConnectColors.primary} 0%, #004a96 100%);
        color: ${autisConnectColors.white};
        border: none;
        font-weight: 600;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .autisconnect-card-header svg {
        color: ${autisConnectColors.accent};
    }

    .autisconnect-nav-pills .nav-link {
        color: ${autisConnectColors.text};
        border-radius: 8px;
        transition: all 0.3s ease;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }

    .autisconnect-nav-pills .nav-link:hover {
        background-color: ${autisConnectColors.light};
        color: ${autisConnectColors.primary};
    }

    .autisconnect-nav-pills .nav-link.active {
        background: linear-gradient(135deg, ${autisConnectColors.primary} 0%, #004a96 100%);
        color: ${autisConnectColors.white};
        box-shadow: 0 2px 8px rgba(0, 61, 122, 0.2);
    }

    .autisconnect-btn-primary {
        background: linear-gradient(135deg, ${autisConnectColors.primary} 0%, #004a96 100%);
        border: none;
        color: ${autisConnectColors.white};
        font-weight: 600;
        border-radius: 8px;
        transition: all 0.3s ease;
        padding: 0.75rem 1.5rem;
    }

    .autisconnect-btn-primary:hover {
        background: linear-gradient(135deg, #004a96 0%, ${autisConnectColors.primary} 100%);
        color: ${autisConnectColors.white};
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 61, 122, 0.3);
    }

    .autisconnect-btn-secondary {
        background-color: ${autisConnectColors.secondary};
        border: none;
        color: ${autisConnectColors.white};
        font-weight: 600;
        border-radius: 8px;
        transition: all 0.3s ease;
    }

    .autisconnect-btn-secondary:hover {
        background-color: #b30a2c;
        color: ${autisConnectColors.white};
        transform: translateY(-2px);
    }

    .autisconnect-badge {
        background-color: ${autisConnectColors.accent};
        color: ${autisConnectColors.primary};
        font-weight: 600;
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
    }

    .autisconnect-badge-secondary {
        background-color: ${autisConnectColors.secondary};
        color: ${autisConnectColors.white};
    }

    .autisconnect-list-group-item {
        border: 1px solid ${autisConnectColors.border};
        border-radius: 8px;
        margin-bottom: 0.5rem;
        transition: all 0.3s ease;
    }

    .autisconnect-list-group-item:hover {
        background-color: ${autisConnectColors.light};
        border-color: ${autisConnectColors.primary};
    }

    .autisconnect-feedback-item {
        border-left: 4px solid ${autisConnectColors.accent};
        padding: 1rem;
        border-radius: 8px;
        background-color: ${autisConnectColors.light};
        margin-bottom: 1rem;
    }

    .autisconnect-rating-avg {
        color: ${autisConnectColors.primary};
        font-weight: 800;
    }

    .autisconnect-modal-header {
        background: linear-gradient(135deg, ${autisConnectColors.primary} 0%, #004a96 100%);
        color: ${autisConnectColors.white};
        border: none;
    }

    .autisconnect-modal-header .btn-close {
        filter: brightness(0) invert(1);
    }

    .autisconnect-form-label {
        color: ${autisConnectColors.primary};
        font-weight: 600;
    }

    .autisconnect-form-control {
        border: 2px solid ${autisConnectColors.border};
        border-radius: 8px;
        transition: all 0.3s ease;
    }

    .autisconnect-form-control:focus {
        border-color: ${autisConnectColors.primary};
        box-shadow: 0 0 0 0.2rem rgba(0, 61, 122, 0.15);
    }

    .autisconnect-alert-success {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        border-radius: 8px;
    }

    .autisconnect-alert-danger {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        border-radius: 8px;
    }

    .autisconnect-link {
        color: ${autisConnectColors.secondary};
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .autisconnect-link:hover {
        color: #b30a2c;
        text-decoration: underline;
    }

    .autisconnect-divider {
        border-top: 2px solid ${autisConnectColors.accent};
        margin: 1.5rem 0;
    }

    .autisconnect-tab-content {
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .autisconnect-map-container {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 61, 122, 0.1);
    }
`;

// --- Star Rating Display Component ---
const StarRating = ({ rating }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
        stars.push(<FaStar key={`full-${i}`} style={{ color: autisConnectColors.accent }} />);
    }
    if (halfStar) {
        stars.push(<FaStarHalfAlt key="half" style={{ color: autisConnectColors.accent }} />);
    }
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<FaRegStar key={`empty-${i}`} style={{ color: autisConnectColors.textMuted }} />);
    }
    return <span className="ms-1">{stars}</span>;
};

// --- Mock Data ---
const mockServiceData = {
    18: {
        id: 18,
        mainPhoto: espacoTerapeutico,
        name: 'Acolher Espaço Terapêutico',
        segment: 'Terapeuta Ocupacional',
        description: 'Um ambiente cuidadosamente projetado para promover o desenvolvimento, a autonomia e o bem-estar de indivíduos com TEA',
        hours: 'Seg-Sex: 07:00-20:00',
        menuServices: [
            { id: 1, name: 'Café da Manhã Inclusivo', description: 'Opções variadas com texturas e sabores suaves.' },
            { id: 2, name: 'Almoço Sensorial', description: 'Pratos balanceados com apresentação cuidadosa.' },
        ],
        certificates: [
            { id: 1, name: 'Certificado de Inclusão Autisconnect 2024' },
            { id: 2, name: 'Selo Ambiente Amigo do Autista' },
        ],
        address: 'Rua Melo Peixoto, 288, Sala 05, Ceorga, Garanhuns, PE',
        coordinates: [-8.89343, -36.495928],
        contact: {
            phone: '(87) 99971-0062',
            whatsapp: '(87) 99971-0062',
            socialMedia: {
                instagram: 'https://instagram.com/acolher.espaco_terapeutico',
            },
        },
        feedbacks: [
            { id: 1, rating: 5, comment: 'Excelente atendimento, ambiente muito calmo e adaptado. Meu filho adorou!', date: '2025-06-10' },
            { id: 2, rating: 4, comment: 'Gostamos muito, apenas o som ambiente estava um pouco alto no início.', date: '2025-06-08' },
            { id: 3, rating: 4.5, comment: 'Recomendo!', date: '2025-05-28' },
        ],
        reservations: [
            { id: 1, date: '2025-06-15', time: '09:00', status: 'Confirmada' },
            { id: 2, date: '2025-06-20', time: '14:00', status: 'Pendente' },
            { id: 3, date: '2025-06-22', time: '11:00', status: 'Cancelada' },
        ]
    },
};

// --- Component ---
function ServiceDashboard18() {
    const { id: serviceId } = useParams();
    const id = serviceId || '18';

    const [serviceData, setServiceData] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('visao-geral');
    const [mapInstance, setMapInstance] = useState(null);

    const [showReservationModal, setShowReservationModal] = useState(false);
    const [reservationDate, setReservationDate] = useState('');
    const [reservationTime, setReservationTime] = useState('');
    const [reservationSuccess, setReservationSuccess] = useState(null);
    const [reservationError, setReservationError] = useState(null);

    // --- Effects ---
    useEffect(() => {
        const dataToUse = mockServiceData[id];
        if (dataToUse) {
            setServiceData(dataToUse);
        } else {
            setError('Serviço não encontrado.');
        }
    }, [id]);

    useEffect(() => {
        if (mapInstance && serviceData?.coordinates) {
            mapInstance.flyTo(serviceData.coordinates, 15);
        }
    }, [serviceData?.coordinates, mapInstance]);

    // --- Handlers ---
    const handleCloseTab = () => {
        window.close();
    };

    const handleShowReservationModal = () => {
        setReservationDate('');
        setReservationTime('');
        setReservationSuccess(null);
        setReservationError(null);
        setShowReservationModal(true);
    };

    const handleCloseReservationModal = () => {
        setShowReservationModal(false);
    };

    const handleMakeReservation = () => {
        if (!reservationDate || !reservationTime) {
            setReservationError('Por favor, selecione a data e a hora desejadas.');
            return;
        }
        console.log(`Solicitando reserva para ${reservationDate} às ${reservationTime}`);
        const newReservation = {
            id: Date.now(),
            date: reservationDate,
            time: reservationTime,
            status: 'Pendente'
        };
        setServiceData(prevData => ({
            ...prevData,
            reservations: [...(prevData.reservations || []), newReservation]
        }));
        setReservationSuccess(`Solicitação de reserva para ${reservationDate} às ${reservationTime} enviada! Aguarde a confirmação.`);
        setReservationError(null);
    };

    const averageRating = useMemo(() => {
        if (!serviceData?.feedbacks || serviceData.feedbacks.length === 0) return 0;
        const totalRating = serviceData.feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
        return (totalRating / serviceData.feedbacks.length).toFixed(1);
    }, [serviceData?.feedbacks]);

    // --- Render Logic ---
    if (error) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Alert className="autisconnect-alert-danger">{error}</Alert>
            </Container>
        );
    }

    if (!serviceData) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div style={{ color: autisConnectColors.primary, fontWeight: 600 }}>Carregando informações do serviço...</div>
            </Container>
        );
    }

    return (
        <div className="app" style={{ backgroundColor: autisConnectColors.light, minHeight: '100vh' }}>
            <style>{customStyles}</style>

            {/* Navbar */}
            <Navbar expand="lg" sticky="top" className="autisconnect-navbar mb-4">
                <Container fluid>
                    <Navbar.Brand href="/" className="fw-bold">
                        <img src={logohori} alt="Autisconnect Logo" className="d-inline-block align-top" style={{ height: '40px', marginRight: '10px' }} />
                    </Navbar.Brand>
                    <span className="navbar-text mx-auto d-none d-lg-block" style={{ color: autisConnectColors.white, fontWeight: 600 }}>
                        {serviceData.name}
                    </span>
                    <Button 
                        className="autisconnect-btn-primary d-flex align-items-center gap-2"
                        size="sm" 
                        onClick={handleCloseTab}
                    >
                        <FaArrowLeft /> Voltar
                    </Button>
                </Container>
            </Navbar>

            {/* Main Content Area */}
            <Container fluid className="px-3 px-md-4 pb-5">
                {/* Hero Section */}
                <Row className="autisconnect-hero mb-4 align-items-center" style={{ backgroundImage: `url(${serviceData.mainPhoto})` }}>
                    <Col className="autisconnect-hero-overlay p-4 p-md-5 text-white">
                        <h1 className="display-4 fw-bold mb-3">{serviceData.name}</h1>
                        <p className="lead mb-2" style={{ fontSize: '1.3rem', fontWeight: 600 }}>{serviceData.segment}</p>
                        <p className="mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>{serviceData.description || 'Descrição do serviço não disponível.'}</p>
                    </Col>
                </Row>

                {/* Tab Navigation & Content */}
                <Tab.Container id="service-dashboard-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <Row className="g-4">
                        {/* Sidebar Navigation */}
                        <Col lg={3} className="mb-3 mb-lg-0">
                            <Nav variant="pills" className="flex-column autisconnect-nav-pills p-4 bg-white rounded-3" style={{ boxShadow: '0 2px 8px rgba(0, 61, 122, 0.08)' }}>
                                <Nav.Item className="mb-2">
                                    <Nav.Link eventKey="visao-geral" className="d-flex align-items-center gap-2">
                                        <FaUsers style={{ color: autisConnectColors.accent }} /> Visão Geral
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item className="mb-3">
                                    <Nav.Link eventKey="feedback" className="d-flex align-items-center gap-2">
                                        <FaComments style={{ color: autisConnectColors.accent }} /> Avaliações
                                    </Nav.Link>
                                </Nav.Item>
                                <div className="autisconnect-divider"></div>
                                <Nav.Item>
                                    <Button 
                                        className="autisconnect-btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                                        onClick={handleShowReservationModal}
                                    >
                                        <FaCalendarCheck /> Solicitar Atendimento
                                    </Button>
                                </Nav.Item>
                            </Nav>
                        </Col>

                        {/* Tab Content Area */}
                        <Col lg={9}>
                            <Tab.Content className="autisconnect-tab-content">
                                {/* Visão Geral Tab */}
                                <Tab.Pane eventKey="visao-geral">
                                    <Row className="g-4">
                                        {/* Left Column: Details */}
                                        <Col md={7}>
                                            {/* Horário */}
                                            <Card className="autisconnect-card mb-4">
                                                <Card.Header className="autisconnect-card-header">
                                                    <FaClock /> Horário de Funcionamento
                                                </Card.Header>
                                                <Card.Body style={{ padding: '1.5rem' }}>
                                                    <p style={{ fontSize: '1.1rem', color: autisConnectColors.primary, fontWeight: 600, margin: 0 }}>
                                                        {serviceData.hours}
                                                    </p>
                                                </Card.Body>
                                            </Card>

                                            {/* Serviços */}
                                            <Card className="autisconnect-card mb-4">
                                                <Card.Header className="autisconnect-card-header">
                                                    <FaListAlt /> Serviços Oferecidos
                                                </Card.Header>
                                                <ListGroup variant="flush">
                                                    {serviceData.menuServices?.length > 0 ? serviceData.menuServices.map((service) => (
                                                        <ListGroup.Item key={service.id} className="autisconnect-list-group-item" style={{ border: 'none', padding: '1rem' }}>
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div className="flex-grow-1">
                                                                    <div className="fw-bold" style={{ color: autisConnectColors.primary, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                                                                        {service.name}
                                                                    </div>
                                                                    <p style={{ color: autisConnectColors.textMuted, margin: 0, fontSize: '0.95rem' }}>
                                                                        {service.description}
                                                                    </p>
                                                                </div>
                                                                {service.price && (
                                                                    <Badge className="autisconnect-badge ms-2">{service.price}</Badge>
                                                                )}
                                                            </div>
                                                        </ListGroup.Item>
                                                    )) : (
                                                        <ListGroup.Item style={{ padding: '1rem', color: autisConnectColors.textMuted }}>
                                                            Nenhum serviço cadastrado.
                                                        </ListGroup.Item>
                                                    )}
                                                </ListGroup>
                                            </Card>

                                            {/* Certificados */}
                                            <Card className="autisconnect-card">
                                                <Card.Header className="autisconnect-card-header">
                                                    <FaCertificate /> Certificações e Selos
                                                </Card.Header>
                                                <ListGroup variant="flush">
                                                    {serviceData.certificates?.length > 0 ? serviceData.certificates.map((cert) => (
                                                        <ListGroup.Item key={cert.id} style={{ padding: '1rem', borderBottom: `1px solid ${autisConnectColors.border}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ color: autisConnectColors.accent, fontSize: '1.2rem' }}>✓</span>
                                                            <span style={{ color: autisConnectColors.primary, fontWeight: 500 }}>{cert.name}</span>
                                                        </ListGroup.Item>
                                                    )) : (
                                                        <ListGroup.Item style={{ padding: '1rem', color: autisConnectColors.textMuted }}>
                                                            Nenhum certificado cadastrado.
                                                        </ListGroup.Item>
                                                    )}
                                                </ListGroup>
                                            </Card>
                                        </Col>

                                        {/* Right Column: Map & Contact */}
                                        <Col md={5}>
                                            {/* Mapa */}
                                            <Card className="autisconnect-card mb-4" style={{ height: '350px' }}>
                                                <Card.Header className="autisconnect-card-header">
                                                    <FaMapMarkerAlt /> Localização
                                                </Card.Header>
                                                <div className="autisconnect-map-container" style={{ height: '100%', width: '100%' }}>
                                                    <MapContainer center={serviceData.coordinates || [-8.047562, -34.877]} zoom={15} style={{ height: '100%', width: '100%' }} whenCreated={setMapInstance}>
                                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                                        {serviceData.coordinates && <Marker position={serviceData.coordinates}><Popup>{serviceData.name}</Popup></Marker>}
                                                    </MapContainer>
                                                </div>
                                            </Card>

                                            {/* Contato */}
                                            <Card className="autisconnect-card">
                                                <Card.Header className="autisconnect-card-header">
                                                    <FaPhone /> Contato
                                                </Card.Header>
                                                <ListGroup variant="flush">
                                                    <ListGroup.Item style={{ padding: '1rem', borderBottom: `1px solid ${autisConnectColors.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <FaPhone style={{ color: autisConnectColors.primary }} />
                                                        <span style={{ color: autisConnectColors.text, fontWeight: 500 }}>
                                                            {serviceData.contact?.phone || 'Não informado'}
                                                        </span>
                                                    </ListGroup.Item>
                                                    {serviceData.contact?.whatsapp && (
                                                        <ListGroup.Item style={{ padding: '1rem', borderBottom: `1px solid ${autisConnectColors.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <FaWhatsapp style={{ color: '#25D366' }} />
                                                            <a href={`https://wa.me/${serviceData.contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="autisconnect-link">
                                                                {serviceData.contact.whatsapp}
                                                            </a>
                                                        </ListGroup.Item>
                                                    )}
                                                    {serviceData.contact?.socialMedia?.instagram && (
                                                        <ListGroup.Item style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <FaInstagram style={{ color: '#E4405F' }} />
                                                            <a href={serviceData.contact.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="autisconnect-link">
                                                                Instagram
                                                            </a>
                                                        </ListGroup.Item>
                                                    )}
                                                </ListGroup>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab.Pane>

                                {/* Avaliações Tab */}
                                <Tab.Pane eventKey="feedback">
                                    <h3 className="mb-4" style={{ color: autisConnectColors.primary, fontWeight: 700 }}>
                                        Avaliações do Estabelecimento
                                    </h3>

                                    {/* Avaliação Média */}
                                    <Card className="autisconnect-card mb-4">
                                        <Card.Header className="autisconnect-card-header">
                                            Avaliação Média
                                        </Card.Header>
                                        <Card.Body style={{ padding: '2rem', textAlign: 'center' }}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <span className="autisconnect-rating-avg" style={{ fontSize: '3rem', marginRight: '1rem' }}>
                                                    {averageRating}
                                                </span>
                                                <StarRating rating={parseFloat(averageRating)} />
                                            </div>
                                            <p style={{ color: autisConnectColors.textMuted, margin: 0, fontSize: '0.95rem' }}>
                                                Baseado em {serviceData.feedbacks?.length || 0} avaliações
                                            </p>
                                        </Card.Body>
                                    </Card>

                                    {/* Comentários */}
                                    <Card className="autisconnect-card">
                                        <Card.Header className="autisconnect-card-header">
                                            Comentários de Usuários
                                        </Card.Header>
                                        <Card.Body style={{ padding: '1.5rem' }}>
                                            {serviceData.feedbacks && serviceData.feedbacks.length > 0 ? (
                                                serviceData.feedbacks.map((fb) => (
                                                    <div key={fb.id} className="autisconnect-feedback-item">
                                                        <div className="d-flex w-100 justify-content-between align-items-center mb-2">
                                                            <StarRating rating={fb.rating} />
                                                            <small style={{ color: autisConnectColors.textMuted, fontWeight: 500 }}>
                                                                {new Date(fb.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                            </small>
                                                        </div>
                                                        <p style={{ color: autisConnectColors.text, margin: 0, lineHeight: 1.6 }}>
                                                            {fb.comment}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ color: autisConnectColors.textMuted, textAlign: 'center', padding: '2rem 0' }}>
                                                    Nenhum feedback recebido ainda.
                                                </p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </Container>

            {/* Reservation Modal */}
            <Modal show={showReservationModal} onHide={handleCloseReservationModal} centered>
                <Modal.Header className="autisconnect-modal-header">
                    <Modal.Title style={{ fontWeight: 700 }}>
                        Solicitar Atendimento
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '2rem' }}>
                    {reservationSuccess && (
                        <Alert className="autisconnect-alert-success" style={{ marginBottom: '1rem' }}>
                            {reservationSuccess}
                        </Alert>
                    )}
                    {reservationError && (
                        <Alert className="autisconnect-alert-danger" style={{ marginBottom: '1rem' }}>
                            {reservationError}
                        </Alert>
                    )}
                    {!reservationSuccess && (
                        <Form>
                            <Form.Group className="mb-3" controlId="reservationDate">
                                <Form.Label className="autisconnect-form-label">Data Desejada</Form.Label>
                                <Form.Control 
                                    type="date" 
                                    className="autisconnect-form-control"
                                    value={reservationDate} 
                                    onChange={(e) => setReservationDate(e.target.value)} 
                                    min={new Date().toISOString().split('T')[0]} 
                                    required 
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="reservationTime">
                                <Form.Label className="autisconnect-form-label">Hora Desejada</Form.Label>
                                <Form.Control 
                                    type="time" 
                                    className="autisconnect-form-control"
                                    value={reservationTime} 
                                    onChange={(e) => setReservationTime(e.target.value)} 
                                    required 
                                />
                            </Form.Group>
                            <p style={{ color: autisConnectColors.textMuted, fontSize: '0.9rem', marginBottom: 0 }}>
                                Sua solicitação será enviada ao estabelecimento para confirmação.
                            </p>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ padding: '1.5rem', borderTop: `1px solid ${autisConnectColors.border}` }}>
                    <Button 
                        className="autisconnect-btn-secondary"
                        onClick={handleCloseReservationModal}
                    >
                        Fechar
                    </Button>
                    {!reservationSuccess && (
                        <Button 
                            className="autisconnect-btn-primary"
                            onClick={handleMakeReservation}
                        >
                            Enviar Solicitação
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ServiceDashboard18;
