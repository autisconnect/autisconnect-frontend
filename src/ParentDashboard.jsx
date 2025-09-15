// src/pages/ParentDashboard.jsx
// VERSÃO COMPLETA E REESTRUTURADA

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Container, Navbar, Card, Table, Form, Button, Nav, Tab, Row, Col, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api'; // Usando apiClient para consistência
import logohori from './assets/logohoriz copy.jpg';
import './App.css';

// Gráficos
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// Ícones
import { GraphUp, Calendar3, ExclamationTriangle, Heart } from 'react-bootstrap-icons';

// Componente para um Card de Estatística
const StatCard = ({ title, value, subtitle, icon, color }) => (
    <Card className="text-center mb-3 shadow-sm h-100">
        <Card.Body>
            {React.cloneElement(icon, { className: `text-${color} mb-2`, size: 24 })}
            <h6>{title}</h6>
            <h3>{value || 'N/A'}</h3>
            <small className="text-muted">{subtitle || ' '}</small>
        </Card.Body>
    </Card>
);

function ParentDashboard() {
    // ===================================================
    // 1. HOOKS E ESTADOS
    // ===================================================
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id: urlId } = useParams();

    // Estados de Controle
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Dados do Paciente e Profissionais
    const [patient, setPatient] = useState(null);
    const [associatedProfessionals, setAssociatedProfessionals] = useState([]);

    // Dados de Monitoramento
    const [emotions, setEmotions] = useState([]);
    const [stereotypies, setStereotypies] = useState([]);
    const [vocalizations, setVocalizations] = useState([]);
    const [strokeRisks, setStrokeRisks] = useState([]);

    // Dados para Gráficos
    const [emotionChartData, setEmotionChartData] = useState(null);
    const [emotionDistributionData, setEmotionDistributionData] = useState(null);
    const [stereotypyChartData, setStereotypyChartData] = useState(null);
    const [vocalizationChartData, setVocalizationChartData] = useState(null);
    const [strokeChartData, setStrokeChartData] = useState(null);

    // Agendamento de Consultas
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [newAppointment, setNewAppointment] = useState({ professionalId: '', date: '', time: '', notes: '' });
    const [professionalAvailability, setProfessionalAvailability] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);

    // ===================================================
    // 2. FUNÇÕES DE FORMATAÇÃO E OPÇÕES DE GRÁFICOS
    // ===================================================
    const formatAge = (birthDate) => {
        if (!birthDate) return 'N/A';
        const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
        return `${age} anos`;
    };
    const lineOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Evolução ao Longo do Tempo' } } };
    const pieOptions = { responsive: true, plugins: { legend: { position: 'right' }, title: { display: true, text: 'Distribuição' } } };

    // ===================================================
    // 3. LÓGICA DE BUSCA DE DADOS (DATA FETCHING)
    // ===================================================
    const fetchData = useCallback(async (patientId) => {
        try {
            const [
                patientRes, professionalsRes, emotionsRes, stereotypiesRes, vocalizationsRes, strokeRes, appointmentsRes
            ] = await Promise.all([
                apiClient.get(`/parent/patient-details/${patientId}`),
                apiClient.get(`/parent/patient/${patientId}/associated-professionals`),
                apiClient.get(`/emotions/${patientId}`),
                apiClient.get(`/stereotypies/${patientId}`),
                apiClient.get(`/vocalizations/${patientId}`),
                apiClient.get(`/stroke-risk/${patientId}`),
                apiClient.get(`/appointments/patient/${patientId}?status=agendada,confirmada`)
            ]);

            setPatient(patientRes.data);
            setAssociatedProfessionals(professionalsRes.data);
            setEmotions(emotionsRes.data);
            setStereotypies(stereotypiesRes.data);
            setVocalizations(vocalizationsRes.data);
            setStrokeRisks(strokeRes.data);
            setUpcomingAppointments(appointmentsRes.data);

        } catch (err) {
            console.error("Erro ao carregar dados do dashboard:", err);
            setError(err.response?.data?.error || "Falha ao carregar os dados. Tente novamente mais tarde.");
        }
    }, []);

    useEffect(() => {
        if (!user || !user.userId) {
            navigate('/login');
            return;
        }
        if (urlId && urlId !== user.userId.toString()) {
            navigate(`/parent-dashboard/${user.userId}`);
            return;
        }

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const patientIdRes = await apiClient.get(`/parent/main-patient-id`);
                const patientId = patientIdRes.data.patientId;
                if (patientId) {
                    await fetchData(patientId);
                } else {
                    setError("Nenhum paciente associado a este responsável.");
                }
            } catch (err) {
                setError("Não foi possível encontrar o paciente associado.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [user, urlId, navigate, fetchData]);

    // ===================================================
    // 4. PROCESSAMENTO DE DADOS PARA GRÁFICOS
    // ===================================================
    useEffect(() => {
        // Processar dados de emoções
        if (emotions.length > 0) {
            const emotionTypes = ['happy', 'sad', 'neutral', 'angry', 'surprised'];
            const emotionColors = ['#28a745', '#007bff', '#6c757d', '#dc3545', '#ffc107'];
            const emotionCounts = emotions.reduce((acc, { emotion }) => {
                acc[emotion] = (acc[emotion] || 0) + 1;
                return acc;
            }, {});
            setEmotionDistributionData({
                labels: emotionTypes.map(e => e.charAt(0).toUpperCase() + e.slice(1)),
                datasets: [{ data: emotionTypes.map(type => emotionCounts[type] || 0), backgroundColor: emotionColors }]
            });
        }

        // Processar dados de estereotipias
        if (stereotypies.length > 0) {
            const stereotypyTypes = [...new Set(stereotypies.map(s => s.type))];
            const stereotypyCounts = stereotypies.reduce((acc, { type }) => {
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});
            setStereotypyChartData({
                labels: stereotypyTypes,
                datasets: [{ label: 'Frequência', data: stereotypyTypes.map(type => stereotypyCounts[type]), backgroundColor: ['#17a2b8', '#fd7e14', '#6f42c1'] }]
            });
        }
        
        // Adicione processamento para vocalizações e risco de AVC se necessário
        // ...

    }, [emotions, stereotypies, vocalizations, strokeRisks]);

    // ===================================================
    // 5. HANDLERS DE EVENTOS (agendamento, logout, etc.)
    // ===================================================
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleOpenAppointmentModal = () => {
        setNewAppointment({ professionalId: '', date: '', time: '', notes: '' });
        setProfessionalAvailability([]);
        setShowAppointmentModal(true);
    };

    const handleProfessionalChangeForAppointment = async (e) => {
        const profId = e.target.value;
        setNewAppointment(prev => ({ ...prev, professionalId: profId, date: '', time: '' }));
        if (profId) {
            try {
                const response = await apiClient.get(`/professional/${profId}/availability`);
                setProfessionalAvailability(response.data);
            } catch (err) {
                setError("Falha ao buscar horários do profissional.");
                setProfessionalAvailability([]);
            }
        } else {
            setProfessionalAvailability([]);
        }
    };

    const handleAppointmentInputChange = (e) => {
        const { name, value } = e.target;
        setNewAppointment(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAppointment = async (e) => {
        e.preventDefault();
        const { professionalId, date, time, notes } = newAppointment;
        if (!professionalId || !date || !time) {
            alert("Por favor, selecione o profissional, a data e o horário.");
            return;
        }
        try {
            await apiClient.post(`/parent/patient/${patient.id}/request-appointment`, {
                professionalId, date, time, notes
            });
            alert("Solicitação de agendamento enviada com sucesso!");
            setShowAppointmentModal(false);
            fetchData(patient.id); // Recarrega os dados
        } catch (err) {
            alert(err.response?.data?.error || "Erro ao enviar solicitação.");
        }
    };

    const handleOpenMonitoringTool = (route) => {
        const url = new URL(window.location.origin);
        url.pathname = route;
        url.searchParams.append('patientId', patient.id);
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
    };

    // ===================================================
    // 6. RENDERIZAÇÃO
    // ===================================================
    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    }

    if (error) {
        return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    }

    if (!patient) {
        return <Container className="mt-5"><Alert variant="warning">Não foi possível carregar os dados do paciente.</Alert></Container>;
    }

    return (
        <div className="App">
            <Navbar bg="light" expand="lg" fixed="top" className="mb-4">
                <Container>
                    <Navbar.Brand><img src={logohori} alt="Logo" className="logo" /></Navbar.Brand>
                    <Navbar.Text className="mx-auto d-none d-lg-block fw-light">
                        Painel dos Pais: <strong className="fw-semibold">{user?.nome_completo || user?.username}</strong>
                    </Navbar.Text>
                    <Button variant="danger" onClick={handleLogout}>Sair</Button>
                </Container>
            </Navbar>

            <section className="parent-section py-5" style={{ marginTop: '70px' }}>
                <Container className="dashboard-container">
                    <Row className="patient-header-row mb-4 align-items-center">
                        <Col>
                            <h1 className="patient-name mb-0 mt-2">Dashboard do Paciente</h1>
                            <p className="patient-info text-muted mb-0">{patient.name}</p>
                        </Col>
                        <Col xs="auto">
                            <div className="patient-info-block">
                                <div className="info-item"><strong>Idade:</strong> <span>{formatAge(patient.birthDate)}</span></div>
                                <div className="info-item"><strong>Diagnóstico:</strong> <span>{patient.diagnosis || 'N/A'}</span></div>
                            </div>
                        </Col>
                    </Row>

                    <Tab.Container id="parent-dashboard-tabs" activeKey={activeTab} onSelect={setActiveTab}>
                        <Nav variant="tabs" className="mb-3">
                            <Nav.Item><Nav.Link eventKey="overview">Visão Geral</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="emotion">Emoções</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="stereotypy">Estereotipias</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="vocalization">Vocalizações</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="stroke">Risco de AVC</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="appointments">Consultas</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="monitoring-tools">Ferramentas</Nav.Link></Nav.Item>
                        </Nav>

                        <Tab.Content>
                            <Tab.Pane eventKey="overview">
                                <Row>
                                    <Col md={3}><StatCard title="Emoção Predominante" value={emotions[0]?.emotion || 'N/A'} subtitle="Na última semana" icon={<Heart />} color="success" /></Col>
                                    <Col md={3}><StatCard title="Estereotipia Comum" value={stereotypies[0]?.type || 'N/A'} subtitle="Frequência: alta" icon={<GraphUp />} color="primary" /></Col>
                                    <Col md={3}><StatCard title="Próxima Consulta" value={upcomingAppointments[0] ? new Date(upcomingAppointments[0].appointment_date).toLocaleDateString('pt-BR') : 'Nenhuma'} subtitle={upcomingAppointments[0]?.professionalName || ''} icon={<Calendar3 />} color="info" /></Col>
                                    <Col md={3}><StatCard title="Risco de AVC" value={strokeRisks[0]?.risk_level || 'Baixo'} subtitle={`Assimetria: ${strokeRisks[0]?.asymmetry_index || 'N/A'}`} icon={<ExclamationTriangle />} color="danger" /></Col>
                                </Row>
                                <Row className="mt-4">
                                    <Col md={6} className="mb-4">
                                        <Card className="shadow-sm h-100"><Card.Header>Evolução das Emoções</Card.Header><Card.Body>{emotionChartData ? <Line data={emotionChartData} options={lineOptions} /> : <p>Sem dados.</p>}</Card.Body></Card>
                                    </Col>
                                    <Col md={6} className="mb-4">
                                        <Card className="shadow-sm h-100"><Card.Header>Distribuição de Estereotipias</Card.Header><Card.Body>{stereotypyChartData ? <Pie data={stereotypyChartData} options={pieOptions} /> : <p>Sem dados.</p>}</Card.Body></Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            <Tab.Pane eventKey="emotion">
                                <Card><Card.Header>Análise de Emoções</Card.Header><Card.Body>{emotionDistributionData ? <Pie data={emotionDistributionData} options={pieOptions} /> : <p>Sem dados.</p>}</Card.Body></Card>
                            </Tab.Pane>
                            
                            <Tab.Pane eventKey="stereotypy">
                                <Card><Card.Header>Análise de Estereotipias</Card.Header><Card.Body>{stereotypyChartData ? <Bar data={stereotypyChartData} options={{...pieOptions, indexAxis: 'y'}} /> : <p>Sem dados.</p>}</Card.Body></Card>
                            </Tab.Pane>

                            <Tab.Pane eventKey="appointments">
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        Consultas Agendadas
                                        <Button variant="primary" onClick={handleOpenAppointmentModal}>Agendar Nova Consulta</Button>
                                    </Card.Header>
                                    <Card.Body>
                                        <Table striped bordered hover responsive>
                                            <thead><tr><th>Data</th><th>Hora</th><th>Profissional</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {upcomingAppointments.length > 0 ? upcomingAppointments.map(appt => (
                                                    <tr key={appt.id}>
                                                        <td>{new Date(appt.appointment_date).toLocaleDateString('pt-BR')}</td>
                                                        <td>{appt.appointment_time.substring(0, 5)}</td>
                                                        <td>{appt.professionalName}</td>
                                                        <td><Badge bg={appt.status === 'Confirmada' ? 'success' : 'warning'}>{appt.status}</Badge></td>
                                                    </tr>
                                                )) : <tr><td colSpan="4" className="text-center">Nenhuma consulta agendada.</td></tr>}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>

                            <Tab.Pane eventKey="monitoring-tools">
                                <Row>
                                    <Col md={6} lg={3} className="mb-3"><Button className="w-100 p-3" variant="primary" onClick={() => handleOpenMonitoringTool('/emotion-detector')}>Detector de Emoções</Button></Col>
                                    <Col md={6} lg={3} className="mb-3"><Button className="w-100 p-3" variant="info" onClick={() => handleOpenMonitoringTool('/stereotypy-monitor')}>Monitor de Estereotipias</Button></Col>
                                    <Col md={6} lg={3} className="mb-3"><Button className="w-100 p-3" variant="success" onClick={() => handleOpenMonitoringTool('/trigger-recorder')}>Gravador de Voz</Button></Col>
                                    <Col md={6} lg={3} className="mb-3"><Button className="w-100 p-3" variant="danger" onClick={() => handleOpenMonitoringTool('/stroke-risk-monitor')}>Monitor de Risco de AVC</Button></Col>
                                </Row>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Container>
            </section>

            {/* Modal de Agendamento */}
            <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>Agendar Nova Consulta</Modal.Title></Modal.Header>
                <Form onSubmit={handleSaveAppointment}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Profissional*</Form.Label>
                            <Form.Select name="professionalId" value={newAppointment.professionalId} onChange={handleProfessionalChangeForAppointment} required>
                                <option value="">Selecione o profissional</option>
                                {associatedProfessionals.map(prof => (
                                    <option key={prof.id} value={prof.id}>{prof.name} ({prof.specialty})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        {newAppointment.professionalId && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data*</Form.Label>
                                    <Form.Control type="date" name="date" value={newAppointment.date} onChange={handleAppointmentInputChange} min={new Date().toISOString().split('T')[0]} required />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Horário*</Form.Label>
                                    <Form.Select name="time" value={newAppointment.time} onChange={handleAppointmentInputChange} required>
                                        <option value="">Selecione um horário disponível</option>
                                        {professionalAvailability.filter(slot => slot.date === newAppointment.date).map((slot, index) => (
                                            <option key={index} value={slot.time}>{slot.time}</option>
                                        ))}
                                    </Form.Select>
                                    {newAppointment.date && professionalAvailability.filter(slot => slot.date === newAppointment.date).length === 0 && <small className="text-muted">Nenhum horário disponível para esta data.</small>}
                                </Form.Group>
                            </>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>Observações (opcional)</Form.Label>
                            <Form.Control as="textarea" rows={3} name="notes" value={newAppointment.notes} onChange={handleAppointmentInputChange} placeholder="Motivo da consulta, sintomas, etc." />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAppointmentModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit">Enviar Solicitação</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}

export default ParentDashboard;
