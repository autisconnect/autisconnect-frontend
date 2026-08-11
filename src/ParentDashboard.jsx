import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Modal,
  Offcanvas,
  OverlayTrigger,
  Row,
  Tooltip
} from 'react-bootstrap';
import {
  ArrowRight,
  BoxArrowRight,
  BoxArrowUpRight,
  Calendar2Check,
  Calendar3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GeoAlt,
  Gear,
  GraphUp,
  HouseDoor,
  List,
  PersonCircle,
  PlusCircle,
  Search,
  ShieldCheck,
  Sliders,
  StarFill
} from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';
import logonovo from './assets/logonovo.png';
import './App.css';
import './ParentDashboard.css';

import { Line } from 'react-chartjs-2';
import {
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

const SIDEBAR_STORAGE_KEY = 'ac-parent-sidebar-collapsed';

const SERVICE_TYPE_OPTIONS = [
  { value: 'ABA', label: 'ABA' },
  { value: 'Fonoaudiologia', label: 'Fonoaudiologia' },
  { value: 'Psicopedagogia', label: 'Psicopedagogia' },
  { value: 'Equoterapia', label: 'Equoterapia' },
  { value: 'Natacao Adaptada', label: 'Natacao Adaptada' },
  { value: 'Musica', label: 'Musica' },
  { value: 'Artes', label: 'Artes' },
  { value: 'Odontologia Sensorial', label: 'Odontologia Sensorial' },
  { value: 'Psiquiatria', label: 'Psiquiatria' },
  { value: 'Neuropediatria', label: 'Neuropediatria' }
];

const SERVICE_SUPPORT_LEVEL_OPTIONS = [
  { value: '1', label: 'Nivel 1' },
  { value: '2', label: 'Nivel 2' },
  { value: '3', label: 'Nivel 3' }
];

const SERVICE_MODALITY_OPTIONS = [
  { value: 'Presencial', label: 'Presencial' },
  { value: 'Online', label: 'Online' },
  { value: 'Hibrido', label: 'Hibrido' }
];

const SERVICE_AGE_RANGE_OPTIONS = [
  { value: '0-3', label: '0-3 anos' },
  { value: '4-7', label: '4-7 anos' },
  { value: '8-12', label: '8-12 anos' },
  { value: '13-17', label: '13-17 anos' },
  { value: '18+', label: '18+ anos' }
];

const SERVICE_COVERAGE_OPTIONS = [
  { value: 'Convenio', label: 'Convenio' },
  { value: 'Particular', label: 'Particular' },
  { value: 'PlanoSaude', label: 'Plano de Saude' }
];

const APPOINTMENT_TYPE_OPTIONS = [
  { value: 'Consulta Regular', label: 'Atendimento regular' },
  { value: 'Consulta Inicial', label: 'Atendimento inicial' },
  { value: 'Acompanhamento', label: 'Acompanhamento' },
  { value: 'Avaliacao', label: 'Avaliacao' },
  { value: 'Terapia', label: 'Terapia' }
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'Pix', label: 'Pix' },
  { value: 'Credito', label: 'Cartao de Credito' },
  { value: 'Debito', label: 'Cartao de Debito' },
  { value: 'Dinheiro', label: 'Dinheiro' },
  { value: 'Plano de Saúde', label: 'Plano de Saude' }
];

const SERVICE_TYPE_LABELS = SERVICE_TYPE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const buildBaseServiceFilters = () => ({
  city: '',
  region: '',
  state: '',
  types: [],
  supportLevels: [],
  modality: '',
  ageRange: '',
  coverage: '',
  search: '',
  sort: 'relevance',
  page: 1,
  limit: 20,
  lat: null,
  lng: null
});

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 10,
        color: '#475569',
        font: {
          size: 12,
          weight: 600
        }
      }
    },
    tooltip: {
      backgroundColor: '#0F172A',
      titleColor: '#F8FAFC',
      bodyColor: '#E2E8F0',
      padding: 12,
      borderColor: 'rgba(56, 96, 248, 0.35)',
      borderWidth: 1,
      displayColors: true
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#64748B'
      }
    },
    y: {
      beginAtZero: true,
      max: 5,
      ticks: {
        stepSize: 1,
        color: '#64748B'
      },
      title: {
        display: true,
        text: 'Nivel (1-5)',
        color: '#475569'
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.16)',
        drawBorder: false
      }
    }
  }
};

const getInitials = (value) => {
  const source = String(value || '').trim();
  if (!source) return 'AC';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const getPatientName = (patient) =>
  patient?.name || patient?.nome_completo || patient?.patient_name || 'Paciente';

const getPatientSupportLevel = (patient) =>
  patient?.nivel_suporte || patient?.supportLevel || patient?.diagnosis || 'Nao informado';

const getPatientDiagnosis = (patient) =>
  patient?.diagnosis || patient?.diagnostico || patient?.nivel_suporte || 'Nao informado';

const getPatientPhone = (patient) => patient?.phone || patient?.telefone || 'Nao informado';

const getPatientEmail = (patient) => patient?.email || patient?.responsible_email || 'Nao informado';

const getAppointmentTimestamp = (appointment) => {
  const dateValue = appointment?.date || appointment?.appointment_date;
  const timeValue = appointment?.time || appointment?.appointment_time || '00:00';
  if (!dateValue) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(`${dateValue}T${String(timeValue).slice(0, 5)}:00`).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
};

const getAppointmentStatusMeta = (status) => {
  const normalized = String(status || 'Agendada').toLowerCase();
  if (normalized.includes('confirm')) {
    return { label: 'Confirmado', tone: 'success' };
  }
  if (normalized.includes('concl') || normalized.includes('realiz')) {
    return { label: 'Concluido', tone: 'done' };
  }
  if (normalized.includes('cancel')) {
    return { label: 'Cancelado', tone: 'danger' };
  }
  if (normalized.includes('pend')) {
    return { label: 'Pendente', tone: 'warning' };
  }
  return { label: 'Agendado', tone: 'info' };
};

const getAppointmentTypeLabel = (value) => {
  const matched = APPOINTMENT_TYPE_OPTIONS.find((option) => option.value === value);
  return matched?.label || value || 'Atendimento';
};

const formatDayMonth = (dateString) => {
  if (!dateString) {
    return { day: '--', month: '---' };
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return { day: '--', month: '---' };
  }

  return {
    day: date.toLocaleDateString('pt-BR', { day: '2-digit' }),
    month: date
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
      .toUpperCase()
  };
};

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = GraphUp,
  compact = false
}) {
  return (
    <div className={`ac-parent-empty-state${compact ? ' ac-parent-empty-state--compact' : ''}`}>
      <div className="ac-parent-empty-state__icon">
        <Icon />
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
    <div className="ac-parent-dashboard ac-parent-dashboard--loading">
      <aside className="ac-parent-sidebar-shell">
        <div className="ac-parent-sidebar">
          <div className="ac-parent-sidebar__brand-block">
            <div className="ac-parent-skeleton ac-parent-skeleton--logo" />
            <div className="ac-parent-sidebar__brand-ribbon" />
          </div>
          <div className="ac-parent-sidebar__nav-group">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="ac-parent-skeleton ac-parent-skeleton--nav" />
            ))}
          </div>
        </div>
      </aside>
      <div className="ac-parent-shell">
        <header className="ac-parent-header">
          <div className="ac-parent-skeleton ac-parent-skeleton--header-title" />
          <div className="ac-parent-skeleton ac-parent-skeleton--header-actions" />
        </header>
        <main className="ac-parent-main">
          <section className="ac-parent-page-header">
            <div className="ac-parent-page-header__copy">
              <div className="ac-parent-skeleton ac-parent-skeleton--eyebrow" />
              <div className="ac-parent-skeleton ac-parent-skeleton--title" />
              <div className="ac-parent-skeleton ac-parent-skeleton--paragraph" />
            </div>
            <div className="ac-parent-skeleton ac-parent-skeleton--selector" />
          </section>
          <div className="ac-parent-skeleton-grid">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="ac-parent-skeleton ac-parent-skeleton--kpi" />
            ))}
          </div>
          <div className="ac-parent-skeleton-grid ac-parent-skeleton-grid--content">
            <div className="ac-parent-skeleton ac-parent-skeleton--panel" />
            <div className="ac-parent-skeleton ac-parent-skeleton--panel" />
          </div>
        </main>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, caption, tone = 'primary' }) {
  return (
    <Card className="ac-parent-card ac-parent-kpi">
      <Card.Body>
        <div className={`ac-parent-kpi__icon ac-parent-kpi__icon--${tone}`}>
          <Icon />
        </div>
        <span className="ac-parent-kpi__title">{title}</span>
        <strong className="ac-parent-kpi__value">{value}</strong>
        <small className="ac-parent-kpi__caption">{caption}</small>
      </Card.Body>
    </Card>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="ac-parent-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ParentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [children, setChildren] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    professionalId: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'Consulta Regular',
    status: 'Agendada',
    payment_method: 'Pix',
    payment_details: '',
    payment_status: 'Pendente',
    value: '',
    notes: ''
  });

  const [patientProgressData, setPatientProgressData] = useState({
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
    datasets: []
  });

  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [services, setServices] = useState([]);
  const [serviceFilters, setServiceFilters] = useState(() => buildBaseServiceFilters());
  const [serviceQuery, setServiceQuery] = useState(() => buildBaseServiceFilters());
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const [serviceMeta, setServiceMeta] = useState({ total: 0, page: 1, pageSize: 20 });
  const [serviceGeoStatus, setServiceGeoStatus] = useState('');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showServiceFilters, setShowServiceFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 992;
  });

  const handlePatientSelect = (patient) => {
    try {
      const patientId = patient.id;
      if (!patientId) {
        setError('Paciente invalido selecionado.');
        return;
      }

      window.open(`/patient-details-parent/${patientId}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Erro ao abrir dashboard do paciente:', err);
      setError('Erro ao abrir detalhes do paciente.');
    }
  };

  const formatAge = (birthDate) => {
    if (!birthDate) return 'Nao informado';
    const today = new Date();
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return 'Nao informado';

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }

    return `${age} anos`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nao informado';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return 'Nao informado';
    return parsed.toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString) => {
    return timeString ? String(timeString).substring(0, 5) : 'Nao informado';
  };

  const resolveDefaultServiceLocation = () => {
    const city =
      user?.cidade ||
      user?.city ||
      user?.endereco?.cidade ||
      user?.address?.city ||
      selectedPatient?.cidade ||
      selectedPatient?.city ||
      '';
    const state =
      user?.estado ||
      user?.uf ||
      user?.state ||
      user?.endereco?.estado ||
      user?.address?.state ||
      selectedPatient?.estado ||
      selectedPatient?.uf ||
      '';
    const region = user?.regiao || user?.region || '';
    return { city, state, region };
  };

  const normalizeList = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const normalizeService = (service) => {
    const specialtiesRaw =
      service?.specialties ||
      service?.especialidades ||
      service?.types ||
      service?.servicos ||
      service?.categorias ||
      service?.tipo_servico;
    const specialties = normalizeList(specialtiesRaw).map(
      (item) => SERVICE_TYPE_LABELS[item] || item
    );

    return {
      id: service?.id || service?.service_id || service?.codigo || service?.uuid,
      name: service?.name || service?.nome || service?.titulo || 'Servico',
      neighborhood: service?.neighborhood || service?.bairro || service?.district || '',
      city: service?.city || service?.cidade || '',
      state: service?.state || service?.uf || service?.estado || '',
      specialties,
      rating: Number(service?.rating || service?.avaliacao_media || service?.avaliacao || 0),
      ratingCount: Number(
        service?.ratingCount || service?.avaliacoes_count || service?.total_avaliacoes || 0
      ),
      distanceKm: service?.distanceKm || service?.distancia_km || service?.distancia || null,
      updatedAt:
        service?.updatedAt ||
        service?.updated_at ||
        service?.created_at ||
        service?.data_cadastro ||
        null,
      raw: service
    };
  };

  const parseCoordinate = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const buildServiceSearchParams = (filters) => {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    if (filters.region) params.append('region', filters.region);
    if (filters.state) params.append('state', filters.state);
    if (filters.search) {
      params.append('q', filters.search);
      params.append('search', filters.search);
    }
    filters.types.forEach((type) => params.append('types[]', type));
    filters.supportLevels.forEach((level) => params.append('levels[]', level));
    if (filters.modality) params.append('modality', filters.modality);
    if (filters.ageRange) params.append('ageRange', filters.ageRange);
    if (filters.coverage) params.append('coverage', filters.coverage);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    const lat = parseCoordinate(filters.lat);
    const lng = parseCoordinate(filters.lng);
    if (lat !== null && lng !== null) {
      params.append('lat', String(lat));
      params.append('lng', String(lng));
    }
    return params.toString();
  };

  const getServiceDefaults = () => {
    const base = buildBaseServiceFilters();
    const { city, state, region } = resolveDefaultServiceLocation();
    return {
      ...base,
      city: city || '',
      state: state || '',
      region: region || ''
    };
  };

  const updateServiceFilter = (key, value) => {
    setServiceFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleServiceFilterValue = (key, value) => {
    setServiceFilters((prev) => {
      const current = prev[key] || [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const handleServiceSearch = (event) => {
    if (event) event.preventDefault();
    const hasLocation = serviceFilters.city || serviceFilters.region || serviceFilters.state;
    if (!hasLocation) {
      setServicesError('Informe cidade, regiao ou estado para buscar servicos.');
      setServices([]);
      setServiceMeta({ total: 0, page: 1, pageSize: serviceFilters.limit });
      return;
    }

    setServicesError('');
    setServiceQuery({
      ...serviceFilters,
      page: 1,
      types: [...serviceFilters.types],
      supportLevels: [...serviceFilters.supportLevels]
    });
    setShowMobileFilters(false);
  };

  const handleServiceClear = () => {
    const defaults = getServiceDefaults();
    setServiceFilters(defaults);
    setServiceQuery(defaults);
    setServicesError('');
  };

  const handleServiceSortChange = (value) => {
    setServiceFilters((prev) => ({ ...prev, sort: value }));
    setServiceQuery((prev) => ({ ...prev, sort: value, page: 1 }));
    if (value === 'distance') {
      const hasCoords =
        parseCoordinate(serviceFilters.lat) !== null && parseCoordinate(serviceFilters.lng) !== null;
      if (!hasCoords) {
        handleUseMyLocation();
      }
    }
  };

  const handleServicePageChange = (nextPage) => {
    if (!nextPage || nextPage < 1) return;
    setServiceQuery((prev) => ({ ...prev, page: nextPage }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setServiceGeoStatus('Geolocalizacao nao suportada neste navegador.');
      return;
    }

    setServiceGeoStatus('Obtendo localizacao...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setServiceFilters((prev) => ({ ...prev, lat: latitude, lng: longitude }));
        setServiceQuery((prev) => ({ ...prev, lat: latitude, lng: longitude }));
        setServiceGeoStatus('Localizacao capturada para calcular distancia.');
      },
      () => {
        setServiceGeoStatus('Nao foi possivel obter sua localizacao.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const openServiceDetails = (serviceId) => {
    // TODO: revisar este fallback quando houver garantia de IDs validos na listagem.
    const resolvedId = serviceId || 18;
    window.open(`/service-dashboard/${resolvedId}`, '_blank', 'noopener,noreferrer');
  };

  const fetchChildren = async () => {
    if (!user) return;

    const routes = ['/parent/my-children'];

    for (const route of routes) {
      try {
        const response = await apiClient.get(route);
        const data = Array.isArray(response.data) ? response.data : [];
        if (data.length > 0) {
          const normalizedData = data.map((child) => ({
            ...child,
            id: child.id || 16,
            name: child.name || child.nome_completo || 'teste01',
            diagnosis: child.diagnosis || child.diagnostico || 'Nivel 2',
            birthDate: child.birthDate || child.data_nascimento || '2015-01-01'
          }));
          setChildren(normalizedData);
          setSelectedPatient(normalizedData[0]);
          return;
        }
      } catch (err) {
        console.warn(`Rota ${route} falhou.`);
      }
    }

    const fallbackChild = {
      id: 16,
      name: 'teste01',
      diagnosis: 'Nivel 2',
      nivel_suporte: 'Nivel 2',
      birthDate: '2015-01-01'
    };
    setChildren([fallbackChild]);
    setSelectedPatient(fallbackChild);
  };

  const fetchConsultations = async (patientId) => {
    if (!patientId) return;
    try {
      const response = await apiClient.get(`/parent/patient/${patientId}/upcoming-appointments`);
      setConsultations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.warn('Erro ao buscar consultas, usando lista vazia.');
      setConsultations([]);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const response = await apiClient.get('/parent/professionals/list');
      const data = Array.isArray(response.data) ? response.data : [];
      const normalizedProfs = data.map((professional) => ({
        ...professional,
        specialty: professional.specialty || professional.especialidade || 'Especialista'
      }));
      setProfessionals(normalizedProfs);
    } catch (err) {
      console.warn('Erro ao buscar profissionais (pais).');
      setProfessionals([]);
    }
  };

  const fetchServices = async (filters) => {
    const hasLocation = filters.city || filters.region || filters.state;
    if (!hasLocation) {
      setServices([]);
      setServiceMeta({ total: 0, page: filters.page || 1, pageSize: filters.limit || 20 });
      return;
    }

    setServicesLoading(true);
    setServicesError('');
    try {
      const queryString = buildServiceSearchParams(filters);
      const response = await apiClient.get(`/parent/services/search?${queryString}`);
      const payload = response.data;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
          ? payload.results
          : [];

      const normalized = data.map(normalizeService);
      setServices(normalized);

      if (!Array.isArray(payload)) {
        setServiceMeta({
          total: payload?.total ?? normalized.length,
          page: payload?.page ?? filters.page ?? 1,
          pageSize: payload?.pageSize ?? filters.limit ?? 20
        });
      } else {
        setServiceMeta({
          total: normalized.length,
          page: filters.page ?? 1,
          pageSize: filters.limit ?? 20
        });
      }
    } catch (err) {
      console.warn('Erro ao buscar servicos.', err);
      setServices([]);
      setServiceMeta({ total: 0, page: filters.page || 1, pageSize: filters.limit || 20 });
      setServicesError('Nao foi possivel carregar servicos agora. Tente novamente.');
    } finally {
      setServicesLoading(false);
    }
  };

  const handleAddAppointment = async (event) => {
    event.preventDefault();
    if (!selectedPatient) return;

    try {
      const payload = {
        patientId: selectedPatient.id,
        professionalId: newAppointment.professionalId,
        appointment_date: newAppointment.appointment_date,
        appointment_time: newAppointment.appointment_time,
        appointment_type: newAppointment.appointment_type,
        status: 'Agendada',
        payment_method: newAppointment.payment_method,
        payment_details: newAppointment.payment_details,
        payment_status: 'Pendente',
        value: newAppointment.value,
        notes: newAppointment.notes
      };

      await apiClient.post('/appointments', payload);
      setSuccessMessage('Atendimento solicitado com sucesso!');
      setShowAppointmentModal(false);
      fetchConsultations(selectedPatient.id);

      setNewAppointment({
        professionalId: '',
        appointment_date: '',
        appointment_time: '',
        appointment_type: 'Consulta Regular',
        status: 'Agendada',
        payment_method: 'Pix',
        payment_details: '',
        payment_status: 'Pendente',
        value: '',
        notes: ''
      });

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Erro ao solicitar atendimento. Verifique a disponibilidade.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      const compact = window.innerWidth < 992;
      setIsCompactLayout(compact);
      if (!compact) {
        setShowMobileFilters(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
    setShowMobileFilters(false);
  }, [activeTab]);

  useEffect(() => {
    if (!user) return;

    if (user.tipo_usuario !== 'pais_responsavel') {
      navigate('/login');
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);
      setError('');
      await Promise.allSettled([fetchChildren(), fetchProfessionals()]);
      setLoading(false);
    };

    loadInitialData();
  }, [user, navigate]);

  useEffect(() => {
    if (serviceInitialized) return;
    if (!user && !selectedPatient) return;

    const defaults = getServiceDefaults();
    setServiceFilters(defaults);
    setServiceQuery(defaults);
    setServiceInitialized(true);
  }, [user, selectedPatient, serviceInitialized]);

  useEffect(() => {
    if (!serviceQuery) return;
    const hasLocation = serviceQuery.city || serviceQuery.region || serviceQuery.state;
    if (!hasLocation) return;
    fetchServices(serviceQuery);
  }, [serviceQuery]);

  useEffect(() => {
    if (!selectedPatient) return;

    fetchConsultations(selectedPatient.id);

    // TODO: substituir pelos indicadores clinicos reais quando o backend de evolucao estiver disponivel.
    setPatientProgressData({
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
      datasets: [
        {
          label: 'Comunicacao',
          data: [2, 3, 3.5, 4, 4.2],
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          pointBackgroundColor: '#2563EB',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Interacao social',
          data: [1.5, 2, 2.8, 3.5, 4],
          borderColor: '#06B6D4',
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          pointBackgroundColor: '#06B6D4',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Comportamento',
          data: [3, 3.2, 3.8, 4, 4.5],
          borderColor: '#16A34A',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          pointBackgroundColor: '#16A34A',
          fill: true,
          tension: 0.4
        }
      ]
    });
  }, [selectedPatient]);

  const sortedAppointments = [...consultations].sort(
    (first, second) => getAppointmentTimestamp(first) - getAppointmentTimestamp(second)
  );

  const nextAppointment = sortedAppointments[0] || null;
  const totalServicePages = Math.max(
    1,
    Math.ceil((serviceMeta.total || services.length) / (serviceMeta.pageSize || 1))
  );
  const currentPatientName = getPatientName(selectedPatient);
  const currentSupportLevel = getPatientSupportLevel(selectedPatient);
  const currentDiagnosis = getPatientDiagnosis(selectedPatient);
  const linkedPatientsLabel =
    children.length === 1 ? '1 paciente acompanhado' : `${children.length} pacientes acompanhados`;
  const hasServiceLocation =
    Boolean(serviceFilters.city) || Boolean(serviceFilters.region) || Boolean(serviceFilters.state);
  const previewServices = services.slice(0, 2);

  const activeSection = {
    overview: {
      breadcrumb: 'Dashboard dos Pais / Visao geral',
      title: 'Visao geral',
      subtitle: selectedPatient
        ? `Acompanhe o desenvolvimento, os atendimentos e os proximos passos de ${currentPatientName}.`
        : 'Acompanhe os principais indicadores da familia.'
    },
    appointments: {
      breadcrumb: 'Dashboard dos Pais / Atendimentos',
      title: 'Atendimentos',
      subtitle: 'Organize os proximos atendimentos, acompanhe status e solicite novos agendamentos.'
    },
    progress: {
      breadcrumb: 'Dashboard dos Pais / Evolucao',
      title: 'Evolucao',
      subtitle: 'Visualize a evolucao ao longo do tempo com foco em clareza e contexto.'
    },
    services: {
      breadcrumb: 'Dashboard dos Pais / Servicos & Rede TEA',
      title: 'Servicos & Rede TEA',
      subtitle: 'Encontre profissionais, clinicas e servicos especializados proximos a voce.'
    },
    account: {
      breadcrumb: 'Dashboard dos Pais / Conta',
      title: 'Conta',
      subtitle: 'Consulte os dados da conta responsavel e o panorama dos pacientes vinculados.'
    }
  }[activeTab] || {
    breadcrumb: 'Dashboard dos Pais',
    title: 'Visao geral',
    subtitle: 'Acompanhe os principais indicadores.'
  };

  const navigationGroups = [
    {
      label: 'Principal',
      items: [{ key: 'overview', label: 'Visao geral', icon: HouseDoor }]
    },
    {
      label: 'Acompanhamento',
      items: [
        {
          key: 'patient-link',
          label: 'Paciente',
          icon: BoxArrowUpRight,
          action: () => selectedPatient && handlePatientSelect(selectedPatient),
          disabled: !selectedPatient
        },
        { key: 'appointments', label: 'Atendimentos', icon: Calendar2Check },
        { key: 'progress', label: 'Evolucao', icon: GraphUp }
      ]
    },
    {
      label: 'Rede de apoio',
      items: [{ key: 'services', label: 'Servicos & Rede TEA', icon: GeoAlt }]
    },
    {
      label: 'Conta',
      items: [{ key: 'account', label: 'Configuracoes', icon: Gear }]
    }
  ];

  const renderSidebarNavItem = (item, mobile = false) => {
    const Icon = item.icon;
    const collapsed = isSidebarCollapsed && !mobile;
    const isActive = !item.action && activeTab === item.key;
    const className = `ac-parent-sidebar__item${isActive ? ' is-active' : ''}${item.disabled ? ' is-disabled' : ''}`;

    const handleClick = () => {
      if (item.disabled) return;
      if (item.action) {
        item.action();
        return;
      }
      setActiveTab(item.key);
    };

    const content = (
      <button
        type="button"
        className={className}
        onClick={handleClick}
        title={item.label}
        aria-current={isActive ? 'page' : undefined}
        aria-disabled={item.disabled ? 'true' : undefined}
        disabled={item.disabled}
      >
        <span className="ac-parent-sidebar__item-icon">
          <Icon />
        </span>
        <span className="ac-parent-sidebar__item-label">{item.label}</span>
        {item.action && !collapsed ? (
          <span className="ac-parent-sidebar__item-arrow">
            <ArrowRight />
          </span>
        ) : null}
      </button>
    );

    if (collapsed) {
      return (
        <OverlayTrigger
          key={item.key}
          placement="right"
          overlay={<Tooltip id={`parent-tooltip-${item.key}`}>{item.label}</Tooltip>}
        >
          {content}
        </OverlayTrigger>
      );
    }

    return <React.Fragment key={item.key}>{content}</React.Fragment>;
  };

  const renderSidebar = (mobile = false) => (
    <div className={`ac-parent-sidebar${isSidebarCollapsed && !mobile ? ' ac-parent-sidebar--collapsed' : ''}`}>
      <div className="ac-parent-sidebar__brand-block">
        <div className="ac-parent-sidebar__brand-row">
          <img src={logonovo} alt="AutisConnect" className="ac-parent-sidebar__logo" />
          {!mobile ? (
            <button
              type="button"
              className="ac-parent-sidebar__collapse"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            >
              {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </button>
          ) : null}
        </div>
        <div className="ac-parent-sidebar__brand-ribbon" />
      </div>

      <div className="ac-parent-sidebar__nav">
        {navigationGroups.map((group) => (
          <div className="ac-parent-sidebar__nav-group" key={group.label}>
            {!isSidebarCollapsed || mobile ? (
              <span className="ac-parent-sidebar__group-label">{group.label}</span>
            ) : null}
            <div className="ac-parent-sidebar__group-items">
              {group.items.map((item) => renderSidebarNavItem(item, mobile))}
            </div>
          </div>
        ))}
      </div>

      <div className="ac-parent-sidebar__footer">
        {!isSidebarCollapsed || mobile ? (
          <div className="ac-parent-sidebar__user">
            <div className="ac-parent-sidebar__user-avatar">
              {getInitials(user?.nome_completo || user?.username || 'Responsavel')}
            </div>
            <div>
              <strong>{user?.nome_completo || user?.username || 'Responsavel'}</strong>
              <span>{linkedPatientsLabel}</span>
            </div>
          </div>
        ) : (
          <div className="ac-parent-sidebar__user-avatar ac-parent-sidebar__user-avatar--solo">
            {getInitials(user?.nome_completo || user?.username || 'Responsavel')}
          </div>
        )}

        <button type="button" className="ac-parent-sidebar__logout" onClick={handleLogout}>
          <BoxArrowRight />
          {!isSidebarCollapsed || mobile ? <span>Sair</span> : null}
        </button>
      </div>
    </div>
  );

  const renderFeedback = () => {
    if (!successMessage && !error) return null;

    return (
      <div className="ac-parent-feedback-stack">
        {successMessage ? (
          <Alert
            variant="success"
            className="ac-parent-feedback"
            dismissible
            onClose={() => setSuccessMessage('')}
          >
            {successMessage}
          </Alert>
        ) : null}
        {error ? (
          <Alert
            variant="danger"
            className="ac-parent-feedback"
            dismissible
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        ) : null}
      </div>
    );
  };

  const renderPatientSelector = () => {
    if (!selectedPatient) return null;

    if (children.length <= 1) {
      return (
        <div className="ac-parent-patient-selector ac-parent-patient-selector--static">
          <span className="ac-parent-patient-selector__label">Paciente acompanhado</span>
          <div className="ac-parent-patient-selector__summary">
            <div className="ac-parent-patient-selector__avatar">
              {getInitials(currentPatientName)}
            </div>
            <div>
              <strong>{currentPatientName}</strong>
              <small>{currentSupportLevel}</small>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Dropdown align="end">
        <Dropdown.Toggle
          as="button"
          id="parent-patient-selector"
          className="ac-parent-patient-selector"
          type="button"
        >
          <span className="ac-parent-patient-selector__label">Acompanhando</span>
          <span className="ac-parent-patient-selector__summary">
            <span className="ac-parent-patient-selector__avatar">
              {getInitials(currentPatientName)}
            </span>
            <span>
              <strong>{currentPatientName}</strong>
              <small>{currentSupportLevel}</small>
            </span>
          </span>
          <ChevronDown />
        </Dropdown.Toggle>
        <Dropdown.Menu className="ac-parent-dropdown">
          {children.map((child) => {
            const childName = getPatientName(child);
            const childSupportLevel = getPatientSupportLevel(child);
            return (
              <Dropdown.Item
                as="button"
                key={child.id}
                className="ac-parent-dropdown__item"
                onClick={() => setSelectedPatient(child)}
              >
                <span className="ac-parent-dropdown__avatar">{getInitials(childName)}</span>
                <span className="ac-parent-dropdown__content">
                  <strong>{childName}</strong>
                  <small>{childSupportLevel}</small>
                </span>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const renderPatientHeroCard = () => (
    <Card className="ac-parent-card ac-parent-patient-card">
      <Card.Body>
        <div className="ac-parent-patient-card__top">
          <div className="ac-parent-patient-card__identity">
            <div className="ac-parent-patient-card__avatar">{getInitials(currentPatientName)}</div>
            <div>
              <span className="ac-parent-card__eyebrow">Paciente selecionado</span>
              <h3>{currentPatientName}</h3>
              <p>
                {formatAge(selectedPatient?.birthDate)} <span aria-hidden="true">•</span> {currentSupportLevel}
              </p>
            </div>
          </div>
          <span className="ac-parent-status ac-parent-status--neutral">{currentDiagnosis}</span>
        </div>

        <div className="ac-parent-patient-card__grid">
          <div className="ac-parent-patient-card__metric">
            <span>Diagnostico</span>
            <strong>{currentDiagnosis}</strong>
          </div>
          <div className="ac-parent-patient-card__metric">
            <span>Proximo atendimento</span>
            <strong>
              {nextAppointment
                ? `${formatDate(nextAppointment.date || nextAppointment.appointment_date)} as ${formatTime(
                    nextAppointment.time || nextAppointment.appointment_time
                  )}`
                : 'Sem atendimento agendado'}
            </strong>
          </div>
        </div>

        <div className="ac-parent-patient-card__actions">
          <Button
            onClick={() => selectedPatient && handlePatientSelect(selectedPatient)}
            disabled={!selectedPatient}
          >
            <BoxArrowUpRight className="me-2" />
            Abrir Dashboard do Paciente
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowAppointmentModal(true)}>
            <PlusCircle className="me-2" />
            Novo Atendimento
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  const renderOverview = () => (
    <div className="ac-parent-section-stack">
      <section className="ac-parent-overview-hero">
        {renderPatientHeroCard()}

        <Card className="ac-parent-card ac-parent-next-card">
          <Card.Body>
            <div className="ac-parent-card__header ac-parent-card__header--compact">
              <div>
                <span className="ac-parent-card__eyebrow">Proximo passo</span>
                <h3>Atendimento em destaque</h3>
              </div>
              <Calendar2Check />
            </div>

            {nextAppointment ? (
              <div className="ac-parent-next-card__content">
                <strong>{formatDate(nextAppointment.date || nextAppointment.appointment_date)}</strong>
                <p>
                  {formatTime(nextAppointment.time || nextAppointment.appointment_time)} com{' '}
                  {nextAppointment.professionalName || nextAppointment.professional_name || 'Profissional AutisConnect'}
                </p>
                <span className={`ac-parent-status ac-parent-status--${getAppointmentStatusMeta(nextAppointment.status).tone}`}>
                  {getAppointmentStatusMeta(nextAppointment.status).label}
                </span>
              </div>
            ) : (
              <EmptyState
                compact
                icon={Calendar2Check}
                title="Nenhum atendimento agendado"
                description="Voce pode solicitar um novo atendimento quando precisar."
                actionLabel="Novo Atendimento"
                onAction={() => setShowAppointmentModal(true)}
              />
            )}
          </Card.Body>
        </Card>
      </section>

      <section className="ac-parent-kpi-grid">
        <KpiCard
          icon={Calendar3}
          title="Idade"
          value={formatAge(selectedPatient?.birthDate)}
          caption="Com base na data de nascimento cadastrada"
          tone="primary"
        />
        <KpiCard
          icon={ShieldCheck}
          title="Nivel de suporte"
          value={currentSupportLevel}
          caption="Informacao principal para acompanhamento"
          tone="cyan"
        />
        <KpiCard
          icon={Calendar2Check}
          title="Atendimentos agendados"
          value={consultations.length}
          caption="Agenda futura vinculada a este paciente"
          tone="success"
        />
        <KpiCard
          icon={GraphUp}
          title="Proximo atendimento"
          value={
            nextAppointment
              ? `${formatDate(nextAppointment.date || nextAppointment.appointment_date)}`
              : 'Sem agenda'
          }
          caption={
            nextAppointment
              ? `${formatTime(nextAppointment.time || nextAppointment.appointment_time)}`
              : 'Sem horario previsto'
          }
          tone="warning"
        />
      </section>

      <section className="ac-parent-overview-grid">
        <Card className="ac-parent-card ac-parent-chart-card">
          <Card.Body>
            <div className="ac-parent-card__header">
              <div>
                <span className="ac-parent-card__eyebrow">Evolucao</span>
                <h3>Evolucao de {currentPatientName}</h3>
                <p>Acompanhe indicadores ao longo do tempo.</p>
              </div>
            </div>
            <div className="ac-parent-chart-shell">
              <Line data={patientProgressData} options={lineOptions} />
            </div>
            <div className="ac-parent-chart-note">
              Os indicadores atuais seguem a estrutura temporaria do frontend e devem ser conectados a dados clinicos reais quando o backend estiver disponivel.
            </div>
          </Card.Body>
        </Card>

        <div className="ac-parent-column-stack">
          <Card className="ac-parent-card">
            <Card.Body>
              <div className="ac-parent-card__header">
                <div>
                  <span className="ac-parent-card__eyebrow">Acoes rapidas</span>
                  <h3>O que voce precisa agora?</h3>
                </div>
              </div>
              <div className="ac-parent-actions">
                <button type="button" className="ac-parent-action-card" onClick={() => handlePatientSelect(selectedPatient)}>
                  <BoxArrowUpRight />
                  <div>
                    <strong>Abrir Dashboard</strong>
                    <span>Ver o acompanhamento completo</span>
                  </div>
                </button>
                <button type="button" className="ac-parent-action-card" onClick={() => setShowAppointmentModal(true)}>
                  <PlusCircle />
                  <div>
                    <strong>Novo Atendimento</strong>
                    <span>Solicitar atendimento com um profissional</span>
                  </div>
                </button>
                <button type="button" className="ac-parent-action-card" onClick={() => setActiveTab('services')}>
                  <GeoAlt />
                  <div>
                    <strong>Encontrar Servico</strong>
                    <span>Explorar a rede de apoio e servicos</span>
                  </div>
                </button>
              </div>
            </Card.Body>
          </Card>

          <Card className="ac-parent-card">
            <Card.Body>
              <div className="ac-parent-card__header">
                <div>
                  <span className="ac-parent-card__eyebrow">Informacoes basicas</span>
                  <h3>Informacoes do paciente</h3>
                </div>
              </div>
              <div className="ac-parent-info-list">
                <InfoRow label="Diagnostico" value={currentDiagnosis} />
                <InfoRow label="Nascimento" value={formatDate(selectedPatient?.birthDate)} />
                <InfoRow label="Idade" value={formatAge(selectedPatient?.birthDate)} />
                <InfoRow label="Telefone" value={getPatientPhone(selectedPatient)} />
                <InfoRow label="E-mail" value={getPatientEmail(selectedPatient)} />
                <InfoRow label="Nivel de suporte" value={currentSupportLevel} />
              </div>
            </Card.Body>
          </Card>
        </div>
      </section>

      <section className="ac-parent-overview-grid">
        <Card className="ac-parent-card">
          <Card.Body>
            <div className="ac-parent-card__header">
              <div>
                <span className="ac-parent-card__eyebrow">Atendimentos</span>
                <h3>Proximos Atendimentos</h3>
                <p>Veja rapidamente os compromissos mais proximos.</p>
              </div>
              <Button variant="outline-secondary" onClick={() => setActiveTab('appointments')}>
                Ver agenda completa
              </Button>
            </div>

            {sortedAppointments.length ? (
              <div className="ac-parent-appointments-list ac-parent-appointments-list--compact">
                {sortedAppointments.slice(0, 3).map((appointment) => {
                  const statusMeta = getAppointmentStatusMeta(appointment.status);
                  const dateParts = formatDayMonth(appointment.date || appointment.appointment_date);
                  return (
                    <article
                      className="ac-parent-appointment-card ac-parent-appointment-card--compact"
                      key={appointment.id || `${appointment.appointment_date}-${appointment.appointment_time}`}
                    >
                      <div className="ac-parent-appointment-card__date">
                        <strong>{dateParts.day}</strong>
                        <span>{dateParts.month}</span>
                      </div>
                      <div className="ac-parent-appointment-card__content">
                        <div className="ac-parent-appointment-card__meta">
                          <span>{formatTime(appointment.time || appointment.appointment_time)}</span>
                          <span>{appointment.professionalName || appointment.professional_name || 'Profissional'}</span>
                        </div>
                        <strong>{getAppointmentTypeLabel(appointment.appointment_type)}</strong>
                      </div>
                      <span className={`ac-parent-status ac-parent-status--${statusMeta.tone}`}>
                        {statusMeta.label}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                compact
                icon={Calendar2Check}
                title="Nenhum atendimento agendado"
                description="Voce pode solicitar um novo atendimento quando precisar."
                actionLabel="Novo Atendimento"
                onAction={() => setShowAppointmentModal(true)}
              />
            )}
          </Card.Body>
        </Card>

        <Card className="ac-parent-card">
          <Card.Body>
            <div className="ac-parent-card__header">
              <div>
                <span className="ac-parent-card__eyebrow">Rede de apoio</span>
                <h3>Servicos & Rede TEA</h3>
                <p>Encontre profissionais, clinicas e servicos especializados proximos a voce.</p>
              </div>
              <Button variant="outline-secondary" onClick={() => setActiveTab('services')}>
                Ir para servicos
              </Button>
            </div>

            {servicesLoading ? (
              <div className="ac-parent-inline-loader">
                <div className="ac-parent-loader" />
                <span>Carregando servicos...</span>
              </div>
            ) : previewServices.length ? (
              <div className="ac-parent-service-preview-list">
                {previewServices.map((service) => (
                  <div className="ac-parent-service-preview" key={service.id || service.name}>
                    <div>
                      <strong>{service.name}</strong>
                      <span>
                        {[service.neighborhood, [service.city, service.state].filter(Boolean).join('/')].filter(Boolean).join(' - ') ||
                          'Localizacao nao informada'}
                      </span>
                    </div>
                    <Button variant="outline-secondary" size="sm" onClick={() => openServiceDetails(service.id)}>
                      Ver detalhes
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={GeoAlt}
                title="Sua rede de apoio aparece aqui"
                description={
                  hasServiceLocation
                    ? 'Explore a aba de servicos para refinar filtros e descobrir opcoes proximas.'
                    : 'Defina cidade ou estado na busca para localizar servicos especializados.'
                }
                actionLabel="Encontrar Servicos"
                onAction={() => setActiveTab('services')}
              />
            )}
          </Card.Body>
        </Card>
      </section>
    </div>
  );

  const renderAppointments = () => (
    <section className="ac-parent-section-stack">
      <div className="ac-parent-section-heading">
        <div>
          <span className="ac-parent-section-heading__eyebrow">Agenda</span>
          <h2>Proximos Atendimentos</h2>
        </div>
        <Button onClick={() => setShowAppointmentModal(true)}>
          <PlusCircle className="me-2" />
          Novo Atendimento
        </Button>
      </div>

      {sortedAppointments.length ? (
        <div className="ac-parent-appointments-list">
          {sortedAppointments.map((appointment) => {
            const statusMeta = getAppointmentStatusMeta(appointment.status);
            const dateParts = formatDayMonth(appointment.date || appointment.appointment_date);
            return (
              <Card
                className="ac-parent-card ac-parent-appointment-card"
                key={appointment.id || `${appointment.appointment_date}-${appointment.appointment_time}`}
              >
                <Card.Body>
                  <div className="ac-parent-appointment-card__date">
                    <strong>{dateParts.day}</strong>
                    <span>{dateParts.month}</span>
                  </div>
                  <div className="ac-parent-appointment-card__content">
                    <div className="ac-parent-appointment-card__meta">
                      <span>{formatTime(appointment.time || appointment.appointment_time)}</span>
                      <span>{appointment.professionalName || appointment.professional_name || 'Profissional AutisConnect'}</span>
                    </div>
                    <strong>{getAppointmentTypeLabel(appointment.appointment_type)}</strong>
                    <p>{formatDate(appointment.date || appointment.appointment_date)}</p>
                  </div>
                  <span className={`ac-parent-status ac-parent-status--${statusMeta.tone}`}>
                    {statusMeta.label}
                  </span>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="ac-parent-card">
          <Card.Body>
            <EmptyState
              icon={Calendar2Check}
              title="Nenhum atendimento agendado"
              description="Voce pode solicitar um novo atendimento quando precisar."
              actionLabel="Novo Atendimento"
              onAction={() => setShowAppointmentModal(true)}
            />
          </Card.Body>
        </Card>
      )}
    </section>
  );

  const renderServicesFilterFields = () => (
    <div className="ac-parent-filter-panel__fields">
      <div className="ac-parent-filter-group">
        <span className="ac-parent-filter-group__title">Tipo de servico</span>
        <div className="ac-parent-chip-grid">
          {SERVICE_TYPE_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`ac-parent-chip${serviceFilters.types.includes(option.value) ? ' is-selected' : ''}`}
              onClick={() => toggleServiceFilterValue('types', option.value)}
              aria-pressed={serviceFilters.types.includes(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ac-parent-filter-group">
        <span className="ac-parent-filter-group__title">Nivel de suporte</span>
        <div className="ac-parent-chip-grid">
          {SERVICE_SUPPORT_LEVEL_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`ac-parent-chip${serviceFilters.supportLevels.includes(option.value) ? ' is-selected' : ''}`}
              onClick={() => toggleServiceFilterValue('supportLevels', option.value)}
              aria-pressed={serviceFilters.supportLevels.includes(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ac-parent-filter-grid">
        <Form.Group>
          <Form.Label>Regiao</Form.Label>
          <Form.Control
            type="text"
            value={serviceFilters.region}
            onChange={(event) => updateServiceFilter('region', event.target.value)}
            placeholder="Regiao"
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Modalidade</Form.Label>
          <Form.Select
            value={serviceFilters.modality}
            onChange={(event) => updateServiceFilter('modality', event.target.value)}
          >
            <option value="">Todas</option>
            {SERVICE_MODALITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group>
          <Form.Label>Faixa etaria</Form.Label>
          <Form.Select
            value={serviceFilters.ageRange}
            onChange={(event) => updateServiceFilter('ageRange', event.target.value)}
          >
            <option value="">Todas</option>
            {SERVICE_AGE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group>
          <Form.Label>Cobertura</Form.Label>
          <Form.Select
            value={serviceFilters.coverage}
            onChange={(event) => updateServiceFilter('coverage', event.target.value)}
          >
            <option value="">Todas</option>
            {SERVICE_COVERAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </div>

      <div className="ac-parent-filter-panel__actions">
        <Button type="submit">Aplicar filtros</Button>
        <Button type="button" variant="outline-secondary" onClick={handleServiceClear}>
          Limpar filtros
        </Button>
      </div>
    </div>
  );

  const renderServices = () => (
    <section className="ac-parent-section-stack">
      <div className="ac-parent-section-heading">
        <div>
          <span className="ac-parent-section-heading__eyebrow">Rede de apoio</span>
          <h2>Servicos & Rede TEA</h2>
          <p>Encontre profissionais, clinicas e servicos especializados proximos a voce.</p>
        </div>
      </div>

      <Card className="ac-parent-card ac-parent-services-search">
        <Card.Body>
          <Form onSubmit={handleServiceSearch}>
            <div className="ac-parent-services-search__grid">
              <Form.Group className="ac-parent-search-field">
                <Form.Label>Busque por servico, especialidade ou nome</Form.Label>
                <div className="ac-parent-search-field__control">
                  <Search className="ac-parent-search-field__icon" />
                  <Form.Control
                    type="text"
                    placeholder="Ex: ABA, clinica, terapia"
                    value={serviceFilters.search}
                    onChange={(event) => updateServiceFilter('search', event.target.value)}
                  />
                </div>
              </Form.Group>

              <Form.Group>
                <Form.Label>Cidade</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Cidade"
                  value={serviceFilters.city}
                  onChange={(event) => updateServiceFilter('city', event.target.value)}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="UF"
                  value={serviceFilters.state}
                  onChange={(event) => updateServiceFilter('state', event.target.value.toUpperCase())}
                  maxLength={2}
                />
              </Form.Group>

              <div className="ac-parent-services-search__actions">
                <Button type="submit">
                  <Search className="me-2" />
                  Buscar
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => {
                    if (isCompactLayout) {
                      setShowMobileFilters(true);
                    } else {
                      setShowServiceFilters((current) => !current);
                    }
                  }}
                >
                  <Sliders className="me-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </Form>

          <div className="ac-parent-location-row">
            <div>
              <strong>Onde voce procura?</strong>
              <p>Cidade e estado sao os filtros principais. Regiao fica disponivel nos filtros avancados.</p>
            </div>
            <div className="ac-parent-location-row__actions">
              <Button type="button" variant="outline-secondary" onClick={handleUseMyLocation}>
                <GeoAlt className="me-2" />
                Usar minha localizacao
              </Button>
              {serviceGeoStatus ? <small>{serviceGeoStatus}</small> : null}
            </div>
          </div>
        </Card.Body>
      </Card>

      {!isCompactLayout && showServiceFilters ? (
        <Card className="ac-parent-card ac-parent-filter-panel">
          <Card.Body>
            <Form onSubmit={handleServiceSearch}>{renderServicesFilterFields()}</Form>
          </Card.Body>
        </Card>
      ) : null}

      <Card className="ac-parent-card ac-parent-services-results">
        <Card.Body>
          <div className="ac-parent-results-toolbar">
            <div>
              <span className="ac-parent-results-toolbar__count">
                {servicesLoading
                  ? 'Carregando servicos...'
                  : `${serviceMeta.total || services.length} servicos encontrados`}
              </span>
            </div>
            <Form.Group className="ac-parent-sort-select">
              <Form.Label>Ordenar por</Form.Label>
              <Form.Select
                value={serviceFilters.sort}
                onChange={(event) => handleServiceSortChange(event.target.value)}
              >
                <option value="relevance">Relevancia</option>
                <option value="rating">Avaliacao</option>
                <option value="distance">Distancia</option>
                <option value="recent">Mais recente</option>
              </Form.Select>
            </Form.Group>
          </div>

          {servicesError ? (
            <div className="ac-parent-state-box ac-parent-state-box--warning">
              <strong>Busca indisponivel no momento</strong>
              <p>{servicesError}</p>
            </div>
          ) : null}

          {servicesLoading ? (
            <div className="ac-parent-inline-loader ac-parent-inline-loader--large">
              <div className="ac-parent-loader" />
              <span>Carregando servicos...</span>
            </div>
          ) : services.length ? (
            <div className="ac-parent-service-grid">
              {services.map((service) => {
                const locationText = [
                  service.neighborhood,
                  [service.city, service.state].filter(Boolean).join('/')
                ]
                  .filter(Boolean)
                  .join(' - ');

                const specialties = service.specialties?.length ? service.specialties.slice(0, 3) : [];

                return (
                  <article className="ac-parent-service-card" key={service.id || service.name}>
                    <div className="ac-parent-service-card__header">
                      <div>
                        <h3>{service.name}</h3>
                        <p>{locationText || 'Localizacao nao informada'}</p>
                      </div>
                      {service.distanceKm !== null && service.distanceKm !== undefined ? (
                        <span className="ac-parent-distance-pill">{Number(service.distanceKm).toFixed(1)} km</span>
                      ) : null}
                    </div>

                    <div className="ac-parent-service-card__chips">
                      {specialties.length ? (
                        specialties.map((specialty) => (
                          <span className="ac-parent-chip ac-parent-chip--static" key={specialty}>
                            {specialty}
                          </span>
                        ))
                      ) : (
                        <span className="ac-parent-chip ac-parent-chip--static">Especialidades diversas</span>
                      )}
                    </div>

                    <div className="ac-parent-service-card__rating">
                      {service.rating > 0 ? (
                        <>
                          <StarFill />
                          <strong>{service.rating.toFixed(1)}</strong>
                          <span>({service.ratingCount || 0})</span>
                        </>
                      ) : (
                        <span>Sem avaliacoes</span>
                      )}
                    </div>

                    <div className="ac-parent-service-card__footer">
                      <Button variant="outline-secondary" onClick={() => openServiceDetails(service.id)}>
                        Ver detalhes
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={GeoAlt}
              title="Nenhum servico encontrado"
              description={
                hasServiceLocation
                  ? 'Tente ajustar a localizacao ou os filtros.'
                  : 'Defina pelo menos cidade, regiao ou estado para iniciar a busca.'
              }
              actionLabel="Limpar filtros"
              onAction={handleServiceClear}
            />
          )}

          {totalServicePages > 1 ? (
            <div className="ac-parent-pagination">
              <Button
                variant="outline-secondary"
                disabled={serviceMeta.page <= 1}
                onClick={() => handleServicePageChange(serviceMeta.page - 1)}
              >
                ‹ Anterior
              </Button>
              <span>
                Pagina {serviceMeta.page} de {totalServicePages}
              </span>
              <Button
                variant="outline-secondary"
                disabled={serviceMeta.page >= totalServicePages}
                onClick={() => handleServicePageChange(serviceMeta.page + 1)}
              >
                Proxima ›
              </Button>
            </div>
          ) : null}
        </Card.Body>
      </Card>
    </section>
  );

  const renderProgress = () => (
    <section className="ac-parent-section-stack">
      <Card className="ac-parent-card ac-parent-chart-card">
        <Card.Body>
          <div className="ac-parent-card__header">
            <div>
              <span className="ac-parent-card__eyebrow">Evolucao</span>
              <h3>Evolucao de {currentPatientName}</h3>
              <p>Acompanhe indicadores ao longo do tempo.</p>
            </div>
          </div>
          <div className="ac-parent-chart-shell ac-parent-chart-shell--tall">
            <Line data={patientProgressData} options={lineOptions} />
          </div>
          <div className="ac-parent-progress-summary">
            {patientProgressData.datasets.map((dataset) => (
              <div className="ac-parent-progress-summary__item" key={dataset.label}>
                <span>{dataset.label}</span>
                <strong>{dataset.data?.[dataset.data.length - 1] ?? 'N/A'}</strong>
              </div>
            ))}
          </div>
          <div className="ac-parent-chart-note">
            Os dados desta visao mantem a estrutura temporaria atual do frontend e devem ser substituidos por indicadores reais quando a integracao clinica estiver disponivel.
          </div>
        </Card.Body>
      </Card>
    </section>
  );

  const renderAccount = () => (
    <section className="ac-parent-section-stack">
      <section className="ac-parent-overview-grid">
        <Card className="ac-parent-card">
          <Card.Body>
            <div className="ac-parent-card__header">
              <div>
                <span className="ac-parent-card__eyebrow">Conta responsavel</span>
                <h3>{user?.nome_completo || user?.username || 'Responsavel'}</h3>
                <p>Dados exibidos apenas para consulta rapida.</p>
              </div>
            </div>
            <div className="ac-parent-info-list">
              <InfoRow label="Nome" value={user?.nome_completo || user?.username || 'Nao informado'} />
              <InfoRow label="E-mail" value={user?.email || 'Nao informado'} />
              <InfoRow label="Telefone" value={user?.telefone || user?.phone || 'Nao informado'} />
              <InfoRow
                label="Localizacao"
                value={[user?.cidade || user?.city, user?.estado || user?.uf || user?.state]
                  .filter(Boolean)
                  .join(' / ') || 'Nao informada'}
              />
            </div>
          </Card.Body>
        </Card>

        <Card className="ac-parent-card">
          <Card.Body>
            <div className="ac-parent-card__header">
              <div>
                <span className="ac-parent-card__eyebrow">Familia</span>
                <h3>Pacientes vinculados</h3>
                <p>Resumo rapido dos pacientes associados a esta conta.</p>
              </div>
            </div>
            <div className="ac-parent-linked-list">
              {children.map((child) => (
                <div className="ac-parent-linked-item" key={child.id}>
                  <div className="ac-parent-linked-item__avatar">{getInitials(getPatientName(child))}</div>
                  <div>
                    <strong>{getPatientName(child)}</strong>
                    <span>{getPatientSupportLevel(child)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </section>

      <Card className="ac-parent-card">
        <Card.Body className="ac-parent-account-actions">
          <div>
            <span className="ac-parent-card__eyebrow">Seguranca</span>
            <h3>Encerrar sessao com seguranca</h3>
            <p>Use esta opcao quando terminar o acompanhamento.</p>
          </div>
          <Button variant="outline-secondary" onClick={handleLogout}>
            <BoxArrowRight className="me-2" />
            Sair
          </Button>
        </Card.Body>
      </Card>
    </section>
  );

  const renderActiveContent = () => {
    if (!selectedPatient) {
      return (
        <Card className="ac-parent-card">
          <Card.Body>
            <EmptyState
              icon={PersonCircle}
              title="Nenhum paciente vinculado"
              description="Nao encontramos pacientes associados a esta conta no momento."
            />
          </Card.Body>
        </Card>
      );
    }

    switch (activeTab) {
      case 'appointments':
        return renderAppointments();
      case 'progress':
        return renderProgress();
      case 'services':
        return renderServices();
      case 'account':
        return renderAccount();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return <LoadingShell />;
  }

  return (
    <div className={`ac-parent-dashboard${isSidebarCollapsed ? ' ac-parent-dashboard--collapsed' : ''}`}>
      <aside className="ac-parent-sidebar-shell">{renderSidebar()}</aside>

      <Offcanvas
        show={isMobileSidebarOpen}
        onHide={() => setIsMobileSidebarOpen(false)}
        placement="start"
        className="ac-parent-offcanvas"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title>AutisConnect</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>{renderSidebar(true)}</Offcanvas.Body>
      </Offcanvas>

      <Offcanvas
        show={showMobileFilters}
        onHide={() => setShowMobileFilters(false)}
        placement="end"
        className="ac-parent-filter-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Filtros da Rede TEA</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleServiceSearch}>{renderServicesFilterFields()}</Form>
        </Offcanvas.Body>
      </Offcanvas>

      <div className="ac-parent-shell">
        <header className="ac-parent-header">
          <div className="ac-parent-header__context">
            <button
              type="button"
              className="ac-parent-header__menu-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <List />
            </button>
            <div>
              <span className="ac-parent-header__breadcrumb">{activeSection.breadcrumb}</span>
              <h1>{activeSection.title}</h1>
            </div>
          </div>

          <div className="ac-parent-header__actions">
            <button
              type="button"
              className="ac-parent-icon-button"
              onClick={() => setActiveTab('appointments')}
              aria-label="Abrir atendimentos"
            >
              <Calendar2Check />
              {consultations.length ? (
                <span className="ac-parent-icon-button__badge">{consultations.length}</span>
              ) : null}
            </button>

            <Dropdown align="end">
              <Dropdown.Toggle variant="light" className="ac-parent-profile-toggle">
                <span className="ac-parent-profile-toggle__avatar">
                  <PersonCircle />
                </span>
                <span className="ac-parent-profile-toggle__content">
                  <strong>{user?.nome_completo || user?.username || 'Responsavel'}</strong>
                  <small>{linkedPatientsLabel}</small>
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="ac-parent-dropdown">
                <Dropdown.Header>{user?.nome_completo || user?.username || 'Responsavel'}</Dropdown.Header>
                <Dropdown.Item as="button" onClick={() => setActiveTab('account')}>
                  <Gear className="me-2" />
                  Minha conta
                </Dropdown.Item>
                <Dropdown.Item as="button" onClick={handleLogout}>
                  <BoxArrowRight className="me-2" />
                  Sair
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>

        <main className="ac-parent-main">
          {renderFeedback()}

          <section className="ac-parent-page-header">
            <div className="ac-parent-page-header__copy">
              <span className="ac-parent-page-header__eyebrow">AutisConnect Family Care</span>
              <h2>
                Ola, {user?.nome_completo || user?.username || 'Responsavel'}
              </h2>
              <p>{activeSection.subtitle}</p>
            </div>
            <div className="ac-parent-page-header__selector">{renderPatientSelector()}</div>
          </section>

          {renderActiveContent()}
        </main>
      </div>

      <Modal
        show={showAppointmentModal}
        onHide={() => setShowAppointmentModal(false)}
        size="lg"
        centered
        className="ac-parent-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="ac-parent-modal__eyebrow">Novo Atendimento</span>
            <strong>Novo Atendimento</strong>
            <small>Escolha o profissional e os detalhes do atendimento.</small>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddAppointment}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Profissional *</Form.Label>
              <Form.Select
                value={newAppointment.professionalId}
                onChange={(event) =>
                  setNewAppointment({ ...newAppointment, professionalId: event.target.value })
                }
                required
              >
                <option value="">Selecione um profissional</option>
                {professionals.length > 0 ? (
                  professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name} - {professional.specialty}
                    </option>
                  ))
                ) : (
                  <option disabled>Nenhum profissional disponivel</option>
                )}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data *</Form.Label>
                  <Form.Control
                    type="date"
                    value={newAppointment.appointment_date}
                    onChange={(event) =>
                      setNewAppointment({ ...newAppointment, appointment_date: event.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Horario *</Form.Label>
                  <Form.Control
                    type="time"
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
                <Form.Group className="mb-3">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select
                    value={newAppointment.appointment_type}
                    onChange={(event) =>
                      setNewAppointment({ ...newAppointment, appointment_type: event.target.value })
                    }
                  >
                    {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor estimado (R$) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={newAppointment.value}
                    onChange={(event) =>
                      setNewAppointment({ ...newAppointment, value: event.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Forma de pagamento</Form.Label>
              <Form.Select
                value={newAppointment.payment_method}
                onChange={(event) =>
                  setNewAppointment({ ...newAppointment, payment_method: event.target.value })
                }
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Label>Observacoes</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newAppointment.notes}
                onChange={(event) =>
                  setNewAppointment({ ...newAppointment, notes: event.target.value })
                }
                placeholder="Descreva detalhes importantes para este atendimento"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowAppointmentModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">Solicitar atendimento</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default ParentDashboard;
