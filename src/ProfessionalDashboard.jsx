import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Dropdown,
    Form,
    Modal,
    Offcanvas,
    OverlayTrigger,
    Row,
    Spinner,
    Table,
    Tooltip
} from 'react-bootstrap';
import {
    ArrowRight,
    Bell,
    BoxArrowRight,
    Calendar2Check,
    ChevronLeft,
    ChevronRight,
    FileEarmarkText,
    GraphUp,
    List,
    People,
    PersonCircle,
    PlusCircle,
    Search,
    Wallet2
} from 'react-bootstrap-icons';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip as ChartTooltip
} from 'chart.js';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';
import logonovo from './assets/logonovo.png';
import './App.css';
import './ProfessionalDashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, ChartTooltip, Legend, Filler);

const SIDEBAR_STORAGE_KEY = 'ac-professional-sidebar-collapsed';
const PROFESSIONAL_TAB_STORAGE_KEY = 'ac-professional-dashboard-tab';
const diagnosisPalette = ['#2563EB', '#06B6D4', '#38BDF8', '#0F172A', '#94A3B8'];
const appointmentPalette = ['#2563EB', '#3860F8', '#06B6D4', '#0F172A', '#60A5FA'];

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

function EmptyState({ title, description, actionLabel, onAction, compact = false }) {
    return (
        <div className={`ac-prof-empty-state${compact ? ' ac-prof-empty-state--compact' : ''}`}>
            <div className="ac-prof-empty-state__icon">
                <GraphUp />
            </div>
            <div>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            {actionLabel && onAction ? (
                <Button variant="outline-primary" onClick={onAction}>
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    );
}

function LoadingShell() {
    return (
        <div className="ac-prof-dashboard ac-prof-dashboard--loading">
            <aside className="ac-prof-sidebar">
                <div className="ac-prof-sidebar__brand-block">
                    <div className="ac-prof-skeleton ac-prof-skeleton--logo" />
                    <div className="ac-prof-sidebar__brand-ribbon" />
                </div>
                <div className="ac-prof-sidebar__nav-group">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="ac-prof-skeleton ac-prof-skeleton--nav" />
                    ))}
                </div>
            </aside>
            <div className="ac-prof-shell">
                <header className="ac-prof-header">
                    <div className="ac-prof-skeleton ac-prof-skeleton--header-title" />
                    <div className="ac-prof-skeleton ac-prof-skeleton--header-actions" />
                </header>
                <main className="ac-prof-main">
                    <div className="ac-prof-skeleton-grid">
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="ac-prof-skeleton ac-prof-skeleton--kpi" />
                        ))}
                    </div>
                    <div className="ac-prof-skeleton-grid ac-prof-skeleton-grid--content">
                        <div className="ac-prof-skeleton ac-prof-skeleton--panel" />
                        <div className="ac-prof-skeleton ac-prof-skeleton--panel" />
                    </div>
                </main>
            </div>
        </div>
    );
}

const ProfessionalDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id: dashboardId } = useParams();

    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window === 'undefined') return 'overview';
        const storedTab = window.sessionStorage.getItem(PROFESSIONAL_TAB_STORAGE_KEY);
        const allowedTabs = ['overview', 'patients', 'appointments', 'reports', 'assistants'];
        return allowedTabs.includes(storedTab) ? storedTab : 'overview';
    });
    const [patients, setPatients] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [notifications] = useState([]);
    const [assistants, setAssistants] = useState([]);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [showAssistantModal, setShowAssistantModal] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [assistantStatusFilter, setAssistantStatusFilter] = useState('todos');
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(true);
    const [loadingCharts, setLoadingCharts] = useState(false);
    const [loadingPatients] = useState(false);
    const [loadingConsultations] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.sessionStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [professionalInfo, setProfessionalInfo] = useState({
        name: '',
        specialty: '',
        totalPatients: 0,
        todayAppointments: 0,
        weekAppointments: 0
    });
    const [newAssistant, setNewAssistant] = useState({
        nome: '',
        cpf: '',
        email: '',
        password: '',
        status: 'ativo',
        telefone: ''
    });
    const [clinicInvitations, setClinicInvitations] = useState([]);
    const [invitationLoading, setInvitationLoading] = useState(false);
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
                backgroundColor: diagnosisPalette,
                borderColor: '#FFFFFF',
                borderWidth: 2,
                hoverOffset: 8
            }
        ]
    });
    const [appointmentTypeData, setAppointmentTypeData] = useState({
        labels: [],
        datasets: [
            {
                label: 'Tipos de Atendimento',
                data: [],
                backgroundColor: appointmentPalette,
                borderRadius: 12,
                borderSkipped: false,
                maxBarThickness: 42
            }
        ]
    });

    const loadClinicInvitations = async () => {
        try {
            const response = await apiClient.get('/professional/invitations');
            setClinicInvitations(response.data || []);
        } catch {
            setClinicInvitations([]);
        }
    };

    const respondClinicInvitation = async (invitationId, action) => {
        setInvitationLoading(true);
        try {
            await apiClient.post(`/professional/invitations/${invitationId}/${action}`);
            setSuccessMessage(action === 'accept' ? 'Convite aceito. Vínculo com a clínica realizado.' : 'Convite recusado.');
            await loadClinicInvitations();
        } catch (requestError) {
            setError(requestError.response?.data?.error || 'Não foi possível responder ao convite.');
        } finally {
            setInvitationLoading(false);
        }
    };

    useEffect(() => {
        if (user?.tipo_usuario === 'medicos_terapeutas') {
            loadClinicInvitations();
        }
    }, [user?.id]);

    const handleApiError = (err, context) => {
        console.error(`Erro ao ${context}:`, err.response?.data, err.message);
        const message = err.response?.data?.details
            ? `Erro ao ${context}: ${err.response.data.details}`
            : err.response?.data?.error || err.response?.data?.message || `Erro ao ${context}. Tente novamente.`;
        setError(message);
    };

    const fetchAssistants = async () => {
        if (!user) return;

        try {
            const response = await apiClient.get(`/professional/${user.id}/assistants`);
            setAssistants(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            handleApiError(err, 'buscar colaboradores');
        }
    };

    const handleAddAssistant = async (event) => {
        event.preventDefault();
        if (!user) return;

        try {
            await apiClient.post(`/professional/${user.id}/assistants`, newAssistant);
            setSuccessMessage('Colaborador adicionado com sucesso!');
            setNewAssistant({ nome: '', cpf: '', email: '', password: '', status: 'ativo', telefone: '' });
            setShowAssistantModal(false);
            fetchAssistants();
        } catch (err) {
            handleApiError(err, 'adicionar colaborador');
        }
    };

    const handleToggleStatus = async (assistantId, currentStatus) => {
        if (!user) return;

        const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

        try {
            await apiClient.put(`/professional/${user.id}/assistants/${assistantId}/status`, { status: newStatus });
            setSuccessMessage('Status do colaborador atualizado!');
            fetchAssistants();
        } catch (err) {
            handleApiError(err, 'atualizar o status do colaborador');
        }
    };

    const fetchDashboardData = async () => {
        try {
            const response = await apiClient.get(`/professional/dashboard/${user.id}`);
            const data = response.data;
            setProfessionalInfo({
                name: data.professional.name,
                specialty: data.professional.specialty,
                totalPatients: data.stats.totalPatients,
                todayAppointments: data.stats.todayAppointments,
                weekAppointments: data.stats.weekAppointments
            });
        } catch (err) {
            console.error('Erro ao buscar dados do dashboard:', err.response?.data, err.message);
            handleApiError(err, 'buscar dados do dashboard');
        }
    };

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

    const handleUpdatePatient = async (event) => {
        event.preventDefault();
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
            setSelectedPatient((previous) => ({ ...previous, ...editingPatient }));
        } catch (err) {
            handleApiError(err, 'atualizar paciente');
        }
    };

    const fetchConsultations = async () => {
        if (!user) return;

        try {
            const response = await apiClient.get(`/appointments/professional/${user.id}`);
            setConsultations(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            handleApiError(err, 'buscar consultas');
        }
    };

    const fetchPatientProgress = async () => {
        if (!user) return;

        try {
            const response = await apiClient.get(`/professional/${user.id}/patient-progress`);
            const data = Array.isArray(response.data) ? response.data : [];
            const labels = [...new Set(data.map((item) => new Date(item.recorded_date).toLocaleDateString('pt-BR')))];
            const metrics = ['Comunicacao', 'Interacao_Social', 'Comportamento'];
            const colors = {
                Comunicacao: { border: '#2563EB', fill: 'rgba(37, 99, 235, 0.10)' },
                Interacao_Social: { border: '#06B6D4', fill: 'rgba(6, 182, 212, 0.12)' },
                Comportamento: { border: '#22C55E', fill: 'rgba(34, 197, 94, 0.10)' }
            };

            const datasets = metrics.map((metric) => ({
                label: metric.replace('_', ' '),
                data: labels.map((label) => {
                    const item = data.find(
                        (entry) =>
                            new Date(entry.recorded_date).toLocaleDateString('pt-BR') === label &&
                            entry.metric_type === metric
                    );
                    return item ? item.score : null;
                }),
                borderColor: colors[metric].border,
                backgroundColor: colors[metric].fill,
                pointBackgroundColor: colors[metric].border,
                pointBorderWidth: 0,
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.36
            }));

            setPatientProgressData({ labels, datasets });
        } catch (err) {
            if (err.response?.status !== 404) {
                handleApiError(err, 'buscar o progresso dos pacientes');
            }
            setPatientProgressData({ labels: [], datasets: [] });
        }
    };

    const fetchDiagnosisDistribution = async () => {
        if (!user) return;

        setLoadingCharts(true);
        try {
            const response = await apiClient.get(`/professional/${user.id}/diagnosis-distribution`);
            const data = response.data;

            setDiagnosisDistribution({
                labels: data.labels,
                datasets: [
                    {
                        data: data.data,
                        backgroundColor: diagnosisPalette.slice(0, Math.max(data.data?.length || 0, 1)),
                        borderColor: '#FFFFFF',
                        borderWidth: 2,
                        hoverOffset: 8
                    }
                ]
            });
        } catch (err) {
            console.error('Erro ao buscar a distribuição de diagnósticos:', err.response?.data, err.message);
            handleApiError(err, 'buscar a distribuição de diagnósticos');
            setDiagnosisDistribution({
                labels: [],
                datasets: [{ data: [], backgroundColor: [], borderColor: '#FFFFFF', borderWidth: 2, hoverOffset: 0 }]
            });
        } finally {
            setLoadingCharts(false);
        }
    };

    const fetchAppointmentTypes = async () => {
        if (!user) return;

        setLoadingCharts(true);
        try {
            const response = await apiClient.get(`/professional/${user.id}/appointment-types`);
            const data = response.data || {};

            setAppointmentTypeData({
                labels: Array.isArray(data.labels) ? data.labels : [],
                datasets: [
                    {
                        label: 'Tipos de Atendimento',
                        data: Array.isArray(data.data) ? data.data : [],
                        backgroundColor: appointmentPalette,
                        borderRadius: 12,
                        borderSkipped: false,
                        maxBarThickness: 42
                    }
                ]
            });
        } catch (err) {
            if (err.response?.status === 404) {
                try {
                    const fallbackResponse = await apiClient.get(`/appointments/professional/${user.id}`);
                    const list = Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
                    const counts = list.reduce((accumulator, item) => {
                        const key = item.appointment_type || 'Consulta Regular';
                        accumulator[key] = (accumulator[key] || 0) + 1;
                        return accumulator;
                    }, {});

                    setAppointmentTypeData({
                        labels: Object.keys(counts),
                        datasets: [
                            {
                                label: 'Tipos de Atendimento',
                                data: Object.values(counts),
                                backgroundColor: appointmentPalette,
                                borderRadius: 12,
                                borderSkipped: false,
                                maxBarThickness: 42
                            }
                        ]
                    });
                    return;
                } catch (fallbackErr) {
                    if (fallbackErr.response?.status !== 404) {
                        handleApiError(fallbackErr, 'buscar tipos de consulta');
                    }
                }
            } else {
                console.error('Erro ao buscar tipos de consulta:', err.response?.data, err.message);
                handleApiError(err, 'buscar tipos de consulta');
            }

            setAppointmentTypeData({
                labels: [],
                datasets: [{ label: 'Tipos de Atendimento', data: [], backgroundColor: [], borderRadius: 12, borderSkipped: false }]
            });
        } finally {
            setLoadingCharts(false);
        }
    };

    const handleAddPatient = async (event) => {
        event.preventDefault();
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

    const handleAddAppointment = async (event) => {
        event.preventDefault();

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
                patientId: newAppointment.patientId,
                appointment_date: newAppointment.appointment_date,
                appointment_time: newAppointment.appointment_time,
                appointment_type: newAppointment.appointment_type,
                status: newAppointment.status,
                payment_method: newAppointment.payment_method,
                payment_details: newAppointment.payment_details,
                payment_status: newAppointment.payment_status,
                value: newAppointment.value,
                notes: newAppointment.notes
            };

            await apiClient.post('/appointments', payload);

            setSuccessMessage('Atendimento registrado com sucesso!');
            setShowAppointmentModal(false);
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

            fetchConsultations();
            fetchDashboardData();
            fetchAppointmentTypes();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            handleApiError(err, 'registrar o atendimento');
        }
    };

    const handleAddNote = async (event) => {
        event.preventDefault();

        if (!user || !selectedPatient) {
            setError('Usuário ou paciente não selecionado.');
            return;
        }

        try {
            await apiClient.post(`/professional/${user.id}/patients/${selectedPatient.id}/notes`, newNote);
            setSuccessMessage('Nota adicionada com sucesso!');
            setNewNote({ title: '', content: '' });
            setShowNoteModal(false);
            fetchPatientNotes(selectedPatient.id);
        } catch (err) {
            handleApiError(err, 'adicionar nota');
        }
    };

    const fetchPatientNotes = async (patientId) => {
        if (!user || !patientId) {
            setError('Não foi possível buscar as notas: ID do usuário ou do paciente está faltando.');
            return;
        }

        try {
            const response = await apiClient.get(`/professional/${user.id}/patients/${patientId}/notes`);
            const notes = response.data;
            setSelectedPatient((previous) => ({
                ...previous,
                notes: Array.isArray(notes) ? notes : []
            }));
        } catch (err) {
            handleApiError(err, 'buscar as notas do paciente');
            setSelectedPatient((previous) => ({
                ...previous,
                notes: []
            }));
        }
    };

    const handleUpdateStatus = async (patientId, newStatus) => {
        if (!user) return;

        try {
            await apiClient.put(`/professional/${user.id}/patients/${patientId}/status`, { status: newStatus });
            setSuccessMessage('Status do paciente atualizado!');
            await fetchPatients();

            if (selectedPatient && selectedPatient.id === patientId) {
                setSelectedPatient((previous) => ({ ...previous, status: newStatus }));
            }
        } catch (err) {
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
            setError(`Erro ao carregar detalhes do paciente: ${err.message}`);
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
            setError(`Erro ao carregar detalhes do paciente: ${err.message}`);
            setSelectedPatient(null);
        }
    };

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString('pt-BR') : 'N/A';
    };

    const formatTime = (timeString) => {
        return timeString ? timeString.substring(0, 5) : 'N/A';
    };

    const getStatusBadge = (status) => {
        const normalizedStatus = (status || '').toString().toLowerCase();

        if (['realizada', 'concluído', 'concluída', 'ativo', 'aceito', 'pago'].includes(normalizedStatus)) return 'success';
        if (['agendada', 'confirmada', 'pendente'].includes(normalizedStatus)) return 'warning';
        if (['cancelada', 'cancelado', 'inativo', 'recusado', 'atrasado', 'não realizada', 'nao realizada'].includes(normalizedStatus)) return 'danger';
        return 'neutral';
    };

    const getTodayAppointments = () => {
        const today = new Date();

        return consultations.filter((consultation) => {
            const appointmentDate = new Date(consultation.appointment_date);
            return (
                appointmentDate.getDate() === today.getDate() &&
                appointmentDate.getMonth() === today.getMonth() &&
                appointmentDate.getFullYear() === today.getFullYear()
            );
        });
    };

    const getInitials = (name) => {
        if (!name) return 'AC';
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
    };

    const normalizedSearch = (searchTerm || '').toLowerCase();
    const filteredPatients = patients.filter((patient) => {
        if (!patient) return false;

        const name = (patient.name ?? '').toString().toLowerCase();
        const diagnosis = (patient.diagnosis ?? '').toString().toLowerCase();
        const matchesSearch = name.includes(normalizedSearch) || diagnosis.includes(normalizedSearch);
        const matchesFilter = statusFilter === '' || statusFilter === 'todos' || (patient.status ?? '') === statusFilter;

        return matchesSearch && matchesFilter;
    });

    const filteredAssistants = assistants.filter((assistant) => {
        return assistantStatusFilter === '' || assistantStatusFilter === 'todos' || assistant.status === assistantStatusFilter;
    });

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#475569',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 18
                }
            },
            title: { display: false },
            tooltip: {
                backgroundColor: '#0F172A',
                titleColor: '#F8FAFC',
                bodyColor: '#E2E8F0',
                borderColor: 'rgba(37, 99, 235, 0.20)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#64748B' }
            },
            y: {
                beginAtZero: true,
                max: 5,
                ticks: { color: '#64748B', stepSize: 1 },
                grid: { color: 'rgba(148, 163, 184, 0.16)', drawBorder: false },
                title: { display: true, text: 'Escala de evolução', color: '#64748B' }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#475569',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 18
                }
            },
            title: { display: false },
            tooltip: {
                backgroundColor: '#0F172A',
                titleColor: '#F8FAFC',
                bodyColor: '#E2E8F0',
                padding: 12,
                cornerRadius: 12
            }
        }
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                backgroundColor: '#0F172A',
                titleColor: '#F8FAFC',
                bodyColor: '#E2E8F0',
                padding: 12,
                cornerRadius: 12
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#64748B' }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(148, 163, 184, 0.16)', drawBorder: false },
                ticks: { color: '#64748B' }
            }
        }
    };

    const todayAppointments = [...getTodayAppointments()].sort((a, b) =>
        `${a.appointment_time || ''}`.localeCompare(`${b.appointment_time || ''}`)
    );

    const upcomingAppointments = [...consultations]
        .filter((consultation) => {
            const timestamp = new Date(`${consultation.appointment_date}T${consultation.appointment_time || '00:00'}`);
            return !Number.isNaN(timestamp.getTime()) && timestamp >= new Date();
        })
        .sort((a, b) => {
            const first = new Date(`${a.appointment_date}T${a.appointment_time || '00:00'}`).getTime();
            const second = new Date(`${b.appointment_date}T${b.appointment_time || '00:00'}`).getTime();
            return first - second;
        });

    const nextAppointment = upcomingAppointments[0] || null;
    const unreadNotifications = notifications.filter((item) => !item.read).length;

    const sectionMeta = {
        overview: {
            title: 'Visão geral',
            breadcrumb: 'Dashboard / Visão geral',
            subtitle: 'Central de trabalho com agenda, pacientes e indicadores do seu acompanhamento.'
        },
        patients: {
            title: 'Pacientes',
            breadcrumb: 'Dashboard / Pacientes',
            subtitle: 'Gerencie seus pacientes e acompanhe suas informações clínicas com agilidade.'
        },
        appointments: {
            title: 'Atendimentos',
            breadcrumb: 'Dashboard / Atendimentos',
            subtitle: 'Visualize e gerencie o histórico dos seus atendimentos.'
        },
        reports: {
            title: 'Relatórios e indicadores',
            breadcrumb: 'Dashboard / Relatórios',
            subtitle: 'Visualize dados consolidados dos seus pacientes e atendimentos.'
        },
        assistants: {
            title: 'Equipe',
            breadcrumb: 'Dashboard / Colaboradores',
            subtitle: 'Gerencie profissionais e colaboradores vinculados à sua conta.'
        }
    };

    const activeSection = sectionMeta[activeTab] || sectionMeta.overview;

    const navigationGroups = [
        {
            label: 'Principal',
            items: [{ key: 'overview', label: 'Visão geral', icon: GraphUp }]
        },
        {
            label: 'Gestão',
            items: [
                { key: 'patients', label: 'Pacientes', icon: People },
                { key: 'appointments', label: 'Atendimentos', icon: Calendar2Check },
                { key: 'reports', label: 'Relatórios', icon: FileEarmarkText },
                { key: 'assistants', label: 'Colaboradores', icon: People },
                {
                    key: 'finance',
                    label: 'Financeiro',
                    icon: Wallet2,
                    href: `/financial-dashboard/${user?.id}`,
                    target: '_blank'
                }
            ]
        }
    ];

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.sessionStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.sessionStorage.removeItem(PROFESSIONAL_TAB_STORAGE_KEY);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleResize = () => {
            if (window.innerWidth >= 992) {
                setIsMobileSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [activeTab]);

    useEffect(() => {
        if (!user) {
            console.log('ProfessionalDashboard: Aguardando dados do usuário...');
            return;
        }

        if (user.tipo_usuario !== 'medicos_terapeutas' || (dashboardId && dashboardId !== user.id.toString())) {
            console.warn('Acesso negado ou ID da URL incorreto. Redirecionando...');
            navigate(`/professional-dashboard/${user.id}`);
            return;
        }

        const fetchAllData = async () => {
            setLoading(true);
            setError('');
            try {
                await Promise.all([
                    fetchDashboardData(),
                    fetchPatients(),
                    fetchConsultations(),
                    fetchAssistants(),
                    fetchPatientProgress(),
                    fetchDiagnosisDistribution(),
                    fetchAppointmentTypes()
                ]);
            } catch {
                setError('Ocorreu um erro ao carregar os dados do dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [user, navigate, dashboardId]);

    useEffect(() => {
        if (!user || loading) return;
        fetchPatients();
    }, [statusFilter]);

    const renderSidebarNavItem = (item, mobile = false) => {
        const Icon = item.icon;
        const collapsed = isSidebarCollapsed && !mobile;
        const isActive = activeTab === item.key;
        const className = `ac-prof-sidebar__item${isActive ? ' is-active' : ''}${item.href ? ' is-external' : ''}`;

        const content = item.href ? (
            <a
                href={item.href}
                target={item.target}
                rel="noopener noreferrer"
                className={className}
                title={item.label}
            >
                <span className="ac-prof-sidebar__item-icon">
                    <Icon />
                </span>
                <span className="ac-prof-sidebar__item-label">{item.label}</span>
                {!collapsed ? (
                    <span className="ac-prof-sidebar__item-arrow">
                        <ArrowRight />
                    </span>
                ) : null}
            </a>
        ) : (
            <button
                type="button"
                className={className}
                onClick={() => setActiveTab(item.key)}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
            >
                <span className="ac-prof-sidebar__item-icon">
                    <Icon />
                </span>
                <span className="ac-prof-sidebar__item-label">{item.label}</span>
            </button>
        );

        if (collapsed) {
            return (
                <OverlayTrigger key={item.key} placement="right" overlay={<Tooltip id={`tooltip-${item.key}`}>{item.label}</Tooltip>}>
                    {content}
                </OverlayTrigger>
            );
        }

        return <React.Fragment key={item.key}>{content}</React.Fragment>;
    };

    const renderSidebar = (mobile = false) => (
        <div className={`ac-prof-sidebar${isSidebarCollapsed && !mobile ? ' ac-prof-sidebar--collapsed' : ''}`}>
            <div className="ac-prof-sidebar__brand-block">
                <div className="ac-prof-sidebar__brand-row">
                    <img src={logonovo} alt="AutisConnect" className="ac-prof-sidebar__logo" />
                    {!mobile ? (
                        <button
                            type="button"
                            className="ac-prof-sidebar__collapse"
                            onClick={() => setIsSidebarCollapsed((current) => !current)}
                            aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                        >
                            {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
                        </button>
                    ) : null}
                </div>
                <div className="ac-prof-sidebar__brand-ribbon" />
            </div>

            <div className="ac-prof-sidebar__nav">
                {navigationGroups.map((group) => (
                    <div className="ac-prof-sidebar__nav-group" key={group.label}>
                        {!isSidebarCollapsed || mobile ? (
                            <span className="ac-prof-sidebar__group-label">{group.label}</span>
                        ) : null}
                        <div className="ac-prof-sidebar__group-items">
                            {group.items.map((item) => renderSidebarNavItem(item, mobile))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="ac-prof-sidebar__footer">
                {!isSidebarCollapsed || mobile ? (
                    <div className="ac-prof-sidebar__user">
                        <div className="ac-prof-sidebar__user-avatar">{getInitials(professionalInfo.name || user?.nome_completo || user?.username)}</div>
                        <div>
                            <strong>{professionalInfo.name || user?.nome_completo || user?.username || 'Profissional'}</strong>
                            <span>{professionalInfo.specialty || 'Profissional AutisConnect'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="ac-prof-sidebar__user-avatar ac-prof-sidebar__user-avatar--solo">
                        {getInitials(professionalInfo.name || user?.nome_completo || user?.username)}
                    </div>
                )}

                <button type="button" className="ac-prof-sidebar__logout" onClick={handleLogout}>
                    <BoxArrowRight />
                    {!isSidebarCollapsed || mobile ? <span>Sair</span> : null}
                </button>
            </div>
        </div>
    );

    const renderFeedback = () => {
        if (!successMessage && !error) return null;

        return (
            <div className="ac-prof-feedback-stack">
                {successMessage ? (
                    <Alert variant="success" className="ac-prof-feedback" dismissible onClose={() => setSuccessMessage('')}>
                        {successMessage}
                    </Alert>
                ) : null}
                {error ? (
                    <Alert variant="danger" className="ac-prof-feedback" dismissible onClose={() => setError('')}>
                        {error}
                    </Alert>
                ) : null}
            </div>
        );
    };

    const renderInvitations = () => {
        if (!clinicInvitations.length) return null;

        return (
            <section className="ac-prof-invitations">
                <div className="ac-prof-section-heading">
                    <div>
                        <span className="ac-prof-section-heading__eyebrow">Convites recebidos</span>
                        <h2>Clínicas aguardando sua resposta</h2>
                    </div>
                </div>
                <div className="ac-prof-invitations__grid">
                    {clinicInvitations.map((invitation) => (
                        <Card className="ac-prof-card ac-prof-invitation-card" key={invitation.id}>
                            <Card.Body>
                                <div className="ac-prof-invitation-card__header">
                                    <div>
                                        <span className="ac-prof-status ac-prof-status--warning">Pendente</span>
                                        <h3>{invitation.clinic_name || 'Clínica AutisConnect'}</h3>
                                    </div>
                                    <small>Expira em {formatDate(invitation.expires_at)}</small>
                                </div>
                                <p>
                                    {invitation.clinic_name || 'A clínica'} convidou você para fazer parte da equipe e ampliar o
                                    acompanhamento dos pacientes.
                                </p>
                                <div className="ac-prof-invitation-card__actions">
                                    <Button
                                        variant="outline-secondary"
                                        disabled={invitationLoading}
                                        onClick={() => respondClinicInvitation(invitation.id, 'decline')}
                                    >
                                        Recusar
                                    </Button>
                                    <Button disabled={invitationLoading} onClick={() => respondClinicInvitation(invitation.id, 'accept')}>
                                        {invitationLoading ? 'Processando...' : 'Aceitar'}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            </section>
        );
    };

    const renderPageActions = () => {
        if (activeTab === 'overview') {
            return (
                <div className="ac-prof-page-header__actions">
                    <Button onClick={() => setShowPatientModal(true)}>
                        <PlusCircle className="me-2" />
                        Novo paciente
                    </Button>
                    <Button variant="outline-primary" onClick={() => setShowAppointmentModal(true)}>
                        <Calendar2Check className="me-2" />
                        Novo atendimento
                    </Button>
                </div>
            );
        }

        if (activeTab === 'patients') {
            return (
                <div className="ac-prof-page-header__actions">
                    <Button onClick={() => setShowPatientModal(true)}>
                        <PlusCircle className="me-2" />
                        Adicionar paciente
                    </Button>
                </div>
            );
        }

        if (activeTab === 'appointments') {
            return (
                <div className="ac-prof-page-header__actions">
                    <Button onClick={() => setShowAppointmentModal(true)}>
                        <PlusCircle className="me-2" />
                        Novo atendimento
                    </Button>
                </div>
            );
        }

        if (activeTab === 'assistants') {
            return (
                <div className="ac-prof-page-header__actions">
                    <Button onClick={() => setShowAssistantModal(true)}>
                        <PlusCircle className="me-2" />
                        Adicionar colaborador
                    </Button>
                </div>
            );
        }

        return null;
    };

    const renderOverview = () => (
        <div className="ac-prof-section-stack">
            <div className="ac-prof-kpi-grid">
                <Card className="ac-prof-card ac-prof-kpi-card">
                    <Card.Body>
                        <span className="ac-prof-kpi-card__label">Pacientes ativos</span>
                        <strong>{professionalInfo.totalPatients || 0}</strong>
                        <small>Pessoas em acompanhamento na sua carteira atual.</small>
                    </Card.Body>
                </Card>
                <Card className="ac-prof-card ac-prof-kpi-card">
                    <Card.Body>
                        <span className="ac-prof-kpi-card__label">Atendimentos hoje</span>
                        <strong>{professionalInfo.todayAppointments || todayAppointments.length || 0}</strong>
                        <small>Compromissos programados para o dia de hoje.</small>
                    </Card.Body>
                </Card>
                <Card className="ac-prof-card ac-prof-kpi-card">
                    <Card.Body>
                        <span className="ac-prof-kpi-card__label">Atendimentos na semana</span>
                        <strong>{professionalInfo.weekAppointments || 0}</strong>
                        <small>Resumo operacional da sua agenda semanal.</small>
                    </Card.Body>
                </Card>
                <Card className="ac-prof-card ac-prof-kpi-card">
                    <Card.Body>
                        <span className="ac-prof-kpi-card__label">Próximo horário</span>
                        <strong>{nextAppointment ? formatTime(nextAppointment.appointment_time) : 'Livre'}</strong>
                        <small>
                            {nextAppointment
                                ? `${nextAppointment.patient_name || 'Paciente'} • ${formatDate(nextAppointment.appointment_date)}`
                                : 'Sua agenda está livre no momento.'}
                        </small>
                    </Card.Body>
                </Card>
            </div>

            <div className="ac-prof-overview-grid">
                <Card className="ac-prof-card ac-prof-card--wide">
                    <Card.Body>
                        <div className="ac-prof-card__header">
                            <div>
                                <span className="ac-prof-card__eyebrow">Agenda</span>
                                <h3>Atendimentos de hoje</h3>
                                <p>Organize a rotina do dia com status e pacientes prioritários.</p>
                            </div>
                            <Button variant="link" className="ac-prof-link-btn" onClick={() => setActiveTab('appointments')}>
                                Ver agenda
                                <ArrowRight className="ms-2" />
                            </Button>
                        </div>

                        {loadingConsultations ? (
                            <div className="ac-prof-loading-inline">
                                <Spinner animation="border" size="sm" />
                                <span>Carregando atendimentos...</span>
                            </div>
                        ) : todayAppointments.length > 0 ? (
                            <div className="table-responsive">
                                <Table className="ac-prof-table">
                                    <thead>
                                        <tr>
                                            <th>Horário</th>
                                            <th>Paciente</th>
                                            <th>Tipo</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {todayAppointments.map((consultation) => (
                                            <tr key={consultation.id}>
                                                <td data-label="Horário">{formatTime(consultation.appointment_time)}</td>
                                                <td data-label="Paciente">{consultation.patient_name || 'N/A'}</td>
                                                <td data-label="Tipo">{consultation.appointment_type || 'N/A'}</td>
                                                <td data-label="Status">
                                                    <span className={`ac-prof-status ac-prof-status--${getStatusBadge(consultation.status)}`}>
                                                        {consultation.status || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        ) : (
                            <EmptyState
                                compact
                                title="Nenhum atendimento hoje"
                                description="Sua agenda está livre no momento."
                                actionLabel="Registrar novo atendimento"
                                onAction={() => setShowAppointmentModal(true)}
                            />
                        )}
                    </Card.Body>
                </Card>

                <Card className="ac-prof-card">
                    <Card.Body>
                        <div className="ac-prof-card__header">
                            <div>
                                <span className="ac-prof-card__eyebrow">Atenção</span>
                                <h3>Notificações recentes</h3>
                                <p>Alertas importantes do seu ambiente de trabalho.</p>
                            </div>
                            {unreadNotifications > 0 ? <Badge bg="primary">{unreadNotifications}</Badge> : null}
                        </div>

                        {notifications.length ? (
                            <div className="ac-prof-notification-list">
                                {notifications.slice(0, 5).map((notification) => (
                                    <div key={notification.id} className="ac-prof-notification">
                                        <div className={`ac-prof-notification__dot ac-prof-notification__dot--${notification.read ? 'neutral' : 'primary'}`} />
                                        <div>
                                            <strong>{notification.message}</strong>
                                            <small>{formatDate(notification.date)}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState compact title="Nenhuma notificação" description="Você está em dia." />
                        )}
                    </Card.Body>
                </Card>
            </div>

            <div className="ac-prof-analytics-grid">
                <Card className="ac-prof-card ac-prof-chart-card ac-prof-chart-card--wide">
                    <Card.Body>
                        <div className="ac-prof-card__header">
                            <div>
                                <span className="ac-prof-card__eyebrow">Evolução</span>
                                <h3>Progresso dos pacientes</h3>
                                <p>Visão consolidada da evolução clínica registrada no sistema.</p>
                            </div>
                        </div>
                        <div className="ac-prof-chart">
                            {loadingCharts ? (
                                <div className="ac-prof-loading-inline">
                                    <Spinner animation="border" size="sm" />
                                    <span>Carregando dados...</span>
                                </div>
                            ) : patientProgressData.labels.length === 0 ? (
                                <EmptyState compact title="Sem dados de evolução" description="Ainda não há registros suficientes para este gráfico." />
                            ) : (
                                <Line data={patientProgressData} options={lineOptions} />
                            )}
                        </div>
                    </Card.Body>
                </Card>

                <Card className="ac-prof-card ac-prof-chart-card">
                    <Card.Body>
                        <div className="ac-prof-card__header">
                            <div>
                                <span className="ac-prof-card__eyebrow">Análises</span>
                                <h3>Distribuição de diagnósticos</h3>
                                <p>Panorama atual dos perfis acompanhados.</p>
                            </div>
                        </div>
                        <div className="ac-prof-chart">
                            {loadingCharts ? (
                                <div className="ac-prof-loading-inline">
                                    <Spinner animation="border" size="sm" />
                                    <span>Carregando dados...</span>
                                </div>
                            ) : diagnosisDistribution.labels.length === 0 ? (
                                <EmptyState compact title="Sem distribuição disponível" description="Não há dados suficientes para esta análise." />
                            ) : (
                                <Doughnut data={diagnosisDistribution} options={doughnutOptions} />
                            )}
                        </div>
                    </Card.Body>
                </Card>

                <Card className="ac-prof-card ac-prof-chart-card">
                    <Card.Body>
                        <div className="ac-prof-card__header">
                            <div>
                                <span className="ac-prof-card__eyebrow">Operação</span>
                                <h3>Tipos de atendimento</h3>
                                <p>Distribuição dos atendimentos por modalidade registrada.</p>
                            </div>
                        </div>
                        <div className="ac-prof-chart">
                            {loadingCharts ? (
                                <div className="ac-prof-loading-inline">
                                    <Spinner animation="border" size="sm" />
                                    <span>Carregando dados...</span>
                                </div>
                            ) : appointmentTypeData.labels.length === 0 ? (
                                <EmptyState compact title="Sem tipos cadastrados" description="Os dados aparecerão conforme os atendimentos forem registrados." />
                            ) : (
                                <Bar data={appointmentTypeData} options={barOptions} />
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );

    const renderPatients = () => (
        <div className="ac-prof-section-stack">
            <Card className="ac-prof-card">
                <Card.Body>
                    <div className="ac-prof-toolbar">
                        <div className="ac-prof-toolbar__search">
                            <Search />
                            <Form.Control
                                type="text"
                                placeholder="Buscar paciente por nome ou diagnóstico..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                        <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="ativo">Ativos</option>
                            <option value="inativo">Inativos</option>
                        </Form.Select>
                    </div>
                </Card.Body>
            </Card>

            <div className="ac-prof-patient-layout">
                <Card className="ac-prof-card">
                    <Card.Body>
                        <div className="ac-prof-card__header">
                            <div>
                                <span className="ac-prof-card__eyebrow">Cadastro clínico</span>
                                <h3>Pacientes</h3>
                                <p>Selecione um paciente para ver o painel detalhado ao lado.</p>
                            </div>
                        </div>

                        {loadingPatients ? (
                            <div className="ac-prof-loading-inline">
                                <Spinner animation="border" />
                                <span>Carregando pacientes...</span>
                            </div>
                        ) : filteredPatients.length > 0 ? (
                            <div className="table-responsive">
                                <Table className="ac-prof-table">
                                    <thead>
                                        <tr>
                                            <th>Paciente</th>
                                            <th>Nascimento</th>
                                            <th>Diagnóstico</th>
                                            <th>Status</th>
                                            <th>Último atendimento</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPatients.map((patient) => (
                                            <tr key={patient.id}>
                                                <td data-label="Paciente" onClick={() => handlePatientRowClick(patient)} className="ac-prof-cell-clickable">
                                                    <div className="ac-prof-patient-cell">
                                                        <span className="ac-prof-avatar">{getInitials(patient.name)}</span>
                                                        <div>
                                                            <strong>{patient.name}</strong>
                                                            <small>{patient.email || 'Sem e-mail cadastrado'}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Nascimento" onClick={() => handlePatientRowClick(patient)} className="ac-prof-cell-clickable">
                                                    {formatDate(patient.birthDate)}
                                                </td>
                                                <td data-label="Diagnóstico" onClick={() => handlePatientRowClick(patient)} className="ac-prof-cell-clickable">
                                                    {patient.diagnosis || 'N/A'}
                                                </td>
                                                <td data-label="Status" onClick={() => handlePatientRowClick(patient)} className="ac-prof-cell-clickable">
                                                    <span className={`ac-prof-status ac-prof-status--${getStatusBadge(patient.status)}`}>
                                                        {patient.status || 'N/A'}
                                                    </span>
                                                </td>
                                                <td data-label="Último atendimento" onClick={() => handlePatientRowClick(patient)} className="ac-prof-cell-clickable">
                                                    {formatDate(patient.registrationDate)}
                                                </td>
                                                <td data-label="Ações">
                                                    <Button variant="outline-primary" size="sm" onClick={() => handlePatientSelect(patient)}>
                                                        Perfil Paciente
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        ) : (
                            <EmptyState
                                title="Nenhum paciente encontrado"
                                description="Tente ajustar os filtros ou adicione um novo paciente."
                                actionLabel="Adicionar paciente"
                                onAction={() => setShowPatientModal(true)}
                            />
                        )}
                    </Card.Body>
                </Card>

                <Card className="ac-prof-card ac-prof-patient-panel">
                    <Card.Body>
                        {selectedPatient && selectedPatient.id ? (
                            <>
                                <div className="ac-prof-patient-panel__hero">
                                    <div className="ac-prof-patient-panel__avatar">{getInitials(selectedPatient.name)}</div>
                                    <div>
                                        <h3>{selectedPatient.name || 'Paciente'}</h3>
                                        <span className={`ac-prof-status ac-prof-status--${getStatusBadge(selectedPatient.status)}`}>
                                            {selectedPatient.status || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="ac-prof-patient-panel__section">
                                    <span className="ac-prof-card__eyebrow">Informações</span>
                                    <dl className="ac-prof-info-list">
                                        <div>
                                            <dt>Nascimento</dt>
                                            <dd>{selectedPatient.birthDate ? new Date(selectedPatient.birthDate).toLocaleDateString('pt-BR') : 'N/A'}</dd>
                                        </div>
                                        <div>
                                            <dt>Diagnóstico</dt>
                                            <dd>{selectedPatient.diagnosis || 'N/A'}</dd>
                                        </div>
                                        <div>
                                            <dt>Telefone</dt>
                                            <dd>{selectedPatient.phone || 'N/A'}</dd>
                                        </div>
                                        <div>
                                            <dt>E-mail</dt>
                                            <dd>{selectedPatient.email || 'N/A'}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="ac-prof-patient-panel__section">
                                    <span className="ac-prof-card__eyebrow">Observações</span>
                                    <p className="ac-prof-patient-panel__notes-text">
                                        {selectedPatient.observacoes || 'Nenhuma observação registrada.'}
                                    </p>
                                </div>

                                <div className="ac-prof-patient-panel__actions">
                                    <Button variant="outline-primary" onClick={() => handlePatientSelect(selectedPatient)}>
                                        Abrir prontuário
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => {
                                            setEditingPatient(selectedPatient);
                                            setShowEditPatientModal(true);
                                        }}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant={selectedPatient.status === 'ativo' ? 'outline-secondary' : 'primary'}
                                        onClick={() =>
                                            handleUpdateStatus(selectedPatient.id, selectedPatient.status === 'ativo' ? 'inativo' : 'ativo')
                                        }
                                    >
                                        {selectedPatient.status === 'ativo' ? 'Desativar' : 'Ativar'}
                                    </Button>
                                    <Button variant="primary" onClick={() => setShowNoteModal(true)}>
                                        Adicionar nota
                                    </Button>
                                </div>

                                <div className="ac-prof-patient-panel__section">
                                    <div className="ac-prof-card__header ac-prof-card__header--compact">
                                        <div>
                                            <h3>Notas do paciente</h3>
                                            <p>Histórico clínico complementar registrado para acompanhamento.</p>
                                        </div>
                                    </div>
                                    {selectedPatient.notes && Array.isArray(selectedPatient.notes) && selectedPatient.notes.length > 0 ? (
                                        <div className="ac-prof-note-list">
                                            {selectedPatient.notes.map((note) =>
                                                note && note.id ? (
                                                    <div key={note.id} className="ac-prof-note-card">
                                                        <strong>{note.title || 'Sem título'}</strong>
                                                        <p>{note.content || 'Sem conteúdo'}</p>
                                                        <small>{note.createdAt ? new Date(note.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</small>
                                                    </div>
                                                ) : null
                                            )}
                                        </div>
                                    ) : (
                                        <EmptyState compact title="Nenhuma nota registrada" description="Adicione uma nota para manter o histórico do paciente atualizado." />
                                    )}
                                </div>
                            </>
                        ) : (
                            <EmptyState
                                title="Selecione um paciente"
                                description="Ao escolher um registro da tabela, o painel lateral exibirá informações, status e notas."
                            />
                        )}
                    </Card.Body>
                </Card>
            </div>
        </div>
    );

    const renderAppointments = () => (
        <div className="ac-prof-section-stack">
            <div className="ac-prof-overview-grid ac-prof-overview-grid--compact">
                <Card className="ac-prof-card ac-prof-kpi-card">
                    <Card.Body>
                        <span className="ac-prof-kpi-card__label">Total de registros</span>
                        <strong>{consultations.length}</strong>
                        <small>Atendimentos disponíveis no histórico carregado.</small>
                    </Card.Body>
                </Card>
                <Card className="ac-prof-card ac-prof-kpi-card">
                    <Card.Body>
                        <span className="ac-prof-kpi-card__label">Hoje</span>
                        <strong>{todayAppointments.length}</strong>
                        <small>Atendimentos mapeados para a agenda atual.</small>
                    </Card.Body>
                </Card>
            </div>

            <Card className="ac-prof-card">
                <Card.Body>
                    <div className="ac-prof-card__header">
                        <div>
                            <span className="ac-prof-card__eyebrow">Histórico</span>
                            <h3>Atendimentos</h3>
                            <p>Visualize os registros e acompanhe o andamento de cada atendimento.</p>
                        </div>
                    </div>

                    {loadingConsultations ? (
                        <div className="ac-prof-loading-inline">
                            <Spinner animation="border" />
                            <span>Carregando atendimentos...</span>
                        </div>
                    ) : consultations.length > 0 ? (
                        <div className="table-responsive">
                            <Table className="ac-prof-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Horário</th>
                                        <th>Paciente</th>
                                        <th>Tipo</th>
                                        <th>Status</th>
                                        <th>Observações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consultations.map((consultation) => (
                                        <tr key={consultation.id}>
                                            <td data-label="Data">{formatDate(consultation.appointment_date)}</td>
                                            <td data-label="Horário">{formatTime(consultation.appointment_time)}</td>
                                            <td data-label="Paciente">{consultation.patient_name || 'N/A'}</td>
                                            <td data-label="Tipo">{consultation.appointment_type || 'N/A'}</td>
                                            <td data-label="Status">
                                                <span className={`ac-prof-status ac-prof-status--${getStatusBadge(consultation.status)}`}>
                                                    {consultation.status || 'N/A'}
                                                </span>
                                            </td>
                                            <td data-label="Observações">{consultation.notes || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <EmptyState
                            title="Nenhum atendimento encontrado"
                            description="Registre um novo atendimento para começar a preencher o histórico."
                            actionLabel="Novo atendimento"
                            onAction={() => setShowAppointmentModal(true)}
                        />
                    )}
                </Card.Body>
            </Card>
        </div>
    );

    const renderReports = () => (
        <div className="ac-prof-section-stack">
            <div className="ac-prof-analytics-grid">
                <Card className="ac-prof-card ac-prof-chart-card ac-prof-chart-card--wide">
                    <Card.Body>
                        <div className="ac-prof-card__header">
                            <div>
                                <span className="ac-prof-card__eyebrow">Analytics</span>
                                <h3>Progresso dos pacientes</h3>
                                <p>Série histórica dos principais indicadores clínicos monitorados.</p>
                            </div>
                        </div>
                        <div className="ac-prof-chart">
                            {loadingCharts ? (
                                <div className="ac-prof-loading-inline">
                                    <Spinner animation="border" size="sm" />
                                    <span>Carregando dados...</span>
                                </div>
                            ) : patientProgressData.labels.length === 0 ? (
                                <EmptyState compact title="Sem progresso disponível" description="Os dados aparecerão conforme os registros forem lançados." />
                            ) : (
                                <Line data={patientProgressData} options={lineOptions} />
                            )}
                        </div>
                    </Card.Body>
                </Card>

                <Card className="ac-prof-card ac-prof-chart-card">
                    <Card.Body>
                        <div className="ac-prof-card__header">
                            <div>
                                <span className="ac-prof-card__eyebrow">Distribuição</span>
                                <h3>Diagnósticos</h3>
                                <p>Visão consolidada dos diagnósticos registrados.</p>
                            </div>
                        </div>
                        <div className="ac-prof-chart">
                            {loadingCharts ? (
                                <div className="ac-prof-loading-inline">
                                    <Spinner animation="border" size="sm" />
                                    <span>Carregando dados...</span>
                                </div>
                            ) : diagnosisDistribution.labels.length === 0 ? (
                                <EmptyState compact title="Sem diagnósticos consolidados" description="Ainda não há dados suficientes para compor esta distribuição." />
                            ) : (
                                <Doughnut data={diagnosisDistribution} options={doughnutOptions} />
                            )}
                        </div>
                    </Card.Body>
                </Card>

                <Card className="ac-prof-card ac-prof-chart-card">
                    <Card.Body>
                        <div className="ac-prof-card__header">
                            <div>
                                <span className="ac-prof-card__eyebrow">Operação</span>
                                <h3>Atendimentos por tipo</h3>
                                <p>Distribuição das modalidades registradas na sua rotina.</p>
                            </div>
                        </div>
                        <div className="ac-prof-chart">
                            {loadingCharts ? (
                                <div className="ac-prof-loading-inline">
                                    <Spinner animation="border" size="sm" />
                                    <span>Carregando dados...</span>
                                </div>
                            ) : appointmentTypeData.labels.length === 0 ? (
                                <EmptyState compact title="Sem tipos de atendimento" description="Os dados aparecerão conforme os atendimentos forem registrados." />
                            ) : (
                                <Bar data={appointmentTypeData} options={barOptions} />
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );

    const renderAssistants = () => (
        <div className="ac-prof-section-stack">
            <Card className="ac-prof-card">
                <Card.Body>
                    <div className="ac-prof-toolbar">
                        <Form.Select value={assistantStatusFilter} onChange={(event) => setAssistantStatusFilter(event.target.value)}>
                            <option value="todos">Todos os status</option>
                            <option value="ativo">Apenas ativos</option>
                            <option value="inativo">Apenas inativos</option>
                        </Form.Select>
                        <Button onClick={() => setShowAssistantModal(true)}>
                            <PlusCircle className="me-2" />
                            Adicionar colaborador
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            <Card className="ac-prof-card">
                <Card.Body>
                    <div className="ac-prof-card__header">
                        <div>
                            <span className="ac-prof-card__eyebrow">Equipe</span>
                            <h3>Colaboradores vinculados</h3>
                            <p>Gerencie acessos, contatos e status dos colaboradores associados à sua conta.</p>
                        </div>
                    </div>

                    {filteredAssistants.length > 0 ? (
                        <div className="table-responsive">
                            <Table className="ac-prof-table">
                                <thead>
                                    <tr>
                                        <th>Colaborador</th>
                                        <th>Contato</th>
                                        <th>E-mail</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssistants.map((assistant) => (
                                        <tr key={assistant.id}>
                                            <td data-label="Colaborador">
                                                <div className="ac-prof-patient-cell">
                                                    <span className="ac-prof-avatar">{getInitials(assistant.nome)}</span>
                                                    <div>
                                                        <strong>{assistant.nome}</strong>
                                                        <small>{assistant.cpf || 'CPF não informado'}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Contato">{assistant.telefone || 'N/A'}</td>
                                            <td data-label="E-mail">{assistant.email || 'N/A'}</td>
                                            <td data-label="Status">
                                                <span className={`ac-prof-status ac-prof-status--${getStatusBadge(assistant.status)}`}>
                                                    {assistant.status || 'N/A'}
                                                </span>
                                            </td>
                                            <td data-label="Ações">
                                                <Button
                                                    variant={assistant.status === 'ativo' ? 'outline-secondary' : 'primary'}
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(assistant.id, assistant.status)}
                                                >
                                                    {assistant.status === 'ativo' ? 'Desativar' : 'Ativar'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <EmptyState
                            title="Nenhum colaborador cadastrado"
                            description="Adicione um novo colaborador para ampliar a operação da sua equipe."
                            actionLabel="Adicionar colaborador"
                            onAction={() => setShowAssistantModal(true)}
                        />
                    )}
                </Card.Body>
            </Card>
        </div>
    );

    const renderActiveContent = () => {
        switch (activeTab) {
            case 'patients':
                return renderPatients();
            case 'appointments':
                return renderAppointments();
            case 'reports':
                return renderReports();
            case 'assistants':
                return renderAssistants();
            case 'overview':
            default:
                return renderOverview();
        }
    };

    if (loading) {
        return (
            <ErrorBoundary>
                <LoadingShell />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <div className={`ac-prof-dashboard${isSidebarCollapsed ? ' ac-prof-dashboard--collapsed' : ''}`}>
                <aside className="ac-prof-sidebar-shell">{renderSidebar()}</aside>

                <Offcanvas
                    show={isMobileSidebarOpen}
                    onHide={() => setIsMobileSidebarOpen(false)}
                    placement="start"
                    className="ac-prof-offcanvas"
                >
                    <Offcanvas.Header closeButton closeVariant="white">
                        <Offcanvas.Title>AutisConnect</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>{renderSidebar(true)}</Offcanvas.Body>
                </Offcanvas>

                <div className="ac-prof-shell">
                    <header className="ac-prof-header">
                        <div className="ac-prof-header__context">
                            <button
                                type="button"
                                className="ac-prof-header__menu-toggle"
                                onClick={() => setIsMobileSidebarOpen(true)}
                                aria-label="Abrir menu"
                            >
                                <List />
                            </button>
                            <div>
                                <span className="ac-prof-header__breadcrumb">{activeSection.breadcrumb}</span>
                                <h1>{activeSection.title}</h1>
                            </div>
                        </div>

                        <div className="ac-prof-header__actions">
                            <button type="button" className="ac-prof-icon-button" onClick={() => setActiveTab('overview')} aria-label="Notificações">
                                <Bell />
                                {unreadNotifications > 0 ? <span className="ac-prof-icon-button__badge">{unreadNotifications}</span> : null}
                            </button>

                            <Dropdown align="end">
                                <Dropdown.Toggle variant="light" className="ac-prof-profile-toggle">
                                    <span className="ac-prof-profile-toggle__avatar">
                                        <PersonCircle />
                                    </span>
                                    <span className="ac-prof-profile-toggle__content">
                                        <strong>{professionalInfo.name || user?.nome_completo || user?.username || 'Profissional'}</strong>
                                        <small>{professionalInfo.specialty || 'Profissional AutisConnect'}</small>
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="ac-prof-dropdown">
                                    <Dropdown.Header>
                                        {professionalInfo.name || user?.nome_completo || user?.username || 'Profissional'}
                                    </Dropdown.Header>
                                    <Dropdown.Item as="button" onClick={handleLogout}>
                                        <BoxArrowRight className="me-2" />
                                        Sair
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </header>

                    <main className="ac-prof-main">
                        {renderFeedback()}
                        {renderInvitations()}

                        <section className="ac-prof-page-header">
                            <div className="ac-prof-page-header__copy">
                                <span className="ac-prof-page-header__eyebrow">AutisConnect Professional</span>
                                <h2>
                                    {activeTab === 'overview'
                                        ? `Bom dia, ${professionalInfo.name || user?.nome_completo || user?.username || 'Profissional'}`
                                        : activeSection.title}
                                </h2>
                                <p>
                                    {activeTab === 'overview'
                                        ? `Aqui está o resumo dos seus atendimentos, pacientes e indicadores. ${professionalInfo.specialty ? `Especialidade: ${professionalInfo.specialty}.` : ''}`
                                        : activeSection.subtitle}
                                </p>
                            </div>
                            {renderPageActions()}
                        </section>

                        {renderActiveContent()}
                    </main>
                </div>

                <Modal show={showPatientModal} onHide={() => setShowPatientModal(false)} size="lg" className="ac-prof-modal">
                    <Modal.Header closeButton>
                        <Modal.Title>Adicionar novo paciente</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleAddPatient}>
                        <Modal.Body>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nome completo *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={newPatient.name}
                                            onChange={(event) => setNewPatient({ ...newPatient, name: event.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Data de nascimento</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={newPatient.birthDate}
                                            onChange={(event) => setNewPatient({ ...newPatient, birthDate: event.target.value })}
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
                                            onChange={(event) => setNewPatient({ ...newPatient, phone: event.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={newPatient.email}
                                            onChange={(event) => setNewPatient({ ...newPatient, email: event.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Diagnóstico do Transtorno do Espectro Autista (TEA)</Form.Label>
                                <div className="d-flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant={newPatient.diagnosis === 'Nível 1' ? 'primary' : 'outline-primary'}
                                        onClick={() => setNewPatient({ ...newPatient, diagnosis: 'Nível 1' })}
                                    >
                                        Nível 1
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={newPatient.diagnosis === 'Nível 2' ? 'primary' : 'outline-primary'}
                                        onClick={() => setNewPatient({ ...newPatient, diagnosis: 'Nível 2' })}
                                    >
                                        Nível 2
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={newPatient.diagnosis === 'Nível 3' ? 'primary' : 'outline-primary'}
                                        onClick={() => setNewPatient({ ...newPatient, diagnosis: 'Nível 3' })}
                                    >
                                        Nível 3
                                    </Button>
                                </div>
                                <Form.Text className="text-muted">Selecione o nível de suporte necessário.</Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Observações</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={newPatient.notes}
                                    onChange={(event) => setNewPatient({ ...newPatient, notes: event.target.value })}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" onClick={() => setShowPatientModal(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Adicionar paciente</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)} size="lg" className="ac-prof-modal">
                    <Modal.Header closeButton>
                        <Modal.Title>Novo atendimento</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleAddAppointment}>
                        <Modal.Body>
                            <Form.Group className="mb-3" controlId="appointmentPatient">
                                <Form.Label>Paciente *</Form.Label>
                                <Form.Select
                                    name="patientId"
                                    value={newAppointment.patientId}
                                    onChange={(event) => setNewAppointment({ ...newAppointment, patientId: event.target.value })}
                                    required
                                >
                                    <option value="">Selecione um paciente</option>
                                    {patients.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="appointmentDate">
                                        <Form.Label>Data do atendimento *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="appointment_date"
                                            value={newAppointment.appointment_date}
                                            onChange={(event) =>
                                                setNewAppointment({ ...newAppointment, appointment_date: event.target.value })
                                            }
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="appointmentTime">
                                        <Form.Label>Horário *</Form.Label>
                                        <Form.Control
                                            type="time"
                                            name="appointment_time"
                                            value={newAppointment.appointment_time}
                                            onChange={(event) =>
                                                setNewAppointment({ ...newAppointment, appointment_time: event.target.value })
                                            }
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="appointmentType">
                                        <Form.Label>Tipo de atendimento</Form.Label>
                                        <Form.Select
                                            name="appointment_type"
                                            value={newAppointment.appointment_type}
                                            onChange={(event) =>
                                                setNewAppointment({ ...newAppointment, appointment_type: event.target.value })
                                            }
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
                                        <Form.Label>Status do atendimento</Form.Label>
                                        <Form.Select
                                            name="status"
                                            value={newAppointment.status}
                                            onChange={(event) => setNewAppointment({ ...newAppointment, status: event.target.value })}
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
                                        <Form.Label>Valor do atendimento (R$) *</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            name="value"
                                            placeholder="Ex: 150.00"
                                            value={newAppointment.value}
                                            onChange={(event) => setNewAppointment({ ...newAppointment, value: event.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="paymentStatus">
                                        <Form.Label>Status do pagamento</Form.Label>
                                        <Form.Select
                                            name="payment_status"
                                            value={newAppointment.payment_status}
                                            onChange={(event) =>
                                                setNewAppointment({ ...newAppointment, payment_status: event.target.value })
                                            }
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
                            <h5 className="ac-prof-modal__section-title">Detalhes do pagamento</h5>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="paymentMethod">
                                        <Form.Label>Forma de pagamento</Form.Label>
                                        <Form.Select
                                            name="payment_method"
                                            value={newAppointment.payment_method}
                                            onChange={(event) =>
                                                setNewAppointment({ ...newAppointment, payment_method: event.target.value })
                                            }
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
                                                onChange={(event) =>
                                                    setNewAppointment({ ...newAppointment, payment_details: event.target.value })
                                                }
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
                                    onChange={(event) => setNewAppointment({ ...newAppointment, notes: event.target.value })}
                                    placeholder="Digite observações sobre o atendimento"
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" onClick={() => setShowAppointmentModal(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Salvar atendimento</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} className="ac-prof-modal">
                    <Modal.Header closeButton>
                        <Modal.Title>Adicionar nota</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleAddNote}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Título *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newNote.title}
                                    onChange={(event) => setNewNote({ ...newNote, title: event.target.value })}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Conteúdo *</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={5}
                                    value={newNote.content}
                                    onChange={(event) => setNewNote({ ...newNote, content: event.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" onClick={() => setShowNoteModal(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Adicionar nota</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                <Modal show={showEditPatientModal} onHide={() => setShowEditPatientModal(false)} size="lg" className="ac-prof-modal">
                    <Modal.Header closeButton>
                        <Modal.Title>Editar dados do paciente</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleUpdatePatient}>
                        <Modal.Body>
                            {editingPatient ? (
                                <>
                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Nome completo *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={editingPatient.name || ''}
                                                    onChange={(event) =>
                                                        setEditingPatient({ ...editingPatient, name: event.target.value })
                                                    }
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Data de nascimento</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={editingPatient.birthDate ? editingPatient.birthDate.split('T')[0] : ''}
                                                    onChange={(event) =>
                                                        setEditingPatient({ ...editingPatient, birthDate: event.target.value })
                                                    }
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Telefone</Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    value={editingPatient.phone || ''}
                                                    onChange={(event) =>
                                                        setEditingPatient({ ...editingPatient, phone: event.target.value })
                                                    }
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={editingPatient.email || ''}
                                            onChange={(event) => setEditingPatient({ ...editingPatient, email: event.target.value })}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Diagnóstico do Transtorno do Espectro Autista (TEA)</Form.Label>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                variant={editingPatient.diagnosis === 'Nível 1' ? 'primary' : 'outline-primary'}
                                                onClick={() => setEditingPatient({ ...editingPatient, diagnosis: 'Nível 1' })}
                                            >
                                                Nível 1
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={editingPatient.diagnosis === 'Nível 2' ? 'primary' : 'outline-primary'}
                                                onClick={() => setEditingPatient({ ...editingPatient, diagnosis: 'Nível 2' })}
                                            >
                                                Nível 2
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={editingPatient.diagnosis === 'Nível 3' ? 'primary' : 'outline-primary'}
                                                onClick={() => setEditingPatient({ ...editingPatient, diagnosis: 'Nível 3' })}
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
                                            onChange={(event) =>
                                                setEditingPatient({ ...editingPatient, observacoes: event.target.value })
                                            }
                                        />
                                    </Form.Group>
                                </>
                            ) : null}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" onClick={() => setShowEditPatientModal(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Salvar alterações</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                <Modal show={showAssistantModal} onHide={() => setShowAssistantModal(false)} size="lg" className="ac-prof-modal">
                    <Modal.Header closeButton>
                        <Modal.Title>Adicionar colaborador</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleAddAssistant}>
                        <Modal.Body>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Nome</Form.Label>
                                        <Form.Control
                                            placeholder="Nome completo"
                                            value={newAssistant.nome}
                                            onChange={(event) => setNewAssistant({ ...newAssistant, nome: event.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>CPF</Form.Label>
                                        <Form.Control
                                            placeholder="CPF (opcional)"
                                            value={newAssistant.cpf}
                                            onChange={(event) => setNewAssistant({ ...newAssistant, cpf: event.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Telefone</Form.Label>
                                        <Form.Control
                                            placeholder="Telefone"
                                            value={newAssistant.telefone || ''}
                                            onChange={(event) => setNewAssistant({ ...newAssistant, telefone: event.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>E-mail (para login)</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="Email"
                                            value={newAssistant.email}
                                            onChange={(event) => setNewAssistant({ ...newAssistant, email: event.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Senha</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Senha"
                                            value={newAssistant.password}
                                            onChange={(event) => setNewAssistant({ ...newAssistant, password: event.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Status</Form.Label>
                                        <Form.Select
                                            value={newAssistant.status}
                                            onChange={(event) => setNewAssistant({ ...newAssistant, status: event.target.value })}
                                        >
                                            <option value="ativo">Ativo</option>
                                            <option value="inativo">Inativo</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" onClick={() => setShowAssistantModal(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Adicionar colaborador</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            </div>
        </ErrorBoundary>
    );
};

export default ProfessionalDashboard;
