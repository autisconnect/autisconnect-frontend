import React, { useEffect } from 'react';
import { Container, Navbar, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { FaCalendarAlt, FaUserPlus, FaChartBar, FaTasks } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logohori from '../assets/logo.png';
import './App.css';

// Importe as imagens que você vai criar
import secretaryMain from '../assets/secretary-main.png';
import secretaryAppointments from '../assets/secretary-appointments.png';
import secretaryPatients from '../assets/secretary-patients.png';
import secretaryAnalytics from '../assets/secretary-analytics.png';
import secretaryVision from '../assets/secretary-vision.png';

function PresentationSecretaryDashboard() {
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
                        <Button variant="danger" onClick={handleBackToMain} style={{ backgroundColor: '#e67e22', borderColor: '#e67e22' }}>Voltar</Button>
                    </div>
                </Container>
            </Navbar>

            <div 
                className="hero-section mb-5" 
                style={{ 
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${secretaryMain})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    minHeight: '450px'
                }}
            >
                <div>
                    <h1 className="display-4 fw-bold mb-3">Gestão para Secretárias e Clínicas</h1>
                    <p className="lead mb-4 text-white">Centralize a gestão de agendamentos, pacientes e comunicação em uma plataforma inteligente e integrada.</p>
                </div>
            </div>

            <Container fluid className="px-md-5">
                <Row className="mb-5 text-center">
                    <Col>
                        <h2>Otimize a Administração da sua Clínica</h2>
                        <p className="text-muted">Oferecemos um dashboard completo para que a equipe administrativa gerencie todas as operações do dia a dia com eficiência.</p>
                    </Col>
                </Row>

                <Row className="mb-5">
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaCalendarAlt className="text-primary me-3" size={30} /><h4>Agenda Centralizada</h4></div>
                                <p>Visualize e gerencie o histórico completo de consultas de todos os pacientes do profissional. Filtre por data, paciente ou status e atualize informações com um clique.</p>
                                <Image src={secretaryAppointments} fluid rounded className="mt-3 feature-image" alt="Agenda Centralizada" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaUserPlus className="text-success me-3" size={30} /><h4>Gerenciamento de Pacientes</h4></div>
                                <p>Cadastre novos pacientes e edite informações existentes diretamente pelo dashboard, mantendo todos os registros atualizados e acessíveis.</p>
                                <Image src={secretaryPatients} fluid rounded className="mt-3 feature-image" alt="Gerenciamento de Pacientes" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaChartBar className="text-warning me-3" size={30} /><h4>Relatórios de Desempenho</h4></div>
                                <p>Acesse gráficos que mostram o número de atendimentos por dia e a distribuição dos status das consultas, ajudando na gestão da clínica.</p>
                                <Image src={secretaryAnalytics} fluid rounded className="mt-3 feature-image" alt="Relatórios de Desempenho" />
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3"><FaTasks className="text-info me-3" size={30} /><h4>Visão Geral Simplificada</h4></div>
                                <p>Acompanhe as consultas do dia, os próximos agendamentos e os pagamentos pendentes em uma única tela, otimizando o fluxo de trabalho diário.</p>
                                <Image src={secretaryVision} fluid rounded className="mt-3 feature-image" alt="Visão Gereal" />                            
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="mb-5 text-center">
                    <Col>
                        <h3>Organize sua Clínica com Eficiência</h3>
                        <p className="text-muted mb-4">Dê à sua equipe administrativa as ferramentas certas para um gerenciamento impecável.</p>
                        <Button variant="primary" size="lg" onClick={handleSignUp}>Cadastre sua Clínica</Button>
                    </Col>
                </Row>
            </Container>

            <footer className="bg-light py-4 mt-5">
                <Container><p className="mb-0 text-center text-muted">Nrmendfsystems. Todos os direitos reservados.</p></Container>
            </footer>
        </div>
    );
}

export default PresentationSecretaryDashboard;
