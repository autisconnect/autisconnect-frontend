import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Nav, Tab, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import { Calendar2Check, People, GraphUp, Wallet2, PlusCircle, FileEarmarkText, Bell } from 'react-bootstrap-icons'; // Ícones adicionados
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';
import logohori from './assets/logo.png';
import './App.css';

// Registrar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler );


// Componente ErrorBoundary
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Container className="mt-5">
                    <Alert variant="danger">
                        Algo deu errado: {this.state.error?.message || 'Erro desconhecido'}. Por favor, recarregue a página.
                    </Alert>
                </Container>
            );
        }
        return this.props.children;
    }
}

const ProfessionalDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id: dashboardId } = useParams();

    // Estados
    const [activeTab, setActiveTab] = useState('overview');
    const [patients, setPatients] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [assistants, setAssistants] = useState([]);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(true);
    const [loadingCharts, setLoadingCharts] = useState(false);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [loadingConsultations, setLoadingConsultations] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [professionalInfo, setProfessionalInfo] = useState({
        name: '',
        specialty: '',
        totalPatients: 0,
        todayAppointments: 0,
        weekAppointments: 0
    });
    const [newAssistant, setNewAssistant] = useState({ nome: '', cpf: '', email: '', password: '', status: 'ativo', telefone: '' });

    const [newPatient, setNewPatient] = useState({
        name: '',
        birthDate: '',
        phone: '',
        email: '',
        diagnosis: '',
        notes: ''
    });
    const [newAppointment, setNewAppointment] = useState({
        patientId: '',
        appointment_date: '',
        appointment_time: '',
        appointment_type: 'Consulta Regular',
        status: 'Realizada',
        payment_method: 'Pix',
        payment_details: '',
        payment_status: 'Pendente',
        value: '',
        notes: ''
    });
    const [patientProgressData, setPatientProgressData] = useState({
        labels: [],
        datasets: []
    });
    const [diagnosisDistribution, setDiagnosisDistribution] = useState({
        labels: [],
        datasets: [
            {
                data: [],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1,
            },
        ],
    });
    const [appointmentTypeData, setAppointmentTypeData] = useState({
        labels: [],
        datasets: [
            {
                label: 'Tipos de Consulta',
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                ],
                borderWidth: 1,
            },
        ],
    });

    // Funções de API
    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    });
//ok
        // Função genérica para tratar erros de API
    const handleApiError = (err, context) => {
        console.error(`Erro ao ${context}:`, err);
        const message = err.response?.data?.error || err.response?.data?.message || `Erro ao ${context}. Tente novamente.`;
        setError(message);
    };
//ok
    const fetchAssistants = async () => {
        if (!user) return;
        try {
            const response = await apiClient.get(`/professional/${user.id}/assistants`);
            setAssistants(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            handleApiError(err, 'buscar colaboradores');
        }
    };
//ok
    const handleAddAssistant = async (e) => {
        e.preventDefault();
        if (!user) return;
        try {
            await apiClient.post(`/professional/${user.id}/assistants`, newAssistant);
            setSuccessMessage('Colaborador adicionado com sucesso!');
            setNewAssistant({ nome: '', cpf: '', email: '', password: '', status: 'ativo', telefone: '' });
            fetchAssistants();
        } catch (err) {
            handleApiError(err, 'adicionar colaborador');
        }
    };
//ok
    const handleToggleStatus = async (assistantId, currentStatus) => {
        if (!user) return; // Verificação de segurança

        const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
        
        try {
            // URL relativa. O corpo da requisição é o segundo argumento.
            await apiClient.put(
                `/professional/${user.id}/assistants/${assistantId}/status`,
                { status: newStatus }
            );

            setSuccessMessage('Status do colaborador atualizado!');
            
            // Atualiza a lista de colaboradores na interface.
            fetchAssistants();

        } catch (err) {
            // Usa a função genérica para exibir o erro.
            handleApiError(err, 'atualizar o status do colaborador');
        }
    };
//ok
    const fetchDashboardData = async () => {
        try {
        const response = await apiClient.get(`/professional/dashboard/${user.id}`);
        const data = response.data; // Com Axios, os dados já vêm em .data
            setProfessionalInfo({
                name: data.professional.name,
                specialty: data.professional.specialty,
                totalPatients: data.stats.totalPatients,
                todayAppointments: data.stats.todayAppointments,
                weekAppointments: data.stats.weekAppointments
            });
        } catch (err) {
            console.error('Erro ao buscar dados do dashboard:', err);
            setError(err.message);
        }
    };
//ok
    const fetchPatients = async () => {
        if (!user) return;
        try {
            const query = statusFilter && statusFilter !== 'todos' ? `?status=${statusFilter}` : '';
            const response = await apiClient.get(`/professional/${user.id}/patients${query}`);
            setPatients(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            handleApiError(err, 'buscar pacientes');
        }
    };
//ok
    const handleUpdatePatient = async (e) => {
        e.preventDefault();
        if (!editingPatient || !user) return;
        try {
            const payload = {
                name: editingPatient.name,
                birthDate: editingPatient.birthDate ? new Date(editingPatient.birthDate).toISOString().split('T')[0] : null,
                phone: editingPatient.phone,
                email: editingPatient.email,
                diagnosis: editingPatient.diagnosis,
                notes: editingPatient.observacoes
            };
            await apiClient.put(`/professional/${user.id}/patients/${editingPatient.id}`, payload);
            setSuccessMessage('Paciente atualizado com sucesso!');
            setShowEditPatientModal(false);
            fetchPatients();
            setSelectedPatient(prev => ({ ...prev, ...editingPatient }));
        } catch (err) {
            handleApiError(err, 'atualizar paciente');
        }
    };
//ok
    const fetchConsultations = async () => {
        if (!user) return;
        try {
            const response = await apiClient.get(`/appointments/professional/${user.id}`);
            setConsultations(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            handleApiError(err, 'buscar consultas');
        }
    };
//ok
    const fetchPatientProgress = async () => {
        if (!user) return; // Verificação de segurança

        try {
            // URL relativa, o apiClient cuida do resto.
            const response = await apiClient.get(`/professional/${user.id}/patient-progress`);
            
            const data = response.data; // Dados já vêm em .data com Axios

            // A lógica para processar os dados e montar o gráfico permanece a mesma.
            const labels = [...new Set(data.map(item => new Date(item.recorded_date).toLocaleDateString('pt-BR')))];
            const metrics = ['Comunicacao', 'Interacao_Social', 'Comportamento'];
            const datasets = metrics.map(metric => ({
                label: metric,
                data: labels.map(label => {
                    const item = data.find(d =>
                        new Date(d.recorded_date).toLocaleDateString('pt-BR') === label &&
                        d.metric_type === metric
                    );
                    return item ? item.score : null;
                }),
                borderColor: metric === 'Comunicacao' ? 'rgba(75, 192, 192, 1)' :
                            metric === 'Interacao_Social' ? 'rgba(54, 162, 235, 1)' :
                            'rgba(255, 99, 132, 1)',
                backgroundColor: metric === 'Comunicacao' ? 'rgba(75, 192, 192, 0.2)' :
                                metric === 'Interacao_Social' ? 'rgba(54, 162, 235, 0.2)' :
                                'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.4
            }));

            setPatientProgressData({ labels, datasets });

        } catch (err) {
            // Usa a função genérica para exibir o erro.
            handleApiError(err, 'buscar o progresso dos pacientes');
            
            // Zera os dados do gráfico em caso de erro.
            setPatientProgressData({ labels: [], datasets: [] });
        }
    };
//ok
    const fetchDiagnosisDistribution = async () => {
        if (!user) return; // Verificação de segurança

        setLoadingCharts(true);
        try {
            // URL relativa, o apiClient cuida do resto.
            const response = await apiClient.get(`/professional/${user.id}/diagnosis-distribution`);
            
            const data = response.data; // Dados já vêm em .data com Axios

            // Atualiza o estado do gráfico com os dados recebidos.
            setDiagnosisDistribution({
                labels: data.labels,
                datasets: [
                    {
                        data: data.data,
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(255, 206, 86, 1)',
                        ],
                        borderWidth: 1,
                    },
                ],
            });
        } catch (err) {
            // O tratamento de erro do Axios já lida com status 404 e outros.
            handleApiError(err, 'buscar a distribuição de diagnósticos');
            
            // Em caso de erro, zera os dados do gráfico.
            setDiagnosisDistribution({
                labels: [],
                datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }],
            });
        } finally {
            setLoadingCharts(false);
        }
    };
//ok
    const fetchAppointmentTypes = async () => {
        if (!user) return; // Verificação de segurança

        setLoadingCharts(true);
        try {
            // URL relativa, o apiClient cuida do resto.
            const response = await apiClient.get(`/professional/${user.id}/appointment-types`);
            
            const data = response.data; // Dados já vêm em .data com Axios

            // Atualiza o estado do gráfico com os dados recebidos.
            setAppointmentTypeData({
                labels: data.labels,
                datasets: [
                    {
                        label: 'Tipos de Consulta',
                        data: data.data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                        ],
                        borderWidth: 1,
                    },
                ],
            });
        } catch (err) {
            // O tratamento de erro do Axios já lida com status 404 e outros.
            handleApiError(err, 'buscar tipos de consulta');
            
            // Em caso de erro, zera os dados do gráfico para não exibir informação antiga.
            setAppointmentTypeData({
                labels: [],
                datasets: [{ label: 'Tipos de Consulta', data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }],
            });
        } finally {
            setLoadingCharts(false);
        }
    };
//ok
    const handleAddPatient = async (e) => {
        e.preventDefault();
        if (!user) return;
        try {
            await apiClient.post(`/professional/${user.id}/patients`, { ...newPatient, status: 'ativo' });
            setSuccessMessage('Paciente adicionado com sucesso!');
            setShowPatientModal(false);
            setNewPatient({ name: '', birthDate: '', phone: '', email: '', diagnosis: '', notes: '' });
            fetchPatients();
            fetchDashboardData();
        } catch (err) {
            handleApiError(err, 'adicionar paciente');
        }
    };
//ok
    const handleAddAppointment = async (e) => {
        e.preventDefault();

        // Verificação de segurança e validação dos campos
        if (!user) {
            setError('Usuário não autenticado.');
            return;
        }
        if (!newAppointment.patientId || !newAppointment.appointment_date || !newAppointment.appointment_time || !newAppointment.value) {
            setError('Paciente, data, hora e valor são obrigatórios.');
            return;
        }

        try {
            const payload = {
                patientId: newAppointment.patientId, // O backend espera 'patientId'
                appointment_date: newAppointment.appointment_date,
                appointment_time: newAppointment.appointment_time,
                appointment_type: newAppointment.appointment_type,
                status: newAppointment.status,
                payment_method: newAppointment.payment_method,
                payment_details: newAppointment.payment_details,
                payment_status: newAppointment.payment_status,
                value: newAppointment.value,
                notes: newAppointment.notes,
                // O professional_id é adicionado pelo backend a partir do token, não precisa enviar.
            };

            // A URL é relativa. O payload é o segundo argumento.
            await apiClient.post('/appointments', payload);

            setSuccessMessage('Consulta registrada com sucesso!');
            setShowAppointmentModal(false);

            // Limpa o formulário para o próximo agendamento
            setNewAppointment({
                patientId: '',
                appointment_date: '',
                appointment_time: '',
                appointment_type: 'Consulta Regular',
                status: 'Realizada',
                payment_method: 'Pix',
                payment_details: '',
                payment_status: 'Pendente',
                value: '',
                notes: ''
            });
            
            // Atualiza os dados relevantes no dashboard
            fetchConsultations();
            fetchDashboardData();
            fetchAppointmentTypes();

            // Limpa a mensagem de sucesso após 3 segundos
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            // Usa a função genérica para exibir o erro.
            handleApiError(err, 'registrar a consulta');
        }
    };
//ok
    const handleAddNote = async (e) => {
        e.preventDefault();
        
        // Verificações de segurança
        if (!user || !selectedPatient) {
            setError('Usuário ou paciente não selecionado.');
            return;
        }

        try {
            // A URL é relativa. O corpo da requisição (newNote) é o segundo argumento.
            await apiClient.post(
                `/professional/${user.id}/patients/${selectedPatient.id}/notes`, 
                newNote
            );

            setSuccessMessage('Nota adicionada com sucesso!');
            
            // Limpa o formulário e fecha o modal
            setNewNote({ title: '', content: '' });
            setShowNoteModal(false);
            
            // Atualiza a lista de notas do paciente selecionado
            fetchPatientNotes(selectedPatient.id);

        } catch (err) {
            // Usa a função genérica para exibir o erro.
            handleApiError(err, 'adicionar nota');
        }
    };
//ok
    const fetchPatientNotes = async (patientId) => {
        // Verificações de segurança iniciais
        if (!user || !patientId) {
            setError('Não foi possível buscar as notas: ID do usuário ou do paciente está faltando.');
            return;
        }

        try {
            // A URL é relativa, o apiClient cuida da base e do token.
            const response = await apiClient.get(`/professional/${user.id}/patients/${patientId}/notes`);

            // Com Axios (usado pelo apiClient), os dados já vêm em response.data
            const notes = response.data;

            // Atualiza o estado do paciente selecionado com as notas recebidas.
            setSelectedPatient(prev => ({
                ...prev,
                notes: Array.isArray(notes) ? notes : [] // Garante que 'notes' seja sempre um array.
            }));

        } catch (err) {
            // Usa a função genérica para exibir o erro.
            handleApiError(err, 'buscar as notas do paciente');
            
            // Em caso de erro, garante que o painel de notas fique vazio.
            setSelectedPatient(prev => ({
                ...prev,
                notes: []
            }));
        }
    };
//ok
    const handleUpdateStatus = async (patientId, newStatus) => {
        if (!user) return; // Adiciona uma verificação de segurança

        try {
            // A URL agora é relativa e o apiClient cuida do resto (URL base, token).
            // O método é PUT e o corpo da requisição é o segundo argumento.
            await apiClient.put(
                `/professional/${user.id}/patients/${patientId}/status`, 
                { status: newStatus }
            );

            setSuccessMessage('Status do paciente atualizado!');

            // Atualiza a lista de pacientes na interface para refletir a mudança.
            await fetchPatients(); 

            // Se o paciente atualizado for o que está selecionado no painel de detalhes,
            // atualiza o status dele lá também.
            if (selectedPatient && selectedPatient.id === patientId) {
                setSelectedPatient(prev => ({ ...prev, status: newStatus }));
            }

        } catch (err) {
            // Usa a função genérica para exibir o erro.
            handleApiError(err, 'atualizar status do paciente');
        }
    };

    const handlePatientRowClick = async (patient) => {
        try {
            if (!patient || !patient.id) {
                console.error('Paciente inválido:', patient);
                setError('Paciente inválido selecionado.');
                setSelectedPatient(null);
                return;
            }
            setSelectedPatient({ ...patient, notes: [] });
            await fetchPatientNotes(patient.id);
        } catch (err) {
            console.error('Erro ao selecionar paciente:', err);
            setError('Erro ao carregar detalhes do paciente: ' + err.message);
            setSelectedPatient(null);
        }
    };

    const handlePatientSelect = async (patient) => {
        try {
            if (!patient || !patient.id) {
                console.error('Paciente inválido:', patient);
                setError('Paciente inválido selecionado.');
                setSelectedPatient(null);
                return;
            }

            setSelectedPatient({ ...patient, notes: [] });
            await fetchPatientNotes(patient.id);
            window.open(`/patient-details/${patient.id}`, '_blank', 'noopener,noreferrer');
        } catch (err) {
            console.error('Erro ao selecionar paciente:', err);
            setError('Erro ao carregar detalhes do paciente: ' + err.message);
            setSelectedPatient(null);
        }
    };

    // Funções auxiliares
    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'N/A';
    };

    const formatTime = (timeString) => {
        return timeString ? timeString.substring(0, 5) : 'N/A';
    };

    const getStatusBadge = (status) => {
        return status === 'Realizada' ? 'success' : 'secondary';
    };

    const getTodayAppointments = () => {
        const today = new Date();
        return consultations.filter(consultation => {
            const appointmentDate = new Date(consultation.appointment_date);
            return appointmentDate.getDate() === today.getDate() &&
                appointmentDate.getMonth() === today.getMonth() &&
                appointmentDate.getFullYear() === today.getFullYear();
        });
    };

    const filteredPatients = patients.filter(patient => {
        const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = statusFilter === '' || statusFilter === 'todos' || patient.status === statusFilter;
        return matchesSearch && matchesFilter;
    });

    const filteredAssistants = assistants.filter(assistant => {
        return statusFilter === '' || statusFilter === 'todos' || assistant.status === statusFilter;
    });

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Opções para gráficos
    const lineOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Progresso dos Pacientes' }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 5,
                title: { display: true, text: 'Nível (1-5)' }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'right' },
            title: { display: true, text: 'Distribuição de Diagnósticos' }
        }
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Tipos de Consulta' }
        }
    };

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (user.tipo_usuario !== 'medicos_terapeutas' || dashboardId !== user.id.toString()) {
            navigate(`/professional-dashboard/${user.id}`);
            return;
        }
        const fetchAllData = async () => {
            setLoading(true);
            setError('');
            await Promise.all([
                fetchDashboardData(),
                fetchPatients(),
                fetchConsultations(),
                fetchAssistants(),
                fetchPatientProgress(),
                fetchDiagnosisDistribution(),
                fetchAppointmentTypes()
            ]);
            setLoading(false);
        };
        fetchAllData();
    }, [user, navigate, dashboardId]);

    useEffect(() => {
        if (!user || loading) return;
        fetchPatients();
    }, [statusFilter]);

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" />
                <p>Carregando dashboard...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 patient-details-page">
            <style>
                {`
                    @media print {
                        body * { visibility: hidden; }
                        .printable-prescription, .printable-prescription * { visibility: visible; }
                        .printable-prescription { position: absolute; top: 0; left: 0; width: 100%; }
                        .print-header, .print-footer { margin: 20px 0; }
                        .print-header h4, .print-footer p { margin: 5px 0; }
                        .print-footer .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 20px; }
                        .no-print { display: none; }
                        .prescription-observations { margin-top: 10px; margin-bottom: 20px; font-size: 14px; }
                    }
                `}
            </style>

            {successMessage && (
                <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
                    {successMessage}
                </Alert>
            )}

            
            <div className="professional-dashboard">

            <Row className="professional-header-row mb-4 align-items-center">
                
                {/* Coluna da Logo */}
                <Col xs="auto">
                    <img src={logohori} alt="AutisConnect Logo" className="details-logo" />
                </Col>

                {/* Coluna do Título e Informações do Profissional */}
                <Col>
                    <h1 className="professional-name mb-0">Dashboard Profissional</h1>
                    <p className="professional-specialty text-muted mb-0">{professionalInfo.name} - {professionalInfo.specialty}</p>
                </Col>

                {/* Coluna dos Cards de Resumo */}
                <Col xs="auto">
                    <div className="d-flex gap-3">
                        <Card className="summary-card">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <People className="summary-icon text-primary me-3" />
                                    <div>
                                        <div className="summary-value">{professionalInfo.totalPatients}</div>
                                        <div className="summary-label">Pacientes Ativos</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                        <Card className="summary-card">
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <Calendar2Check className="summary-icon text-success me-3" />
                                    <div>
                                        <div className="summary-value">{professionalInfo.todayAppointments}</div>
                                        <div className="summary-label">Consultas Hoje</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>

                {/* Coluna do Botão de Logout */}
                <Col xs="auto">
                    <Button variant="danger" onClick={handleLogout}>Sair</Button>
                </Col>
            </Row>

                <Container fluid className="py-4 professional-dashboard">
                    {/* Mensagens de feedback */}
                    {successMessage && (
                        <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
                            {successMessage}
                        </Alert>
                    )}
                    {error && (
                        <Alert variant="danger" onClose={() => setError('')} dismissible>
                            {error}
                        </Alert>
                    )}

                    {/* Alertas para feedback */}
                    {successMessage && (
                        <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
                            {successMessage}
                        </Alert>
                    )}
                    {error && (
                        <Alert variant="danger" onClose={() => setError('')} dismissible>
                            {error}
                        </Alert>
                    )}

                    {/* Navegação por Abas */}
                    <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav variant="tabs" className="mb-4">
                            <Nav.Item>
                                <Nav.Link eventKey="overview"><GraphUp className="me-2" />Visão Geral</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="patients"><People className="me-2" />Pacientes</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="appointments"><Calendar2Check className="me-2" />Consultas</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="reports"><FileEarmarkText className="me-2" />Relatórios</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="assistants"><People className="me-2" />Colaboradores</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link onClick={() => window.open(`/financial-dashboard/${user.id}`, '_blank', 'noopener,noreferrer')}>
                                    <Wallet2 className="me-2" />Financeiro
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>

                        <Tab.Content>
                            {/* Aba Visão Geral */}
                            <Tab.Pane eventKey="overview">
                                <Row>
                                    <Col md={8}>
                                        <Card className="mb-4">
                                            <Card.Header><h5>Consultas de Hoje</h5></Card.Header>
                                            <Card.Body>
                                                {loadingConsultations ? (
                                                    <div className="text-center">
                                                        <Spinner animation="border" size="sm" />
                                                        <span className="ms-2">Carregando consultas...</span>
                                                    </div>
                                                ) : getTodayAppointments().length > 0 ? (
                                                    <Table responsive>
                                                        <thead>
                                                            <tr>
                                                                <th>Horário</th>
                                                                <th>Paciente</th>
                                                                <th>Tipo</th>
                                                                <th>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {getTodayAppointments().map(consultation => (
                                                                <tr key={consultation.id}>
                                                                    <td>{formatTime(consultation.appointment_time)}</td>
                                                                    <td>{consultation.patient_name}</td>
                                                                    <td>{consultation.appointment_type}</td>
                                                                    <td><Badge bg={getStatusBadge(consultation.status)}>{consultation.status}</Badge></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                ) : (
                                                    <p className="text-muted">Nenhuma consulta agendada para hoje.</p>
                                                )}
                                            </Card.Body>
                                        </Card>

                                        <Row>
                                            <Col md={6}>
                                                <Card>
                                                    <Card.Header><h6>Progresso dos Pacientes</h6></Card.Header>
                                                    <Card.Body>
                                                        {loadingCharts ? (
                                                            <div className="text-center">
                                                                <Spinner animation="border" size="sm" />
                                                                <span className="ms-2">Carregando dados...</span>
                                                            </div>
                                                        ) : patientProgressData.labels.length === 0 ? (
                                                            <p className="text-muted">Nenhum dado disponível para progresso dos pacientes.</p>
                                                        ) : (
                                                            <Line data={patientProgressData} options={lineOptions} />
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={6}>
                                                <Card>
                                                    <Card.Header><h6>Tipos de Consulta</h6></Card.Header>
                                                    <Card.Body>
                                                        {loadingCharts ? (
                                                            <div className="text-center">
                                                                <Spinner animation="border" size="sm" />
                                                                <span className="ms-2">Carregando dados...</span>
                                                            </div>
                                                        ) : appointmentTypeData.labels.length === 0 ? (
                                                            <p className="text-muted">Nenhum dado disponível para tipos de consulta.</p>
                                                        ) : (
                                                            <Bar data={appointmentTypeData} options={barOptions} />
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col md={4}>
                                        <Card className="mb-4">
                                            <Card.Header><h6>Distribuição de Diagnósticos</h6></Card.Header>
                                            <Card.Body>
                                                {loadingCharts ? (
                                                    <div className="text-center">
                                                        <Spinner animation="border" size="sm" />
                                                        <span className="ms-2">Carregando dados...</span>
                                                    </div>
                                                ) : diagnosisDistribution.labels.length === 0 ? (
                                                    <p className="text-muted">Nenhum dado disponível para distribuição de diagnósticos.</p>
                                                ) : (
                                                    <Pie data={diagnosisDistribution} options={pieOptions} />
                                                )}
                                            </Card.Body>
                                        </Card>

                                        <Card>
                                            <Card.Header><h6>Notificações Recentes</h6></Card.Header>
                                            <Card.Body>
                                                {notifications.slice(0, 5).map(notification => (
                                                    <div key={notification.id} className="d-flex align-items-start mb-3">
                                                        <Bell className={`me-2 mt-1 ${notification.read ? 'text-muted' : 'text-primary'}`} />
                                                        <div className="flex-grow-1">
                                                            <p className={`mb-1 ${notification.read ? 'text-muted' : ''}`}>
                                                                {notification.message}
                                                            </p>
                                                            <small className="text-muted">{formatDate(notification.date)}</small>
                                                        </div>
                                                    </div>
                                                ))}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            {/* Aba Pacientes */}
                            <Tab.Pane eventKey="patients">
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Buscar pacientes..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                            <option value="" disabled>Filtrar por Status</option>
                                            <option value="todos">Todos</option>
                                            <option value="ativo">Ativo</option>
                                            <option value="inativo">Inativo</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={3}>
                                        <Button variant="primary" onClick={() => setShowPatientModal(true)} className="w-100">
                                            Adicionar Paciente
                                        </Button>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={8}>
                                        <Card>
                                            <Card.Header><h5>Lista de Pacientes</h5></Card.Header>
                                            <Card.Body>
                                                {loadingPatients ? (
                                                    <div className="text-center">
                                                        <Spinner animation="border" />
                                                        <p>Carregando pacientes...</p>
                                                    </div>
                                                ) : filteredPatients.length > 0 ? (
                                                    <Table responsive hover>
                                                        <thead>
                                                            <tr>
                                                                <th>Nome</th>
                                                                <th>Data de Nascimento</th>
                                                                <th>Diagnóstico</th>
                                                                <th>Status</th>
                                                                <th>Última Consulta</th>
                                                                <th>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredPatients.map(patient => (
                                                                <tr key={patient.id}>
                                                                    <td onClick={() => handlePatientRowClick(patient)} style={{ cursor: 'pointer' }}>
                                                                        {patient.name}
                                                                    </td>
                                                                    <td onClick={() => handlePatientRowClick(patient)} style={{ cursor: 'pointer' }}>
                                                                        {formatDate(patient.birthDate)}
                                                                    </td>
                                                                    <td onClick={() => handlePatientRowClick(patient)} style={{ cursor: 'pointer' }}>
                                                                        {patient.diagnosis}
                                                                    </td>
                                                                    <td onClick={() => handlePatientRowClick(patient)} style={{ cursor: 'pointer' }}>
                                                                        {patient.status}
                                                                    </td>
                                                                    <td onClick={() => handlePatientRowClick(patient)} style={{ cursor: 'pointer' }}>
                                                                        {formatDate(patient.registrationDate)}
                                                                    </td>
                                                                    <td>
                                                                        <Button
                                                                            variant="outline-primary"
                                                                            size="sm"
                                                                            onClick={() => handlePatientSelect(patient)}
                                                                        >
                                                                            Ver Detalhes
                                                                        </Button>
                                                                    </td>
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
                                                <Card.Header><h6>Detalhes do Paciente</h6>
                                                </Card.Header>
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
                                                    <h5>{selectedPatient.name || 'Nome não disponível'}</h5>
                                                    <p><strong>Data de Nascimento:</strong> {selectedPatient.birthDate ? new Date(selectedPatient.birthDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                                    <p><strong>Telefone:</strong> {selectedPatient.phone || 'N/A'}</p>
                                                    <p><strong>Email:</strong> {selectedPatient.email || 'N/A'}</p>
                                                    <p><strong>Diagnóstico:</strong> {selectedPatient.diagnosis || 'N/A'}</p>
                                                    <p><strong>Observações:</strong> {selectedPatient.observacoes || 'Nenhuma observação.'}</p>
                                                    <p><strong>Status:</strong> {selectedPatient.status || 'N/A'}</p>
                                                    <Button
                                                        variant={selectedPatient.status === 'ativo' ? 'warning' : 'success'}
                                                        size="sm"
                                                        onClick={() => handleUpdateStatus(selectedPatient.id, selectedPatient.status === 'ativo' ? 'inativo' : 'ativo')}
                                                    >
                                                        {selectedPatient.status === 'ativo' ? 'Desativar' : 'Ativar'}
                                                    </Button>
                                                    <hr />
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h6>Notas</h6>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => setShowNoteModal(true)}
                                                            disabled={!selectedPatient.id}
                                                        >
                                                            Adicionar Nota
                                                        </Button>
                                                    </div>
                                                    {selectedPatient.notes && Array.isArray(selectedPatient.notes) && selectedPatient.notes.length > 0 ? (
                                                        selectedPatient.notes.map(note => (
                                                            note && note.id ? (
                                                                <div key={note.id} className="mb-3 p-2 border rounded">
                                                                    <h6>{note.title || 'Sem título'}</h6>
                                                                    <p className="mb-1">{note.content || 'Sem conteúdo'}</p>
                                                                    <small className="text-muted">
                                                                        {note.createdAt ? new Date(note.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                                                                    </small>
                                                                </div>
                                                            ) : null
                                                        ))
                                                    ) : (
                                                        <p className="text-muted">Nenhuma nota registrada.</p>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        ) : (
                                            <Card>
                                                <Card.Body>
                                                    <p className="text-muted">Selecione um paciente para ver os detalhes.</p>
                                                </Card.Body>
                                            </Card>
                                        )}
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            {/* Aba Consultas */}
                            <Tab.Pane eventKey="appointments">
                                <Card>
                                    <Card.Header>
                                        <Row className="align-items-center">
                                        <Col>
                                            <h5>Histórico Geral de Consultas</h5>
                                        </Col>
                                        </Row>
                                    </Card.Header>
                                    <Row className="align-items-center">
                                        <p></p>
                                    <Col md={3} className="ms-auto text-end">
                                        <Button 
                                        variant="primary" 
                                        onClick={() => setShowAppointmentModal(true)} 
                                        className="w-100"
                                        >
                                        Agendar Consulta
                                        </Button>
                                    </Col>
                                    </Row>
                                    <Card.Body>
                                        {loadingConsultations ? (
                                            <div className="text-center">
                                                <Spinner animation="border" />
                                                <p>Carregando consultas...</p>
                                            </div>
                                        ) : consultations.length > 0 ? (
                                            <Table responsive hover>
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Hora</th>
                                                        <th>Paciente</th>
                                                        <th>Tipo</th>
                                                        <th>Status</th>
                                                        <th>Observações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {consultations.map(consultation => (
                                                        <tr key={consultation.id}>
                                                            <td>{formatDate(consultation.appointment_date)}</td>
                                                            <td>{formatTime(consultation.appointment_time)}</td>
                                                            <td>{consultation.patient_name || 'N/A'}</td>
                                                            <td>{consultation.appointment_type || 'N/A'}</td>
                                                            <td><Badge bg={getStatusBadge(consultation.status)}>{consultation.status || 'N/A'}</Badge></td>
                                                            <td>{consultation.notes || 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        ) : (
                                            <p className="text-muted">Nenhuma consulta encontrada.</p>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>

                            {/* Aba Relatórios */}
                            <Tab.Pane eventKey="reports">
                                <Row>
                                    <Col md={6}>
                                        <Card className="mb-4">
                                            <Card.Header><h6>Distribuição de Diagnósticos</h6></Card.Header>
                                            <Card.Body>
                                                {loadingCharts ? (
                                                    <div className="text-center">
                                                        <Spinner animation="border" size="sm" />
                                                        <span className="ms-2">Carregando dados...</span>
                                                    </div>
                                                ) : diagnosisDistribution.labels.length === 0 ? (
                                                    <p className="text-muted">Nenhum dado disponível para distribuição de diagnósticos.</p>
                                                ) : (
                                                    <Pie data={diagnosisDistribution} options={pieOptions} />
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="mb-4">
                                            <Card.Header><h6>Tipos de Consulta</h6></Card.Header>
                                            <Card.Body>
                                                {loadingCharts ? (
                                                    <div className="text-center">
                                                        <Spinner animation="border" size="sm" />
                                                        <span className="ms-2">Carregando dados...</span>
                                                    </div>
                                                ) : appointmentTypeData.labels.length === 0 ? (
                                                    <p className="text-muted">Nenhum dado disponível para tipos de consulta.</p>
                                                ) : (
                                                    <Bar data={appointmentTypeData} options={barOptions} />
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            {/* Aba Colaboradores */}
                            <Tab.Pane eventKey="assistants">
                                <Card>
                                    <Card.Header><h5>Gerenciar Colaboradores</h5></Card.Header>
                                    <Card.Body>
                                        <Form onSubmit={handleAddAssistant} className="mb-4 p-3 border rounded">
                                            <h6>Adicionar Novo Colaborador</h6>
                                            <Row className="align-items-end g-3">
                                                <Col md={3}>
                                                    <Form.Group>
                                                        <Form.Label>Nome</Form.Label>
                                                        <Form.Control
                                                            placeholder="Nome completo"
                                                            value={newAssistant.nome}
                                                            onChange={e => setNewAssistant({...newAssistant, nome: e.target.value})}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Group>
                                                        <Form.Label>CPF</Form.Label>
                                                        <Form.Control
                                                            placeholder="CPF (opcional)"
                                                            value={newAssistant.cpf}
                                                            onChange={e => setNewAssistant({...newAssistant, cpf: e.target.value})}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Group>
                                                        <Form.Label>Telefone</Form.Label>
                                                        <Form.Control
                                                            placeholder="Telefone"
                                                            value={newAssistant.telefone || ''}
                                                            onChange={e => setNewAssistant({...newAssistant, telefone: e.target.value})}
                                                            required // Torna o campo obrigatório no formulário
                                                        />
                                                    </Form.Group>
                                                </Col>
  
                                                <Col md={3}>
                                                    <Form.Group>
                                                        <Form.Label>Email (para login)</Form.Label>
                                                        <Form.Control
                                                            type="email"
                                                            placeholder="Email"
                                                            value={newAssistant.email}
                                                            onChange={e => setNewAssistant({...newAssistant, email: e.target.value})}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={2}>
                                                    <Form.Group>
                                                        <Form.Label>Senha</Form.Label>
                                                        <Form.Control
                                                            type="password"
                                                            placeholder="Senha"
                                                            value={newAssistant.password}
                                                            onChange={e => setNewAssistant({...newAssistant, password: e.target.value})}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={2}>
                                                    <Button type="submit" className="w-100">Adicionar</Button>
                                                </Col>
                                            </Row>
                                        </Form>

                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                                    <option value="todos">Todos os status</option>
                                                    <option value="ativo">Apenas Ativos</option>
                                                    <option value="inativo">Apenas Inativos</option>
                                                </Form.Select>
                                            </Col>
                                        </Row>

                                        <h6>Colaboradores Cadastrados</h6>
                                        <Table striped bordered hover responsive>
                                            <thead>
                                                <tr>
                                                    <th>Nome</th>
                                                    <th>CPF</th>
                                                    <th>Email</th>
                                                    <th>Status</th>
                                                    <th>Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredAssistants.length > 0 ? filteredAssistants.map(a => (
                                                    <tr key={a.id}>
                                                        <td>{a.nome}</td>
                                                        <td>{a.cpf || 'N/A'}</td>
                                                        <td>{a.email}</td>
                                                        <td><Badge bg={a.status === 'ativo' ? 'success' : 'secondary'}>{a.status}</Badge></td>
                                                        <td>
                                                            <Button
                                                                variant={a.status === 'ativo' ? 'warning' : 'success'}
                                                                size="sm"
                                                                onClick={() => handleToggleStatus(a.id, a.status)}
                                                            >
                                                                {a.status === 'ativo' ? 'Desativar' : 'Ativar'}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan="5" className="text-center">Nenhum colaborador cadastrado.</td></tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Container>

                {/* Modal para Adicionar Paciente */}
                <Modal show={showPatientModal} onHide={() => setShowPatientModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Adicionar Novo Paciente</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleAddPatient}>
                        <Modal.Body>
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

                {/* Modal para Agendar Consulta */}
                <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Registrar Nova Consulta</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleAddAppointment}>
                        <Modal.Body>
                            <Form.Group className="mb-3" controlId="appointmentPatient">
                                <Form.Label>Paciente *</Form.Label>
                                <Form.Select
                                    name="patientId"
                                    value={newAppointment.patientId}
                                    onChange={(e) => setNewAppointment({...newAppointment, patientId: e.target.value})}
                                    required
                                >
                                    <option value="">Selecione um paciente</option>
                                    {patients.map(patient => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="appointmentDate">
                                        <Form.Label>Data da Consulta *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="appointment_date"
                                            value={newAppointment.appointment_date}
                                            onChange={(e) => setNewAppointment({...newAppointment, appointment_date: e.target.value})}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="appointmentTime">
                                        <Form.Label>Hora da Consulta *</Form.Label>
                                        <Form.Control
                                            type="time"
                                            name="appointment_time"
                                            value={newAppointment.appointment_time}
                                            onChange={(e) => setNewAppointment({...newAppointment, appointment_time: e.target.value})}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="appointmentType">
                                        <Form.Label>Tipo de Consulta</Form.Label>
                                        <Form.Select
                                            name="appointment_type"
                                            value={newAppointment.appointment_type}
                                            onChange={(e) => setNewAppointment({...newAppointment, appointment_type: e.target.value})}
                                        >
                                            <option value="Consulta Regular">Consulta Regular</option>
                                            <option value="Consulta Inicial">Consulta Inicial</option>
                                            <option value="Acompanhamento">Acompanhamento</option>
                                            <option value="Avaliação">Avaliação</option>
                                            <option value="Terapia">Terapia</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="appointmentStatus">
                                        <Form.Label>Status da Consulta</Form.Label>
                                        <Form.Select
                                            name="status"
                                            value={newAppointment.status}
                                            onChange={(e) => setNewAppointment({...newAppointment, status: e.target.value})}
                                        >
                                            <option value="Realizada">Realizada</option>
                                            <option value="Agendada">Agendada</option>
                                            <option value="Confirmada">Confirmada</option>
                                            <option value="Cancelada">Cancelada</option>
                                            <option value="Não Realizada">Não Realizada</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="appointmentValue">
                                        <Form.Label>Valor da Consulta (R$) *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            name="value"
                                            placeholder="Ex: 150.00"
                                            value={newAppointment.value}
                                            onChange={(e) => setNewAppointment({...newAppointment, value: e.target.value})}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="paymentStatus">
                                        <Form.Label>Status do Pagamento</Form.Label>
                                        <Form.Select
                                            name="payment_status"
                                            value={newAppointment.payment_status}
                                            onChange={(e) => setNewAppointment({...newAppointment, payment_status: e.target.value})}
                                        >
                                            <option value="Pendente">Pendente</option>
                                            <option value="Pago">Pago</option>
                                            <option value="Atrasado">Atrasado</option>
                                            <option value="Isento">Isento</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <hr />
                            <h5>Detalhes do Pagamento</h5>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="paymentMethod">
                                        <Form.Label>Forma de Pagamento</Form.Label>
                                        <Form.Select
                                            name="payment_method"
                                            value={newAppointment.payment_method}
                                            onChange={(e) => setNewAppointment({...newAppointment, payment_method: e.target.value})}
                                        >
                                            <option value="Pix">Pix</option>
                                            <option value="Crédito">Cartão de Crédito</option>
                                            <option value="Débito">Cartão de Débito</option>
                                            <option value="Dinheiro">Dinheiro</option>
                                            <option value="Plano de Saúde">Plano de Saúde</option>
                                            <option value="Outros">Outros</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                {(newAppointment.payment_method === 'Plano de Saúde' || newAppointment.payment_method === 'Outros') && (
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="paymentDetails">
                                            <Form.Label>Especifique</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="payment_details"
                                                placeholder="Ex: Unimed ou Transferência"
                                                value={newAppointment.payment_details}
                                                onChange={(e) => setNewAppointment({...newAppointment, payment_details: e.target.value})}
                                            />
                                        </Form.Group>
                                    </Col>
                                )}
                            </Row>
                            <Form.Group className="mb-3" controlId="appointmentNotes">
                                <Form.Label>Observações</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="notes"
                                    value={newAppointment.notes}
                                    onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                                    placeholder="Digite observações sobre a consulta"
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowAppointmentModal(false)}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit">
                                Salvar Consulta
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* Modal para Adicionar Nota */}
                <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Adicionar Nota</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleAddNote}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Título *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newNote.title}
                                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Conteúdo *</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={5}
                                    value={newNote.content}
                                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit">
                                Adicionar Nota
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
                </Modal>
            </div>
        </Container>
    );
};

export default ProfessionalDashboard;