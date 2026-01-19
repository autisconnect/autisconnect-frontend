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
import { GraphUp, Calendar3, ExclamationTriangle, Heart, Person, FileEarmarkMedical } from 'react-bootstrap-icons';

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
    const { user, setUser, logout } = useContext(AuthContext);
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

    // Prescrições Médicas
    const [prescriptions, setPrescriptions] = useState([]);
    const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);

    // ===================================================
    // 2. FUNÇÕES DE FORMATAÇÃO E OPÇÕES DE GRÁFICOS
    // ===================================================
    const formatAge = (birthDate) => {
        if (!birthDate) return 'N/A';
        const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
        return `${age} anos`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const lineOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Evolução ao Longo do Tempo' } } };
    const pieOptions = { responsive: true, plugins: { legend: { position: 'right' }, title: { display: true, text: 'Distribuição' } } };

    // ===================================================
    // 3. LÓGICA DE BUSCA DE DADOS (DATA FETCHING)
    // ===================================================
    const fetchData = useCallback(async (patientId) => {
        try {
            const [
                patientRes, professionalsRes, emotionsRes, stereotypiesRes, vocalizationsRes, strokeRes, appointmentsRes, prescriptionsRes
            ] = await Promise.all([
                apiClient.get(`/parent/patient-details/${patientId}`),
                apiClient.get(`/parent/patient/${patientId}/associated-professionals`),
                apiClient.get(`/emotions/${patientId}`),
                apiClient.get(`/stereotypies/${patientId}`),
                apiClient.get(`/vocalizations/${patientId}`),
                apiClient.get(`/stroke-risk/${patientId}`),
                apiClient.get(`/appointments/patient/${patientId}?status=agendada,confirmada`),
                apiClient.get(`/prescriptions/patient/${patientId}`)
            ]);

            setPatient(patientRes.data);
            setAssociatedProfessionals(professionalsRes.data);
            setEmotions(emotionsRes.data);
            setStereotypies(stereotypiesRes.data);
            setVocalizations(vocalizationsRes.data);
            setStrokeRisks(strokeRes.data);
            setUpcomingAppointments(appointmentsRes.data);
            setPrescriptions(prescriptionsRes.data);
            setFilteredPrescriptions(prescriptionsRes.data);

        } catch (err) {
            console.error("Erro ao carregar dados do dashboard:", err);
            setError(err.response?.data?.error || "Falha ao carregar os dados. Tente novamente mais tarde.");
        }
    }, []);

    // ===================================================
    // EFEITO PRINCIPAL — VALIDAÇÃO + BUSCA DE DADOS
    // ===================================================
  useEffect(() => {
    if (!user) {
      console.log("ParentDashboard: Aguardando usuário...");
      return;
    }

    if (user.tipo_usuario !== 'pais_responsavel') {
      navigate('/login');
      return;
    }

    if (urlId && urlId !== user.id.toString()) {
      navigate(`/parent-dashboard/${user.id}`, { replace: true });
      return;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      setError('');

      try {
        // ROTA QUE EXISTE E FUNCIONA NO SEU BACKEND
        const response = await apiClient.get('/parent/children');
        
        if (!response.data || response.data.length === 0) {
          setError("Nenhum filho cadastrado. Peça ao profissional para vincular um paciente.");
          setLoading(false);
          return;
        }

        // Pega o primeiro filho
        const patientId = response.data[0].id;
        
        await fetchData(patientId);

      } catch (err) {
        console.error("Erro ao carregar filhos:", err);
        setError("Erro ao carregar dados do filho. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

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
                            <Nav.Item><Nav.Link eventKey="patient-details">Detalhes do Paciente</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="emotion">Emoções</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="vocalization">Vocalizações</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="stroke">Risco de AVC</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="prescription">Prescrição Médica</Nav.Link></Nav.Item>
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

                            <Tab.Pane eventKey="patient-details">
                                <Row>
                                    <Col md={12}>
                                        <Card className="shadow-sm mb-4">
                                            <Card.Header className="d-flex align-items-center">
                                                <Person className="me-2" size={20} />
                                                <h5 className="mb-0">Informações do Paciente</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Row>
                                                    <Col md={6}>
                                                        <Table borderless>
                                                            <tbody>
                                                                <tr>
                                                                    <td><strong>Nome:</strong></td>
                                                                    <td>{patient.name}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Data de Nascimento:</strong></td>
                                                                    <td>{formatDate(patient.birthDate)}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Idade:</strong></td>
                                                                    <td>{formatAge(patient.birthDate)}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Telefone:</strong></td>
                                                                    <td>{patient.phone || 'N/A'}</td>
                                                                </tr>
                                                            </tbody>
                                                        </Table>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Table borderless>
                                                            <tbody>
                                                                <tr>
                                                                    <td><strong>Email:</strong></td>
                                                                    <td>{patient.email || 'N/A'}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Diagnóstico:</strong></td>
                                                                    <td>{patient.diagnosis || 'N/A'}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Responsável:</strong></td>
                                                                    <td>{patient.parent || user?.nome_completo || 'N/A'}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Status:</strong></td>
                                                                    <td><Badge bg="success">Ativo</Badge></td>
                                                                </tr>
                                                            </tbody>
                                                        </Table>
                                                    </Col>
                                                </Row>
                                                {patient.notes && (
                                                    <Row className="mt-3">
                                                        <Col md={12}>
                                                            <h6>Observações:</h6>
                                                            <p className="text-muted">{patient.notes}</p>
                                                        </Col>
                                                    </Row>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Profissionais Associados */}
                                <Row>
                                    <Col md={12}>
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                <h5 className="mb-0">Profissionais Associados</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {associatedProfessionals.length > 0 ? (
                                                    <Table striped bordered hover responsive>
                                                        <thead>
                                                            <tr>
                                                                <th>Nome</th>
                                                                <th>Especialidade</th>
                                                                <th>Email</th>
                                                                <th>Telefone</th>
                                                                <th>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {associatedProfessionals.map(prof => (
                                                                <tr key={prof.id}>
                                                                    <td>{prof.name}</td>
                                                                    <td>{prof.specialty || 'N/A'}</td>
                                                                    <td>{prof.email}</td>
                                                                    <td>{prof.phone || 'N/A'}</td>
                                                                    <td><Badge bg="success">Ativo</Badge></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                ) : (
                                                    <Alert variant="info">Nenhum profissional associado encontrado.</Alert>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            <Tab.Pane eventKey="emotion">
                                <Card><Card.Header>Análise de Emoções</Card.Header><Card.Body>{emotionDistributionData ? <Pie data={emotionDistributionData} options={pieOptions} /> : <p>Sem dados.</p>}</Card.Body></Card>
                            </Tab.Pane>
                            
                            <Tab.Pane eventKey="vocalization">
                                <Card><Card.Header>Análise de Vocalizações</Card.Header><Card.Body>{vocalizationChartData ? <Bar data={vocalizationChartData} options={lineOptions} /> : <p>Sem dados.</p>}</Card.Body></Card>
                            </Tab.Pane>

                            <Tab.Pane eventKey="stroke">
                                <Card><Card.Header>Análise de Risco de AVC</Card.Header><Card.Body>{strokeChartData ? <Line data={strokeChartData} options={lineOptions} /> : <p>Sem dados.</p>}</Card.Body></Card>
                            </Tab.Pane>

                            <Tab.Pane eventKey="prescription">
                                <Card className="shadow-sm">
                                    <Card.Header className="d-flex align-items-center">
                                        <FileEarmarkMedical className="me-2" size={20} />
                                        <h5 className="mb-0">Prescrições Médicas</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {filteredPrescriptions.length > 0 ? (
                                            <div className="prescription-list">
                                                {filteredPrescriptions.map(prescription => (
                                                    <Card key={prescription.id} className="mb-3 border-start border-primary border-3">
                                                        <Card.Body>
                                                            <Row className="mb-3">
                                                                <Col md={4}>
                                                                    <strong>Data da Prescrição:</strong><br />
                                                                    <span className="text-muted">{formatDate(prescription.date)}</span>
                                                                </Col>
                                                                <Col md={4}>
                                                                    <strong>Médico:</strong><br />
                                                                    <span className="text-muted">{prescription.doctor_name || 'N/A'}</span>
                                                                </Col>
                                                                <Col md={4}>
                                                                    <strong>Registro:</strong><br />
                                                                    <span className="text-muted">{prescription.doctor_registration || 'N/A'}</span>
                                                                </Col>
                                                            </Row>
                                                            
                                                            <div className="prescription-content">
                                                                <h6 className="text-primary mb-3">Prescrição:</h6>
                                                                <Table striped bordered hover responsive size="sm">
                                                                    <thead className="table-light">
                                                                        <tr>
                                                                            <th>Medicamento/Prescrição</th>
                                                                            <th>Dosagem/Quantidade</th>
                                                                            <th>Indicações</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {prescription.medications && prescription.medications.map((med, index) => (
                                                                            <tr key={`${prescription.id}-${index}`}>
                                                                                <td><strong>{med.medication}</strong></td>
                                                                                <td>{med.dosage}</td>
                                                                                <td>{med.indicationssuggestions || 'N/A'}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </Table>
                                                                
                                                                {prescription.observations && (
                                                                    <div className="mt-3">
                                                                        <h6 className="text-secondary">Observações:</h6>
                                                                        <p className="text-muted bg-light p-3 rounded">{prescription.observations}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <Alert variant="info" className="text-center">
                                                <FileEarmarkMedical size={48} className="mb-3 text-muted" />
                                                <h6>Nenhuma prescrição médica encontrada</h6>
                                                <p className="mb-0">As prescrições médicas aparecerão aqui quando forem criadas pelos profissionais.</p>
                                            </Alert>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>

                            <Tab.Pane eventKey="appointments">
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        Consultas Agendadas
                                        <Button variant="primary" onClick={handleOpenAppointmentModal}>Agendar Nova Consulta</Button>
                                    </Card.Header>
                                    <Card.Body>
                                        {upcomingAppointments.length > 0 ? (
                                            <Table striped bordered hover responsive>
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Horário</th>
                                                        <th>Profissional</th>
                                                        <th>Tipo</th>
                                                        <th>Status</th>
                                                        <th>Observações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {upcomingAppointments.map(appointment => (
                                                        <tr key={appointment.id}>
                                                            <td>{formatDate(appointment.appointment_date)}</td>
                                                            <td>{appointment.appointment_time}</td>
                                                            <td>{appointment.professionalName}</td>
                                                            <td>{appointment.appointment_type}</td>
                                                            <td>
                                                                <Badge bg={appointment.status === 'confirmada' ? 'success' : 'warning'}>
                                                                    {appointment.status}
                                                                </Badge>
                                                            </td>
                                                            <td>{appointment.notes || 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        ) : (
                                            <Alert variant="info">Nenhuma consulta agendada.</Alert>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>

                            <Tab.Pane eventKey="monitoring-tools">
                                <Row>
                                    <Col md={4} className="mb-3">
                                        <Card className="text-center h-100 shadow-sm">
                                            <Card.Body>
                                                <Heart className="text-primary mb-3" size={48} />
                                                <h5>Detector de Emoções</h5>
                                                <p>Monitore as emoções do paciente em tempo real</p>
                                                <Button variant="primary" onClick={() => handleOpenMonitoringTool('/emotion-detector')}>
                                                    Abrir Ferramenta
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Card className="text-center h-100 shadow-sm">
                                            <Card.Body>
                                                <ExclamationTriangle className="text-danger mb-3" size={48} />
                                                <h5>Monitor de Risco de AVC</h5>
                                                <p>Avalie sinais de risco de AVC através da análise facial</p>
                                                <Button variant="danger" onClick={() => handleOpenMonitoringTool('/stroke-risk-monitor')}>
                                                    Abrir Ferramenta
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Card className="text-center h-100 shadow-sm">
                                            <Card.Body>
                                                <GraphUp className="text-success mb-3" size={48} />
                                                <h5>Gravador de Gatilhos</h5>
                                                <p>Registre comportamentos e padrões repetitivos</p>
                                                <Button variant="success" onClick={() => handleOpenMonitoringTool('/trigger-recorder')}>
                                                    Abrir Ferramenta
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Container>
            </section>

            {/* Modal de Agendamento */}
            <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Solicitar Agendamento</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSaveAppointment}>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Profissional</Form.Label>
                                    <Form.Select
                                        name="professionalId"
                                        value={newAppointment.professionalId}
                                        onChange={handleProfessionalChangeForAppointment}
                                        required
                                    >
                                        <option value="">Selecione um profissional</option>
                                        {associatedProfessionals.map(prof => (
                                            <option key={prof.id} value={prof.id}>{prof.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Data</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date"
                                        value={newAppointment.date}
                                        onChange={handleAppointmentInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Horário</Form.Label>
                                    <Form.Select
                                        name="time"
                                        value={newAppointment.time}
                                        onChange={handleAppointmentInputChange}
                                        required
                                    >
                                        <option value="">Selecione um horário</option>
                                        {professionalAvailability.map((slot, index) => (
                                            <option key={index} value={slot.time}>{slot.time}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Observações</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="notes"
                                        value={newAppointment.notes}
                                        onChange={handleAppointmentInputChange}
                                        placeholder="Observações sobre a consulta (opcional)"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" className="me-2" onClick={() => setShowAppointmentModal(false)}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit">
                                Solicitar Agendamento
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default ParentDashboard;
