import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Container, Navbar, Card, Table, ListGroup, Nav, Tab, Row, Col, Button, Modal, Form, Image, Alert, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Added FaTimes back for cancel action
import { FaMapMarkerAlt, FaPhone, FaWhatsapp, FaFacebook, FaInstagram, FaClock, FaListAlt, FaCertificate, FaUsers, FaComments, FaCalendarCheck, FaStar, FaStarHalfAlt, FaRegStar, FaTimes } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import logohori from '../assets/logohoriz copy.jpg';
import '../app.css';

// --- Leaflet Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- Mock Data ---
const mockServiceData = {
    1: {
        id: 1,
        mainPhoto: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        name: 'Clínica Bem-Estar',
        segment: 'Restaurante',
        description: 'Um ambiente acolhedor e sensorialmente adaptado para refeições tranquilas e prazerosas para toda a família.',
        hours: 'Seg-Sex: 08:00-18:00, Sáb: 08:00-12:00',
        menuServices: [
            { id: 1, name: 'Café da Manhã Inclusivo', price: 'R$ 20,00', description: 'Opções variadas com texturas e sabores suaves.' },
            { id: 2, name: 'Almoço Sensorial', price: 'R$ 35,00', description: 'Pratos balanceados com apresentação cuidadosa.' },
        ],
        certificates: [
            { id: 1, name: 'Certificado de Inclusão Autisconnect 2024' },
            { id: 2, name: 'Selo Ambiente Amigo do Autista' },
        ],
        address: 'Rua das Flores, 123, Boa Viagem, Recife, PE',
        coordinates: [-8.047562, -34.877],
        contact: {
            phone: '(81) 98765-4321',
            whatsapp: '(81) 98765-4321',
            socialMedia: {
                facebook: 'https://facebook.com/clinicabemestar',
                instagram: 'https://instagram.com/clinicabemestar',
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

// Star Rating Display Component
const StarRating = ({ rating }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
        stars.push(<FaStar key={`full-${i}`} className="text-warning" />);
    }
    if (halfStar) {
        stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<FaRegStar key={`empty-${i}`} className="text-warning" />);
    }
    return <span className="ms-1">{stars}</span>;
};

// --- Component ---
function ServiceDashboard01() {
    const { id: serviceId } = useParams();
    const id = serviceId || '1';

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
            id: Date.now(), // Simple mock ID
            date: reservationDate,
            time: reservationTime,
            status: 'Pendente' // Initial status
        };
        // Simulate adding to the list (in real app, this comes from API response)
        setServiceData(prevData => ({
            ...prevData,
            reservations: [...(prevData.reservations || []), newReservation]
        }));
        setReservationSuccess(`Solicitação de reserva para ${reservationDate} às ${reservationTime} enviada! Aguarde a confirmação.`);
        setReservationError(null);
        // Keep modal open to show success message
    };

    const handleCancelReservation = (reservationId) => {
        // Simulate API call to cancel reservation
        if (window.confirm('Tem certeza que deseja cancelar esta solicitação de reserva?')) {
            console.log(`Solicitando cancelamento da reserva ${reservationId}`);
            alert(`Solicitação de cancelamento para reserva ${reservationId} enviada (simulação).`);
            // Update state locally (or refetch)
            setServiceData(prevData => ({
                ...prevData,
                reservations: prevData.reservations.map(res =>
                    res.id === reservationId ? { ...res, status: 'Cancelada' } : res
                )
            }));
        }
    };

    const averageRating = useMemo(() => {
        if (!serviceData?.feedbacks || serviceData.feedbacks.length === 0) return 0;
        const totalRating = serviceData.feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
        return (totalRating / serviceData.feedbacks.length).toFixed(1);
    }, [serviceData?.feedbacks]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Confirmada': return <Badge bg="success">Confirmada</Badge>;
            case 'Pendente': return <Badge bg="warning" text="dark">Pendente</Badge>;
            case 'Cancelada': return <Badge bg="danger">Cancelada</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    // --- Render Logic ---
    if (error) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    if (!serviceData) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div>Carregando informações do serviço...</div>
            </Container>
        );
    }

    return (
        <div className="service-dashboard-page">
            {/* Navbar */}
            <Navbar bg="light" expand="lg" sticky="top" className="shadow-sm mb-4 service-navbar">
                <Container fluid>
                    <Navbar.Brand href="/">
                        <img src={logohori} alt="Autisconnect Logo" className="d-inline-block align-top logo" />
                    </Navbar.Brand>
                    <span className="navbar-text mx-auto d-none d-lg-block">
                        Detalhes de: <strong>{serviceData.name}</strong>
                    </span>
                    <Button variant="outline-secondary" size="sm" onClick={handleCloseTab}>Voltar</Button>
                </Container>
            </Navbar>

            {/* Main Content Area */}
            <Container fluid className="px-md-4">
                {/* Hero Section */}
                <Row className="service-hero-section mb-4 align-items-center" style={{ backgroundImage: `url(${serviceData.mainPhoto})` }}>
                    <Col className="service-hero-overlay p-4 p-md-5 text-white">
                        <h1 className="display-4 fw-bold mb-3">{serviceData.name}</h1>
                        <p className="lead mb-2">{serviceData.segment}</p>
                        <p className="mb-3">{serviceData.description || 'Descrição do serviço não disponível.'}</p>
                    </Col>
                </Row>

                {/* Tab Navigation & Content */}
                <Tab.Container id="service-dashboard-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <Row>
                        {/* Sidebar Navigation */}
                        <Col lg={3} className="mb-3 mb-lg-0">
                            <Nav variant="pills" className="flex-column service-dashboard-nav shadow-sm rounded p-3 bg-light">
                                <Nav.Item className="mb-1">
                                    <Nav.Link eventKey="visao-geral"><FaUsers className="me-2" />Visão Geral</Nav.Link>
                                </Nav.Item>
                                <Nav.Item className="mb-1">
                                    <Nav.Link eventKey="reservas"><FaCalendarCheck className="me-2" />Minhas Reservas</Nav.Link>
                                </Nav.Item>
                                <Nav.Item className="mb-1">
                                    <Nav.Link eventKey="feedback"><FaComments className="me-2" />Avaliações</Nav.Link>
                                </Nav.Item>
                                <Nav.Item className="mt-3">
                                    <Button variant="primary" className="w-100" onClick={handleShowReservationModal}>
                                        <FaCalendarCheck className="me-1" /> Solicitar Reserva
                                    </Button>
                                </Nav.Item>
                            </Nav>
                        </Col>

                        {/* Tab Content Area */}
                        <Col lg={9}>
                            <Tab.Content className="service-dashboard-content">
                                {/* Visão Geral Tab */}
                                <Tab.Pane eventKey="visao-geral">
                                    <Row>
                                        {/* Left Column: Details */}
                                        <Col md={7} className="mb-3 mb-md-0">
                                            <Card className="shadow-sm mb-3">
                                                <Card.Header as="h5"><FaClock className="me-2" />Horário</Card.Header>
                                                <Card.Body><pre className="mb-0">{serviceData.hours}</pre></Card.Body>
                                            </Card>
                                            <Card className="shadow-sm mb-3">
                                                <Card.Header as="h5"><FaListAlt className="me-2" />Menu/Serviços</Card.Header>
                                                <ListGroup variant="flush">
                                                    {serviceData.menuServices?.length > 0 ? serviceData.menuServices.map((service) => (
                                                        <ListGroup.Item key={service.id} className="d-flex justify-content-between align-items-start">
                                                            <div><div className="fw-bold">{service.name}</div>{service.description}</div>
                                                            <Badge bg="primary" pill className="ms-2">{service.price}</Badge>
                                                        </ListGroup.Item>
                                                    )) : <ListGroup.Item>Nenhum item cadastrado.</ListGroup.Item>}
                                                </ListGroup>
                                            </Card>
                                            <Card className="shadow-sm mb-3">
                                                <Card.Header as="h5"><FaCertificate className="me-2" />Certificados</Card.Header>
                                                <ListGroup variant="flush">
                                                    {serviceData.certificates?.length > 0 ? serviceData.certificates.map((cert) => (
                                                        <ListGroup.Item key={cert.id}>{cert.name}</ListGroup.Item>
                                                    )) : <ListGroup.Item>Nenhum certificado cadastrado.</ListGroup.Item>}
                                                </ListGroup>
                                            </Card>
                                        </Col>
                                        {/* Right Column: Map & Contact */}
                                        <Col md={5}>
                                            <Card className="shadow-sm mb-3" style={{ height: '300px' }}>
                                                <Card.Header as="h5"><FaMapMarkerAlt className="me-2" />Localização</Card.Header>
                                                <MapContainer center={serviceData.coordinates || [-8.047562, -34.877]} zoom={15} style={{ height: '100%', width: '100%' }} whenCreated={setMapInstance}>
                                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                                    {serviceData.coordinates && <Marker position={serviceData.coordinates}><Popup>{serviceData.name}</Popup></Marker>}
                                                </MapContainer>
                                            </Card>
                                            <Card className="shadow-sm">
                                                <Card.Header as="h5"><FaPhone className="me-2" />Contato</Card.Header>
                                                <ListGroup variant="flush">
                                                    <ListGroup.Item><FaPhone className="me-2" /> {serviceData.contact?.phone || 'Não informado'}</ListGroup.Item>
                                                    {serviceData.contact?.whatsapp && <ListGroup.Item><FaWhatsapp className="me-2 text-success" /> <a href={`https://wa.me/${serviceData.contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{serviceData.contact.whatsapp}</a></ListGroup.Item>}
                                                    {serviceData.contact?.socialMedia?.facebook && <ListGroup.Item><FaFacebook className="me-2 text-primary" /> <a href={serviceData.contact.socialMedia.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></ListGroup.Item>}
                                                    {serviceData.contact?.socialMedia?.instagram && <ListGroup.Item><FaInstagram className="me-2 text-danger" /> <a href={serviceData.contact.socialMedia.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></ListGroup.Item>}
                                                </ListGroup>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab.Pane>

                                {/* Minhas Reservas Tab - ADJUSTED TABLE ORDER */}
                                <Tab.Pane eventKey="reservas">
                                    <h4 className="mb-3">Minhas Reservas</h4>
                                    <Card className="shadow-sm">
                                        <Card.Header>Histórico de Reservas</Card.Header>
                                        <Card.Body>
                                            <Table striped bordered hover responsive>
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Hora</th>
                                                        <th>Ações</th> {/* Actions first */} 
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {serviceData.reservations && serviceData.reservations.length > 0 ? serviceData.reservations.map((reserva) => (
                                                        <tr key={reserva.id}>
                                                            <td>{new Date(reserva.date + 'T00:00:00').toLocaleDateString()}</td>
                                                            <td>{reserva.time}</td>
                                                            <td>
                                                                {/* Show Cancel button only for Pending status */}
                                                                {reserva.status === 'Pendente' && (
                                                                    <Button variant="outline-danger" size="sm" onClick={() => handleCancelReservation(reserva.id)} title="Cancelar Solicitação">
                                                                        <FaTimes className="me-1"/> Cancelar
                                                                    </Button>
                                                                )}
                                                                {/* No actions for other statuses from user perspective */}
                                                                {(reserva.status === 'Confirmada' || reserva.status === 'Cancelada') && (
                                                                    <span className="text-muted">--</span>
                                                                )}
                                                            </td>
                                                            <td>{getStatusBadge(reserva.status)}</td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="4" className="text-center">Você ainda não possui reservas neste estabelecimento.</td> {/* Updated colSpan */} 
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                            <div className="mt-3 text-center">
                                                <Button variant="primary" onClick={handleShowReservationModal}>
                                                    <FaCalendarCheck className="me-1" /> Solicitar Nova Reserva
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Tab.Pane>

                                {/* Avaliações Tab */}
                                <Tab.Pane eventKey="feedback">
                                    <h4 className="mb-3">Avaliações do Estabelecimento</h4>
                                    <Card className="shadow-sm mb-4">
                                        <Card.Header as="h5">Avaliação Média</Card.Header>
                                        <Card.Body className="text-center">
                                            <span className="fs-2 fw-bold me-2">{averageRating}</span>
                                            <StarRating rating={parseFloat(averageRating)} />
                                            <span className="text-muted ms-1">({serviceData.feedbacks?.length || 0} avaliações)</span>
                                        </Card.Body>
                                    </Card>
                                    <Card className="shadow-sm">
                                        <Card.Header as="h5">Comentários de Usuários</Card.Header>
                                        <ListGroup variant="flush">
                                            {serviceData.feedbacks && serviceData.feedbacks.length > 0 ? serviceData.feedbacks.map((fb) => (
                                                <ListGroup.Item key={fb.id} className="feedback-item">
                                                    <div className="d-flex w-100 justify-content-between mb-1">
                                                        <StarRating rating={fb.rating} />
                                                        <small className="text-muted">{new Date(fb.date + 'T00:00:00').toLocaleDateString()}</small>
                                                    </div>
                                                    <p className="mb-1">{fb.comment}</p>
                                                </ListGroup.Item>
                                            )) : (
                                                <ListGroup.Item>Nenhum feedback recebido ainda.</ListGroup.Item>
                                            )}
                                        </ListGroup>
                                    </Card>
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </Container>

            {/* Reservation Modal */}
            <Modal show={showReservationModal} onHide={handleCloseReservationModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Solicitar Reserva em {serviceData.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {reservationSuccess && <Alert variant="success">{reservationSuccess}</Alert>}
                    {reservationError && <Alert variant="danger">{reservationError}</Alert>}
                    {!reservationSuccess && (
                        <Form>
                            <Form.Group className="mb-3" controlId="reservationDate">
                                <Form.Label>Data Desejada</Form.Label>
                                <Form.Control type="date" value={reservationDate} onChange={(e) => setReservationDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="reservationTime">
                                <Form.Label>Hora Desejada</Form.Label>
                                <Form.Control type="time" value={reservationTime} onChange={(e) => setReservationTime(e.target.value)} required />
                            </Form.Group>
                            <p className="text-muted small">Sua solicitação será enviada ao estabelecimento para confirmação.</p>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseReservationModal}>Fechar</Button>
                    {!reservationSuccess && (
                        <Button variant="primary" onClick={handleMakeReservation}>Enviar Solicitação</Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default ServiceDashboard01;

