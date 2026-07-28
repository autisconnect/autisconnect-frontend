import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Nav, Tab, Badge, Modal, Spinner, Alert } from 'react-bootstrap';
import { Calendar2Check, ChatDots, Bell, PlusCircle, BarChartLine, People } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';

import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';

import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import logonovo from './assets/logonovo.png';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const DashboardCard = ({ title, children, isLoading }) => (
    <Card className="h-100 shadow-sm">
        <Card.Header><h5 className="mb-0">{title}</h5></Card.Header>
        <Card.Body>{isLoading ? <div className="text-center"><Spinner animation="border" size="sm" /></div> : children}</Card.Body>
    </Card>
);

const emptyPatientForm = {
    name: '',
    birthDate: '',
    phone: '',
    email: '',
    diagnosis: '',
    notes: '',
    professionalId: ''
};

const emptyAppointmentForm = {
    patientId: '',
    professionalId: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'Consulta Regular',
    status: 'Agendada',
    value: '',
    payment_method: 'Pix',
    payment_details: '',
    payment_status: 'Pendente',
    notes: ''
};

const SecretaryDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id: secretaryId } = useParams();

    // --- ESTADOS ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [patients, setPatients] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [professional, setProfessional] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showCommunicationModal, setShowCommunicationModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [newPatient, setNewPatient] = useState(emptyPatientForm);
    const [editingPatient, setEditingPatient] = useState(null);
    const [newAppointment, setNewAppointment] = useState(emptyAppointmentForm);
    const [newMessage, setNewMessage] = useState({ recipientId: '', content: '' });
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [filters, setFilters] = useState({ date: '', patientId: '', professionalId: '', status: '' });
    const isClinicSecretary = Boolean(user?.clinic_id);
//ok
    // --- FUNÇÕES DE API ---
    const handleApiError = (err, context) => {
        console.error(`Erro ao ${context}:`, err);
        const message = err.response?.data?.error || err.response?.data?.message || `Erro ao ${context}. Tente novamente.`;
        setError(message);
    };
//ok
    const fetchAllData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const [patientsRes, profRes, appointmentsRes, messagesRes] = await Promise.all([
                apiClient.get('/secretary/patients'),
                apiClient.get('/secretary/professionals'),
                apiClient.get('/secretary/appointments'),
                apiClient.get('/secretary/messages')
            ]);
            const loadedProfessionals = Array.isArray(profRes.data) ? profRes.data : [];
            setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : []);
            setProfessionals(loadedProfessionals);
            setProfessional(loadedProfessionals[0] || null);
            setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : []);
            setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
            const defaultProfessionalId = loadedProfessionals.length === 1 ? String(loadedProfessionals[0].id) : '';
            setNewPatient(prev => ({
                ...prev,
                professionalId: prev.professionalId || defaultProfessionalId
            }));
            setNewAppointment(prev => ({
                ...prev,
                professionalId: prev.professionalId || defaultProfessionalId
            }));
        } catch (err) {
            handleApiError(err, 'carregar os dados do dashboard');
        } finally {
            setLoading(false);
        }
    }, [user]);
//ok
    const handleAddAppointment = async (e) => {
        e.preventDefault();
        if (!user) { setError('Usuário não autenticado.'); return; }
        if (!newAppointment.patientId || !newAppointment.appointment_date || !newAppointment.appointment_time || (!isClinicSecretary && !newAppointment.value) || (isClinicSecretary && !newAppointment.professionalId)) {
            setError(isClinicSecretary ? 'Profissional, paciente, data e hora sao obrigatorios.' : 'Profissional, paciente, data, hora e valor sao obrigatorios.');
            return;
        }
        try {
            const appointmentPayload = isClinicSecretary
                ? { ...newAppointment, value: 0, payment_method: null, payment_details: null, payment_status: 'Pendente' }
                : newAppointment;
            await apiClient.post('/secretary/appointments', appointmentPayload);
            setSuccessMessage('Consulta registrada com sucesso!');
            setShowAppointmentModal(false);
            setNewAppointment({
                ...emptyAppointmentForm,
                professionalId: professionals.length === 1 ? String(professionals[0].id) : ''
            });
            fetchAllData();
        } catch (err) {
            handleApiError(err, 'registrar a consulta');
        }
    };
//ok
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.recipientId || !newMessage.content) { setError('Destinatário e conteúdo são obrigatórios.'); return; }
        try {
            await apiClient.post('/secretary/messages', newMessage);
            setSuccessMessage('Mensagem enviada com sucesso!');
            setShowCommunicationModal(false);
            setNewMessage({ recipientId: '', content: '' });
            const messagesRes = await apiClient.get('/secretary/messages');
            setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
        } catch (err) {
            handleApiError(err, 'enviar mensagem');
        }
    };
//ok
    const handleFieldUpdate = async (appointmentId, field, value) => {
        setAppointments(prev => prev.map(c => c.id === appointmentId ? { ...c, [field]: value } : c));
        try {
            await apiClient.put(`/secretary/appointments/${appointmentId}`, { field, value });
            setSuccessMessage('Campo atualizado com sucesso!');
        } catch (err) {
            handleApiError(err, 'atualizar o campo');
            fetchAllData();
        }
    };
//ok
    const handleAddPatient = async (e) => {
        e.preventDefault();
        if (!user) return;
        if (isClinicSecretary && !newPatient.professionalId) {
            setError('Selecione o profissional responsavel pelo paciente.');
            return;
        }
        try {
            await apiClient.post('/secretary/patients', newPatient);
            setSuccessMessage('Paciente adicionado com sucesso!');
            setShowPatientModal(false);
            setNewPatient({
                ...emptyPatientForm,
                professionalId: professionals.length === 1 ? String(professionals[0].id) : ''
            });
            fetchAllData(); // Simplificado para buscar todos os dados novamente
        } catch (err) {
            handleApiError(err, 'adicionar paciente');
        }
    };
//ok
    const handlePatientRowClick = async (patient) => {
        // 1. Validação inicial para garantir que um paciente válido foi clicado.
        if (!patient || !patient.id) {
            setError('Ocorreu um erro ao selecionar o paciente.');
            console.error('Tentativa de clique em paciente inválido:', patient);
            setSelectedPatient(null);
            return;
        }

        try {
            // 2. "Limpa" o painel de detalhes e mostra o nome do paciente imediatamente.
            //    Isso dá um feedback visual rápido para o usuário.
            setSelectedPatient({ ...patient, notes: [] }); 
            
            // 3. Busca as notas do paciente. A função fetchPatientNotes já tem seu próprio try/catch.
            await fetchPatientNotes(patient.id);

        } catch (err) {
            // 4. Este catch agora serve como uma segurança extra, caso algo inesperado aconteça.
            handleApiError(err, 'carregar os detalhes do paciente');
            setSelectedPatient(null); // Limpa o painel de detalhes em caso de erro.
        }
    };
//ok
    const handleUpdatePatient = async (e) => {
        e.preventDefault();
        if (!editingPatient?.id || !user) {
            setError('Nenhum paciente selecionado para edição.');
            return;
        }
        try {
            const payload = {
                name: editingPatient.name,
                birthDate: editingPatient.birthDate ? new Date(editingPatient.birthDate).toISOString().split('T')[0] : null,
                phone: editingPatient.phone,
                email: editingPatient.email,
                diagnosis: editingPatient.diagnosis,
                notes: editingPatient.observacoes,
                professionalId: editingPatient.professionalId || editingPatient.professional_id
            };
            // USA O apiClient E A ROTA CORRETA
            await apiClient.put(`/secretary/patients/${editingPatient.id}`, payload);
            setSuccessMessage('Dados do paciente atualizados com sucesso!');
            setShowEditPatientModal(false);
            fetchAllData(); // Simplificado para buscar todos os dados novamente
            setSelectedPatient(prev => ({ ...prev, ...editingPatient, observacoes: payload.notes }));
            setEditingPatient(null);
        } catch (err) {
            handleApiError(err, 'atualizar paciente');
        }
    };

//ok
    const handleUpdateStatus = async (patientId, newStatus) => {
        try {
            await apiClient.put(`/secretary/patients/${patientId}/status`, { status: newStatus });
            setSuccessMessage('Status do paciente atualizado!');
            const patientsRes = await apiClient.get('/secretary/patients');
            setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : []);
            if (selectedPatient?.id === patientId) {
                setSelectedPatient({ ...selectedPatient, status: newStatus });
            }
        } catch (err) {
            handleApiError(err, 'atualizar status do paciente');
        }
    };
//ok
    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!selectedPatient || !selectedPatient.id) {
            setError('Selecione um paciente para adicionar nota.');
            return;
        }
        if (!selectedPatient) return;
        try {
            await apiClient.post(`/secretary/patients/${selectedPatient.id}/notes`, newNote);
            setSuccessMessage('Nota adicionada com sucesso!');
            setNewNote({ title: '', content: '' });
            setShowNoteModal(false);
            fetchPatientNotes(selectedPatient.id);
        } catch (err) {
            handleApiError(err, 'adicionar nota');
        }
    };
//ok
    const fetchPatientNotes = async (patientId) => {
        if (!patientId) return;
        try {
            const response = await apiClient.get(`/secretary/patients/${patientId}/notes`);
            setSelectedPatient(prev => ({ ...prev, notes: Array.isArray(response.data) ? response.data : [] }));
        } catch (err) {
            handleApiError(err, 'carregar notas do paciente');
            setSelectedPatient(prev => ({ ...prev, notes: [] }));
        }
    };
//ok
    const filteredPatients = useMemo(() => {
        if (!Array.isArray(patients)) return [];
        return patients.filter(patient => {
            const searchTermLower = searchTerm.toLowerCase();
            const nameMatch = patient.name?.toLowerCase().includes(searchTermLower);
            const diagnosisMatch = patient.diagnosis ? patient.diagnosis.toLowerCase().includes(searchTermLower) : false;
            const statusMatch = !statusFilter || patient.status === statusFilter;
            const patientProfessionalId = patient.professionalId ?? patient.professional_id;
            const professionalMatch = !isClinicSecretary || !filters.professionalId || String(patientProfessionalId) === filters.professionalId;
            return (nameMatch || diagnosisMatch) && statusMatch && professionalMatch;
        });
    }, [patients, searchTerm, statusFilter, filters.professionalId, isClinicSecretary]);

    const availableAppointmentPatients = useMemo(() => {
        if (!Array.isArray(patients)) return [];
        if (!newAppointment.professionalId) return patients;
        return patients.filter(patient => {
            const patientProfessionalId = patient.professionalId ?? patient.professional_id;
            return !patientProfessionalId || String(patientProfessionalId) === String(newAppointment.professionalId);
        });
    }, [patients, newAppointment.professionalId]);

    const getProfessionalName = useCallback((professionalId) => {
        const matchedProfessional = professionals.find(item => String(item.id) === String(professionalId));
        return matchedProfessional?.name || 'N/A';
    }, [professionals]);


    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';
    const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : 'N/A';

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
//ok
    const filteredAppointments = useMemo(() => {
        if (!Array.isArray(appointments)) return [];
        return appointments.filter(app => {
            const appointmentDate = app.appointment_date ? app.appointment_date.split('T')[0] : '';
            const matchesDate = !filters.date || appointmentDate === filters.date;
            const appPatientId = app.patient_id ?? app.patientId;
            const appProfessionalId = app.professional_id ?? app.professionalId;
            const matchesPatient = !filters.patientId || String(appPatientId) === filters.patientId;
            const matchesProfessional = !filters.professionalId || String(appProfessionalId) === filters.professionalId;
            const matchesStatus = !filters.status || app.status === filters.status;
            return matchesDate && matchesPatient && matchesProfessional && matchesStatus;
        });
    }, [appointments, filters]);

    const { appointmentsToday, upcomingAppointments, pendingPayments } = useMemo(() => {
        if (!Array.isArray(appointments)) return { appointmentsToday: [], upcomingAppointments: [], pendingPayments: [] };
        const today = new Date().toISOString().slice(0, 10);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const todayList = appointments.filter(a => a.appointment_date?.slice(0, 10) === today);
        const upcomingList = appointments.filter(a => {
            const appDate = new Date(a.appointment_date);
            return appDate > new Date() && appDate <= nextWeek;
        }).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
        const pendingList = appointments.filter(a => a.payment_status === 'Pendente' && a.status === 'Realizada');

        return { appointmentsToday: todayList, upcomingAppointments: upcomingList, pendingPayments: pendingList };
    }, [appointments]);

    const chartData = useMemo(() => {
        if (!Array.isArray(appointments)) return { statusDistribution: { labels: [], datasets: [] }, dailyPerformance: { labels: [], datasets: [] } };
        
        const statusCounts = appointments.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
        }, {});

    const dailyCounts = appointments.reduce((acc, app) => {
        if (app.status === 'Realizada') {
            const date = formatDate(app.appointment_date);
            acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
    }, {});

    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }).reverse();

    return {
        statusDistribution: {
            labels: Object.keys(statusCounts),
            datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d'],
            hoverOffset: 4,
            }],
        },
        dailyPerformance: {
            labels: last7Days,
            datasets: [{
            label: 'Consultas Realizadas',
            data: last7Days.map(day => dailyCounts[day] || 0),
            backgroundColor: 'rgba(0, 123, 255, 0.5)',
            borderColor: 'rgba(0, 123, 255, 1)',
            borderWidth: 1,
            }],
        },
        };
    }, [appointments]);
//ok
    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (user.tipo_usuario !== 'secretaria' || (secretaryId && parseInt(secretaryId, 10) !== user.id)) {
            logout();
            navigate('/login');
            return;
        }
        fetchAllData();
    }, [user, navigate, secretaryId, logout, fetchAllData]);

    if (loading) { // CORRIGIDO: Usando 'loading'
        return (
            <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Carregando...</span>
                </Spinner>
            </Container>
        );
    }

return (
        <div className="App bg-light min-vh-100">
            <nav className="top-bar fixed-top shadow-sm">
                <Container>
                    <Row className="align-items-center py-3">
                        <Col md={4} className="text-center text-md-start">
                            <img src={logonovo} alt="AutisConnect" className="top-bar-logo" />
                        </Col>
                        <Col md={4} className="text-center d-none d-md-block">
                            <span className="text-white fw-semibold">Dashboard da Secretaria</span>
                        </Col>
                        <Col md={4} className="text-center text-md-end">
                            <Button variant="outline-light" size="sm" onClick={() => { logout(); navigate('/'); }}>Sair</Button>
                        </Col>
                    </Row>
                </Container>
            </nav>

            <div className="home-page" style={{ paddingTop: '85px' }}>
                <section className="hero-section hero-short">
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={7} className="mb-4 mb-lg-0">
                                <div className="hero-content-box p-4 rounded-4">
                                    <h2 className="display-6 fw-bold mb-2 text-white">Dashboard da Secretaria</h2>
                                    <p className="text-white-90 mb-1">
                                        {isClinicSecretary
                                            ? 'Organizando a agenda operacional da clinica.'
                                            : `Organizando a clinica de ${professional?.name || '...'}.`}
                                    </p>
                                    <p className="text-white-90 mb-0">
                                        Gestao de pacientes, consultas e comunicacao em um so lugar.
                                    </p>
                                </div>
                            </Col>
                            <Col lg={5}>
                                <Card className="shadow-sm border-0">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-2">Resumo rapido</h5>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="text-muted">Pacientes cadastrados</span>
                                            <span className="fw-semibold">{patients.length}</span>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="text-muted">Consultas agendadas</span>
                                            <span className="fw-semibold">{appointments.length}</span>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <span className="text-muted">Mensagens</span>
                                            <span className="fw-semibold">{messages.length}</span>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Badge bg="info">Equipe ativa</Badge>
                                            <Badge bg="secondary">Clinica</Badge>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <main className="dashboard-section py-4">
                    <Container fluid className="secretary-dashboard">
        {successMessage && <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>{successMessage}</Alert>}
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={3} className>
                            <Button variant="primary" onClick={() => setShowAppointmentModal(true)}><PlusCircle className="me-2" /> Nova Consulta</Button>
                        </Col>
                    </Row>
                </Card.Body>
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav variant="tabs" className="mb-4">
            <Nav.Item><Nav.Link eventKey="overview"><Calendar2Check className="me-2" />Visão Geral</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="analytics"><BarChartLine className="me-2" />Análises</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="full_history"><Calendar2Check className="me-2" />Consultas</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="patients"><People className="me-2" />Pacientes</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="communication"><ChatDots className="me-2" />Comunicação</Nav.Link></Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="overview">
              <Row>
                <Col lg={8}>
                  <DashboardCard title="Consultas de Hoje" isLoading={loading}>
                    <Table striped hover responsive size="sm">
                      <thead><tr><th>Horário</th><th>Paciente</th><th>Tipo</th><th>Status</th></tr></thead>
                      <tbody>
                        {appointmentsToday.length > 0 ? appointmentsToday.map(app => (
                          <tr key={app.id}>
                            <td>{formatTime(app.appointment_time)}</td>
                            <td>{app.patient_name}</td>
                            <td>{app.appointment_type}</td>
                            <td><Badge bg={app.status === 'Realizada' ? 'success' : 'info'}>{app.status}</Badge></td>
                          </tr>
                        )) : <tr><td colSpan="4" className="text-center text-muted">Nenhuma consulta para hoje.</td></tr>}
                      </tbody>
                    </Table>
                  </DashboardCard>
                  <div className="mt-4">
                    <DashboardCard title="Próximos Agendamentos (7 dias)" isLoading={loading}>
                      <Table striped hover responsive size="sm">
                        <thead><tr><th>Data</th><th>Horário</th><th>Paciente</th><th>Status</th></tr></thead>
                        <tbody>
                          {upcomingAppointments.length > 0 ? upcomingAppointments.map(app => (
                            <tr key={app.id}>
                              <td>{formatDate(app.appointment_date)}</td>
                              <td>{formatTime(app.appointment_time)}</td>
                              <td>{app.patient_name}</td>
                              <td><Badge bg="secondary">{app.status}</Badge></td>
                            </tr>
                          )) : <tr><td colSpan="4" className="text-center text-muted">Nenhum agendamento próximo.</td></tr>}
                        </tbody>
                      </Table>
                    </DashboardCard>
                  </div>
                </Col>
                <Col lg={4}>
                  {isClinicSecretary ? (
                    <DashboardCard title="Profissionais da Clinica" isLoading={loading}>
                      <Table striped hover responsive size="sm">
                        <thead><tr><th>Nome</th><th>Especialidade</th></tr></thead>
                        <tbody>
                          {professionals.length > 0 ? professionals.map(item => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>{item.especialidade || item.specialty || 'N/A'}</td>
                            </tr>
                          )) : <tr><td colSpan="2" className="text-center text-muted">Nenhum profissional encontrado.</td></tr>}
                        </tbody>
                      </Table>
                    </DashboardCard>
                  ) : (
                    <DashboardCard title="Pagamentos Pendentes" isLoading={loading}>
                      <Table striped hover responsive size="sm">
                        <thead><tr><th>Paciente</th><th>Valor</th></tr></thead>
                        <tbody>
                          {pendingPayments.length > 0 ? pendingPayments.map(app => (
                            <tr key={app.id}>
                              <td>{app.patient_name}</td>
                              <td>R$ {parseFloat(app.value).toFixed(2)}</td>
                            </tr>
                          )) : <tr><td colSpan="2" className="text-center text-muted">Nenhum pagamento pendente.</td></tr>}
                        </tbody>
                      </Table>
                    </DashboardCard>
                  )}
                </Col>
              </Row>
            </Tab.Pane>

            {/* O resto das suas abas e modais permanecem os mesmos */}
            <Tab.Pane eventKey="analytics">
              <Row>
                <Col lg={8} className="mb-4">
                  <DashboardCard title="Atendimentos por Dia (Últimos 7 dias)" isLoading={loading}>
                    <Bar data={chartData.dailyPerformance} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                  </DashboardCard>
                </Col>
                <Col lg={4} className="mb-4">
                  <DashboardCard title="Status das Consultas" isLoading={loading}>
                    <Doughnut data={chartData.statusDistribution} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                  </DashboardCard>
                </Col>
              </Row>
            </Tab.Pane>

            <Tab.Pane eventKey="full_history">
              <Card>
                <Card.Header>
                  <Row className="align-items-center">
                    <Col>
                      <h5>Histórico Geral de Consultas</h5>
                    </Col>
                  </Row>
                </Card.Header>
                    {/*<Row className="align-items-center">
                      <p></p>
                        <Col md={3} className="ms-auto text-end">
                            <Button variant="primary" onClick={() => setShowAppointmentModal(true)}><PlusCircle className="me-2" /> Nova Consulta</Button>
                        </Col>
                    </Row>*/}
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={isClinicSecretary ? 3 : 4}><Form.Group><Form.Label>Filtrar por Data</Form.Label><Form.Control type="date" name="date" value={filters.date} onChange={handleFilterChange} /></Form.Group></Col>
                    {isClinicSecretary && <Col md={3}><Form.Group><Form.Label>Filtrar por Profissional</Form.Label><Form.Select name="professionalId" value={filters.professionalId} onChange={handleFilterChange}><option value="">Todos</option>{Array.isArray(professionals) && professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></Form.Group></Col>}
                    <Col md={isClinicSecretary ? 3 : 4}><Form.Group><Form.Label>Filtrar por Paciente</Form.Label><Form.Select name="patientId" value={filters.patientId} onChange={handleFilterChange}><option value="">Todos</option>{Array.isArray(patients) && patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></Form.Group></Col>
                    <Col md={isClinicSecretary ? 3 : 4}><Form.Group><Form.Label>Filtrar por Status</Form.Label><Form.Select name="status" value={filters.status} onChange={handleFilterChange}><option value="">Todos</option><option value="Agendada">Agendada</option><option value="Confirmada">Confirmada</option><option value="Realizada">Realizada</option><option value="Cancelada">Cancelada</option><option value="Não Realizada">Não Realizada</option></Form.Select></Form.Group></Col>
                  </Row>
                  <Table striped bordered hover responsive>
                    <thead><tr><th>Data/Hora</th>{isClinicSecretary && <th>Profissional</th>}<th>Paciente</th>{!isClinicSecretary && <th>Valor (R$)</th>}<th>Status</th>{!isClinicSecretary && <th>Forma Pag.</th>}{!isClinicSecretary && <th>Detalhes</th>}{!isClinicSecretary && <th>Status Pag.</th>}</tr></thead>
                    <tbody>
                      {filteredAppointments.length > 0 ? filteredAppointments.map((app) => (
                        <tr key={app.id}>
                          <td>{`${formatDate(app.appointment_date)} ${formatTime(app.appointment_time)}`}</td>
                          {isClinicSecretary && <td>{app.professional_name || getProfessionalName(app.professional_id ?? app.professionalId)}</td>}
                          <td>{app.patient_name || 'N/A'}</td>
                          {!isClinicSecretary && <td>{app.value ? parseFloat(app.value).toFixed(2) : '0.00'}</td>}
                          <td><Form.Select size="sm" value={app.status} onChange={(e) => handleFieldUpdate(app.id, 'status', e.target.value)}><option value="Agendada">Agendada</option><option value="Confirmada">Confirmada</option><option value="Realizada">Realizada</option><option value="Cancelada">Cancelada</option><option value="Não Realizada">Não Realizada</option></Form.Select></td>
                          {!isClinicSecretary && <td><Form.Select size="sm" value={app.payment_method || ''} onChange={(e) => handleFieldUpdate(app.id, 'payment_method', e.target.value)}><option value="">N/A</option><option value="Pix">Pix</option><option value="Crédito">Crédito</option><option value="Débito">Débito</option><option value="Dinheiro">Dinheiro</option><option value="Plano de Saúde">Plano de Saúde</option><option value="Outros">Outros</option></Form.Select></td>}
                          {!isClinicSecretary && <td>{(app.payment_method === 'Plano de Saúde' || app.payment_method === 'Outros') && (<Form.Control type="text" size="sm" defaultValue={app.payment_details || ''} onBlur={(e) => handleFieldUpdate(app.id, 'payment_details', e.target.value)} />)}</td>}
                          {!isClinicSecretary && <td><Form.Select size="sm" value={app.payment_status} onChange={(e) => handleFieldUpdate(app.id, 'payment_status', e.target.value)}><option value="Pendente">Pendente</option><option value="Pago">Pago</option><option value="Atrasado">Atrasado</option><option value="Isento">Isento</option></Form.Select></td>}
                        </tr>
                      )) : <tr><td colSpan={isClinicSecretary ? 4 : 7} className="text-center">Nenhuma consulta encontrada.</td></tr>}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab.Pane>
            
            <Tab.Pane eventKey="patients">
                <Row className="mb-3">
                    <Col md={isClinicSecretary ? 4 : 6}>
                        <Form.Control
                            type="text"
                            placeholder="Buscar pacientes por nome ou diagnóstico..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Col>
                    {isClinicSecretary && (
                        <Col md={2}>
                            <Form.Select value={filters.professionalId} onChange={(e) => setFilters(prev => ({ ...prev, professionalId: e.target.value }))}>
                                <option value="">Todos os profissionais</option>
                                {professionals.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </Form.Select>
                        </Col>
                    )}
                    <Col md={3}>
                        <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">Todos os Status</option>
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                        </Form.Select>
                    </Col>
                    <Col md={3}>
                        <Button variant="primary" onClick={() => setShowPatientModal(true)} className="w-100">
                            <PlusCircle className="me-2" /> Adicionar Paciente
                        </Button>
                    </Col>
                </Row>

                <Row>
                    <Col md={8}>
                        <Card>
                            <Card.Header><h5>Lista de Pacientes</h5></Card.Header>
                            <Card.Body>
                                {loading ? (
                                    <div className="text-center"><Spinner animation="border" /></div>
                                ) : filteredPatients.length > 0 ? (
                                    <Table responsive hover>
                                        <thead>
                                            <tr>
                                                <th>Nome</th>
                                                {isClinicSecretary && <th>Profissional</th>}
                                                <th>Telefone</th>
                                                <th>Diagnóstico</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPatients.map(patient => (
                                                <tr key={patient.id} onClick={() => handlePatientRowClick(patient)} style={{ cursor: 'pointer' }}>
                                                    <td>{patient.name}</td>
                                                    {isClinicSecretary && <td>{patient.professionalName || getProfessionalName(patient.professionalId ?? patient.professional_id)}</td>}
                                                    <td>{patient.phone || 'N/A'}</td>
                                                    <td>{patient.diagnosis || 'N/A'}</td>
                                                    <td><Badge bg={patient.status === 'ativo' ? 'success' : 'secondary'}>{patient.status}</Badge></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <p className="text-muted">Nenhum paciente encontrado.</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        {selectedPatient && selectedPatient.id ? (
                    <Card>
                        <Card.Header>
                            <h6>Detalhes do Paciente</h6>
                        </Card.Header>
                        {/* O botão agora está fora do Header, mas dentro do Card */}
                        <Button 
                            variant="outline-secondary" 
                            size="sm"
                            className="m-2" // Adiciona uma pequena margem para espaçamento
                            onClick={() => {
                                console.log("Abrindo modal de edição para o paciente:", selectedPatient);
                                setEditingPatient(selectedPatient);
                                setShowEditPatientModal(true);
                            }}
                        >
                            Editar
                        </Button>
                        <Card.Body>
                            <h5>{selectedPatient.name}</h5>
                            {isClinicSecretary && <p><strong>Profissional:</strong> {selectedPatient.professionalName || getProfessionalName(selectedPatient.professionalId ?? selectedPatient.professional_id)}</p>}
                            <p><strong>Telefone:</strong> {selectedPatient.phone || 'N/A'}</p>
                            <p><strong>Email:</strong> {selectedPatient.email || 'N/A'}</p>
                            <p><strong>Diagnóstico:</strong> {selectedPatient.diagnosis || 'N/A'}</p>
                            <p><strong>Observações:</strong> {selectedPatient.observacoes || 'Nenhuma.'}</p>
                            <p><strong>Status:</strong> 
                                <Badge bg={selectedPatient.status === 'ativo' ? 'success' : 'secondary'} className="ms-2">
                                    {selectedPatient.status}
                                </Badge>
                            </p>
                            <Button
                                variant={selectedPatient.status === 'ativo' ? 'warning' : 'success'}
                                size="sm"
                                onClick={() => handleUpdateStatus(selectedPatient.id, selectedPatient.status === 'ativo' ? 'inativo' : 'ativo')}
                            >
                                {selectedPatient.status === 'ativo' ? 'Desativar' : 'Ativar'}
                            </Button>
                            <hr />
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6>Notas de Evolução</h6>
                                <Button variant="outline-primary" size="sm" onClick={() => setShowNoteModal(true)}>
                                    Adicionar Nota
                                </Button>
                            </div>
                            {selectedPatient.notes && selectedPatient.notes.length > 0 ? (
                                selectedPatient.notes.map(note => (
                                    <div key={note.id} className="mb-3 p-2 border rounded">
                                        <h6>{note.title}</h6>
                                        <p className="mb-1">{note.content}</p>
                                        <small className="text-muted">{formatDate(note.createdAt)}</small>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted">Nenhuma nota de evolução registrada.</p>
                            )}
                        </Card.Body>
                    </Card>
                        ) : (
                            <Card>
                                <Card.Body className="text-center text-muted">
                                    <p>Selecione um paciente da lista para ver os detalhes.</p>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                </Row>
            </Tab.Pane>

            <Tab.Pane eventKey="communication">
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5>Comunicação com Profissional</h5>
                </Card.Header>
                <Row className="align-items-center">
                  <p></p>
                    <Col md={3} className="ms-auto text-end">
                      <Button variant="primary" size="sm" onClick={() => setShowCommunicationModal(true)}>Enviar Mensagem</Button>
                    </Col>
                </Row>
                <Card.Body>
                  {loading ? <Spinner animation="border" size="sm" /> :
                    Array.isArray(messages) && messages.length > 0 ? messages.map((message) => (
                      <div key={message.id} className="d-flex align-items-start mb-3">
                        <Bell className={`me-2 mt-1 ${message.read ? 'text-muted' : 'text-primary'}`} />
                        <div>
                          <p className={message.read ? 'text-muted' : ''}><strong>{message.sender_name || 'N/A'}:</strong> {message.content}</p>
                          <small className="text-muted">{formatDate(message.created_at)}</small>
                        </div>
                      </div>
                    )) : <p className="text-muted">Nenhuma mensagem encontrada.</p>
                  }
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>

        {/* Modais permanecem os mesmos */}


        <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)} size="lg">
          <Modal.Header closeButton><Modal.Title>Registrar Nova Consulta</Modal.Title></Modal.Header>
          <Form onSubmit={handleAddAppointment}>
            <Modal.Body>
              <Row>
                {isClinicSecretary && <Col md={6}><Form.Group className="mb-3"><Form.Label>Profissional *</Form.Label><Form.Select name="professionalId" value={newAppointment.professionalId} onChange={(e) => setNewAppointment({ ...newAppointment, professionalId: e.target.value, patientId: '' })} required><option value="">Selecione um profissional</option>{professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></Form.Group></Col>}
                <Col md={isClinicSecretary ? 6 : 12}><Form.Group className="mb-3"><Form.Label>Paciente *</Form.Label><Form.Select name="patientId" value={newAppointment.patientId} onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })} required><option value="">Selecione um paciente</option>{availableAppointmentPatients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></Form.Group></Col>
              </Row>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Data da Consulta *</Form.Label><Form.Control type="date" name="appointment_date" value={newAppointment.appointment_date} onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })} required /></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Hora da Consulta *</Form.Label><Form.Control type="time" name="appointment_time" value={newAppointment.appointment_time} onChange={(e) => setNewAppointment({ ...newAppointment, appointment_time: e.target.value })} required /></Form.Group></Col>
              </Row>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Tipo de Consulta</Form.Label><Form.Select name="appointment_type" value={newAppointment.appointment_type} onChange={(e) => setNewAppointment({ ...newAppointment, appointment_type: e.target.value })}><option value="Consulta Regular">Consulta Regular</option><option value="Consulta Inicial">Consulta Inicial</option><option value="Acompanhamento">Acompanhamento</option><option value="Avaliação">Avaliação</option><option value="Terapia">Terapia</option></Form.Select></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Status da Consulta</Form.Label><Form.Select name="status" value={newAppointment.status} onChange={(e) => setNewAppointment({ ...newAppointment, status: e.target.value })}><option value="Agendada">Agendada</option><option value="Confirmada">Confirmada</option><option value="Realizada">Realizada</option><option value="Cancelada">Cancelada</option><option value="Não Realizada">Não Realizada</option></Form.Select></Form.Group></Col>
              </Row>
              {!isClinicSecretary && <>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Valor da Consulta (R$) *</Form.Label><Form.Control type="number" step="0.01" name="value" placeholder="Ex: 150.00" value={newAppointment.value} onChange={(e) => setNewAppointment({ ...newAppointment, value: e.target.value })} required /></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Status do Pagamento</Form.Label><Form.Select name="payment_status" value={newAppointment.payment_status} onChange={(e) => setNewAppointment({ ...newAppointment, payment_status: e.target.value })}><option value="Pendente">Pendente</option><option value="Pago">Pago</option><option value="Atrasado">Atrasado</option><option value="Isento">Isento</option></Form.Select></Form.Group></Col>
              </Row>
              <hr />
              <h5>Detalhes do Pagamento</h5>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Forma de Pagamento</Form.Label><Form.Select name="payment_method" value={newAppointment.payment_method} onChange={(e) => setNewAppointment({ ...newAppointment, payment_method: e.target.value })}><option value="Pix">Pix</option><option value="Crédito">Cartão de Crédito</option><option value="Débito">Cartão de Débito</option><option value="Dinheiro">Dinheiro</option><option value="Plano de Saúde">Plano de Saúde</option><option value="Outros">Outros</option></Form.Select></Form.Group></Col>
                {(newAppointment.payment_method === 'Plano de Saúde' || newAppointment.payment_method === 'Outros') && <Col md={6}><Form.Group className="mb-3"><Form.Label>Especifique</Form.Label><Form.Control type="text" name="payment_details" placeholder="Ex: Unimed ou Transferência" value={newAppointment.payment_details} onChange={(e) => setNewAppointment({ ...newAppointment, payment_details: e.target.value })} /></Form.Group></Col>}
              </Row>
              </>}
              <Form.Group className="mb-3"><Form.Label>Observações</Form.Label><Form.Control as="textarea" rows={3} name="notes" value={newAppointment.notes} onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })} /></Form.Group>
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={() => setShowAppointmentModal(false)}>Cancelar</Button><Button variant="primary" type="submit">Salvar Consulta</Button></Modal.Footer>
          </Form>
        </Modal>

        <Modal show={showCommunicationModal} onHide={() => setShowCommunicationModal(false)}>
          <Modal.Header closeButton><Modal.Title>Enviar Mensagem</Modal.Title></Modal.Header>
          <Form onSubmit={handleSendMessage}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Destinatário *</Form.Label>
                <Form.Select value={newMessage.recipientId} onChange={(e) => setNewMessage({ ...newMessage, recipientId: e.target.value })} required>
                  <option value="">Selecione um destinatário</option>
                  {professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mensagem *</Form.Label>
                <Form.Control as="textarea" rows={5} value={newMessage.content} onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })} required />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCommunicationModal(false)}>Cancelar</Button>
              <Button variant="primary" type="submit">Enviar</Button>
            </Modal.Footer>
          </Form>
        </Modal>

                        {/* Modal para Adicionar Paciente */}
                        <Modal show={showPatientModal} onHide={() => setShowPatientModal(false)} size="lg">
                            <Modal.Header closeButton>
                                <Modal.Title>Adicionar Novo Paciente</Modal.Title>
                            </Modal.Header>
                            <Form onSubmit={handleAddPatient}>
                                <Modal.Body>
                                    {isClinicSecretary && (
                                        <Form.Group className="mb-3">
                                            <Form.Label>Profissional responsavel *</Form.Label>
                                            <Form.Select
                                                value={newPatient.professionalId}
                                                onChange={(e) => setNewPatient({...newPatient, professionalId: e.target.value})}
                                                required
                                            >
                                                <option value="">Selecione um profissional</option>
                                                {professionals.map((item) => (
                                                    <option key={item.id} value={item.id}>{item.name}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    )}
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Nome Completo *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={newPatient.name}
                                                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Data de Nascimento</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={newPatient.birthDate}
                                                    onChange={(e) => setNewPatient({...newPatient, birthDate: e.target.value})}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Telefone</Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    value={newPatient.phone}
                                                    onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Email</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    value={newPatient.email}
                                                    onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Diagnóstico do Transtorno do Espectro Autista (TEA)</Form.Label>
                                        
                                        {/* Grupo de botões para selecionar o nível */}
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant={newPatient.diagnosis === 'Nível 1' ? 'primary' : 'outline-primary'}
                                                onClick={() => setNewPatient({...newPatient, diagnosis: 'Nível 1'})}
                                            >
                                                Nível 1
                                            </Button>
                                            <Button
                                                variant={newPatient.diagnosis === 'Nível 2' ? 'primary' : 'outline-primary'}
                                                onClick={() => setNewPatient({...newPatient, diagnosis: 'Nível 2'})}
                                            >
                                                Nível 2
                                            </Button>
                                            <Button
                                                variant={newPatient.diagnosis === 'Nível 3' ? 'primary' : 'outline-primary'}
                                                onClick={() => setNewPatient({...newPatient, diagnosis: 'Nível 3'})}
                                            >
                                                Nível 3
                                            </Button>
                                        </div>
                                        <Form.Text className="text-muted">
                                            Selecione o nível de suporte necessário.
                                        </Form.Text>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Observações</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={newPatient.notes}
                                            onChange={(e) => setNewPatient({...newPatient, notes: e.target.value})}
                                        />
                                    </Form.Group>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="secondary" onClick={() => setShowPatientModal(false)}>
                                        Cancelar
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Adicionar Paciente
                                    </Button>
                                </Modal.Footer>
                            </Form>
                        </Modal>

                                        {/* >>>>> MODAL PARA EDITAR PACIENTE <<<<< */}
                                        <Modal show={showEditPatientModal} onHide={() => setShowEditPatientModal(false)} size="lg">
                                            <Modal.Header closeButton>
                                                <Modal.Title>Editar Dados do Paciente</Modal.Title>
                                            </Modal.Header>
                                            <Form onSubmit={handleUpdatePatient}>
                                                <Modal.Body>
                                                    {editingPatient && (
                                                        <>
                                                            {isClinicSecretary && (
                                                                <Form.Group className="mb-3">
                                                                    <Form.Label>Profissional responsavel *</Form.Label>
                                                                    <Form.Select
                                                                        value={editingPatient.professionalId || editingPatient.professional_id || ''}
                                                                        onChange={(e) => setEditingPatient({...editingPatient, professionalId: e.target.value})}
                                                                        required
                                                                    >
                                                                        <option value="">Selecione um profissional</option>
                                                                        {professionals.map((item) => (
                                                                            <option key={item.id} value={item.id}>{item.name}</option>
                                                                        ))}
                                                                    </Form.Select>
                                                                </Form.Group>
                                                            )}
                                                            <Row>
                                                                <Col md={12}>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>Nome Completo *</Form.Label>
                                                                        <Form.Control
                                                                            type="text"
                                                                            value={editingPatient.name || ''}
                                                                            onChange={(e) => setEditingPatient({...editingPatient, name: e.target.value})}
                                                                            required
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                            <Row>
                                                                <Col md={6}>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>Data de Nascimento</Form.Label>
                                                                        <Form.Control
                                                                            type="date"
                                                                            value={editingPatient.birthDate ? editingPatient.birthDate.split('T')[0] : ''}
                                                                            onChange={(e) => setEditingPatient({...editingPatient, birthDate: e.target.value})}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                                <Col md={6}>
                                                                    <Form.Group className="mb-3">
                                                                        <Form.Label>Telefone</Form.Label>
                                                                        <Form.Control
                                                                            type="tel"
                                                                            value={editingPatient.phone || ''}
                                                                            onChange={(e) => setEditingPatient({...editingPatient, phone: e.target.value})}
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </Row>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Email</Form.Label>
                                                                <Form.Control
                                                                    type="email"
                                                                    value={editingPatient.email || ''}
                                                                    onChange={(e) => setEditingPatient({...editingPatient, email: e.target.value})}
                                                                />
                                                            </Form.Group>
                                                            
                                                            {/* Campo de Diagnóstico com botões */}
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Diagnóstico do Transtorno do Espectro Autista (TEA)</Form.Label>
                                                                <div className="d-flex gap-2">
                                                                    <Button
                                                                        variant={editingPatient.diagnosis === 'Nível 1' ? 'primary' : 'outline-primary'}
                                                                        onClick={() => setEditingPatient({...editingPatient, diagnosis: 'Nível 1'})}
                                                                    >
                                                                        Nível 1
                                                                    </Button>
                                                                    <Button
                                                                        variant={editingPatient.diagnosis === 'Nível 2' ? 'primary' : 'outline-primary'}
                                                                        onClick={() => setEditingPatient({...editingPatient, diagnosis: 'Nível 2'})}
                                                                    >
                                                                        Nível 2
                                                                    </Button>
                                                                    <Button
                                                                        variant={editingPatient.diagnosis === 'Nível 3' ? 'primary' : 'outline-primary'}
                                                                        onClick={() => setEditingPatient({...editingPatient, diagnosis: 'Nível 3'})}
                                                                    >
                                                                        Nível 3
                                                                    </Button>
                                                                </div>
                                                            </Form.Group>
                        
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Observações</Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={3}
                                                                    value={editingPatient.observacoes || ''}
                                                                    onChange={(e) => setEditingPatient({...editingPatient, observacoes: e.target.value})}
                                                                />
                                                            </Form.Group>
                                                        </>
                                                    )}
                                                </Modal.Body>
                                                <Modal.Footer>
                                                    <Button variant="secondary" onClick={() => setShowEditPatientModal(false)}>
                                                        Cancelar
                                                    </Button>
                                                    <Button variant="primary" type="submit">
                                                        Salvar Alterações
                                                    </Button>
                                                </Modal.Footer>
                                            </Form>
                                        </Modal>        <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Adicionar Nota</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleAddNote}>
            <Modal.Body>
              {!selectedPatient?.id && (
                <Alert variant="warning">Selecione um paciente para adicionar a nota.</Alert>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Titulo</Form.Label>
                <Form.Control
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  disabled={!selectedPatient?.id}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Conteudo</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  disabled={!selectedPatient?.id}
                  required
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={!selectedPatient?.id}>
                Salvar Nota
              </Button>
            </Modal.Footer>
          </Form>
</Modal>
    </Container>
  </main>

  <footer className="footer-section py-4">
      <Container>
          <Row className="align-items-center">
              <Col md={6} className="footer-left text-start">
                  <p className="mb-0">
                      {'\u00a9'} 2026 Nf Representacoes Comerciais Ltda.<br />
                      <small>Todos os direitos reservados.</small>
                  </p>
              </Col>
          </Row>
      </Container>
  </footer>
  </div>
  </div>
  );
};

export default SecretaryDashboard;

