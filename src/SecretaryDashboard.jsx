import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
    Row,
    Col,
    Button,
    Table,
    Form,
    Modal,
    Spinner,
    Alert,
    Offcanvas,
    Dropdown
} from 'react-bootstrap';
import {
    Calendar2Check,
    ChatDots,
    Bell,
    PlusCircle,
    BarChartLine,
    People,
    HouseDoor,
    ChevronLeft,
    ChevronRight
} from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';

import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';

import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import logonovo from './assets/logonovo.png';
import './SecretaryDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const SIDEBAR_STORAGE_KEY = 'ac-secretary-sidebar-collapsed';

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

const APPOINTMENT_STATUS_OPTIONS = ['Agendada', 'Confirmada', 'Realizada', 'Cancelada', 'Não Realizada'];
const PAYMENT_STATUS_OPTIONS = ['Pendente', 'Pago', 'Atrasado', 'Isento'];
const PAYMENT_METHOD_OPTIONS = ['Pix', 'Crédito', 'Débito', 'Dinheiro', 'Plano de Saúde', 'Outros'];
const APPOINTMENT_TYPE_OPTIONS = ['Consulta Regular', 'Consulta Inicial', 'Acompanhamento', 'Avaliação', 'Terapia'];
const DIAGNOSIS_OPTIONS = ['Nível 1', 'Nível 2', 'Nível 3'];

const appointmentStatusTone = {
    Agendada: 'scheduled',
    Confirmada: 'confirmed',
    Realizada: 'completed',
    Cancelada: 'cancelled',
    'Não Realizada': 'missed'
};

const paymentStatusTone = {
    Pendente: 'pending',
    Pago: 'paid',
    Atrasado: 'overdue',
    Isento: 'neutral'
};

const patientStatusTone = {
    ativo: 'active',
    inativo: 'inactive'
};

const safeFormatCurrency = (value) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
        return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numericValue);
};

const formatDate = (dateString) => (
    dateString
        ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : 'N/A'
);

const formatTime = (timeString) => (timeString ? timeString.substring(0, 5) : 'N/A');

const formatDateTime = (dateString, timeString) => (
    `${formatDate(dateString)} • ${formatTime(timeString)}`
);

const getInitials = (value) => {
    if (!value) {
        return 'AC';
    }

    const parts = value
        .split(' ')
        .map((part) => part.trim())
        .filter(Boolean);

    if (parts.length === 0) {
        return 'AC';
    }

    return parts
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
};

const capitalizeText = (value) => (
    value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
);

const getGreeting = () => {
    const currentHour = new Date().getHours();

    if (currentHour < 12) {
        return 'Bom dia';
    }

    if (currentHour < 18) {
        return 'Boa tarde';
    }

    return 'Boa noite';
};

const StatusPill = ({ value, toneMap }) => {
    const tone = toneMap[value] || 'neutral';

    return <span className={`ac-secretary-pill ac-secretary-pill--${tone}`}>{value || 'N/A'}</span>;
};

const SectionCard = ({ eyebrow, title, subtitle, action, children, className = '', bodyClassName = '' }) => (
    <section className={`ac-secretary-card ${className}`.trim()}>
        <header className="ac-secretary-card__header">
            <div>
                {eyebrow ? <span className="ac-secretary-card__eyebrow">{eyebrow}</span> : null}
                <h3 className="ac-secretary-card__title">{title}</h3>
                {subtitle ? <p className="ac-secretary-card__subtitle">{subtitle}</p> : null}
            </div>
            {action ? <div className="ac-secretary-card__action">{action}</div> : null}
        </header>
        <div className={`ac-secretary-card__body ${bodyClassName}`.trim()}>{children}</div>
    </section>
);

const KpiCard = ({ label, value, hint, accent }) => (
    <article className={`ac-secretary-kpi ac-secretary-kpi--${accent}`.trim()}>
        <span className="ac-secretary-kpi__label">{label}</span>
        <strong className="ac-secretary-kpi__value">{value}</strong>
        <span className="ac-secretary-kpi__hint">{hint}</span>
    </article>
);

const EmptyState = ({ title, description }) => (
    <div className="ac-secretary-empty-state">
        <strong>{title}</strong>
        <p>{description}</p>
    </div>
);

const SecretaryDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id: secretaryId } = useParams();

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
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 1200));
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
        } catch (storageError) {
            console.warn('Não foi possível ler a preferência da sidebar.', storageError);
            return false;
        }
    });

    const isClinicSecretary = Boolean(user?.clinic_id);

    const handleApiError = (err, context) => {
        console.error(`Erro ao ${context}:`, err);
        const message = err.response?.data?.error || err.response?.data?.message || `Erro ao ${context}. Tente novamente.`;
        setError(message);
    };

    const fetchAllData = useCallback(async () => {
        if (!user) {
            return;
        }

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

            setNewPatient((prev) => ({
                ...prev,
                professionalId: prev.professionalId || defaultProfessionalId
            }));

            setNewAppointment((prev) => ({
                ...prev,
                professionalId: prev.professionalId || defaultProfessionalId
            }));
        } catch (err) {
            handleApiError(err, 'carregar os dados do dashboard');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleAddAppointment = async (e) => {
        e.preventDefault();

        if (!user) {
            setError('Usuário não autenticado.');
            return;
        }

        if (
            !newAppointment.patientId
            || !newAppointment.appointment_date
            || !newAppointment.appointment_time
            || (!isClinicSecretary && !newAppointment.value)
            || (isClinicSecretary && !newAppointment.professionalId)
        ) {
            setError(
                isClinicSecretary
                    ? 'Profissional, paciente, data e hora sao obrigatorios.'
                    : 'Profissional, paciente, data, hora e valor sao obrigatorios.'
            );
            return;
        }

        try {
            const appointmentPayload = isClinicSecretary
                ? { ...newAppointment, value: 0, payment_method: null, payment_details: null, payment_status: 'Pendente' }
                : newAppointment;

            await apiClient.post('/secretary/appointments', appointmentPayload);
            setSuccessMessage('Atendimento registrado com sucesso!');
            setShowAppointmentModal(false);
            setNewAppointment({
                ...emptyAppointmentForm,
                professionalId: professionals.length === 1 ? String(professionals[0].id) : ''
            });
            fetchAllData();
        } catch (err) {
            handleApiError(err, 'registrar o atendimento');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.recipientId || !newMessage.content) {
            setError('Destinatário e conteúdo são obrigatórios.');
            return;
        }

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

    const handleFieldUpdate = async (appointmentId, field, value) => {
        setAppointments((prev) => prev.map((item) => (item.id === appointmentId ? { ...item, [field]: value } : item)));

        try {
            await apiClient.put(`/secretary/appointments/${appointmentId}`, { field, value });
            setSuccessMessage('Campo atualizado com sucesso!');
        } catch (err) {
            handleApiError(err, 'atualizar o campo');
            fetchAllData();
        }
    };

    const handleAddPatient = async (e) => {
        e.preventDefault();

        if (!user) {
            return;
        }

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
            fetchAllData();
        } catch (err) {
            handleApiError(err, 'adicionar paciente');
        }
    };

    const handlePatientRowClick = async (patient) => {
        if (!patient || !patient.id) {
            setError('Ocorreu um erro ao selecionar o paciente.');
            console.error('Tentativa de clique em paciente inválido:', patient);
            setSelectedPatient(null);
            return;
        }

        try {
            setSelectedPatient({ ...patient, notes: [] });
            await fetchPatientNotes(patient.id);
        } catch (err) {
            handleApiError(err, 'carregar os detalhes do paciente');
            setSelectedPatient(null);
        }
    };

    const handleUpdatePatient = async (e) => {
        e.preventDefault();

        if (!editingPatient?.id || !user) {
            setError('Nenhum paciente selecionado para edição.');
            return;
        }

        try {
            const payload = {
                name: editingPatient.name,
                birthDate: (editingPatient.birthDate || editingPatient.birth_date)
                    ? new Date(editingPatient.birthDate || editingPatient.birth_date).toISOString().split('T')[0]
                    : null,
                phone: editingPatient.phone,
                email: editingPatient.email,
                diagnosis: editingPatient.diagnosis,
                notes: editingPatient.observacoes ?? editingPatient.notes,
                professionalId: editingPatient.professionalId || editingPatient.professional_id
            };

            await apiClient.put(`/secretary/patients/${editingPatient.id}`, payload);
            setSuccessMessage('Dados do paciente atualizados com sucesso!');
            setShowEditPatientModal(false);
            fetchAllData();
            setSelectedPatient((prev) => ({ ...prev, ...editingPatient, observacoes: payload.notes }));
            setEditingPatient(null);
        } catch (err) {
            handleApiError(err, 'atualizar paciente');
        }
    };

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

    const handleAddNote = async (e) => {
        e.preventDefault();

        if (!selectedPatient || !selectedPatient.id) {
            setError('Selecione um paciente para adicionar nota.');
            return;
        }

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

    const fetchPatientNotes = async (patientId) => {
        if (!patientId) {
            return;
        }

        try {
            const response = await apiClient.get(`/secretary/patients/${patientId}/notes`);
            setSelectedPatient((prev) => ({ ...prev, notes: Array.isArray(response.data) ? response.data : [] }));
        } catch (err) {
            handleApiError(err, 'carregar notas do paciente');
            setSelectedPatient((prev) => ({ ...prev, notes: [] }));
        }
    };

    const filteredPatients = useMemo(() => {
        if (!Array.isArray(patients)) {
            return [];
        }

        return patients.filter((patient) => {
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
        if (!Array.isArray(patients)) {
            return [];
        }

        if (!newAppointment.professionalId) {
            return patients;
        }

        return patients.filter((patient) => {
            const patientProfessionalId = patient.professionalId ?? patient.professional_id;
            return !patientProfessionalId || String(patientProfessionalId) === String(newAppointment.professionalId);
        });
    }, [patients, newAppointment.professionalId]);

    const getProfessionalName = useCallback((professionalId) => {
        const matchedProfessional = professionals.find((item) => String(item.id) === String(professionalId));
        return matchedProfessional?.name || 'N/A';
    }, [professionals]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const filteredAppointments = useMemo(() => {
        if (!Array.isArray(appointments)) {
            return [];
        }

        return appointments.filter((app) => {
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
        if (!Array.isArray(appointments)) {
            return { appointmentsToday: [], upcomingAppointments: [], pendingPayments: [] };
        }

        const today = new Date().toISOString().slice(0, 10);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const todayList = appointments.filter((item) => item.appointment_date?.slice(0, 10) === today);
        const upcomingList = appointments
            .filter((item) => {
                const appDate = new Date(item.appointment_date);
                return appDate > new Date() && appDate <= nextWeek;
            })
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
        const pendingList = appointments.filter((item) => item.payment_status === 'Pendente' && item.status === 'Realizada');

        return { appointmentsToday: todayList, upcomingAppointments: upcomingList, pendingPayments: pendingList };
    }, [appointments]);

    const chartData = useMemo(() => {
        if (!Array.isArray(appointments)) {
            return {
                statusDistribution: { labels: [], datasets: [] },
                dailyPerformance: { labels: [], datasets: [] }
            };
        }

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

        const last7Days = [...Array(7)].map((_, index) => {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() - index);
            return currentDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        }).reverse();

        const statusLabels = Object.keys(statusCounts);
        const statusPalette = {
            Agendada: '#2563EB',
            Confirmada: '#06B6D4',
            Realizada: '#16A34A',
            Cancelada: '#DC2626',
            'Não Realizada': '#64748B'
        };

        return {
            statusDistribution: {
                labels: statusLabels,
                datasets: [{
                    data: statusLabels.map((label) => statusCounts[label]),
                    backgroundColor: statusLabels.map((label) => statusPalette[label] || '#94A3B8'),
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            dailyPerformance: {
                labels: last7Days,
                datasets: [{
                    label: 'Atendimentos Realizados',
                    data: last7Days.map((day) => dailyCounts[day] || 0),
                    backgroundColor: 'rgba(37, 99, 235, 0.78)',
                    borderRadius: 12,
                    borderSkipped: false,
                    maxBarThickness: 32
                }]
            }
        };
    }, [appointments]);

    const chartTotal = useMemo(
        () => chartData.statusDistribution.datasets[0]?.data?.reduce((acc, value) => acc + value, 0) || 0,
        [chartData]
    );

    const sortedAppointmentsToday = useMemo(
        () => [...appointmentsToday].sort((a, b) => String(a.appointment_time || '').localeCompare(String(b.appointment_time || ''))),
        [appointmentsToday]
    );

    const upcomingPreview = useMemo(() => upcomingAppointments.slice(0, 5), [upcomingAppointments]);
    const professionalsPreview = useMemo(() => professionals.slice(0, 5), [professionals]);
    const recentMessages = useMemo(() => messages.slice(0, 5), [messages]);

    const unreadMessagesCount = useMemo(() => {
        if (!Array.isArray(messages) || messages.length === 0) {
            return null;
        }

        const canReadUnread = messages.some((message) => Object.prototype.hasOwnProperty.call(message, 'read'));
        return canReadUnread ? messages.filter((message) => !message.read).length : null;
    }, [messages]);

    const activePatientsCount = useMemo(
        () => patients.filter((patient) => patient.status === 'ativo').length,
        [patients]
    );

    const pendingPaymentsTotal = useMemo(
        () => pendingPayments.reduce((acc, item) => acc + Number(item.value || 0), 0),
        [pendingPayments]
    );

    const completedAppointmentsCount = useMemo(
        () => appointments.filter((item) => item.status === 'Realizada').length,
        [appointments]
    );

    const confirmedAppointmentsCount = useMemo(
        () => appointments.filter((item) => item.status === 'Confirmada').length,
        [appointments]
    );

    const cancelledAppointmentsCount = useMemo(
        () => appointments.filter((item) => item.status === 'Cancelada' || item.status === 'Não Realizada').length,
        [appointments]
    );

    const notificationCount = unreadMessagesCount ?? messages.length;
    const userDisplayName = user?.nome_completo || user?.username || user?.nome || 'Secretaria';
    const userFirstName = userDisplayName.split(' ')[0] || 'Secretaria';
    const greeting = getGreeting();
    const currentDateLabel = capitalizeText(new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
    }).format(new Date()));

    const contextLabel = useMemo(() => {
        if (isClinicSecretary) {
            return 'Secretaria da Clínica';
        }

        if (professional?.name) {
            return `Secretaria de ${professional.name}`;
        }

        return 'Secretaria Profissional';
    }, [isClinicSecretary, professional]);

    const workspaceSummary = useMemo(() => {
        if (isClinicSecretary) {
            return 'Operação, equipe e acompanhamento dos atendimentos em uma única central.';
        }

        if (professional?.name) {
            return `Agenda, pacientes e comunicação de ${professional.name} organizados no mesmo fluxo.`;
        }

        return 'Agenda, pacientes e comunicação organizados em um único fluxo operacional.';
    }, [isClinicSecretary, professional]);

    const sectionMeta = {
        overview: {
            eyebrow: 'Visão operacional',
            title: 'Central da Secretaria',
            description: 'Organização da agenda, pacientes e comunicação em tempo real.'
        },
        full_history: {
            eyebrow: 'Agenda e histórico',
            title: 'Atendimentos',
            description: 'Gestão completa da agenda com filtros e edição inline.'
        },
        patients: {
            eyebrow: 'Cadastro e acompanhamento',
            title: 'Pacientes',
            description: 'Dados, status e notas clínicas com acesso rápido.'
        },
        communication: {
            eyebrow: 'Comunicação integrada',
            title: 'Mensagens',
            description: 'Acompanhe e envie comunicações da operação sem sair da rotina.'
        },
        analytics: {
            eyebrow: 'Análises operacionais',
            title: 'Analytics',
            description: 'Leitura rápida da demanda, execução e distribuição de status.'
        }
    };

    const sidebarGroups = [
        {
            label: 'Principal',
            items: [
                { key: 'overview', label: 'Visão Geral', description: 'Resumo da operação', icon: HouseDoor }
            ]
        },
        {
            label: 'Operação',
            items: [
                { key: 'full_history', label: 'Agenda', description: 'Histórico e gestão', icon: Calendar2Check },
                { key: 'patients', label: 'Pacientes', description: 'Cadastro e evolução', icon: People }
            ]
        },
        {
            label: 'Comunicação',
            items: [
                { key: 'communication', label: 'Mensagens', description: 'Recados e contatos', icon: ChatDots }
            ]
        },
        {
            label: 'Gestão',
            items: [
                { key: 'analytics', label: 'Análises', description: 'Volume e desempenho', icon: BarChartLine }
            ]
        }
    ];

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 12,
                displayColors: false
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#64748b' }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    color: '#64748b'
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.16)'
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#475569',
                    usePointStyle: true,
                    padding: 18
                }
            },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 12
            }
        }
    };

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1200);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
        } catch (storageError) {
            console.warn('Não foi possível salvar a preferência da sidebar.', storageError);
        }
    }, [isSidebarCollapsed]);

    useEffect(() => {
        if (!isDesktop) {
            setShowMobileSidebar(false);
        }
    }, [isDesktop]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.tipo_usuario !== 'secretaria' || (secretaryId && parseInt(secretaryId, 10) !== user.id)) {
            logout();
            navigate('/login');
            return;
        }

        fetchAllData();
    }, [user, navigate, secretaryId, logout, fetchAllData]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleTabSelect = (tabKey) => {
        setActiveTab(tabKey);
        setShowMobileSidebar(false);
    };

    const resetHistoryFilters = () => {
        setFilters({ date: '', patientId: '', professionalId: '', status: '' });
    };

    const renderSidebar = (mobile = false) => {
        const collapsed = !mobile && isDesktop && isSidebarCollapsed;

        return (
            <div className={`ac-secretary-sidebar${collapsed ? ' ac-secretary-sidebar--collapsed' : ''}${mobile ? ' ac-secretary-sidebar--mobile' : ''}`}>
                <div className="ac-secretary-sidebar__brand-block">
                    <div className="ac-secretary-sidebar__brand-row">
                        <img src={logonovo} alt="AutisConnect" className="ac-secretary-sidebar__logo" />
                        {!mobile ? (
                            <button
                                type="button"
                                className="ac-secretary-sidebar__collapse"
                                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                                aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                            >
                                {collapsed ? <ChevronRight /> : <ChevronLeft />}
                            </button>
                        ) : null}
                    </div>
                    <div className="ac-secretary-sidebar__brand-ribbon" aria-hidden="true" />
                </div>

                <nav className="ac-secretary-sidebar__nav">
                    {sidebarGroups.map((group) => (
                        <div className="ac-secretary-sidebar__nav-group" key={group.label}>
                            {!collapsed ? <span className="ac-secretary-sidebar__group-label">{group.label}</span> : null}
                            <div className="ac-secretary-sidebar__group-items">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.key;

                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            className={`ac-secretary-sidebar__item${isActive ? ' is-active' : ''}`}
                                            onClick={() => handleTabSelect(item.key)}
                                        >
                                            <span className="ac-secretary-sidebar__item-icon" aria-hidden="true">
                                                <Icon />
                                            </span>
                                            <span className="ac-secretary-sidebar__item-copy">
                                                <span className="ac-secretary-sidebar__item-label">{item.label}</span>
                                                <span className="ac-secretary-sidebar__item-desc">{item.description}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="ac-secretary-sidebar__footer">
                    <div className="ac-secretary-sidebar__user">
                        <span className="ac-secretary-sidebar__user-avatar">{getInitials(userDisplayName)}</span>
                        <div className="ac-secretary-sidebar__user-copy">
                            <strong>{userDisplayName}</strong>
                            <span>{contextLabel}</span>
                        </div>
                    </div>
                    <button type="button" className="ac-secretary-sidebar__logout" onClick={handleLogout}>
                        Sair da conta
                    </button>
                    <small className="ac-secretary-sidebar__legal">
                        © 2026 Nf Representacoes Comerciais Ltda.
                    </small>
                </div>
            </div>
        );
    };

    const renderOverview = () => {
        const kpis = [
            {
                label: 'Atendimentos Hoje',
                value: appointmentsToday.length,
                hint: appointmentsToday.length === 1 ? 'atendimento na agenda' : 'atendimentos na agenda',
                accent: 'primary'
            },
            {
                label: 'Próximos 7 Dias',
                value: upcomingAppointments.length,
                hint: upcomingAppointments.length === 1 ? 'agendamento próximo' : 'agendamentos próximos',
                accent: 'cyan'
            },
            {
                label: 'Pacientes',
                value: patients.length,
                hint: `${activePatientsCount} ativos`,
                accent: 'success'
            },
            isClinicSecretary
                ? {
                    label: 'Mensagens',
                    value: messages.length,
                    hint: unreadMessagesCount === null ? 'fluxo de comunicação' : `${unreadMessagesCount} não lidas`,
                    accent: 'violet'
                }
                : {
                    label: 'Pagamentos Pendentes',
                    value: pendingPayments.length,
                    hint: pendingPayments.length ? safeFormatCurrency(pendingPaymentsTotal) : 'sem pendências',
                    accent: 'warning'
                }
        ];

        return (
            <>
                <div className="ac-secretary-kpi-grid">
                    {kpis.map((item) => (
                        <KpiCard
                            key={item.label}
                            label={item.label}
                            value={item.value}
                            hint={item.hint}
                            accent={item.accent}
                        />
                    ))}
                </div>

                <div className="ac-secretary-overview-grid">
                    <div className="ac-secretary-overview-main">
                        <SectionCard
                            eyebrow="Prioridade do dia"
                            title="Agenda de Hoje"
                            subtitle="Os atendimentos mais próximos ficam em destaque para acelerar a operação."
                            className="ac-secretary-card--timeline"
                        >
                            {sortedAppointmentsToday.length > 0 ? (
                                <div className="ac-secretary-timeline">
                                    {sortedAppointmentsToday.map((appointment) => (
                                        <article className="ac-secretary-timeline__item" key={appointment.id}>
                                            <div className="ac-secretary-timeline__time">
                                                <strong>{formatTime(appointment.appointment_time)}</strong>
                                                <span>{formatDate(appointment.appointment_date)}</span>
                                            </div>
                                            <div className="ac-secretary-timeline__content">
                                                <div className="ac-secretary-timeline__top">
                                                    <h4>{appointment.patient_name || 'Paciente não informado'}</h4>
                                                    <StatusPill value={appointment.status} toneMap={appointmentStatusTone} />
                                                </div>
                                                <p>{appointment.appointment_type || 'Atendimento'}</p>
                                                {isClinicSecretary ? (
                                                    <span className="ac-secretary-timeline__meta">
                                                        {appointment.professional_name || getProfessionalName(appointment.professional_id ?? appointment.professionalId)}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    title="Nenhum atendimento hoje"
                                    description="A agenda de hoje está livre. Use o botão de novo atendimento para organizar o próximo compromisso."
                                />
                            )}
                        </SectionCard>

                        <SectionCard
                            eyebrow="Próximos passos"
                            title="Próximos Atendimentos"
                            subtitle="Visão rápida dos próximos sete dias com foco no que vem a seguir."
                        >
                            {upcomingPreview.length > 0 ? (
                                <div className="ac-secretary-list">
                                    {upcomingPreview.map((appointment) => (
                                        <article key={appointment.id} className="ac-secretary-list__item">
                                            <div>
                                                <strong>{appointment.patient_name || 'Paciente não informado'}</strong>
                                                <p>{formatDateTime(appointment.appointment_date, appointment.appointment_time)}</p>
                                                {isClinicSecretary ? (
                                                    <span className="ac-secretary-list__meta">
                                                        {appointment.professional_name || getProfessionalName(appointment.professional_id ?? appointment.professionalId)}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <StatusPill value={appointment.status} toneMap={appointmentStatusTone} />
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    title="Sem agendamentos futuros"
                                    description="Nenhum atendimento foi encontrado para os próximos sete dias."
                                />
                            )}
                        </SectionCard>
                    </div>

                    <div className="ac-secretary-overview-side">
                        {isClinicSecretary ? (
                            <SectionCard
                                eyebrow="Equipe"
                                title="Equipe de Atendimento"
                                subtitle="Profissionais vinculados à operação desta secretaria."
                            >
                                {professionalsPreview.length > 0 ? (
                                    <div className="ac-secretary-list">
                                        {professionalsPreview.map((item) => (
                                            <article key={item.id} className="ac-secretary-list__item">
                                                <div>
                                                    <strong>{item.name}</strong>
                                                    <p>{item.especialidade || item.specialty || 'Especialidade não informada'}</p>
                                                </div>
                                                <span className="ac-secretary-counter-chip">Ativo</span>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="Nenhum profissional encontrado"
                                        description="Quando houver profissionais vinculados, a equipe aparecerá aqui."
                                    />
                                )}
                            </SectionCard>
                        ) : (
                            <SectionCard
                                eyebrow="Financeiro"
                                title="Pagamentos Pendentes"
                                subtitle="Somente atendimentos realizados com pendência financeira."
                            >
                                {pendingPayments.length > 0 ? (
                                    <div className="ac-secretary-list">
                                        {pendingPayments.slice(0, 5).map((appointment) => (
                                            <article key={appointment.id} className="ac-secretary-list__item">
                                                <div>
                                                    <strong>{appointment.patient_name || 'Paciente não informado'}</strong>
                                                    <p>{safeFormatCurrency(appointment.value)}</p>
                                                </div>
                                                <StatusPill value={appointment.payment_status} toneMap={paymentStatusTone} />
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="Sem pendências financeiras"
                                        description="Os pagamentos pendentes aparecerão aqui assim que existirem atendimentos realizados aguardando regularização."
                                    />
                                )}
                            </SectionCard>
                        )}

                        <SectionCard
                            eyebrow="Comunicação"
                            title="Mensagens Recentes"
                            subtitle="Acompanhe os recados mais recentes sem sair da operação."
                            action={(
                                <Button
                                    variant="link"
                                    className="ac-secretary-link-button"
                                    onClick={() => setShowCommunicationModal(true)}
                                >
                                    Enviar mensagem
                                </Button>
                            )}
                        >
                            {recentMessages.length > 0 ? (
                                <div className="ac-secretary-message-list">
                                    {recentMessages.map((message) => (
                                        <article className="ac-secretary-message-list__item" key={message.id}>
                                            <div className={`ac-secretary-message-list__icon${message.read ? '' : ' is-unread'}`}>
                                                <Bell />
                                            </div>
                                            <div>
                                                <strong>{message.sender_name || 'AutisConnect'}</strong>
                                                <p>{message.content}</p>
                                                <small>{formatDate(message.created_at)}</small>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    title="Nenhuma mensagem encontrada"
                                    description="Quando houver novas mensagens, elas serão exibidas nesta área."
                                />
                            )}
                        </SectionCard>
                    </div>
                </div>
            </>
        );
    };

    const renderHistory = () => (
        <SectionCard
            eyebrow="Agenda operacional"
            title="Histórico de Atendimentos"
            subtitle={`${filteredAppointments.length} registro(s) encontrado(s) com os filtros atuais.`}
            action={(
                <Button className="ac-secretary-primary-button" onClick={() => setShowAppointmentModal(true)}>
                    <PlusCircle className="me-2" /> Novo Atendimento
                </Button>
            )}
        >
            <div className="ac-secretary-filter-bar">
                <Form.Group>
                    <Form.Label>Data</Form.Label>
                    <Form.Control type="date" name="date" value={filters.date} onChange={handleFilterChange} />
                </Form.Group>

                {isClinicSecretary ? (
                    <Form.Group>
                        <Form.Label>Profissional</Form.Label>
                        <Form.Select name="professionalId" value={filters.professionalId} onChange={handleFilterChange}>
                            <option value="">Todos</option>
                            {professionals.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                ) : null}

                <Form.Group>
                    <Form.Label>Paciente</Form.Label>
                    <Form.Select name="patientId" value={filters.patientId} onChange={handleFilterChange}>
                        <option value="">Todos</option>
                        {patients.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                        <option value="">Todos</option>
                        {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <div className="ac-secretary-filter-bar__actions">
                    <Button variant="outline-secondary" className="ac-secretary-secondary-button" onClick={resetHistoryFilters}>
                        Limpar
                    </Button>
                </div>
            </div>

            <div className="ac-secretary-table-wrap">
                <Table responsive className="ac-secretary-table">
                    <thead>
                        <tr>
                            <th>Data/Hora</th>
                            {isClinicSecretary ? <th>Profissional</th> : null}
                            <th>Paciente</th>
                            {!isClinicSecretary ? <th>Valor</th> : null}
                            <th>Status</th>
                            {!isClinicSecretary ? <th>Forma de Pagamento</th> : null}
                            {!isClinicSecretary ? <th>Detalhes</th> : null}
                            {!isClinicSecretary ? <th>Status do Pagamento</th> : null}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppointments.length > 0 ? filteredAppointments.map((appointment) => (
                            <tr key={appointment.id}>
                                <td>{formatDateTime(appointment.appointment_date, appointment.appointment_time)}</td>
                                {isClinicSecretary ? (
                                    <td>{appointment.professional_name || getProfessionalName(appointment.professional_id ?? appointment.professionalId)}</td>
                                ) : null}
                                <td>{appointment.patient_name || 'N/A'}</td>
                                {!isClinicSecretary ? <td>{safeFormatCurrency(appointment.value || 0)}</td> : null}
                                <td>
                                    <Form.Select
                                        size="sm"
                                        value={appointment.status}
                                        onChange={(e) => handleFieldUpdate(appointment.id, 'status', e.target.value)}
                                    >
                                        {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </Form.Select>
                                </td>
                                {!isClinicSecretary ? (
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={appointment.payment_method || ''}
                                            onChange={(e) => handleFieldUpdate(appointment.id, 'payment_method', e.target.value)}
                                        >
                                            <option value="">N/A</option>
                                            {PAYMENT_METHOD_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </td>
                                ) : null}
                                {!isClinicSecretary ? (
                                    <td>
                                        {appointment.payment_method === 'Plano de Saúde' || appointment.payment_method === 'Outros' ? (
                                            <Form.Control
                                                type="text"
                                                size="sm"
                                                defaultValue={appointment.payment_details || ''}
                                                onBlur={(e) => handleFieldUpdate(appointment.id, 'payment_details', e.target.value)}
                                            />
                                        ) : (
                                            <span className="ac-secretary-table__muted">-</span>
                                        )}
                                    </td>
                                ) : null}
                                {!isClinicSecretary ? (
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={appointment.payment_status}
                                            onChange={(e) => handleFieldUpdate(appointment.id, 'payment_status', e.target.value)}
                                        >
                                            {PAYMENT_STATUS_OPTIONS.map((status) => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </Form.Select>
                                    </td>
                                ) : null}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={isClinicSecretary ? 4 : 7} className="ac-secretary-table__empty">
                                    Nenhum atendimento encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </SectionCard>
    );

    const renderPatients = () => (
        <div className="ac-secretary-patients-layout">
            <SectionCard
                eyebrow="Busca e cadastro"
                title="Pacientes"
                subtitle="Localize rapidamente pacientes por nome, diagnóstico, status ou profissional."
                className="ac-secretary-patients-list-card"
                action={(
                    <Button className="ac-secretary-primary-button" onClick={() => setShowPatientModal(true)}>
                        <PlusCircle className="me-2" /> Adicionar Paciente
                    </Button>
                )}
            >
                <div className="ac-secretary-search-toolbar">
                    <Form.Control
                        type="text"
                        placeholder="Buscar pacientes por nome ou diagnóstico..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {isClinicSecretary ? (
                        <Form.Select
                            value={filters.professionalId}
                            onChange={(e) => setFilters((prev) => ({ ...prev, professionalId: e.target.value }))}
                        >
                            <option value="">Todos os profissionais</option>
                            {professionals.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </Form.Select>
                    ) : null}

                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">Todos os status</option>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                    </Form.Select>
                </div>

                <div className="ac-secretary-table-wrap">
                    <Table responsive hover className="ac-secretary-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                {isClinicSecretary ? <th>Profissional</th> : null}
                                <th>Telefone</th>
                                <th>Diagnóstico</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.length > 0 ? filteredPatients.map((patient) => {
                                const isSelected = selectedPatient?.id === patient.id;
                                return (
                                    <tr
                                        key={patient.id}
                                        onClick={() => handlePatientRowClick(patient)}
                                        className={isSelected ? 'is-selected' : ''}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>{patient.name}</td>
                                        {isClinicSecretary ? (
                                            <td>{patient.professionalName || getProfessionalName(patient.professionalId ?? patient.professional_id)}</td>
                                        ) : null}
                                        <td>{patient.phone || 'N/A'}</td>
                                        <td>{patient.diagnosis || 'N/A'}</td>
                                        <td><StatusPill value={patient.status} toneMap={patientStatusTone} /></td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={isClinicSecretary ? 5 : 4} className="ac-secretary-table__empty">
                                        Nenhum paciente encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </SectionCard>

            <SectionCard
                eyebrow="Painel lateral"
                title={selectedPatient?.name || 'Selecione um paciente'}
                subtitle={selectedPatient?.id ? 'Dados, vínculo, status e notas do paciente selecionado.' : 'Escolha um paciente da lista para visualizar dados, status e notas.'}
                className="ac-secretary-patient-panel"
                action={selectedPatient?.id ? (
                    <Button
                        variant="outline-secondary"
                        className="ac-secretary-secondary-button"
                        onClick={() => {
                            setEditingPatient(selectedPatient);
                            setShowEditPatientModal(true);
                        }}
                    >
                        Editar cadastro
                    </Button>
                ) : null}
            >
                {selectedPatient?.id ? (
                    <>
                        <div className="ac-secretary-patient-panel__meta">
                            {isClinicSecretary ? (
                                <div>
                                    <span>Profissional</span>
                                    <strong>{selectedPatient.professionalName || getProfessionalName(selectedPatient.professionalId ?? selectedPatient.professional_id)}</strong>
                                </div>
                            ) : null}
                            <div>
                                <span>Telefone</span>
                                <strong>{selectedPatient.phone || 'N/A'}</strong>
                            </div>
                            <div>
                                <span>Email</span>
                                <strong>{selectedPatient.email || 'N/A'}</strong>
                            </div>
                            <div>
                                <span>Status</span>
                                <strong><StatusPill value={selectedPatient.status} toneMap={patientStatusTone} /></strong>
                            </div>
                        </div>

                        <div className="ac-secretary-patient-panel__summary">
                            <div>
                                <span>Diagnóstico</span>
                                <strong>{selectedPatient.diagnosis || 'N/A'}</strong>
                            </div>
                            <div>
                                <span>Observações</span>
                                <p>{selectedPatient.observacoes || selectedPatient.notes || 'Nenhuma observação registrada.'}</p>
                            </div>
                        </div>

                        <div className="ac-secretary-patient-panel__actions">
                            <Button
                                className={selectedPatient.status === 'ativo' ? 'ac-secretary-warning-button' : 'ac-secretary-success-button'}
                                onClick={() => handleUpdateStatus(selectedPatient.id, selectedPatient.status === 'ativo' ? 'inativo' : 'ativo')}
                            >
                                {selectedPatient.status === 'ativo' ? 'Desativar paciente' : 'Ativar paciente'}
                            </Button>
                            <Button className="ac-secretary-secondary-button" onClick={() => setShowNoteModal(true)}>
                                Adicionar Nota
                            </Button>
                        </div>

                        <div className="ac-secretary-notes">
                            <div className="ac-secretary-notes__header">
                                <h4>Notas de Evolução</h4>
                                <span>{selectedPatient.notes?.length || 0} registro(s)</span>
                            </div>

                            {selectedPatient.notes && selectedPatient.notes.length > 0 ? (
                                <div className="ac-secretary-notes__list">
                                    {selectedPatient.notes.map((note) => (
                                        <article key={note.id} className="ac-secretary-note-card">
                                            <strong>{note.title}</strong>
                                            <p>{note.content}</p>
                                            <small>{formatDate(note.createdAt || note.created_at)}</small>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    title="Nenhuma nota registrada"
                                    description="Adicione uma nota para manter o histórico operacional do paciente atualizado."
                                />
                            )}
                        </div>
                    </>
                ) : (
                    <EmptyState
                        title="Selecione um paciente"
                        description="Escolha um paciente da lista para visualizar dados, status e notas."
                    />
                )}
            </SectionCard>
        </div>
    );

    const renderCommunication = () => (
        <SectionCard
            eyebrow="Comunicação integrada"
            title="Central de Mensagens"
            subtitle={unreadMessagesCount === null ? `${messages.length} mensagem(ns) no histórico.` : `${unreadMessagesCount} mensagem(ns) não lida(s).`}
            action={(
                <Button className="ac-secretary-primary-button" onClick={() => setShowCommunicationModal(true)}>
                    Enviar mensagem
                </Button>
            )}
        >
            {messages.length > 0 ? (
                <div className="ac-secretary-message-list ac-secretary-message-list--full">
                    {messages.map((message) => (
                        <article className="ac-secretary-message-list__item" key={message.id}>
                            <div className={`ac-secretary-message-list__icon${message.read ? '' : ' is-unread'}`}>
                                <Bell />
                            </div>
                            <div className="ac-secretary-message-list__content">
                                <div className="ac-secretary-message-list__top">
                                    <strong>{message.sender_name || 'AutisConnect'}</strong>
                                    <small>{formatDate(message.created_at)}</small>
                                </div>
                                <p>{message.content}</p>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="Nenhuma mensagem encontrada"
                    description="As mensagens enviadas ou recebidas aparecerão aqui para facilitar o acompanhamento da rotina."
                />
            )}
        </SectionCard>
    );

    const renderAnalytics = () => (
        <>
            <div className="ac-secretary-analytics-summary">
                <KpiCard label="Realizados" value={completedAppointmentsCount} hint="atendimentos concluídos" accent="success" />
                <KpiCard label="Confirmados" value={confirmedAppointmentsCount} hint="atendimentos confirmados" accent="cyan" />
                <KpiCard label="Cancelados" value={cancelledAppointmentsCount} hint="cancelados ou não realizados" accent="danger" />
            </div>

            <div className="ac-secretary-analytics-grid">
                <SectionCard
                    eyebrow="Desempenho"
                    title="Atendimentos por Dia"
                    subtitle="Últimos sete dias com foco em atendimentos realizados."
                    bodyClassName="ac-secretary-chart-card"
                >
                    <div className="ac-secretary-chart">
                        <Bar data={chartData.dailyPerformance} options={barOptions} />
                    </div>
                </SectionCard>

                <SectionCard
                    eyebrow="Distribuição"
                    title="Status dos Atendimentos"
                    subtitle="Panorama consolidado do status atual da operação."
                    bodyClassName="ac-secretary-chart-card"
                >
                    <div className="ac-secretary-chart ac-secretary-chart--doughnut">
                        <Doughnut data={chartData.statusDistribution} options={doughnutOptions} />
                        <div className="ac-secretary-chart__center-label">
                            <strong>{chartTotal}</strong>
                            <span>total</span>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
        case 'full_history':
            return renderHistory();
        case 'patients':
            return renderPatients();
        case 'communication':
            return renderCommunication();
        case 'analytics':
            return renderAnalytics();
        case 'overview':
        default:
            return renderOverview();
        }
    };

    if (loading) {
        return (
            <div className="ac-secretary-session-state">
                <div className="ac-secretary-session-state__card">
                    <img src={logonovo} alt="AutisConnect" className="ac-secretary-session-state__logo" />
                    <Spinner animation="border" role="status" />
                    <span>Carregando a central operacional da secretaria...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`ac-secretary-dashboard${isDesktop && isSidebarCollapsed ? ' ac-secretary-dashboard--collapsed' : ''}`}>
            <aside className="ac-secretary-sidebar-shell">
                {renderSidebar(false)}
            </aside>

            <Offcanvas
                show={showMobileSidebar}
                onHide={() => setShowMobileSidebar(false)}
                placement="start"
                className="ac-secretary-offcanvas"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>AutisConnect</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    {renderSidebar(true)}
                </Offcanvas.Body>
            </Offcanvas>

            <div className="ac-secretary-shell">
                <header className="ac-secretary-header">
                    <div className="ac-secretary-header__inner">
                        <div className="ac-secretary-header__title-group">
                            {!isDesktop ? (
                                <Button
                                    variant="outline-secondary"
                                    className="ac-secretary-header__menu"
                                    onClick={() => setShowMobileSidebar(true)}
                                >
                                    Menu
                                </Button>
                            ) : null}
                            <div>
                                <span className="ac-secretary-header__eyebrow">{sectionMeta[activeTab].eyebrow}</span>
                                <h1>{sectionMeta[activeTab].title}</h1>
                                <p>{sectionMeta[activeTab].description}</p>
                            </div>
                        </div>

                        <div className="ac-secretary-header__actions">
                            <button
                                type="button"
                                className="ac-secretary-icon-button"
                                onClick={() => setActiveTab('communication')}
                                aria-label="Abrir mensagens"
                            >
                                <Bell />
                                {notificationCount ? <span className="ac-secretary-icon-button__badge">{notificationCount}</span> : null}
                            </button>

                            <div className="ac-secretary-user-pill">
                                <span className="ac-secretary-user-pill__avatar">{getInitials(userDisplayName)}</span>
                                <div className="ac-secretary-user-pill__copy">
                                    <strong>{userFirstName}</strong>
                                    <span>{contextLabel}</span>
                                </div>
                            </div>

                            <Dropdown align="end">
                                <Dropdown.Toggle className="ac-secretary-profile-toggle" id="ac-secretary-profile-menu">
                                    Perfil
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="ac-secretary-profile-menu">
                                    <Dropdown.ItemText>
                                        <strong>{userDisplayName}</strong>
                                        <div>{contextLabel}</div>
                                    </Dropdown.ItemText>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={handleLogout}>Sair</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                <main className="ac-secretary-main">
                    <section className="ac-secretary-hero">
                        <div className="ac-secretary-hero__content">
                            <span className="ac-secretary-context-pill">{contextLabel}</span>
                            <h2>{greeting}, {userFirstName}.</h2>
                            <p>{workspaceSummary}</p>
                            <div className="ac-secretary-hero__meta">
                                <span>{currentDateLabel}</span>
                                <span>{appointmentsToday.length} atendimento(s) previstos hoje</span>
                                <span>{patients.length} paciente(s) em acompanhamento</span>
                            </div>
                        </div>

                        <div className="ac-secretary-hero__actions">
                            <Button className="ac-secretary-primary-button" onClick={() => setShowAppointmentModal(true)}>
                                <PlusCircle className="me-2" /> Novo Atendimento
                            </Button>
                            <div className="ac-secretary-hero__secondary">
                                <Button className="ac-secretary-secondary-button" onClick={() => setShowPatientModal(true)}>
                                    + Paciente
                                </Button>
                                <Button className="ac-secretary-secondary-button" onClick={() => setShowCommunicationModal(true)}>
                                    Enviar mensagem
                                </Button>
                            </div>
                        </div>
                    </section>

                    {(successMessage || error) ? (
                        <div className="ac-secretary-alert-stack">
                            {successMessage ? (
                                <Alert variant="success" dismissible onClose={() => setSuccessMessage('')} className="mb-0">
                                    {successMessage}
                                </Alert>
                            ) : null}
                            {error ? (
                                <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-0">
                                    {error}
                                </Alert>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="ac-secretary-content">
                        {renderActiveTab()}
                    </div>
                </main>
            </div>

            <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)} size="lg" className="ac-secretary-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Novo Atendimento</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddAppointment}>
                    <Modal.Body>
                        <section className="ac-secretary-form-section">
                            <div className="ac-secretary-form-section__header">
                                <h4>Atendimento</h4>
                                <p>Defina paciente, agenda e status do atendimento.</p>
                            </div>

                            <Row>
                                {isClinicSecretary ? (
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Profissional *</Form.Label>
                                            <Form.Select
                                                name="professionalId"
                                                value={newAppointment.professionalId}
                                                onChange={(e) => setNewAppointment({ ...newAppointment, professionalId: e.target.value, patientId: '' })}
                                                required
                                            >
                                                <option value="">Selecione um profissional</option>
                                                {professionals.map((item) => (
                                                    <option key={item.id} value={item.id}>{item.name}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                ) : null}

                                <Col md={isClinicSecretary ? 6 : 12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Paciente *</Form.Label>
                                        <Form.Select
                                            name="patientId"
                                            value={newAppointment.patientId}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
                                            required
                                        >
                                            <option value="">Selecione um paciente</option>
                                            {availableAppointmentPatients.map((item) => (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Data do Atendimento *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="appointment_date"
                                            value={newAppointment.appointment_date}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Hora do Atendimento *</Form.Label>
                                        <Form.Control
                                            type="time"
                                            name="appointment_time"
                                            value={newAppointment.appointment_time}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, appointment_time: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tipo de Atendimento</Form.Label>
                                        <Form.Select
                                            name="appointment_type"
                                            value={newAppointment.appointment_type}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, appointment_type: e.target.value })}
                                        >
                                            {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Select
                                            name="status"
                                            value={newAppointment.status}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, status: e.target.value })}
                                        >
                                            {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </section>

                        {!isClinicSecretary ? (
                            <section className="ac-secretary-form-section">
                                <div className="ac-secretary-form-section__header">
                                    <h4>Pagamento</h4>
                                    <p>Dados financeiros disponíveis apenas na secretaria vinculada ao profissional.</p>
                                </div>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Valor do Atendimento (R$) *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                name="value"
                                                placeholder="Ex: 150.00"
                                                value={newAppointment.value}
                                                onChange={(e) => setNewAppointment({ ...newAppointment, value: e.target.value })}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Status do Pagamento</Form.Label>
                                            <Form.Select
                                                name="payment_status"
                                                value={newAppointment.payment_status}
                                                onChange={(e) => setNewAppointment({ ...newAppointment, payment_status: e.target.value })}
                                            >
                                                {PAYMENT_STATUS_OPTIONS.map((option) => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Forma de Pagamento</Form.Label>
                                            <Form.Select
                                                name="payment_method"
                                                value={newAppointment.payment_method}
                                                onChange={(e) => setNewAppointment({ ...newAppointment, payment_method: e.target.value })}
                                            >
                                                {PAYMENT_METHOD_OPTIONS.map((option) => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    {newAppointment.payment_method === 'Plano de Saúde' || newAppointment.payment_method === 'Outros' ? (
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Detalhes do Pagamento</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="payment_details"
                                                    placeholder="Ex: Unimed ou transferência"
                                                    value={newAppointment.payment_details}
                                                    onChange={(e) => setNewAppointment({ ...newAppointment, payment_details: e.target.value })}
                                                />
                                            </Form.Group>
                                        </Col>
                                    ) : null}
                                </Row>
                            </section>
                        ) : null}

                        <section className="ac-secretary-form-section">
                            <div className="ac-secretary-form-section__header">
                                <h4>Observações</h4>
                                <p>Informações adicionais para contextualizar o atendimento.</p>
                            </div>

                            <Form.Group>
                                <Form.Label>Observações</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    name="notes"
                                    value={newAppointment.notes}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                                />
                            </Form.Group>
                        </section>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowAppointmentModal(false)}>Cancelar</Button>
                        <Button className="ac-secretary-primary-button" type="submit">Salvar Atendimento</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showCommunicationModal} onHide={() => setShowCommunicationModal(false)} className="ac-secretary-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Enviar Mensagem</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSendMessage}>
                    <Modal.Body>
                        <section className="ac-secretary-form-section">
                            <div className="ac-secretary-form-section__header">
                                <h4>Comunicação</h4>
                                <p>Selecione o destinatário e envie a mensagem a partir da central operacional.</p>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Destinatário *</Form.Label>
                                <Form.Select
                                    value={newMessage.recipientId}
                                    onChange={(e) => setNewMessage({ ...newMessage, recipientId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione um destinatário</option>
                                    {professionals.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>Mensagem *</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={5}
                                    value={newMessage.content}
                                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </section>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowCommunicationModal(false)}>Cancelar</Button>
                        <Button className="ac-secretary-primary-button" type="submit">Enviar mensagem</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showPatientModal} onHide={() => setShowPatientModal(false)} size="lg" className="ac-secretary-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Adicionar Novo Paciente</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddPatient}>
                    <Modal.Body>
                        <section className="ac-secretary-form-section">
                            <div className="ac-secretary-form-section__header">
                                <h4>Identificação</h4>
                                <p>Cadastre os dados essenciais do paciente para iniciar o acompanhamento.</p>
                            </div>

                            {isClinicSecretary ? (
                                <Form.Group className="mb-3">
                                    <Form.Label>Profissional responsável *</Form.Label>
                                    <Form.Select
                                        value={newPatient.professionalId}
                                        onChange={(e) => setNewPatient({ ...newPatient, professionalId: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione um profissional</option>
                                        {professionals.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            ) : null}

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nome Completo *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={newPatient.name}
                                            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
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
                                            onChange={(e) => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </section>

                        <section className="ac-secretary-form-section">
                            <div className="ac-secretary-form-section__header">
                                <h4>Contato</h4>
                                <p>Registre os canais principais de contato do paciente.</p>
                            </div>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Telefone</Form.Label>
                                        <Form.Control
                                            type="tel"
                                            value={newPatient.phone}
                                            onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={newPatient.email}
                                            onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </section>

                        <section className="ac-secretary-form-section">
                            <div className="ac-secretary-form-section__header">
                                <h4>Acompanhamento</h4>
                                <p>Defina o nível de suporte e observações relevantes para a rotina.</p>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Diagnóstico do Transtorno do Espectro Autista (TEA)</Form.Label>
                                <div className="ac-secretary-segmented">
                                    {DIAGNOSIS_OPTIONS.map((option) => (
                                        <Button
                                            key={option}
                                            type="button"
                                            className={`ac-secretary-segmented__option${newPatient.diagnosis === option ? ' is-active' : ''}`}
                                            onClick={() => setNewPatient({ ...newPatient, diagnosis: option })}
                                        >
                                            {option}
                                        </Button>
                                    ))}
                                </div>
                                <Form.Text className="text-muted">
                                    Selecione o nível de suporte necessário.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>Observações</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={newPatient.notes}
                                    onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                                />
                            </Form.Group>
                        </section>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowPatientModal(false)}>Cancelar</Button>
                        <Button className="ac-secretary-primary-button" type="submit">Adicionar Paciente</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showEditPatientModal} onHide={() => setShowEditPatientModal(false)} size="lg" className="ac-secretary-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Editar Dados do Paciente</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdatePatient}>
                    <Modal.Body>
                        {editingPatient ? (
                            <>
                                <section className="ac-secretary-form-section">
                                    <div className="ac-secretary-form-section__header">
                                        <h4>Identificação</h4>
                                        <p>Ajuste os dados cadastrais preservando o vínculo atual do paciente.</p>
                                    </div>

                                    {isClinicSecretary ? (
                                        <Form.Group className="mb-3">
                                            <Form.Label>Profissional responsável *</Form.Label>
                                            <Form.Select
                                                value={editingPatient.professionalId || editingPatient.professional_id || ''}
                                                onChange={(e) => setEditingPatient({ ...editingPatient, professionalId: e.target.value })}
                                                required
                                            >
                                                <option value="">Selecione um profissional</option>
                                                {professionals.map((item) => (
                                                    <option key={item.id} value={item.id}>{item.name}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    ) : null}

                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Nome Completo *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={editingPatient.name || ''}
                                                    onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
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
                                                    value={(editingPatient.birthDate || editingPatient.birth_date || '').split('T')[0]}
                                                    onChange={(e) => setEditingPatient({ ...editingPatient, birthDate: e.target.value })}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Telefone</Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    value={editingPatient.phone || ''}
                                                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={editingPatient.email || ''}
                                            onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                                        />
                                    </Form.Group>
                                </section>

                                <section className="ac-secretary-form-section">
                                    <div className="ac-secretary-form-section__header">
                                        <h4>Acompanhamento</h4>
                                        <p>Atualize o nível de suporte e registre observações relevantes.</p>
                                    </div>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Diagnóstico do Transtorno do Espectro Autista (TEA)</Form.Label>
                                        <div className="ac-secretary-segmented">
                                            {DIAGNOSIS_OPTIONS.map((option) => (
                                                <Button
                                                    key={option}
                                                    type="button"
                                                    className={`ac-secretary-segmented__option${editingPatient.diagnosis === option ? ' is-active' : ''}`}
                                                    onClick={() => setEditingPatient({ ...editingPatient, diagnosis: option })}
                                                >
                                                    {option}
                                                </Button>
                                            ))}
                                        </div>
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label>Observações</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={editingPatient.observacoes || editingPatient.notes || ''}
                                            onChange={(e) => setEditingPatient({ ...editingPatient, observacoes: e.target.value })}
                                        />
                                    </Form.Group>
                                </section>
                            </>
                        ) : null}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowEditPatientModal(false)}>Cancelar</Button>
                        <Button className="ac-secretary-primary-button" type="submit">Salvar Alterações</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} className="ac-secretary-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Adicionar Nota</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddNote}>
                    <Modal.Body>
                        <section className="ac-secretary-form-section">
                            <div className="ac-secretary-form-section__header">
                                <h4>Nota de Evolução</h4>
                                <p>{selectedPatient?.name ? `Paciente selecionado: ${selectedPatient.name}` : 'Selecione um paciente para registrar a nota.'}</p>
                            </div>

                            {!selectedPatient?.id ? (
                                <Alert variant="warning">Selecione um paciente para adicionar a nota.</Alert>
                            ) : null}

                            <Form.Group className="mb-3">
                                <Form.Label>Título</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newNote.title}
                                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                    disabled={!selectedPatient?.id}
                                    required
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>Conteúdo</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={newNote.content}
                                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                    disabled={!selectedPatient?.id}
                                    required
                                />
                            </Form.Group>
                        </section>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowNoteModal(false)}>Cancelar</Button>
                        <Button className="ac-secretary-primary-button" type="submit" disabled={!selectedPatient?.id}>
                            Salvar Nota
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default SecretaryDashboard;
