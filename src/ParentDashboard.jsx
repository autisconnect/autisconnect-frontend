import React, { useState, useEffect, useContext } from 'react';
import { Container, Navbar, Card, Table, Form, Button, ListGroup, Nav, Tab, Row, Col, Image, Spinner, Alert, Badge, Modal, Accordion } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import logohori from './assets/logohoriz copy.jpg';
import './app.css';

// Importar as imagens de monitoramento
import emotionalMonitoringImg from './assets/emotional_monitoring.png';
import strokeRiskImg from './assets/stroke_risk.png';
import repetitivePatternsImg from './assets/repetitive_patterns.png';
import triggerRecorderImg from './assets/trigger_recorder.png';
import img17 from './assets/UsersPhoto/UsersPhoto17.jpg';
import img18 from './assets/UsersPhoto/UsersPhoto18.jpg';

// Dados simulados de serviços (substituir pelo backend)
const mockServices = [
    {
        id: 17,
        mainPhoto: img17,
        name: 'Nrmendfsystems',
        segment: 'Startup',
    },
    {
        id: 18,
        mainPhoto: img18,
        name: 'Acolher Espaço Terapêutico',
        segment: 'Clínica',
    },
    {
        id: 1,
        mainPhoto: 'https://via.placeholder.com/300x200',
        name: 'Clínica Bem-Estar',
        segment: 'Restaurante',
    },
    {
        id: 2,
        mainPhoto: 'https://via.placeholder.com/300x200',
        name: 'Terapia Infantil Recife',
        segment: 'Cabeleireiro',
    },
    {
        id: 3,
        mainPhoto: 'https://via.placeholder.com/300x200',
        name: 'Salão Autisconnect',
        segment: 'Salão de Beleza',
    },
    {
        id: 4,
        mainPhoto: 'https://via.placeholder.com/300x200',
        name: 'Lanchonete Amigável',
        segment: 'Lanchonete',
    },
];

function ParentDashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id: dashboardId } = useParams(); // Obter ID da URL

    const [consultasHistoricoBackend, setConsultasHistoricoBackend] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Estados para a nova funcionalidade de agendamento de consultas
    const [associatedProfessionals, setAssociatedProfessionals] = useState([]);
    const [selectedProfessional, setSelectedProfessional] = useState('');
    const [professionalAvailability, setProfessionalAvailability] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [appointmentNotes, setAppointmentNotes] = useState('');
    const [patientIdForAppointments, setPatientIdForAppointments] = useState(null); // Para armazenar o patientId associado ao pai
    const [pendingAppointments, setPendingAppointments] = useState([]); // Para consultas "Em Análise" ou "Confirmada"

    // Novos estados para a Visão Geral
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [progressSummary, setProgressSummary] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    // Estados para a funcionalidade de comunicação
    const [communicationProfessionals, setCommunicationProfessionals] = useState([]);
    const [selectedCommunicationProfessional, setSelectedCommunicationProfessional] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCounts, setUnreadCounts] = useState([]);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);

    const jogos = [
        { id: 1, nome: 'Quebra-Cabeça Sensorial', link: '#' },
        { id: 2, nome: 'Jogo da Memória', link: '#' },
    ];

    const [mensagem, setMensagem] = useState('');
    const [services, setServices] = useState(mockServices);
    const [filterSegment, setFilterSegment] = useState(''); // Filtro por segmento

    const segments = ['Clínica', 'Startup', 'Outros'];

    const filteredServices = filterSegment
        ? services.filter(service => service.segment === filterSegment)
        : services;

    // Efeito para validação de usuário e busca de dados
    useEffect(() => {
        const validateUserAndFetchData = async () => {
            if (!user) {
                navigate('/login');
                return;
            }

            if (user.tipo_usuario !== 'pais_responsavel') {
                navigate('/login');
                return;
            }

            // Garante que user.userId existe antes de usar
            if (!user.userId) {
                setLoading(false);
                return;
            }

            if (dashboardId && dashboardId !== user.userId.toString()) {
                console.warn(`Tentativa de acesso ao dashboard ${dashboardId} pelo usuário ${user.userId}`);
                navigate(`/parent-dashboard/${user.userId}`);
                return;
            }

            // Declare o token uma única vez aqui para este useEffect
            const token = localStorage.getItem('token');

            // Função para buscar o patientId associado ao pai logado
            const fetchPatientId = async () => {
                try {
                    const response = await fetch(`/api/parent/dashboard/${user.userId}/patient-id`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar Patient ID: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    if (data.patientId) {
                        setPatientIdForAppointments(data.patientId);
                        return data.patientId;
                    } else {
                        setError("Nenhum paciente associado encontrado para este responsável.");
                        return null;
                    }
                } catch (err) {
                    console.error("Erro ao buscar Patient ID:", err);
                    setError("Erro ao carregar Patient ID: " + err.message);
                    return null;
                }
            };

            const currentPatientId = await fetchPatientId();

            if (currentPatientId) {
                // Busca histórico de consultas
                try {
                    const response = await fetch(`/api/parent/dashboard/${user.userId}/consultations`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setConsultasHistoricoBackend(data);
                } catch (err) {
                    console.error("Erro ao buscar histórico de consultas:", err);
                    setError("Erro ao carregar histórico de consultas: " + err.message);
                }

                // Busca profissionais associados ao paciente
                try {
                    const response = await fetch(`/api/parent/patient/${currentPatientId}/associated-professionals`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar profissionais: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setAssociatedProfessionals(data);
                } catch (err) {
                    console.error("Erro ao buscar profissionais associados:", err);
                    setError("Erro ao carregar profissionais associados: " + err.message);
                }

                // Busca consultas pendentes/confirmadas do paciente
                try {
                    const response = await fetch(`/api/parent/patient/${currentPatientId}/appointments`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar consultas do paciente: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setPendingAppointments(data);
                } catch (err) {
                    console.error("Erro ao buscar consultas do paciente:", err);
                    setError("Erro ao carregar consultas do paciente: " + err.message);
                }

                // --- Novas chamadas para a Visão Geral ---

                // Próximas Consultas Agendadas
                try {
                    const response = await fetch(`/api/parent/patient/${currentPatientId}/upcoming-appointments`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar próximas consultas: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setUpcomingAppointments(data);
                } catch (err) {
                    console.error("Erro ao buscar próximas consultas:", err);
                    setError("Erro ao carregar próximas consultas: " + err.message);
                }

                // Resumo do Progresso Recente do Paciente
                try {
                    const response = await fetch(`/api/parent/patient/${currentPatientId}/progress-summary`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar resumo de progresso: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setProgressSummary(data);
                } catch (err) {
                    console.error("Erro ao buscar resumo de progresso:", err);
                    setError("Erro ao carregar resumo de progresso: " + err.message);
                }

                // Alertas e Notificações Importantes
                try {
                    const response = await fetch(`/api/parent/patient/${currentPatientId}/alerts`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar alertas: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setAlerts(data);
                } catch (err) {
                    console.error("Erro ao buscar alertas:", err);
                    setError("Erro ao carregar alertas: " + err.message);
                }

                // Tarefas e Recomendações Recentes dos Profissionais
                // ATENÇÃO: A tabela patient_recommendations não foi encontrada. Se esta rota for usada, ela falhará.
                try {
                    const response = await fetch(`/api/parent/patient/${currentPatientId}/recommendations`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar recomendações: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setRecommendations(data);
                } catch (err) {
                    console.error("Erro ao buscar recomendações:", err);
                    setError("Erro ao carregar recomendações: " + err.message);
                }

                // Atividade Recente (Log de Ações)
                try {
                    const response = await fetch(`/api/parent/patient/${currentPatientId}/recent-activity`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar atividades recentes: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setRecentActivity(data);
                } catch (err) {
                    console.error("Erro ao buscar atividades recentes:", err);
                    setError("Erro ao carregar atividades recentes: " + err.message);
                }

                // --- Novas chamadas para Comunicação ---

                // Buscar profissionais para comunicação
                try {
                    const response = await fetch(`/api/parent/patient/${currentPatientId}/communication-professionals`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar profissionais para comunicação: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setCommunicationProfessionals(data);
                } catch (err) {
                    console.error("Erro ao buscar profissionais para comunicação:", err);
                    setError("Erro ao carregar profissionais para comunicação: " + err.message);
                }

                // Buscar contagem de mensagens não lidas
                try {
                    const response = await fetch(`/api/parent/patient/${currentPatientId}/unread-messages-count`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar contagem de mensagens não lidas: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setUnreadCounts(data);
                } catch (err) {
                    console.error("Erro ao buscar contagem de mensagens não lidas:", err);
                    setError("Erro ao carregar contagem de mensagens não lidas: " + err.message);
                }

            } // Fim do if (currentPatientId)

            setLoading(false);
        };

        validateUserAndFetchData();

    }, [user, navigate, dashboardId]); // Dependências

    // Efeito para buscar disponibilidade do profissional quando um é selecionado
    useEffect(() => {
        const fetchProfessionalAvailability = async () => {
            if (selectedProfessional) {
                const token = localStorage.getItem('token'); // Declare o token aqui
                try {
                    const response = await fetch(`/api/professional/${selectedProfessional}/availability`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Erro ao buscar disponibilidade: ${errorData.error || response.statusText}`);
                    }
                    const data = await response.json();
                    setProfessionalAvailability(data);
                } catch (err) {
                    console.error("Erro ao buscar disponibilidade do profissional:", err);
                    setError("Erro ao carregar disponibilidade: " + err.message);
                }
            } else {
                setProfessionalAvailability([]); // Limpa a disponibilidade se nenhum profissional for selecionado
            }
        };

        fetchProfessionalAvailability();
    }, [selectedProfessional]); // Depende do profissional selecionado

    // Função para buscar mensagens de um profissional específico
    const fetchMessages = async (professionalId) => {
        if (!patientIdForAppointments) return;

        setLoadingMessages(true);
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`/api/parent/patient/${patientIdForAppointments}/messages/${professionalId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro ao buscar mensagens: ${errorData.error || response.statusText}`);
            }
            const data = await response.json();
            setMessages(data);

            // Marcar mensagens como lidas
            await fetch(`/api/parent/patient/${patientIdForAppointments}/messages/${professionalId}/mark-read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Atualizar contagem de não lidas
            const unreadResponse = await fetch(`/api/parent/patient/${patientIdForAppointments}/unread-messages-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (unreadResponse.ok) {
                const unreadData = await unreadResponse.json();
                setUnreadCounts(unreadData);
            }

        } catch (err) {
            console.error("Erro ao buscar mensagens:", err);
            setError("Erro ao carregar mensagens: " + err.message);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Função para enviar uma nova mensagem
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedCommunicationProfessional || !patientIdForAppointments) {
            return;
        }

        setSendingMessage(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/parent/patient/${patientIdForAppointments}/send-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    professionalId: selectedCommunicationProfessional.id,
                    message: newMessage.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro ao enviar mensagem: ${errorData.error || response.statusText}`);
            }

            const result = await response.json();
            
            // Adicionar a nova mensagem à lista
            setMessages(prev => [...prev, result.data]);
            setNewMessage('');

            // Atualizar contagem de não lidas
            const unreadResponse = await fetch(`/api/parent/patient/${patientIdForAppointments}/unread-messages-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (unreadResponse.ok) {
                const unreadData = await unreadResponse.json();
                setUnreadCounts(unreadData);
            }

        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
            alert("Erro ao enviar mensagem: " + err.message);
        } finally {
            setSendingMessage(false);
        }
    };

    // Função para abrir modal de comunicação com um profissional
    const handleOpenCommunication = (professional) => {
        setSelectedCommunicationProfessional(professional);
        setShowMessageModal(true);
        fetchMessages(professional.id);
    };

    // Função para fechar modal de comunicação
    const handleCloseCommunication = () => {
        setShowMessageModal(false);
        setSelectedCommunicationProfessional(null);
        setMessages([]);
        setNewMessage('');
    };

    // Função para obter contagem de mensagens não lidas para um profissional
    const getUnreadCount = (professionalId) => {
        const unread = unreadCounts.find(u => u.professionalId === professionalId);
        return unread ? unread.unreadCount : 0;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMensagemSubmit = (e) => {
        e.preventDefault();
        alert('Mensagem enviada: ' + mensagem); // Simulação
        setMensagem('');
    };

    const handleRequestAppointment = async (e) => {
        e.preventDefault();
        if (!patientIdForAppointments || !selectedProfessional || !selectedDate || !selectedTime) {
            alert('Por favor, preencha todos os campos obrigatórios para agendar a consulta.');
            return;
        }

        try {
            const token = localStorage.getItem('token'); // Declare o token aqui
            const response = await fetch(`/api/parent/patient/${patientIdForAppointments}/request-appointment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    professionalId: selectedProfessional,
                    date: selectedDate,
                    time: selectedTime,
                    notes: appointmentNotes
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro ao solicitar agendamento: ${errorData.error || response.statusText}`);
            }

            alert('Solicitação de agendamento enviada com sucesso! Aguarde a confirmação do profissional.');
            // Limpar formulário e recarregar consultas pendentes
            setSelectedProfessional('');
            setSelectedDate('');
            setSelectedTime('');
            setAppointmentNotes('');
            // Recarregar a lista de consultas pendentes
            const updatedResponse = await fetch(`/api/parent/patient/${patientIdForAppointments}/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (updatedResponse.ok) {
                const updatedData = await updatedResponse.json();
                setPendingAppointments(updatedData);
            }

        } catch (err) {
            console.error("Erro ao solicitar agendamento:", err);
            setError("Erro ao solicitar agendamento: " + err.message);
            alert("Erro ao solicitar agendamento: " + err.message);
        }
    };

    // Abrir EmotionDetector em uma nova guia
    const handleOpenEmotionDetector = () => {
        window.open('/emotion-detector', '_blank', 'noopener,noreferrer');
    };

    // Abrir StrokeRiskMonitor em uma nova guia
    const handleOpenStrokeDetector = () => {
        window.open('/stroke-risk-monitor', '_blank', 'noopener,noreferrer');
    };

    // Abrir Monitoramento de Padrões Repetitivos
    const handleOpenStereotypyMonitor = () => {
        window.open('/stereotypy-monitor', '_blank', 'noopener,noreferrer');
    };

    // Abrir Trigger Recorder
    const handleOpenTriggerRecorder = () => {
        window.open('/trigger-recorder', '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <div className="App">
            {/* Navbar Fixa */}
            <Navbar bg="light" expand="lg" fixed="top" className="mb-4">
                <Container>
                    <Navbar.Brand>
                        <img
                            src={logohori}
                            alt="Logo Autisconnect Horizontal"
                            className="d-inline-block align-top logo"
                        />
                    </Navbar.Brand>
                    <Navbar.Text className="mx-auto d-none d-lg-block fw-light">
                        Painel dos Pais: <strong className="fw-semibold">{user?.username || 'Carregando...'}</strong>
                    </Navbar.Text>
                    <div className="ms-auto">
                        <Button variant="danger" onClick={handleLogout}>
                            Sair
                        </Button>
                    </div>
                </Container>
            </Navbar>

            {/* Modal de Comunicação */}
            <Modal show={showMessageModal} onHide={handleCloseCommunication} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Comunicação com {selectedCommunicationProfessional?.name}
                        {selectedCommunicationProfessional?.specialty && (
                            <small className="text-muted"> ({selectedCommunicationProfessional.specialty})</small>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Área de mensagens */}
                    <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.375rem', padding: '1rem', marginBottom: '1rem' }}>
                        {loadingMessages ? (
                            <div className="text-center">
                                <Spinner animation="border" size="sm" />
                                <span className="ms-2">Carregando mensagens...</span>
                            </div>
                        ) : messages.length > 0 ? (
                            messages.map((message) => (
                                <div key={message.id} className={`mb-3 ${message.isFromParent ? 'text-end' : 'text-start'}`}>
                                    <div className={`d-inline-block p-2 rounded ${message.isFromParent ? 'bg-primary text-white' : 'bg-light'}`} style={{ maxWidth: '70%' }}>
                                        <div>{message.message}</div>
                                        <small className={`d-block mt-1 ${message.isFromParent ? 'text-light' : 'text-muted'}`}>
                                            {new Date(message.createdAt).toLocaleString('pt-BR')}
                                        </small>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted">
                                Nenhuma mensagem ainda. Inicie a conversa!
                            </div>
                        )}
                    </div>

                    {/* Formulário para enviar nova mensagem */}
                    <Form onSubmit={handleSendMessage}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                disabled={sendingMessage}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={handleCloseCommunication} className="me-2">
                                Fechar
                            </Button>
                            <Button variant="primary" type="submit" disabled={sendingMessage || !newMessage.trim()}>
                                {sendingMessage ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Mensagem'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Conteúdo Principal com Abas e classes CSS aplicadas */}
            <section className="parent-section py-5" style={{ marginTop: '70px' }}>
                <Container className="dashboard-container">
                    <h2 className="text-center mb-4">Bem-vindo, Pais ou Responsável!</h2>
                    <Tab.Container id="parent-dashboard-tabs" defaultActiveKey="visao-geral">
                        <Row>
                            <Col sm={3}>
                                <Nav variant="pills" className="flex-column dashboard-tabs">
                                    <Nav.Item>
                                        <Nav.Link eventKey="visao-geral">Visão Geral</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="consultas">Consultas</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="comunicacao">
                                            Comunicação
                                            {unreadCounts.length > 0 && (
                                                <Badge bg="danger" className="ms-2">
                                                    {unreadCounts.reduce((total, item) => total + item.unreadCount, 0)}
                                                </Badge>
                                            )}
                                        </Nav.Link>
                                    </Nav.Item>
                                    {/*<Nav.Item>
                                        <Nav.Link eventKey="jogos">Jogos</Nav.Link>
                                    </Nav.Item>*/}
                                    <Nav.Item>
                                        <Nav.Link eventKey="monitoramento">Monitoramento</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="servicos">Serviços</Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                            <Col sm={9}>
                                <Tab.Content>
                                    <Tab.Pane eventKey="visao-geral">
                                        {/* Próximas Consultas Agendadas */}
                                        <Card className="dashboard-stat-card mb-4">
                                            <Card.Body>
                                                <Card.Title>Próximas Consultas Agendadas</Card.Title>
                                                {upcomingAppointments.length > 0 ? (
                                                    <ListGroup variant="flush">
                                                        {upcomingAppointments.map((appt) => (
                                                            <ListGroup.Item key={appt.id}>
                                                                <strong>{new Date(appt.date).toLocaleDateString('pt-BR')} às {appt.time}</strong> com {appt.professionalName} ({appt.professionalSpecialty})
                                                                {appt.notes && <p className="mb-0 text-muted">Obs: {appt.notes}</p>}
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                ) : (
                                                    <Alert variant="info">Nenhuma consulta agendada para os próximos dias.</Alert>
                                                )}
                                            </Card.Body>
                                        </Card>

                                        {/* Resumo do Progresso Recente do Paciente */}
                                        <Card className="dashboard-stat-card mb-4">
                                            <Card.Body>
                                                <Card.Title>Resumo do Progresso Recente</Card.Title>
                                                {progressSummary ? (
                                                    <>
                                                        <p><strong>Monitoramento Emocional:</strong> {progressSummary.emotionalMonitoring.status} - {progressSummary.emotionalMonitoring.change}</p>
                                                        <p><strong>Padrões Repetitivos:</strong> {progressSummary.repetitivePatterns.status} - {progressSummary.repetitivePatterns.change}</p>
                                                        <p><strong>Progresso Geral:</strong> {progressSummary.overallProgress.status} - {progressSummary.overallProgress.change}</p>
                                                    </>
                                                ) : (
                                                    <Alert variant="info">Nenhum resumo de progresso disponível.</Alert>
                                                )}
                                            </Card.Body>
                                        </Card>

                                        {/* Alertas e Notificações Importantes */}
                                        <Card className="dashboard-stat-card mb-4">
                                            <Card.Body>
                                                <Card.Title>Alertas e Notificações</Card.Title>
                                                {alerts.length > 0 ? (
                                                    <ListGroup variant="flush">
                                                        {alerts.map((alert) => (
                                                            <ListGroup.Item key={alert.id} variant={alert.type === 'Urgente' ? 'danger' : 'warning'}>
                                                                <strong>{alert.type}:</strong> {alert.message} <small className="text-muted">({new Date(alert.createdAt).toLocaleDateString('pt-BR')})</small>
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                ) : (
                                                    <Alert variant="info">Nenhum alerta ou notificação recente.</Alert>
                                                )}
                                            </Card.Body>
                                        </Card>

                                        {/* Tarefas e Recomendações Recentes dos Profissionais */}
                                        <Card className="dashboard-stat-card mb-4">
                                            <Card.Body>
                                                <Card.Title>Tarefas e Recomendações</Card.Title>
                                                {recommendations.length > 0 ? (
                                                    <ListGroup variant="flush">
                                                        {recommendations.map((rec) => (
                                                            <ListGroup.Item key={rec.id}>
                                                                <strong>{rec.professionalName}:</strong> {rec.description} (Status: {rec.status})
                                                                <small className="text-muted"> ({new Date(rec.createdAt).toLocaleDateString('pt-BR')})</small>
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                ) : (
                                                    <Alert variant="info">Nenhuma tarefa ou recomendação recente.</Alert>
                                                )}
                                            </Card.Body>
                                        </Card>

                                        {/* Atividade Recente (Log de Ações) */}
                                        <Card className="dashboard-stat-card mb-4">
                                            <Card.Body>
                                                <Card.Title>Atividade Recente</Card.Title>
                                                {recentActivity.length > 0 ? (
                                                    <ListGroup variant="flush">
                                                        {recentActivity.map((activity, index) => (
                                                            <ListGroup.Item key={index}>
                                                                {activity.description} <small className="text-muted">({new Date(activity.timestamp).toLocaleDateString('pt-BR')} {new Date(activity.timestamp).toLocaleTimeString('pt-BR')})</small>
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                ) : (
                                                    <Alert variant="info">Nenhuma atividade recente.</Alert>
                                                )}
                                            </Card.Body>
                                        </Card>

                                        {/* Histórico de Consultas (mantido na Visão Geral, mas pode ser movido para a aba Consultas) */}
                                        <Card className="dashboard-stat-card">
                                            <Card.Body>
                                                <Card.Title>Histórico de Consultas</Card.Title>
                                                <Table striped bordered hover responsive>
                                                    <thead>
                                                        <tr>
                                                            <th>Data</th>
                                                            <th>Hora</th>
                                                            <th>Médico</th>
                                                            <th>Notas do Paciente</th>
                                                            <th>Prescrições</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {consultasHistoricoBackend.length > 0 ? (
                                                            consultasHistoricoBackend.map((consulta) => (
                                                                <tr key={consulta.id}>
                                                                    <td>{new Date(consulta.date_time).toLocaleDateString('pt-BR')}</td>
                                                                    <td>{new Date(consulta.date_time).toLocaleTimeString('pt-BR').substring(0, 5)}</td>
                                                                    <td>{consulta.professionalName || 'N/A'}</td> {/* Adicionado professionalName */}
                                                                    <td>{consulta.notes}</td>
                                                                    <td>{consulta.prescription}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="text-center">Nenhuma consulta encontrada.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="consultas">
                                        <Card className="dashboard-stat-card mb-4">
                                            <Card.Body>
                                                <Card.Title>Agendar Nova Consulta</Card.Title>
                                                <Form onSubmit={handleRequestAppointment}>
                                                    <Form.Group controlId="selectProfessional" className="mb-3">
                                                        <Form.Label>Médico/Terapeuta</Form.Label>
                                                        <Form.Select
                                                            value={selectedProfessional}
                                                            onChange={(e) => setSelectedProfessional(e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Selecione um profissional</option>
                                                            {associatedProfessionals.map((prof) => (
                                                                <option key={prof.id} value={prof.id}>
                                                                    {prof.name} ({prof.specialty})
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>

                                                    {selectedProfessional && (
                                                        <>
                                                            <Form.Group controlId="selectDate" className="mb-3">
                                                                <Form.Label>Data</Form.Label>
                                                                <Form.Control
                                                                    type="date"
                                                                    value={selectedDate}
                                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                                    min={new Date().toISOString().split('T')[0]} // Impede datas passadas
                                                                    required
                                                                />
                                                            </Form.Group>

                                                            <Form.Group controlId="selectTime" className="mb-3">
                                                                <Form.Label>Hora</Form.Label>
                                                                <Form.Select
                                                                    value={selectedTime}
                                                                    onChange={(e) => setSelectedTime(e.target.value)}
                                                                    required
                                                                >
                                                                    <option value="">Selecione um horário</option>
                                                                    {professionalAvailability
                                                                        .filter(slot => slot.date === selectedDate)
                                                                        .map((slot, index) => (
                                                                            <option key={index} value={slot.time}>
                                                                                {slot.time}
                                                                            </option>
                                                                        ))}
                                                                    {professionalAvailability.filter(slot => slot.date === selectedDate).length === 0 && selectedDate && (
                                                                        <option disabled>Nenhum horário disponível para esta data.</option>
                                                                    )}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </>
                                                    )}

                                                    <Form.Group controlId="appointmentNotes" className="mb-3">
                                                        <Form.Label>Observações (opcional)</Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={3}
                                                            value={appointmentNotes}
                                                            onChange={(e) => setAppointmentNotes(e.target.value)}
                                                            placeholder="Detalhes adicionais para a consulta..."
                                                        />
                                                    </Form.Group>

                                                    <Button variant="primary" type="submit">
                                                        Solicitar Agendamento
                                                    </Button>
                                                </Form>
                                            </Card.Body>
                                        </Card>

                                        <Card className="dashboard-stat-card">
                                            <Card.Body>
                                                <Card.Title>Minhas Consultas Agendadas</Card.Title>
                                                <Table striped bordered hover responsive>
                                                    <thead>
                                                        <tr>
                                                            <th>Profissional</th>
                                                            <th>Data</th>
                                                            <th>Hora</th>
                                                            <th>Status</th>
                                                            <th>Observações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pendingAppointments.length > 0 ? (
                                                            pendingAppointments.map((appt) => (
                                                                <tr key={appt.id}>
                                                                    <td>{appt.professionalName}</td>
                                                                    <td>{new Date(appt.data_consulta).toLocaleDateString('pt-BR')}</td>
                                                                    <td>{appt.hora_consulta.substring(0, 5)}</td>
                                                                    <td>{appt.status}</td>
                                                                    <td>{appt.observacoes}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="text-center">Nenhuma consulta agendada.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="comunicacao">
                                        <Card className="dashboard-stat-card">
                                            <Card.Body>
                                                <Card.Title>Comunicação com Profissionais</Card.Title>
                                                {communicationProfessionals.length > 0 ? (
                                                    <Accordion>
                                                        {communicationProfessionals.map((professional) => {
                                                            const unreadCount = getUnreadCount(professional.id);
                                                            return (
                                                                <Accordion.Item eventKey={professional.id.toString()} key={professional.id}>
                                                                    <Accordion.Header>
                                                                        <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                                                            <div>
                                                                                <strong>{professional.name}</strong>
                                                                                {professional.specialty && (
                                                                                    <span className="text-muted"> - {professional.specialty}</span>
                                                                                )}
                                                                            </div>
                                                                            {unreadCount > 0 && (
                                                                                <Badge bg="danger" className="ms-2">
                                                                                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </Accordion.Header>
                                                                    <Accordion.Body>
                                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                                            <div>
                                                                                <p className="mb-1"><strong>Email:</strong> {professional.email}</p>
                                                                                <p className="mb-0"><strong>Especialidade:</strong> {professional.specialty}</p>
                                                                            </div>
                                                                            <Button 
                                                                                variant="primary" 
                                                                                onClick={() => handleOpenCommunication(professional)}
                                                                            >
                                                                                Abrir Conversa
                                                                            </Button>
                                                                        </div>
                                                                    </Accordion.Body>
                                                                </Accordion.Item>
                                                            );
                                                        })}
                                                    </Accordion>
                                                ) : (
                                                    <Alert variant="info">
                                                        Nenhum profissional disponível para comunicação. 
                                                        Os profissionais aparecerão aqui após você ter consultas agendadas ou realizadas com eles.
                                                    </Alert>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="jogos">
                                        <Card className="dashboard-stat-card">
                                            <Card.Body>
                                                <Card.Title>Jogos Interativos</Card.Title>
                                                <ListGroup variant="flush">
                                                    {jogos.map((jogo) => (
                                                        <ListGroup.Item key={jogo.id}>
                                                            <a href={jogo.link}>{jogo.nome}</a>
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="monitoramento">
                                        <Card className="dashboard-stat-card">
                                            <Card.Body>
                                                <Card.Title>Monitoramento</Card.Title>
                                                <div className="monitoring-grid">
                                                    <Row>
                                                        <Col md={6}>
                                                            <div className="monitoring-item">
                                                                <div className="monitoring-image-container">
                                                                    <Image
                                                                        src={emotionalMonitoringImg}
                                                                        alt="Monitoramento Emocional"
                                                                        className="monitoring-image"
                                                                        fluid
                                                                    />
                                                                </div>
                                                                <h5 className="monitoring-title">Monitoramento Emocional</h5>
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={handleOpenEmotionDetector}
                                                                    className="monitoring-button"
                                                                >
                                                                    Abrir Detector de Emoções
                                                                </Button>
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="monitoring-item">
                                                                <div className="monitoring-image-container">
                                                                    <Image
                                                                        src={strokeRiskImg}
                                                                        alt="Monitoramento de Risco de AVC"
                                                                        className="monitoring-image"
                                                                        fluid
                                                                    />
                                                                </div>
                                                                <h5 className="monitoring-title">Monitoramento de Risco de AVC</h5>
                                                                <Button
                                                                    variant="warning"
                                                                    onClick={handleOpenStrokeDetector}
                                                                    className="monitoring-button"
                                                                >
                                                                    Abrir Monitor de AVC
                                                                </Button>
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="monitoring-item">
                                                                <div className="monitoring-image-container">
                                                                    <Image
                                                                        src={repetitivePatternsImg}
                                                                        alt="Monitoramento de Padrões Repetitivos"
                                                                        className="monitoring-image"
                                                                        fluid
                                                                    />
                                                                </div>
                                                                <h5 className="monitoring-title">Padrões Repetitivos</h5>
                                                                <Button
                                                                    variant="info"
                                                                    onClick={handleOpenStereotypyMonitor}
                                                                    className="monitoring-button"
                                                                >
                                                                    Abrir Monitor de Estereotipias
                                                                </Button>
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="monitoring-item">
                                                                <div className="monitoring-image-container">
                                                                    <Image
                                                                        src={triggerRecorderImg}
                                                                        alt="Gravador de Gatilhos"
                                                                        className="monitoring-image"
                                                                        fluid
                                                                    />
                                                                </div>
                                                                <h5 className="monitoring-title">Gravador de Voz</h5>
                                                                <Button
                                                                    variant="success"
                                                                    onClick={handleOpenTriggerRecorder}
                                                                    className="monitoring-button"
                                                                >
                                                                    Abrir Gravador de Voz
                                                                </Button>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="servicos">
                                        <Card className="dashboard-stat-card">
                                            <Card.Body>
                                                <Card.Title>Serviços Locais</Card.Title>
                                                
                                                {/* Filtro por Segmento */}
                                                <Form.Group controlId="filterSegment" className="mb-3">
                                                    <Form.Label>Filtrar por Segmento</Form.Label>
                                                    <Form.Select
                                                        value={filterSegment}
                                                        onChange={(e) => setFilterSegment(e.target.value)}
                                                    >
                                                        <option value="">Todos os Segmentos</option>
                                                        {segments.map((segment) => (
                                                            <option key={segment} value={segment}>
                                                                {segment}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>

                                                {/* Lista de Serviços */}
                                                <Row>
                                                <Col md={6} lg={4} className="mb-3">
                                                    <Card className="h-100">
                                                        <Card.Img
                                                            variant="top"
                                                            src={img17}
                                                            alt="Nrmendfsystems"
                                                            style={{ height: '200px', objectFit: 'cover' }}
                                                        />
                                                        <Card.Body className="d-flex flex-column">
                                                            <Card.Title>Nrmendfsystems</Card.Title>
                                                            <Card.Text>
                                                                <strong>Segmento:</strong> Startup
                                                            </Card.Text>
                                                                <Button
                                                                variant="primary"
                                                                className="mt-auto"
                                                                onClick={() => window.open('/service_dashboard/ServiceDashboard17', '_blank', 'noopener,noreferrer')}
                                                                >
                                                                Ver Detalhes
                                                                </Button>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>


                                                <Col md={6} lg={4} className="mb-3">
                                                    <Card className="h-100">
                                                    <Card.Img
                                                        variant="top"
                                                        src={img18}
                                                        alt="Terapia Infantil Recife"
                                                        style={{ height: '200px', objectFit: 'cover' }}
                                                    />
                                                    <Card.Body className="d-flex flex-column">
                                                        <Card.Title>Acolher Espaço Terapêutico</Card.Title>
                                                        <Card.Text>
                                                        <strong>Segmento:</strong> Clínica
                                                        </Card.Text>
                                                            <Button
                                                            variant="primary"
                                                            className="mt-auto"
                                                            onClick={() => window.open('/service_dashboard/ServiceDashboard18', '_blank', 'noopener,noreferrer')}
                                                            >
                                                            Ver Detalhes
                                                            </Button>
                                                    </Card.Body>
                                                    </Card>
                                                </Col>
                                                </Row>

                                                {filteredServices.length === 0 && (
                                                    <Alert variant="info">
                                                        Nenhum serviço encontrado para o segmento selecionado.
                                                    </Alert>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>
                </Container>
            </section>
        </div>
    );
}

export default ParentDashboard;



