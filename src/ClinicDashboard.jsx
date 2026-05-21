import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Nav,
    ProgressBar,
    Row,
    Spinner,
    Tab,
    Table
} from 'react-bootstrap';
import {
    Bell,
    Calendar2Check,
    Calendar2Week,
    CashCoin,
    Check2Circle,
    Clipboard2Pulse,
    ClockHistory,
    Funnel,
    GraphUpArrow,
    PeopleFill,
    PersonWorkspace,
    ShieldCheck,
    Wallet2
} from 'react-bootstrap-icons';
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
    Tooltip
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';
import './ClinicDashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const emptyDashboard = {
    clinic: {
        name: 'AutisConnect Clinics',
        accessProfile: 'Clínica',
        scopeMode: 'empty',
        scopeDescription: 'Nenhum profissional associado a este acesso.',
        generatedAt: null
    },
    summary: {
        totalProfessionals: 0,
        totalPatients: 0,
        appointmentsToday: 0,
        appointmentsWeek: 0,
        monthlyRevenue: 0,
        pendingReceivables: 0,
        attendanceRate: 0,
        blockedSlots: 0,
        waitingListCount: 0,
        pendingConfirmations: 0,
        averageTicket: 0,
        paidAppointments: 0
    },
    professionals: [],
    appointments: [],
    finance: {
        kpis: {
            cashInMonth: 0,
            pendingReceivables: 0,
            averageTicket: 0,
            paidAppointments: 0,
            cashFlow: 0,
            cashOutMonth: 0
        },
        monthlyRevenueSeries: { labels: [], data: [] },
        revenueByPaymentMethod: { labels: [], data: [] },
        receivablesByStatus: { labels: [], data: [] },
        recentTransactions: []
    },
    operations: {
        waitlist: [],
        blockedSlots: [],
        upcomingConfirmations: [],
        agendaStatus: { labels: [], data: [] }
    },
    insights: [],
    meta: {
        assumptions: [],
        limitations: []
    }
};

const accessProfileLabels = {
    medicos_terapeutas: 'Médico / Profissional',
    secretaria: 'Secretaria / Recepção',
    servicos_locais: 'Clínica',
    clinica: 'Clínica',
    administrador_clinica: 'Administrador Clínico'
};

const overviewColors = [
    '#0f766e',
    '#f59e0b',
    '#2563eb',
    '#dc2626',
    '#8b5cf6',
    '#14b8a6'
];

const emptyProfessionalForm = {
    nome_completo: '',
    email: '',
    telefone: '',
    especialidade: '',
    registro_profissional: '',
    cpf: ''
};

const emptyPatientForm = {
    nome_completo: '',
    cpf: '',
    data_nascimento: '',
    professional_id: ''
};

const getStatusVariant = (status) => {
    const normalized = `${status || ''}`.toLowerCase();
    if (normalized.includes('cancel')) return 'danger';
    if (normalized.includes('realiz') || normalized.includes('confirm')) return 'success';
    if (normalized.includes('espera')) return 'warning';
    if (normalized.includes('bloque')) return 'secondary';
    return 'primary';
};

const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(Number(value || 0));

const formatNumber = (value) =>
    new Intl.NumberFormat('pt-BR').format(Number(value || 0));

const formatDate = (value) => {
    if (!value) return 'Sem data';
    const normalizedValue =
        typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
    const date = new Date(normalizedValue);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short'
    }).format(date);
};

const formatDateTime = (date, time) => {
    if (!date) return 'Sem agendamento';
    const parts = [formatDate(date)];
    if (time) parts.push(time.slice(0, 5));
    return parts.join(' • ');
};

const parseDateTimeValue = (date, time) => {
    if (!date) return null;
    const parsed = new Date(`${date}T${time || '00:00:00'}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const normalizeRegistryList = (payload, fallbackKeys = []) => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
        for (const key of fallbackKeys) {
            if (Array.isArray(payload[key])) return payload[key];
        }
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.items)) return payload.items;
    }
    return [];
};

const normalizeDashboardPayload = (payload) => ({
    ...emptyDashboard,
    ...payload,
    clinic: { ...emptyDashboard.clinic, ...(payload?.clinic || {}) },
    summary: { ...emptyDashboard.summary, ...(payload?.summary || {}) },
    professionals: Array.isArray(payload?.professionals) ? payload.professionals : [],
    appointments: Array.isArray(payload?.appointments) ? payload.appointments : [],
    finance: {
        ...emptyDashboard.finance,
        ...(payload?.finance || {}),
        kpis: {
            ...emptyDashboard.finance.kpis,
            ...(payload?.finance?.kpis || {})
        },
        monthlyRevenueSeries: {
            ...emptyDashboard.finance.monthlyRevenueSeries,
            ...(payload?.finance?.monthlyRevenueSeries || {})
        },
        revenueByPaymentMethod: {
            ...emptyDashboard.finance.revenueByPaymentMethod,
            ...(payload?.finance?.revenueByPaymentMethod || {})
        },
        receivablesByStatus: {
            ...emptyDashboard.finance.receivablesByStatus,
            ...(payload?.finance?.receivablesByStatus || {})
        },
        recentTransactions: Array.isArray(payload?.finance?.recentTransactions)
            ? payload.finance.recentTransactions
            : []
    },
    operations: {
        ...emptyDashboard.operations,
        ...(payload?.operations || {}),
        waitlist: Array.isArray(payload?.operations?.waitlist) ? payload.operations.waitlist : [],
        blockedSlots: Array.isArray(payload?.operations?.blockedSlots) ? payload.operations.blockedSlots : [],
        upcomingConfirmations: Array.isArray(payload?.operations?.upcomingConfirmations)
            ? payload.operations.upcomingConfirmations
            : [],
        agendaStatus: {
            ...emptyDashboard.operations.agendaStatus,
            ...(payload?.operations?.agendaStatus || {})
        }
    },
    insights: Array.isArray(payload?.insights) ? payload.insights : [],
    meta: {
        ...emptyDashboard.meta,
        ...(payload?.meta || {}),
        assumptions: Array.isArray(payload?.meta?.assumptions) ? payload.meta.assumptions : [],
        limitations: Array.isArray(payload?.meta?.limitations) ? payload.meta.limitations : []
    }
});

const ClinicDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id: dashboardId } = useParams();

    const [dashboard, setDashboard] = useState(emptyDashboard);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        professionalId: 'all',
        status: 'all',
        date: new Date().toISOString().split('T')[0]
    });
    const [professionalRecords, setProfessionalRecords] = useState([]);
    const [patientRecords, setPatientRecords] = useState([]);
    const [registryLoading, setRegistryLoading] = useState({
        professionals: false,
        patients: false
    });
    const [submitting, setSubmitting] = useState({
        professional: false,
        patient: false
    });
    const [managementFeedback, setManagementFeedback] = useState(null);
    const [professionalForm, setProfessionalForm] = useState(emptyProfessionalForm);
    const [patientForm, setPatientForm] = useState(emptyPatientForm);
    const [financeProfessionalId, setFinanceProfessionalId] = useState('all');
    const [statusUpdatingProfessionalId, setStatusUpdatingProfessionalId] = useState(null);

    const allowedTypes = ['medicos_terapeutas', 'secretaria', 'servicos_locais', 'clinica', 'administrador_clinica'];
    const canManageProfessionals = ['secretaria', 'servicos_locais', 'clinica'].includes(user?.tipo_usuario);
    const canManagePatients = canManageProfessionals;

    const loadDashboard = async (showRefresh = false) => {
        if (!user) return;

        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await apiClient.get(`/clinic/dashboard/${user.id}`);
            setDashboard(normalizeDashboardPayload(response.data));
            setError('');
        } catch (err) {
            console.error('Erro ao carregar dashboard clinico:', err.response?.data, err.message);
            const message =
                err.response?.data?.details ||
                err.response?.data?.error ||
                'Nao foi possivel carregar o dashboard clinico.';
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadRegistryData = async () => {
        if (!user) return;

        try {
            setRegistryLoading({
                professionals: true,
                patients: true
            });

            const [professionalsResponse, patientsResponse] = await Promise.all([
                apiClient.get(`/clinic/${user.id}/professionals`),
                apiClient.get(`/clinic/${user.id}/patients`)
            ]);

            setProfessionalRecords(normalizeRegistryList(professionalsResponse.data, ['professionals']));
            setPatientRecords(normalizeRegistryList(patientsResponse.data, ['patients']));
        } catch (err) {
            console.error('Erro ao carregar cadastros da clinica:', err.response?.data, err.message);
            setManagementFeedback({
                variant: 'danger',
                text:
                    err.response?.data?.details ||
                    err.response?.data?.error ||
                    'Nao foi possivel carregar os cadastros da clinica.'
            });
        } finally {
            setRegistryLoading({
                professionals: false,
                patients: false
            });
        }
    };

    useEffect(() => {
        if (!user) return;

        const allowedTypes = ['medicos_terapeutas', 'secretaria', 'servicos_locais', 'clinica', 'administrador_clinica'];
        if (!allowedTypes.includes(user.tipo_usuario)) {
            navigate('/');
            return;
        }

        if (dashboardId && dashboardId !== user.id.toString()) {
            navigate(`/clinic-dashboard/${user.id}`);
            return;
        }

        const fetchDashboard = async (showRefresh = false) => {
            try {
                if (showRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                const response = await apiClient.get(`/clinic/dashboard/${user.id}`);
                setDashboard(normalizeDashboardPayload(response.data));
                setError('');
            } catch (err) {
                console.error('Erro ao carregar dashboard clínico:', err.response?.data, err.message);
                const message =
                    err.response?.data?.details ||
                    err.response?.data?.error ||
                    'Não foi possível carregar o dashboard clínico.';
                setError(message);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        };

        fetchDashboard();
        loadRegistryData();
    }, [dashboardId, navigate, user]);

    useEffect(() => {
        if (!patientForm.professional_id) return;

        const availableProfessionals = (professionalRecords.length > 0 ? professionalRecords : dashboard.professionals).filter(
            (professional) => (professional.status || 'ativo') === 'ativo'
        );
        const stillExists = availableProfessionals.some(
            (professional) => professional.id.toString() === patientForm.professional_id.toString()
        );

        if (!stillExists) {
            setPatientForm((current) => ({
                ...current,
                professional_id: ''
            }));
        }
    }, [dashboard.professionals, patientForm.professional_id, professionalRecords]);

    useEffect(() => {
        if (filters.professionalId === 'all') return;

        const availableProfessionals = (professionalRecords.length > 0 ? professionalRecords : dashboard.professionals).filter(
            (professional) => (professional.status || 'ativo') === 'ativo'
        );
        const stillExists = availableProfessionals.some(
            (professional) => professional.id.toString() === filters.professionalId.toString()
        );

        if (!stillExists) {
            setFilters((current) => ({
                ...current,
                professionalId: 'all'
            }));
        }
    }, [dashboard.professionals, filters.professionalId, professionalRecords]);

    useEffect(() => {
        if (financeProfessionalId === 'all') return;

        const availableProfessionals = professionalRecords.length > 0 ? professionalRecords : dashboard.professionals;
        const stillExists = availableProfessionals.some(
            (professional) => professional.id.toString() === financeProfessionalId.toString()
        );

        if (!stillExists) {
            setFinanceProfessionalId('all');
        }
    }, [dashboard.professionals, financeProfessionalId, professionalRecords]);

    const selectedProfessionalName =
        filters.professionalId === 'all'
            ? 'Todos os profissionais'
            : activeProfessionalDirectory.find(
                  (professional) => professional.id.toString() === filters.professionalId
              )?.name ||
              'Profissional selecionado';

    const filteredAppointments = dashboard.appointments.filter((appointment) => {
        const matchProfessional =
            filters.professionalId === 'all' || appointment.professionalId?.toString() === filters.professionalId;
        const matchStatus =
            filters.status === 'all' || `${appointment.status || ''}`.toLowerCase() === filters.status.toLowerCase();
        const matchDate = !filters.date || appointment.date === filters.date;
        return matchProfessional && matchStatus && matchDate;
    });

    const filteredWaitlist = dashboard.operations.waitlist.filter((item) => {
        if (filters.professionalId === 'all') return true;
        return item.professionalId?.toString() === filters.professionalId;
    });

    const filteredBlockedSlots = dashboard.operations.blockedSlots.filter((item) => {
        if (filters.professionalId === 'all') return true;
        return item.professionalId?.toString() === filters.professionalId;
    });

    const filteredConfirmations = dashboard.operations.upcomingConfirmations.filter((item) => {
        if (filters.professionalId === 'all') return true;
        return item.professionalId?.toString() === filters.professionalId;
    });

    const professionalDirectory =
        professionalRecords.length > 0
            ? professionalRecords
            : dashboard.professionals.map((professional) => ({
                  id: professional.id,
                  name: professional.name,
                  specialty: professional.specialty,
                  phone: professional.phone,
                  status: professional.status || 'ativo'
              }));

    const activeProfessionalDirectory = professionalDirectory.filter(
        (professional) => (professional.status || 'ativo') === 'ativo'
    );

    const syncClinicData = async (showRefresh = true) => {
        await Promise.allSettled([loadDashboard(showRefresh), loadRegistryData()]);
    };

    const handleProfessionalFormChange = (field, value) => {
        setProfessionalForm((current) => ({
            ...current,
            [field]: value
        }));
    };

    const handlePatientFormChange = (field, value) => {
        setPatientForm((current) => ({
            ...current,
            [field]: value
        }));
    };

    const handleProfessionalSubmit = async (event) => {
        event.preventDefault();

        try {
            setSubmitting((current) => ({
                ...current,
                professional: true
            }));

            await apiClient.post(`/clinic/${user.id}/professionals`, professionalForm);
            setProfessionalForm(emptyProfessionalForm);
            await syncClinicData(true);
            setManagementFeedback({
                variant: 'success',
                text: 'Profissional cadastrado com sucesso no dashboard da clinica, sem exigir senha manual.'
            });
        } catch (err) {
            console.error('Erro ao cadastrar profissional:', err.response?.data, err.message);
            setManagementFeedback({
                variant: 'danger',
                text:
                    err.response?.data?.details ||
                    err.response?.data?.error ||
                    'Nao foi possivel cadastrar o profissional.'
            });
        } finally {
            setSubmitting((current) => ({
                ...current,
                professional: false
            }));
        }
    };

    const handleProfessionalStatusToggle = async (professional) => {
        const nextStatus = (professional.status || 'ativo') === 'ativo' ? 'inativo' : 'ativo';

        try {
            setStatusUpdatingProfessionalId(professional.id);
            await apiClient.put(`/clinic/${user.id}/professionals/${professional.id}/status`, {
                status: nextStatus
            });
            await syncClinicData(true);
            setManagementFeedback({
                variant: 'success',
                text: `Profissional ${nextStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso.`
            });
        } catch (err) {
            console.error('Erro ao atualizar status do profissional:', err.response?.data, err.message);
            setManagementFeedback({
                variant: 'danger',
                text:
                    err.response?.data?.details ||
                    err.response?.data?.error ||
                    'Nao foi possivel atualizar o status do profissional.'
            });
        } finally {
            setStatusUpdatingProfessionalId(null);
        }
    };

    const handlePatientSubmit = async (event) => {
        event.preventDefault();

        try {
            setSubmitting((current) => ({
                ...current,
                patient: true
            }));

            const response = await apiClient.post(`/clinic/${user.id}/patients`, patientForm);
            const createdPatient = response?.data?.patient || null;

            if (createdPatient && createdPatient.id) {
                setPatientRecords((current) => {
                    const exists = current.some(
                        (patient) => patient.id?.toString() === createdPatient.id.toString()
                    );
                    if (exists) return current;
                    return [...current, createdPatient].sort((first, second) =>
                        `${first.name || ''}`.localeCompare(`${second.name || ''}`, 'pt-BR')
                    );
                });
            }

            setPatientForm(emptyPatientForm);
            await syncClinicData(true);
            setManagementFeedback({
                variant: 'success',
                text: 'Paciente cadastrado com sucesso e vinculado a clinica.'
            });
        } catch (err) {
            console.error('Erro ao cadastrar paciente:', err.response?.data, err.message);
            setManagementFeedback({
                variant: 'danger',
                text:
                    err.response?.data?.details ||
                    err.response?.data?.error ||
                    'Nao foi possivel cadastrar o paciente.'
            });
        } finally {
            setSubmitting((current) => ({
                ...current,
                patient: false
            }));
        }
    };

    const statusBuckets = filteredAppointments.reduce((acc, appointment) => {
        const label = appointment.status || 'Sem status';
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});

    const scheduleChartData = {
        labels: Object.keys(statusBuckets),
        datasets: [
            {
                label: 'Consultas',
                data: Object.values(statusBuckets),
                backgroundColor: overviewColors,
                borderRadius: 12
            }
        ]
    };

    const revenueChartData = {
        labels: dashboard.finance.monthlyRevenueSeries.labels || [],
        datasets: [
            {
                label: 'Receita',
                data: dashboard.finance.monthlyRevenueSeries.data || [],
                borderColor: '#0f766e',
                backgroundColor: 'rgba(15, 118, 110, 0.14)',
                fill: true,
                tension: 0.35
            }
        ]
    };

    const financeScopeLabel =
        financeProfessionalId === 'all'
            ? 'Todos os profissionais'
            : professionalDirectory.find((professional) => professional.id.toString() === financeProfessionalId)?.name ||
              'Profissional selecionado';

    const financeAppointments = dashboard.appointments.filter((appointment) => {
        if (appointment.isBlockedSlot || appointment.isWaitingList) return false;
        if (financeProfessionalId === 'all') return true;
        return appointment.professionalId?.toString() === financeProfessionalId;
    });

    const financePaidAppointments = financeAppointments.filter(
        (appointment) => appointment.isPaid && appointment.isCurrentMonth && !appointment.isCancelled
    );
    const financePendingAppointments = financeAppointments.filter(
        (appointment) => !appointment.isPaid && !appointment.isCancelled && Number(appointment.value || 0) > 0
    );
    const financeCancelledValue = financeAppointments
        .filter((appointment) => appointment.isCancelled && Number(appointment.value || 0) > 0)
        .reduce((sum, appointment) => sum + Number(appointment.value || 0), 0);
    const financeCashInMonth = financePaidAppointments.reduce(
        (sum, appointment) => sum + Number(appointment.value || 0),
        0
    );
    const financePendingReceivables = financePendingAppointments.reduce(
        (sum, appointment) => sum + Number(appointment.value || 0),
        0
    );
    const financeAverageTicket =
        financePaidAppointments.length > 0 ? financeCashInMonth / financePaidAppointments.length : 0;

    const financePaymentMethodMap = financePaidAppointments.reduce((acc, appointment) => {
        const paymentMethod = appointment.paymentMethod || 'Nao informado';
        acc[paymentMethod] = (acc[paymentMethod] || 0) + Number(appointment.value || 0);
        return acc;
    }, {});

    const financeReceivablesMap = {
        Pago: financeCashInMonth,
        Pendente: financePendingReceivables,
        Cancelado: financeCancelledValue
    };

    const financeMonthlySeriesMap = {};
    const financeMonthlySeriesLabels = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
        const marker = new Date();
        marker.setDate(1);
        marker.setMonth(marker.getMonth() - offset);
        const key = getMonthKey(marker);
        financeMonthlySeriesMap[key] = 0;
        const monthName = marker.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        financeMonthlySeriesLabels.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));
    }

    financeAppointments.forEach((appointment) => {
        const dateTime = parseDateTimeValue(appointment.date, appointment.time);
        if (!dateTime || !appointment.isPaid) return;

        const monthKey = getMonthKey(dateTime);
        if (Object.prototype.hasOwnProperty.call(financeMonthlySeriesMap, monthKey)) {
            financeMonthlySeriesMap[monthKey] += Number(appointment.value || 0);
        }
    });

    const financeRevenueChartData = {
        labels: financeMonthlySeriesLabels,
        datasets: [
            {
                label: 'Receita',
                data: Object.values(financeMonthlySeriesMap),
                borderColor: '#0f766e',
                backgroundColor: 'rgba(15, 118, 110, 0.14)',
                fill: true,
                tension: 0.35
            }
        ]
    };

    const financePaymentMethodChartData = {
        labels: Object.keys(financePaymentMethodMap),
        datasets: [
            {
                data: Object.values(financePaymentMethodMap),
                backgroundColor: ['#0f766e', '#f59e0b', '#2563eb', '#8b5cf6', '#ef4444', '#14b8a6'],
                borderWidth: 0
            }
        ]
    };

    const financeReceivablesChartData = {
        labels: Object.keys(financeReceivablesMap).filter((label) => Number(financeReceivablesMap[label]) > 0),
        datasets: [
            {
                label: 'Valores',
                data: Object.keys(financeReceivablesMap)
                    .filter((label) => Number(financeReceivablesMap[label]) > 0)
                    .map((label) => financeReceivablesMap[label]),
                backgroundColor: ['#0f766e', '#f59e0b', '#ef4444'],
                borderRadius: 10
            }
        ]
    };

    const financeRecentTransactions = financeAppointments
        .filter((appointment) => Number(appointment.value || 0) > 0)
        .map((appointment) => ({
            ...appointment,
            dateTimeValue: parseDateTimeValue(appointment.date, appointment.time)
        }))
        .sort((a, b) => {
            const first = a.dateTimeValue ? a.dateTimeValue.getTime() : 0;
            const second = b.dateTimeValue ? b.dateTimeValue.getTime() : 0;
            return second - first;
        })
        .slice(0, 8);

    const summaryCards = [
        {
            title: 'Profissionais ativos',
            value: formatNumber(activeProfessionalDirectory.length),
            caption: `${selectedProfessionalName}`,
            icon: <PeopleFill />
        },
        {
            title: 'Pacientes vinculados',
            value: formatNumber(dashboard.summary.totalPatients),
            caption: 'Base integrada do AutisConnect',
            icon: <Clipboard2Pulse />
        },
        {
            title: 'Consultas do dia',
            value: formatNumber(dashboard.summary.appointmentsToday),
            caption: `${formatNumber(dashboard.summary.pendingConfirmations)} pendentes de confirmação`,
            icon: <Calendar2Check />
        },
        {
            title: 'Faturamento mensal',
            value: formatCurrency(dashboard.summary.monthlyRevenue),
            caption: `${formatCurrency(dashboard.summary.pendingReceivables)} a receber`,
            icon: <Wallet2 />
        }
    ];

    if (!user) {
        return (
            <Container className="py-5">
                <Alert variant="warning">Sessão não encontrada. Faça login para acessar o dashboard clínico.</Alert>
            </Container>
        );
    }

    return (
        <div className="clinic-dashboard-page">
            <Container fluid="xl" className="py-4 py-lg-5">
                <section className="clinic-hero mb-4">
                    <div>
                        <span className="clinic-eyebrow">Gestão Clínica Integrada</span>
                        <h1 className="clinic-title">Dashboard clínico multiagenda e financeiro</h1>
                        <p className="clinic-subtitle">
                            Centralize agendas, confirmações, fila de espera e faturamento em uma única visão para
                            clínicas com vários profissionais.
                        </p>
                        <div className="clinic-badges">
                            <Badge bg="light" text="dark">
                                {dashboard.clinic.accessProfile || accessProfileLabels[user.tipo_usuario] || 'Acesso clínico'}
                            </Badge>
                            <Badge bg="light" text="dark">
                                Escopo: {dashboard.clinic.scopeDescription}
                            </Badge>
                        </div>
                    </div>
                    <div className="clinic-hero-actions">
                        <Button
                            variant="light"
                            className="clinic-action-button"
                            onClick={() => {
                                if (user.tipo_usuario === 'clinica' || user.tipo_usuario === 'servicos_locais') {
                                    setActiveTab('agenda');
                                    window.requestAnimationFrame(() => {
                                        document.querySelector('.clinic-tabs')?.scrollIntoView({
                                            behavior: 'smooth',
                                            block: 'start'
                                        });
                                    });
                                    return;
                                }

                                navigate(
                                    user.tipo_usuario === 'secretaria'
                                        ? `/secretary-dashboard/${user.id}`
                                        : `/professional-dashboard/${user.id}`
                                );
                            }}
                        >
                            <Calendar2Week className="me-2" />
                            Abrir agenda operacional
                        </Button>
                        <Button
                            variant="outline-light"
                            className="clinic-action-button"
                            onClick={() => logout()}
                        >
                            Sair
                        </Button>
                    </div>
                </section>

                {error ? <Alert variant="danger">{error}</Alert> : null}
                {managementFeedback ? <Alert variant={managementFeedback.variant}>{managementFeedback.text}</Alert> : null}

                {dashboard.clinic.scopeMode === 'clinic_pending_setup' ? (
                    <Alert variant="warning" className="clinic-inline-alert">
                        Esta clinica ainda nao possui equipe propria carregada. Cadastre os profissionais neste
                        dashboard para liberar agenda, pacientes e financeiro por profissional.
                    </Alert>
                ) : null}

                {dashboard.meta.limitations.length > 0 ? (
                    <Alert variant="info" className="clinic-inline-alert">
                        {dashboard.meta.limitations[0]}
                    </Alert>
                ) : null}

                <Row className="g-3 mb-4">
                    {summaryCards.map((card) => (
                        <Col key={card.title} xs={12} md={6} xl={3}>
                            <Card className="clinic-stat-card">
                                <Card.Body>
                                    <div className="clinic-stat-header">
                                        <span>{card.title}</span>
                                        <div className="clinic-stat-icon">{card.icon}</div>
                                    </div>
                                    <div className="clinic-stat-value">{card.value}</div>
                                    <div className="clinic-stat-caption">{card.caption}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Card className="clinic-filters-card mb-4">
                    <Card.Body>
                        <Row className="g-3 align-items-end">
                            <Col xs={12} md={4}>
                                <Form.Label>Profissional</Form.Label>
                                <Form.Select
                                    value={filters.professionalId}
                                    onChange={(e) =>
                                        setFilters((current) => ({ ...current, professionalId: e.target.value }))
                                    }
                                >
                                    <option value="all">Todos os profissionais</option>
                                    {activeProfessionalDirectory.map((professional) => (
                                        <option key={professional.id} value={professional.id}>
                                            {professional.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col xs={12} md={3}>
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    value={filters.status}
                                    onChange={(e) =>
                                        setFilters((current) => ({ ...current, status: e.target.value }))
                                    }
                                >
                                    <option value="all">Todos</option>
                                    {[...new Set(dashboard.appointments.map((appointment) => appointment.status).filter(Boolean))].map(
                                        (status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        )
                                    )}
                                </Form.Select>
                            </Col>
                            <Col xs={12} md={3}>
                                <Form.Label>Data foco</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => setFilters((current) => ({ ...current, date: e.target.value }))}
                                />
                            </Col>
                            <Col xs={12} md={2}>
                                <Button
                                    className="w-100 clinic-refresh-button"
                                    disabled={refreshing || loading}
                                    onClick={async () => {
                                        try {
                                            setRefreshing(true);
                                            const response = await apiClient.get(`/clinic/dashboard/${user.id}`);
                                            setDashboard(normalizeDashboardPayload(response.data));
                                            setError('');
                                        } catch (err) {
                                            console.error('Erro ao atualizar dashboard clínico:', err);
                                            setError(
                                                err.response?.data?.details ||
                                                    err.response?.data?.error ||
                                                    'Não foi possível atualizar os dados.'
                                            );
                                        } finally {
                                            setRefreshing(false);
                                        }
                                    }}
                                >
                                    {refreshing ? (
                                        <Spinner size="sm" animation="border" />
                                    ) : (
                                        <>
                                            <ClockHistory className="me-2" />
                                            Atualizar
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {loading ? (
                    <div className="clinic-loading-state">
                        <Spinner animation="border" />
                        <span>Montando a visão consolidada da clínica...</span>
                    </div>
                ) : (
                    <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key || 'overview')}>
                        <>
                            <Nav className="clinic-tabs mb-4">
                                <Nav.Item>
                                    <Nav.Link eventKey="overview">
                                        <GraphUpArrow className="me-2" />
                                        Visão geral
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="agenda">
                                        <Calendar2Week className="me-2" />
                                        Agendamento
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="finance">
                                        <CashCoin className="me-2" />
                                        Financeiro
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="operations">
                                        <ShieldCheck className="me-2" />
                                        Operação & acesso
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="professionals">
                                        <PersonWorkspace className="me-2" />
                                        Profissionais
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="patients">
                                        <Clipboard2Pulse className="me-2" />
                                        Pacientes
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>

                            <Tab.Content>
                                <Tab.Pane eventKey="overview">
                                    <Row className="g-4 mb-4">
                                        <Col xs={12} xl={8}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Tração da clínica</h3>
                                                            <p>Receita consolidada e leitura rápida de capacidade semanal.</p>
                                                        </div>
                                                        <Badge bg="success">
                                                            {formatNumber(dashboard.summary.appointmentsWeek)} consultas na semana
                                                        </Badge>
                                                    </div>
                                                    {revenueChartData.labels.length > 0 ? (
                                                        <Line
                                                            data={revenueChartData}
                                                            options={{
                                                                responsive: true,
                                                                plugins: { legend: { display: false } },
                                                                scales: {
                                                                    y: {
                                                                        ticks: {
                                                                            callback: (value) => formatCurrency(value)
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="clinic-empty-state">Sem histórico financeiro suficiente.</div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} xl={4}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Status da agenda</h3>
                                                            <p>Distribuição do volume filtrado.</p>
                                                        </div>
                                                        <Badge bg="warning" text="dark">
                                                            {formatNumber(filteredAppointments.length)} registros
                                                        </Badge>
                                                    </div>
                                                    {scheduleChartData.labels.length > 0 ? (
                                                        <Bar
                                                            data={scheduleChartData}
                                                            options={{
                                                                responsive: true,
                                                                plugins: { legend: { display: false } }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="clinic-empty-state">Nenhuma consulta no filtro atual.</div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row className="g-4">
                                        <Col xs={12} xl={7}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Perfis profissionais</h3>
                                                            <p>Carga assistencial, agenda de hoje e faturamento por profissional.</p>
                                                        </div>
                                                        <Badge bg="light" text="dark">
                                                            Multi-agenda
                                                        </Badge>
                                                    </div>
                                                    <div className="clinic-professional-grid">
                                                        {dashboard.professionals.length > 0 ? (
                                                            dashboard.professionals.map((professional) => (
                                                                <article
                                                                    className="clinic-professional-card"
                                                                    key={professional.id}
                                                                >
                                                                    <div>
                                                                        <h4>{professional.name}</h4>
                                                                        <span>{professional.specialty || 'Especialidade não informada'}</span>
                                                                    </div>
                                                                    <div className="clinic-professional-metrics">
                                                                        <strong>
                                                                            {formatNumber(professional.todayAppointments)} hoje
                                                                        </strong>
                                                                        <span>
                                                                            {formatNumber(professional.patients)} pacientes
                                                                        </span>
                                                                    </div>
                                                                    <ProgressBar
                                                                        now={Number(professional.utilizationRate || 0)}
                                                                        label={`${Math.round(
                                                                            Number(professional.utilizationRate || 0)
                                                                        )}%`}
                                                                        variant="success"
                                                                    />
                                                                    <div className="clinic-professional-footer">
                                                                        <small>
                                                                            {formatCurrency(professional.monthlyRevenue)} no mês
                                                                        </small>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline-dark"
                                                                            onClick={() =>
                                                                                setFilters((current) => ({
                                                                                    ...current,
                                                                                    professionalId: professional.id.toString()
                                                                                }))
                                                                            }
                                                                        >
                                                                            Filtrar agenda
                                                                        </Button>
                                                                    </div>
                                                                </article>
                                                            ))
                                                        ) : (
                                                            <div className="clinic-empty-state">
                                                                Nenhum profissional associado ao escopo atual.
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} xl={5}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Alertas operacionais</h3>
                                                            <p>Pontos que merecem atenção imediata da recepção e gestão.</p>
                                                        </div>
                                                        <Bell />
                                                    </div>
                                                    <div className="clinic-insight-list">
                                                        {dashboard.insights.length > 0 ? (
                                                            dashboard.insights.map((insight, index) => (
                                                                <div className="clinic-insight-item" key={`${insight}-${index}`}>
                                                                    <Check2Circle />
                                                                    <span>{insight}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="clinic-empty-state">
                                                                Nenhum alerta consolidado neste momento.
                                                            </div>
                                                        )}
                                                    </div>
                                                    <hr />
                                                    <div className="clinic-mini-stats">
                                                        <div>
                                                            <span>Taxa de comparecimento</span>
                                                            <strong>{Math.round(dashboard.summary.attendanceRate || 0)}%</strong>
                                                        </div>
                                                        <div>
                                                            <span>Bloqueios cadastrados</span>
                                                            <strong>{formatNumber(dashboard.summary.blockedSlots)}</strong>
                                                        </div>
                                                        <div>
                                                            <span>Fila de espera</span>
                                                            <strong>{formatNumber(dashboard.summary.waitingListCount)}</strong>
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab.Pane>

                                <Tab.Pane eventKey="agenda">
                                    <Row className="g-4">
                                        <Col xs={12} xl={8}>
                                            <Card className="clinic-panel-card">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Agenda filtrada</h3>
                                                            <p>Visão de consultas, encaixes, bloqueios e andamento do dia.</p>
                                                        </div>
                                                        <Badge bg="primary">
                                                            {formatNumber(filteredAppointments.length)} itens
                                                        </Badge>
                                                    </div>
                                                    <div className="table-responsive">
                                                        <Table hover className="clinic-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Paciente</th>
                                                                    <th>Profissional</th>
                                                                    <th>Horário</th>
                                                                    <th>Tipo</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {filteredAppointments.length > 0 ? (
                                                                    filteredAppointments.slice(0, 18).map((appointment) => (
                                                                        <tr key={appointment.id}>
                                                                            <td>{appointment.patientName}</td>
                                                                            <td>{appointment.professionalName}</td>
                                                                            <td>{formatDateTime(appointment.date, appointment.time)}</td>
                                                                            <td>{appointment.type}</td>
                                                                            <td>
                                                                                <Badge bg={getStatusVariant(appointment.status)}>
                                                                                            {appointment.status}
                                                                                </Badge>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={5}>
                                                                            <div className="clinic-empty-state">
                                                                                Não há consultas para este recorte.
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </Table>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} xl={4}>
                                            <Card className="clinic-panel-card mb-4">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Confirmações pendentes</h3>
                                                            <p>Lembretes, presença e contatos prioritários.</p>
                                                        </div>
                                                        <Funnel />
                                                    </div>
                                                    <div className="clinic-side-list">
                                                        {filteredConfirmations.length > 0 ? (
                                                            filteredConfirmations.map((item) => (
                                                                <div key={item.id} className="clinic-side-item">
                                                                    <strong>{item.patientName}</strong>
                                                                    <span>{item.professionalName}</span>
                                                                    <small>{formatDateTime(item.date, item.time)}</small>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="clinic-empty-state">
                                                                Nenhuma confirmação pendente neste filtro.
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                            </Card>

                                            <Card className="clinic-panel-card">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Fila de espera</h3>
                                                            <p>Pacientes aguardando encaixe ou remarcação.</p>
                                                        </div>
                                                        <ClockHistory />
                                                    </div>
                                                    <div className="clinic-side-list">
                                                        {filteredWaitlist.length > 0 ? (
                                                            filteredWaitlist.map((item) => (
                                                                <div key={item.id} className="clinic-side-item">
                                                                    <strong>{item.patientName}</strong>
                                                                    <span>{item.professionalName}</span>
                                                                    <small>{item.reason || 'Aguardando abertura de vaga'}</small>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="clinic-empty-state">Sem fila de espera ativa.</div>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab.Pane>

                                <Tab.Pane eventKey="finance">
                                    <Card className="clinic-filters-card mb-4">
                                        <Card.Body>
                                            <Row className="g-3 align-items-end">
                                                <Col xs={12} md={6} xl={4}>
                                                    <Form.Label>Profissional no financeiro</Form.Label>
                                                    <Form.Select
                                                        value={financeProfessionalId}
                                                        onChange={(e) => setFinanceProfessionalId(e.target.value)}
                                                    >
                                                        <option value="all">Todos os profissionais</option>
                                                        {professionalDirectory.map((professional) => (
                                                            <option key={professional.id} value={professional.id}>
                                                                {professional.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>
                                                <Col xs={12} md={6} xl={8}>
                                                    <div className="clinic-table-stack">
                                                        <strong>Escopo financeiro</strong>
                                                        <span>
                                                            Visao atual: {financeScopeLabel}. Os indicadores abaixo alternam entre o consolidado da clinica e cada profissional.
                                                        </span>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>

                                    <Row className="g-4 mb-4">
                                        <Col xs={12} md={6} xl={3}>
                                            <Card className="clinic-stat-card">
                                                <Card.Body>
                                                    <span className="clinic-metric-label">Entradas no mes</span>
                                                    <div className="clinic-metric-value">
                                                        {formatCurrency(financeCashInMonth)}
                                                    </div>
                                                    <small>Consultas efetivamente pagas.</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} md={6} xl={3}>
                                            <Card className="clinic-stat-card">
                                                <Card.Body>
                                                    <span className="clinic-metric-label">A receber</span>
                                                    <div className="clinic-metric-value">
                                                        {formatCurrency(financePendingReceivables)}
                                                    </div>
                                                    <small>Recebiveis pendentes por baixa.</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} md={6} xl={3}>
                                            <Card className="clinic-stat-card">
                                                <Card.Body>
                                                    <span className="clinic-metric-label">Ticket medio</span>
                                                    <div className="clinic-metric-value">
                                                        {formatCurrency(financeAverageTicket)}
                                                    </div>
                                                    <small>Valor medio por atendimento pago.</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} md={6} xl={3}>
                                            <Card className="clinic-stat-card">
                                                <Card.Body>
                                                    <span className="clinic-metric-label">Consultas pagas</span>
                                                    <div className="clinic-metric-value">
                                                        {formatNumber(financePaidAppointments.length)}
                                                    </div>
                                                    <small>Baixas concluidas no mes corrente.</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row className="g-4">
                                        <Col xs={12} xl={4}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Receita mensal</h3>
                                                            <p>Evolucao dos recebimentos dentro do filtro selecionado.</p>
                                                        </div>
                                                        <GraphUpArrow />
                                                    </div>
                                                    {financeRevenueChartData.labels.length > 0 ? (
                                                        <Line
                                                            data={financeRevenueChartData}
                                                            options={{
                                                                responsive: true,
                                                                plugins: { legend: { display: false } },
                                                                scales: {
                                                                    y: {
                                                                        ticks: {
                                                                            callback: (value) => formatCurrency(value)
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="clinic-empty-state">Sem historico financeiro suficiente.</div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} xl={4}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Receita por pagamento</h3>
                                                            <p>Mix de Pix, cartao, dinheiro e outros meios.</p>
                                                        </div>
                                                        <Wallet2 />
                                                    </div>
                                                    {financePaymentMethodChartData.labels.length > 0 ? (
                                                        <Doughnut
                                                            data={financePaymentMethodChartData}
                                                            options={{ plugins: { legend: { position: 'bottom' } } }}
                                                        />
                                                    ) : (
                                                        <div className="clinic-empty-state">
                                                            Ainda nao ha pagamentos processados.
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} xl={4}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Contas por status</h3>
                                                            <p>Leitura rapida de baixas, pendencias e cancelamentos.</p>
                                                        </div>
                                                        <CashCoin />
                                                    </div>
                                                    {financeReceivablesChartData.labels.length > 0 ? (
                                                        <Bar
                                                            data={financeReceivablesChartData}
                                                            options={{
                                                                responsive: true,
                                                                plugins: { legend: { display: false } },
                                                                scales: {
                                                                    y: {
                                                                        ticks: {
                                                                            callback: (value) => formatCurrency(value)
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="clinic-empty-state">Sem movimentacoes financeiras.</div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Transacoes recentes</h3>
                                                            <p>Ultimos recebimentos e pendencias relevantes.</p>
                                                        </div>
                                                        <GraphUpArrow />
                                                    </div>
                                                    <div className="clinic-side-list">
                                                        {financeRecentTransactions.length > 0 ? (
                                                            financeRecentTransactions.map((transaction) => (
                                                                <div key={transaction.id} className="clinic-side-item">
                                                                    <strong>{transaction.patientName}</strong>
                                                                    <span>{transaction.professionalName}</span>
                                                                    <small>
                                                                        {formatDateTime(transaction.date, transaction.time)} •{' '}
                                                                        {formatCurrency(transaction.value)}
                                                                    </small>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="clinic-empty-state">
                                                                Nenhuma transacao recente encontrada.
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab.Pane>

                                <Tab.Pane eventKey="operations">
                                    <Row className="g-4">
                                        <Col xs={12} xl={6}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Bloqueios de agenda</h3>
                                                            <p>Períodos reservados para reuniões, pausas e compromissos internos.</p>
                                                        </div>
                                                        <PersonWorkspace />
                                                    </div>
                                                    <div className="clinic-side-list">
                                                        {filteredBlockedSlots.length > 0 ? (
                                                            filteredBlockedSlots.map((slot) => (
                                                                <div key={slot.id} className="clinic-side-item">
                                                                    <strong>{slot.professionalName}</strong>
                                                                    <span>{slot.reason || slot.type || 'Bloqueio operacional'}</span>
                                                                    <small>{formatDateTime(slot.date, slot.time)}</small>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="clinic-empty-state">
                                                                Nenhum bloqueio cadastrado para o recorte atual.
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} xl={6}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Acesso e governança</h3>
                                                            <p>Separação de papéis para LGPD e operação segura da clínica.</p>
                                                        </div>
                                                        <ShieldCheck />
                                                    </div>
                                                    <div className="clinic-access-grid">
                                                        <article>
                                                            <h4>Administrador</h4>
                                                            <p>Visão completa de agenda, indicadores e financeiro consolidado.</p>
                                                        </article>
                                                        <article>
                                                            <h4>Secretária</h4>
                                                            <p>Foco em agendamento, confirmação, remarcação e fila de espera.</p>
                                                        </article>
                                                        <article>
                                                            <h4>Médico</h4>
                                                            <p>Visualização da própria agenda, pacientes e produção assistencial.</p>
                                                        </article>
                                                        <article>
                                                            <h4>Limitações atuais</h4>
                                                            <p>
                                                                O modelo ainda não expõe despesas, convênios e conciliação bancária;
                                                                a estrutura já deixa espaço para essas integrações.
                                                            </p>
                                                        </article>
                                                    </div>
                                                    {dashboard.meta.assumptions.length > 0 ? (
                                                        <Alert variant="secondary" className="mt-3 mb-0">
                                                            {dashboard.meta.assumptions[0]}
                                                        </Alert>
                                                    ) : null}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey="professionals">
                                    <Row className="g-4">
                                        <Col xs={12} xl={5}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Cadastro de profissionais</h3>
                                                            <p>Os profissionais passam a ser incluidos e geridos neste proprio dashboard, sem senha de acesso no cadastro.</p>
                                                        </div>
                                                        <Badge bg="light" text="dark">
                                                            {formatNumber(professionalDirectory.length)} cadastrados
                                                        </Badge>
                                                    </div>
                                                    {!canManageProfessionals ? (
                                                        <Alert variant="secondary" className="mb-0">
                                                            Este perfil tem visao de consulta. O cadastro administrativo fica disponivel para clinica e secretaria.
                                                        </Alert>
                                                    ) : (
                                                        <Form onSubmit={handleProfessionalSubmit} className="clinic-management-form">
                                                            <Row className="g-3">
                                                                <Col xs={12}>
                                                                    <Form.Label>Nome completo</Form.Label>
                                                                    <Form.Control
                                                                        value={professionalForm.nome_completo}
                                                                        onChange={(e) =>
                                                                            handleProfessionalFormChange('nome_completo', e.target.value)
                                                                        }
                                                                        placeholder="Nome do profissional"
                                                                        required
                                                                    />
                                                                </Col>
                                                                <Col xs={12} md={6}>
                                                                    <Form.Label>Email (opcional)</Form.Label>
                                                                    <Form.Control
                                                                        type="email"
                                                                        value={professionalForm.email}
                                                                        onChange={(e) =>
                                                                            handleProfessionalFormChange('email', e.target.value)
                                                                        }
                                                                        placeholder="profissional@clinica.com"
                                                                    />
                                                                </Col>
                                                                <Col xs={12} md={6}>
                                                                    <Form.Label>Telefone</Form.Label>
                                                                    <Form.Control
                                                                        value={professionalForm.telefone}
                                                                        onChange={(e) =>
                                                                            handleProfessionalFormChange('telefone', e.target.value)
                                                                        }
                                                                        placeholder="(85) 99999-9999"
                                                                    />
                                                                </Col>
                                                                <Col xs={12} md={6}>
                                                                    <Form.Label>CPF</Form.Label>
                                                                    <Form.Control
                                                                        value={professionalForm.cpf}
                                                                        onChange={(e) =>
                                                                            handleProfessionalFormChange('cpf', e.target.value)
                                                                        }
                                                                        placeholder="000.000.000-00"
                                                                    />
                                                                </Col>
                                                                <Col xs={12} md={6}>
                                                                    <Form.Label>Especialidade</Form.Label>
                                                                    <Form.Control
                                                                        value={professionalForm.especialidade}
                                                                        onChange={(e) =>
                                                                            handleProfessionalFormChange('especialidade', e.target.value)
                                                                        }
                                                                        placeholder="Neuropediatria, Psicologia..."
                                                                    />
                                                                </Col>
                                                                <Col xs={12} md={6}>
                                                                    <Form.Label>Registro profissional</Form.Label>
                                                                    <Form.Control
                                                                        value={professionalForm.registro_profissional}
                                                                        onChange={(e) =>
                                                                            handleProfessionalFormChange('registro_profissional', e.target.value)
                                                                        }
                                                                        placeholder="CRM, CRP, CREFITO..."
                                                                    />
                                                                </Col>
                                                                <Col xs={12}>
                                                                    <Button
                                                                        type="submit"
                                                                        className="clinic-refresh-button w-100"
                                                                        disabled={submitting.professional}
                                                                    >
                                                                        {submitting.professional ? 'Salvando profissional...' : 'Cadastrar profissional'}
                                                                    </Button>
                                                                </Col>
                                                            </Row>
                                                        </Form>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} xl={7}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Administracao dos profissionais</h3>
                                                            <p>Lista consolidada da equipe associada a esta clinica.</p>
                                                        </div>
                                                        <PersonWorkspace />
                                                    </div>
                                                    {registryLoading.professionals ? (
                                                        <div className="clinic-empty-state">Carregando profissionais...</div>
                                                    ) : professionalDirectory.length > 0 ? (
                                                        <div className="table-responsive">
                                                            <Table hover className="clinic-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Profissional</th>
                                                                        <th>Especialidade</th>
                                                                        <th>Contato</th>
                                                                        <th>Registro</th>
                                                                        <th>Status</th>
                                                                        <th>Acoes</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {professionalDirectory.map((professional) => (
                                                                        <tr key={professional.id}>
                                                                            <td>
                                                                                <strong>{professional.name}</strong>
                                                                            </td>
                                                                            <td>{professional.specialty || 'Nao informado'}</td>
                                                                            <td>
                                                                                <div className="clinic-table-stack">
                                                                                    <span>{professional.email || 'Sem email'}</span>
                                                                                    <small>{professional.phone || 'Sem telefone'}</small>
                                                                                </div>
                                                                            </td>
                                                                            <td>{professional.license || 'Nao informado'}</td>
                                                                            <td>
                                                                                <Badge
                                                                                    bg={
                                                                                        (professional.status || 'ativo') === 'ativo'
                                                                                            ? 'success'
                                                                                            : 'secondary'
                                                                                    }
                                                                                >
                                                                                    {(professional.status || 'ativo') === 'ativo'
                                                                                        ? 'Ativo'
                                                                                        : 'Inativo'}
                                                                                </Badge>
                                                                            </td>
                                                                            <td>
                                                                                {canManageProfessionals ? (
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant={
                                                                                            (professional.status || 'ativo') === 'ativo'
                                                                                                ? 'outline-danger'
                                                                                                : 'outline-success'
                                                                                        }
                                                                                        disabled={
                                                                                            statusUpdatingProfessionalId === professional.id
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleProfessionalStatusToggle(
                                                                                                professional
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        {statusUpdatingProfessionalId === professional.id
                                                                                            ? 'Salvando...'
                                                                                            : (professional.status || 'ativo') ===
                                                                                                'ativo'
                                                                                              ? 'Desativar'
                                                                                              : 'Ativar'}
                                                                                    </Button>
                                                                                ) : (
                                                                                    <span className="clinic-muted-inline">
                                                                                        Somente administracao
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    ) : (
                                                        <div className="clinic-empty-state">Nenhum profissional cadastrado para esta clinica.</div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab.Pane>

                                <Tab.Pane eventKey="patients">
                                    <Row className="g-4">
                                        <Col xs={12} xl={5}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Cadastro de pacientes</h3>
                                                            <p>Todo paciente novo herda o `clinic_id` da clinica e fica ligado a um profissional responsavel.</p>
                                                        </div>
                                                        <Badge bg="light" text="dark">
                                                            {formatNumber(patientRecords.length)} cadastrados
                                                        </Badge>
                                                    </div>
                                                    {!canManagePatients ? (
                                                        <Alert variant="secondary" className="mb-0">
                                                            Este perfil pode acompanhar os pacientes ja vinculados, mas nao cadastrar novos registros.
                                                        </Alert>
                                                    ) : activeProfessionalDirectory.length === 0 ? (
                                                        <Alert variant="warning" className="mb-0">
                                                            Cadastre ao menos um profissional da clinica antes de incluir pacientes.
                                                        </Alert>
                                                    ) : (
                                                        <Form onSubmit={handlePatientSubmit} className="clinic-management-form">
                                                            <Row className="g-3">
                                                                <Col xs={12}>
                                                                    <Form.Label>Nome completo</Form.Label>
                                                                    <Form.Control
                                                                        value={patientForm.nome_completo}
                                                                        onChange={(e) =>
                                                                            handlePatientFormChange('nome_completo', e.target.value)
                                                                        }
                                                                        placeholder="Nome do paciente"
                                                                        required
                                                                    />
                                                                </Col>
                                                                <Col xs={12} md={6}>
                                                                    <Form.Label>CPF</Form.Label>
                                                                    <Form.Control
                                                                        value={patientForm.cpf}
                                                                        onChange={(e) =>
                                                                            handlePatientFormChange('cpf', e.target.value)
                                                                        }
                                                                        placeholder="000.000.000-00"
                                                                    />
                                                                </Col>
                                                                <Col xs={12} md={6}>
                                                                    <Form.Label>Data de nascimento</Form.Label>
                                                                    <Form.Control
                                                                        type="date"
                                                                        value={patientForm.data_nascimento}
                                                                        onChange={(e) =>
                                                                            handlePatientFormChange('data_nascimento', e.target.value)
                                                                        }
                                                                    />
                                                                </Col>
                                                                <Col xs={12}>
                                                                    <Form.Label>Profissional responsavel</Form.Label>
                                                                    <Form.Select
                                                                        value={patientForm.professional_id}
                                                                        onChange={(e) =>
                                                                            handlePatientFormChange('professional_id', e.target.value)
                                                                        }
                                                                        required
                                                                    >
                                                                        <option value="">Selecione um profissional</option>
                                                                        {activeProfessionalDirectory.map((professional) => (
                                                                            <option key={professional.id} value={professional.id}>
                                                                                {professional.name}
                                                                                {professional.specialty ? ` - ${professional.specialty}` : ''}
                                                                            </option>
                                                                        ))}
                                                                    </Form.Select>
                                                                </Col>
                                                                <Col xs={12}>
                                                                    <Button
                                                                        type="submit"
                                                                        className="clinic-refresh-button w-100"
                                                                        disabled={submitting.patient}
                                                                    >
                                                                        {submitting.patient ? 'Salvando paciente...' : 'Cadastrar paciente'}
                                                                    </Button>
                                                                </Col>
                                                            </Row>
                                                        </Form>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col xs={12} xl={7}>
                                            <Card className="clinic-panel-card h-100">
                                                <Card.Body>
                                                    <div className="clinic-panel-header">
                                                        <div>
                                                            <h3>Administracao dos pacientes</h3>
                                                            <p>Base clinica organizada por responsavel e vinculada ao mesmo `clinic_id`.</p>
                                                        </div>
                                                        <Clipboard2Pulse />
                                                    </div>
                                                    {registryLoading.patients ? (
                                                        <div className="clinic-empty-state">Carregando pacientes...</div>
                                                    ) : patientRecords.length > 0 ? (
                                                        <div className="table-responsive">
                                                            <Table hover className="clinic-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Paciente</th>
                                                                        <th>Profissional</th>
                                                                        <th>Nascimento</th>
                                                                        <th>CPF</th>
                                                                        <th>Vinculo</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {patientRecords.map((patient) => (
                                                                        <tr key={patient.id}>
                                                                            <td>
                                                                                <strong>{patient.name}</strong>
                                                                            </td>
                                                                            <td>{patient.professionalName || 'Nao informado'}</td>
                                                                            <td>{formatDate(patient.birthDate)}</td>
                                                                            <td>{patient.cpf || 'Nao informado'}</td>
                                                                            <td>
                                                                                <Badge bg={patient.clinicId ? 'success' : 'secondary'}>
                                                                                    {patient.clinicId ? 'Clinic ID ativo' : 'Sem clinic_id'}
                                                                                </Badge>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    ) : (
                                                        <div className="clinic-empty-state">Nenhum paciente cadastrado para esta clinica.</div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                            </Tab.Content>
                        </>
                    </Tab.Container>
                )}
            </Container>
        </div>
    );
};

export default ClinicDashboard;
