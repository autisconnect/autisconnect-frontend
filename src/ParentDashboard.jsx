import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Navbar, Card, Row, Col, Spinner, Alert, Badge, 
  Nav, Tab, Button, Table, Form, Modal 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';
import logohori from './assets/logo.png';
import './App.css';

// Graficos - Importacao correta conforme ProfessionalDashboard
import { Line, Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
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
} from 'chart.js';

// Registro de componentes do Chart.js
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

// Icones
import { Calendar3, Person, GraphUp, PlusCircle, Calendar2Check, BoxArrowUpRight, Controller, People, GeoAlt, Search, StarFill } from 'react-bootstrap-icons';

// Card de Estatistica
const StatCard = ({ title, value, subtitle, icon, color }) => (
  <Card className="text-center mb-3 shadow-sm h-100 border-0">
    <Card.Body>
      <div className={`bg-${color} bg-opacity-10 p-3 rounded-circle d-inline-block mb-3`}>
        {React.cloneElement(icon, { className: `text-${color}`, size: 24 })}
      </div>
      <h6 className="text-muted mb-1">{title}</h6>
      <h3 className="fw-bold mb-1">{value || 'N/A'}</h3>
      <small className="text-muted">{subtitle || ' '}</small>
    </Card.Body>
  </Card>
);

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

const SERVICE_TYPE_LABELS = SERVICE_TYPE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

function ParentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Estado para multiplos filhos e o selecionado
  const [children, setChildren] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Estados para Agendamento
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

  // Estado para dados do grafico
  const [patientProgressData, setPatientProgressData] = useState({
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
    datasets: []
  });

  // Estados para Servicos & Rede TEA
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [services, setServices] = useState([]);
  const [serviceFilters, setServiceFilters] = useState(() => buildBaseServiceFilters());
  const [serviceQuery, setServiceQuery] = useState(() => buildBaseServiceFilters());
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const [serviceMeta, setServiceMeta] = useState({ total: 0, page: 1, pageSize: 20 });
  const [serviceGeoStatus, setServiceGeoStatus] = useState('');

  // Logica de navegacao sincronizada com ProfessionalDashboard
  const handlePatientSelect = (patient) => {
    try {
        // Usa o mesmo paciente selecionado no dashboard
        const patientId = patient.id;
        if (!patientId) {
          setError('Paciente invalido selecionado.');
          return;
        }
        console.log('Abrindo dashboard para o paciente ID:', patientId);
        
        // Abre em uma nova aba exatamente como no ProfessionalDashboard
        // Usando a rota padrao de detalhes do paciente
        window.open(`/patient-details-parent/${patientId}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
        console.error('Erro ao abrir dashboard do paciente:', err);
        setError('Erro ao abrir detalhes do paciente.');
    }
  };

  const formatAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return `${age} anos`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString) => {
    return timeString ? timeString.substring(0, 5) : 'N/A';
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
    const hasLocation =
      serviceFilters.city || serviceFilters.region || serviceFilters.state;
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
      const hasCoords = parseCoordinate(serviceFilters.lat) !== null && parseCoordinate(serviceFilters.lng) !== null;
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
    const resolvedId = serviceId || 18;
    window.open(`/service-dashboard/${resolvedId}`, '_blank', 'noopener,noreferrer');
  };

  // Opcoes de graficos
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top' },
    },
    scales: {
        y: {
            beginAtZero: true,
            max: 5,
            title: { display: true, text: 'Nível (1-5)' }
        }
    }
  };

  // Funcoes de API sincronizadas com o padrao do ProfessionalDashboard
  const fetchChildren = async () => {
    if (!user) return;
    
    // No backend atual, a rota suportada para pais e /parent/my-children
    const routes = ['/parent/my-children'];
    
    for (const route of routes) {
      try {
        const response = await apiClient.get(route);
        const data = Array.isArray(response.data) ? response.data : [];
        if (data.length > 0) {
          const normalizedData = data.map(child => ({
            ...child,
            id: child.id || 16,
            name: child.name || child.nome_completo || 'teste01',
            diagnosis: child.diagnosis || child.diagnostico || 'Nível 2',
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

    // Fallback local quando não houver retorno das rotas de parent
    // Fallback final local
    const fallbackChild = {
      id: 16,
      name: 'teste01',
      diagnosis: 'Nível 2',
      nivel_suporte: 'Nível 2',
      birthDate: '2015-01-01'
    };
    setChildren([fallbackChild]);
    setSelectedPatient(fallbackChild);
  };

  const fetchConsultations = async (patientId) => {
    if (!patientId) return;
    try {
      // Para pais, a rota permitida e /parent/patient/:patientId/upcoming-appointments
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
      const normalizedProfs = data.map(p => ({
        ...p,
        specialty: p.specialty || p.especialidade || 'Especialista'
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

  const handleAddAppointment = async (e) => {
    e.preventDefault();
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
      setSuccessMessage('Consulta solicitada com sucesso!');
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
      setError('Erro ao agendar consulta. Verifique a disponibilidade.');
    }
  };
  useEffect(() => {
    if (!user) return;

    if (user.tipo_usuario !== 'pais_responsavel') {
      navigate('/login');
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);
      await Promise.allSettled([
        fetchChildren(),
        fetchProfessionals()
      ]);
      setLoading(false);
    };

    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const hasLocation =
      serviceQuery.city || serviceQuery.region || serviceQuery.state;
    if (!hasLocation) return;
    fetchServices(serviceQuery);
  }, [serviceQuery]);
  useEffect(() => {
    if (selectedPatient) {
      fetchConsultations(selectedPatient.id);
      
      setPatientProgressData({
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
        datasets: [
          {
            label: 'Comunicação',
            data: [2, 3, 3.5, 4, 4.2],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Interação Social',
            data: [1.5, 2, 2.8, 3.5, 4],
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Comportamento',
            data: [3, 3.2, 3.8, 4, 4.5],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            tension: 0.4
          }
        ]
      });
    }
  }, [selectedPatient]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalServicePages = Math.max(
    1,
    Math.ceil((serviceMeta.total || services.length) / (serviceMeta.pageSize || 1))
  );

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando dashboard do paciente...</p>
      </Container>
    );
  }

  return (
    <div className="App bg-light min-vh-100">
      <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm py-3">
        <Container>
          <Navbar.Brand>
            <img src={logohori} alt="Logo" className="logo" style={{ height: '40px' }} />
          </Navbar.Brand>
          <Navbar.Text className="mx-auto d-none d-lg-block fw-light">
            Dashboard dos Pais: <strong className="fw-semibold text-primary">{user.nome_completo || user.username || 'Responsavel'}</strong>
          </Navbar.Text>
          <Button variant="outline-danger" size="sm" onClick={handleLogout}>Sair</Button>
        </Container>
      </Navbar>

      <main style={{ marginTop: '100px', paddingBottom: '50px' }}>
        <Container>
          {successMessage && <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>{successMessage}</Alert>}
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          <Row className="mb-4 align-items-center">
            <Col>
              <h2 className="fw-bold mb-0">Visão Geral</h2>
              <p className="text-muted mb-0">Acompanhe o desenvolvimento de seus filhos</p>
            </Col>
            <Col xs="auto" className="d-flex gap-2">
              {children.length > 1 && (
                <Form.Select 
                  className="border-0 shadow-sm" 
                  value={selectedPatient.id} 
                  onChange={(e) => setSelectedPatient(children.find(c => c.id === parseInt(e.target.value)))}
                >
                  {children.map(child => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </Form.Select>
              )}
              <Button variant="primary" onClick={() => handlePatientSelect(selectedPatient)} className="d-flex align-items-center text-nowrap">
                <BoxArrowUpRight className="me-2" /> Dashboard do Paciente
              </Button>
            </Col>
          </Row>

          {selectedPatient ? (
            <>
              <Row className="mb-4">
                <Col md={3}>
                  <StatCard title="Paciente" value={selectedPatient.name} icon={<People />} color="primary" />
                </Col>
                <Col md={3}>
                  <StatCard title="Nível de Suporte" value={selectedPatient.nivel_suporte || 'Nível 2'} icon={<GraphUp />} color="warning" />
                </Col>
                <Col md={3}>
                  <StatCard title="Consultas" value={consultations.length} icon={<Calendar2Check />} color="success" />
                </Col>
                <Col md={3}>
                  <StatCard title="Idade" value={formatAge(selectedPatient.birthDate)} icon={<Calendar3 />} color="info" />
                </Col>
              </Row>

              <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-white border-0 pt-3">
                    <Nav variant="pills" className="nav-pills-custom">
                      <Nav.Item><Nav.Link eventKey="overview" className="px-4">Resumo</Nav.Link></Nav.Item>
                      <Nav.Item><Nav.Link eventKey="appointments" className="px-4">Consultas</Nav.Link></Nav.Item>
                      <Nav.Item><Nav.Link eventKey="games" className="px-4">Games <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.6rem' }}>em breve</Badge></Nav.Link></Nav.Item>
                      <Nav.Item><Nav.Link eventKey="services" className="px-4">Servicos & Rede TEA</Nav.Link></Nav.Item>
                    </Nav>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Tab.Content>
                      <Tab.Pane eventKey="overview">
                        <Row>
                          <Col lg={8}>
                            <Card className="border-0 bg-light mb-4">
                              <Card.Body>
                                <h5 className="fw-bold mb-4">Progresso de {selectedPatient.name}</h5>
                                <div style={{ height: '300px' }}>
                                  <Line data={patientProgressData} options={lineOptions} />
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col lg={4}>
                            <Card className="border-0 bg-light mb-4">
                              <Card.Body>
                                <h5 className="fw-bold mb-4">Informações</h5>
                                <Table borderless size="sm" className="mb-0">
                                  <tbody>
                                    <tr><td className="text-muted py-2">Diagnóstico:</td><td className="fw-bold py-2 text-end"><Badge bg="warning" text="dark">{selectedPatient.diagnosis}</Badge></td></tr>
                                    <tr><td className="text-muted py-2">Nascimento:</td><td className="fw-bold py-2 text-end">{formatDate(selectedPatient.birthDate)}</td></tr>
                                    <tr><td className="text-muted py-2">Telefone:</td><td className="fw-bold py-2 text-end">{selectedPatient.phone || selectedPatient.telefone || '(11) 99999-9999'}</td></tr>
                                    <tr><td className="text-muted py-2">Email:</td><td className="fw-bold py-2 text-end">{selectedPatient.email || 'N/A'}</td></tr>
                                  </tbody>
                                </Table>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </Tab.Pane>

                      <Tab.Pane eventKey="appointments">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="fw-bold mb-0">Proximas Consultas</h5>
                          <Button variant="primary" size="sm" onClick={() => setShowAppointmentModal(true)}>
                            <PlusCircle className="me-2" /> Nova Consulta
                          </Button>
                        </div>
                        {consultations.length > 0 ? (
                          <Table hover responsive className="align-middle">
                            <thead className="bg-light">
                              <tr>
                                <th className="border-0">Data</th>
                                <th className="border-0">Hora</th>
                                <th className="border-0">Profissional</th>
                                <th className="border-0">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {consultations.map(appointment => (
                                <tr key={appointment.id}>
                                  <td>{formatDate(appointment.date || appointment.appointment_date)}</td>
                                  <td>{formatTime(appointment.time || appointment.appointment_time)}</td>
                                  <td>{appointment.professionalName || appointment.professional_name || 'N/A'}</td>
                                  <td><Badge bg="info" className="rounded-pill px-3">Agendada</Badge></td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : (
                          <Alert variant="info" className="border-0 shadow-sm">Nenhuma consulta agendada para este paciente.</Alert>
                        )}
                      </Tab.Pane>

                      <Tab.Pane eventKey="games">
                        <div className="text-center py-5">
                          <Controller size={64} className="text-muted mb-3" />
                          <h4 className="fw-bold">Games Terapêuticos</h4>
                          <p className="text-muted">Disponível em breve para {selectedPatient.name}.</p>
                        </div>
                      </Tab.Pane>

                      <Tab.Pane eventKey="services">
                        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
                          <div>
                            <h4 className="fw-bold mb-1">Servicos & Rede TEA</h4>
                            <p className="text-muted mb-0">
                              Encontre servicos especializados e rede de apoio na sua regiao.
                            </p>
                          </div>
                        </div>

                        <Card className="border-0 bg-light mb-4">
                          <Card.Body>
                            <Form onSubmit={handleServiceSearch}>
                              <Row className="g-3 align-items-end">
                                <Col md={12} lg={5}>
                                  <Form.Label className="fw-semibold">Buscar por nome ou palavra-chave</Form.Label>
                                  <div className="d-flex">
                                    <Form.Control
                                      type="text"
                                      placeholder="Ex: ABA, clinica, terapia"
                                      value={serviceFilters.search}
                                      onChange={(e) => updateServiceFilter('search', e.target.value)}
                                      className="bg-white border-0 shadow-sm"
                                    />
                                    <Button type="submit" variant="primary" className="ms-2 d-flex align-items-center">
                                      <Search className="me-2" /> Buscar
                                    </Button>
                                  </div>
                                </Col>
                                <Col md={6} lg={3}>
                                  <Form.Group>
                                    <Form.Label className="fw-semibold">Cidade *</Form.Label>
                                    <Form.Control
                                      type="text"
                                      placeholder="Cidade"
                                      value={serviceFilters.city}
                                      onChange={(e) => updateServiceFilter('city', e.target.value)}
                                      className="bg-white border-0 shadow-sm"
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={3} lg={2}>
                                  <Form.Group>
                                    <Form.Label className="fw-semibold">Regiao</Form.Label>
                                    <Form.Control
                                      type="text"
                                      placeholder="Regiao"
                                      value={serviceFilters.region}
                                      onChange={(e) => updateServiceFilter('region', e.target.value)}
                                      className="bg-white border-0 shadow-sm"
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={3} lg={2}>
                                  <Form.Group>
                                    <Form.Label className="fw-semibold">Estado</Form.Label>
                                    <Form.Control
                                      type="text"
                                      placeholder="UF"
                                      value={serviceFilters.state}
                                      onChange={(e) =>
                                        updateServiceFilter('state', e.target.value.toUpperCase())
                                      }
                                      maxLength={2}
                                      className="bg-white border-0 shadow-sm"
                                    />
                                  </Form.Group>
                                </Col>
                              </Row>

                              <Row className="g-3 mt-2">
                                <Col md={8} lg={6} className="d-flex align-items-center gap-2 flex-wrap">
                                  <Button
                                    type="button"
                                    variant="outline-primary"
                                    className="d-flex align-items-center"
                                    onClick={handleUseMyLocation}
                                  >
                                    <GeoAlt className="me-2" /> Usar minha localizacao
                                  </Button>
                                  {serviceGeoStatus && (
                                    <small className="text-muted">{serviceGeoStatus}</small>
                                  )}
                                </Col>
                              </Row>

                              <Row className="g-3 mt-2">
                                <Col lg={6}>
                                  <Form.Label className="fw-semibold">Tipo de servico</Form.Label>
                                  <div className="d-flex flex-wrap gap-2">
                                    {SERVICE_TYPE_OPTIONS.map((option) => (
                                      <Form.Check
                                        key={option.value}
                                        type="checkbox"
                                        id={`service-type-${option.value}`}
                                        label={option.label}
                                        checked={serviceFilters.types.includes(option.value)}
                                        onChange={() => toggleServiceFilterValue('types', option.value)}
                                        className="me-2"
                                      />
                                    ))}
                                  </div>
                                </Col>
                                <Col lg={3}>
                                  <Form.Label className="fw-semibold">Nivel de suporte</Form.Label>
                                  <div className="d-flex flex-wrap gap-2">
                                    {SERVICE_SUPPORT_LEVEL_OPTIONS.map((option) => (
                                      <Form.Check
                                        key={option.value}
                                        type="checkbox"
                                        id={`support-level-${option.value}`}
                                        label={option.label}
                                        checked={serviceFilters.supportLevels.includes(option.value)}
                                        onChange={() => toggleServiceFilterValue('supportLevels', option.value)}
                                        className="me-2"
                                      />
                                    ))}
                                  </div>
                                </Col>
                                <Col lg={3}>
                                  <Form.Group>
                                    <Form.Label className="fw-semibold">Modalidade</Form.Label>
                                    <Form.Select
                                      value={serviceFilters.modality}
                                      onChange={(e) => updateServiceFilter('modality', e.target.value)}
                                      className="bg-white border-0 shadow-sm"
                                    >
                                      <option value="">Todas</option>
                                      {SERVICE_MODALITY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                              </Row>

                              <Row className="g-3 mt-2">
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="fw-semibold">Faixa etaria atendida</Form.Label>
                                    <Form.Select
                                      value={serviceFilters.ageRange}
                                      onChange={(e) => updateServiceFilter('ageRange', e.target.value)}
                                      className="bg-white border-0 shadow-sm"
                                    >
                                      <option value="">Todas</option>
                                      {SERVICE_AGE_RANGE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="fw-semibold">Convenio / Particular</Form.Label>
                                    <Form.Select
                                      value={serviceFilters.coverage}
                                      onChange={(e) => updateServiceFilter('coverage', e.target.value)}
                                      className="bg-white border-0 shadow-sm"
                                    >
                                      <option value="">Todos</option>
                                      {SERVICE_COVERAGE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={4} className="d-flex align-items-end">
                                  <div className="d-flex gap-2">
                                    <Button type="submit" variant="primary" className="d-flex align-items-center">
                                      <Search className="me-2" /> Aplicar filtros
                                    </Button>
                                    <Button type="button" variant="outline-secondary" onClick={handleServiceClear}>
                                      Limpar
                                    </Button>
                                  </div>
                                </Col>
                              </Row>
                            </Form>
                          </Card.Body>
                        </Card>

                        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
                          <div className="text-muted">
                            {servicesLoading
                              ? 'Carregando servicos...'
                              : `${serviceMeta.total || services.length} servicos encontrados`}
                          </div>
                          <Form.Group className="d-flex align-items-center gap-2">
                            <Form.Select
                              value={serviceFilters.sort}
                              onChange={(e) => handleServiceSortChange(e.target.value)}
                              className="bg-white border-0 shadow-sm"
                            >
                              <option value="relevance">Relevancia</option>
                              <option value="rating">Avaliacao</option>
                              <option value="distance">Distancia</option>
                              <option value="recent">Mais recente</option>
                            </Form.Select>
                          </Form.Group>
                        </div>

                        {servicesError && (
                          <Alert variant="warning" className="border-0 shadow-sm">
                            {servicesError}
                          </Alert>
                        )}

                        {servicesLoading ? (
                          <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                          </div>
                        ) : services.length > 0 ? (
                          <Row className="g-3">
                            {services.map((service) => {
                              const locationText = [
                                service.neighborhood,
                                [service.city, service.state].filter(Boolean).join('/')
                              ]
                                .filter(Boolean)
                                .join(' - ');
                              const specialties = service.specialties?.length
                                ? service.specialties.slice(0, 2)
                                : [];
                              return (
                                <Col key={service.id || service.name} md={6} lg={4}>
                                  <Card className="h-100 border-0 shadow-sm">
                                    <Card.Body className="d-flex flex-column">
                                      <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                          <h5 className="fw-bold mb-1">{service.name}</h5>
                                          <div className="text-muted small d-flex align-items-center">
                                            <GeoAlt className="me-1" />
                                            {locationText || 'Localizacao nao informada'}
                                          </div>
                                        </div>
                                        {service.distanceKm !== null && service.distanceKm !== undefined ? (
                                          <Badge bg="light" text="dark">
                                            {Number(service.distanceKm).toFixed(1)} km
                                          </Badge>
                                        ) : null}
                                      </div>

                                      <div className="mt-2 d-flex flex-wrap gap-2">
                                        {specialties.length > 0 ? (
                                          specialties.map((specialty) => (
                                            <Badge
                                              key={specialty}
                                              bg="primary"
                                              className="bg-opacity-10 text-primary"
                                            >
                                              {specialty}
                                            </Badge>
                                          ))
                                        ) : (
                                          <Badge bg="secondary" className="bg-opacity-10 text-secondary">
                                            Especialidades diversas
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="mt-2">
                                        {service.rating > 0 ? (
                                          <div className="d-flex align-items-center text-muted small">
                                            <StarFill className="text-warning me-1" />
                                            <span className="fw-semibold text-dark">
                                              {service.rating.toFixed(1)}
                                            </span>
                                            <span className="ms-1">({service.ratingCount || 0})</span>
                                          </div>
                                        ) : (
                                          <div className="text-muted small">Sem avaliacoes</div>
                                        )}
                                      </div>

                                      <div className="mt-auto pt-3">
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => openServiceDetails(service.id)}
                                        >
                                          Ver detalhes
                                        </Button>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              );
                            })}
                          </Row>
                        ) : (
                          <Alert variant="info" className="border-0 shadow-sm">
                            Nenhum servico encontrado. Ajuste os filtros e tente novamente.
                          </Alert>
                        )}

                        {totalServicePages > 1 && (
                          <div className="d-flex justify-content-between align-items-center mt-4">
                            <Button
                              variant="outline-secondary"
                              disabled={serviceMeta.page <= 1}
                              onClick={() => handleServicePageChange(serviceMeta.page - 1)}
                            >
                              Anterior
                            </Button>
                            <div className="text-muted">
                              Pagina {serviceMeta.page} de {totalServicePages}
                            </div>
                            <Button
                              variant="outline-secondary"
                              disabled={serviceMeta.page >= totalServicePages}
                              onClick={() => handleServicePageChange(serviceMeta.page + 1)}
                            >
                              Proxima
                            </Button>
                          </div>
                        )}
                      </Tab.Pane>
                    </Tab.Content>
                  </Card.Body>
                </Card>
              </Tab.Container>
            </>
          ) : (
            <Alert variant="warning">Nenhum paciente vinculado a sua conta foi encontrado.</Alert>
          )}
        </Container>
      </main>

      {/* Modal para Marcar Consulta */}
      <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Marcar Nova Consulta</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddAppointment}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Profissional *</Form.Label>
              <Form.Select
                value={newAppointment.professionalId}
                onChange={(e) => setNewAppointment({...newAppointment, professionalId: e.target.value})}
                required
                className="bg-light border-0"
              >
                <option value="">Selecione um profissional</option>
                {professionals.length > 0 ? professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>{prof.name} - {prof.specialty}</option>
                )) : (
                  <option disabled>Nenhum profissional disponível</option>
                )}
              </Form.Select>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Data da Consulta *</Form.Label>
                  <Form.Control
                    type="date"
                    value={newAppointment.appointment_date}
                    onChange={(e) => setNewAppointment({...newAppointment, appointment_date: e.target.value})}
                    required
                    className="bg-light border-0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Hora da Consulta *</Form.Label>
                  <Form.Control
                    type="time"
                    value={newAppointment.appointment_time}
                    onChange={(e) => setNewAppointment({...newAppointment, appointment_time: e.target.value})}
                    required
                    className="bg-light border-0"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Tipo de Consulta</Form.Label>
                  <Form.Select
                    value={newAppointment.appointment_type}
                    onChange={(e) => setNewAppointment({...newAppointment, appointment_type: e.target.value})}
                    className="bg-light border-0"
                  >
                    <option value="Consulta Regular">Consulta Regular</option>
                    <option value="Consulta Inicial">Consulta Inicial</option>
                    <option value="Acompanhamento">Acompanhamento</option>
                    <option value="Avaliacao">Avaliação</option>
                    <option value="Terapia">Terapia</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Valor Estimado (R$) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={newAppointment.value}
                    onChange={(e) => setNewAppointment({...newAppointment, value: e.target.value})}
                    required
                    className="bg-light border-0"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Forma de Pagamento</Form.Label>
              <Form.Select
                value={newAppointment.payment_method}
                onChange={(e) => setNewAppointment({...newAppointment, payment_method: e.target.value})}
                className="bg-light border-0"
              >
                <option value="Pix">Pix</option>
                <option value="Credito">Cartão de Crédito</option>
                <option value="Debito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Plano de Saúde">Plano de Saúde</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label className="fw-semibold">Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                placeholder="Motivo da consulta ou observacoes"
                className="bg-light border-0"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowAppointmentModal(false)} className="px-4">Cancelar</Button>
            <Button variant="primary" type="submit" className="px-4">Solicitar Agendamento</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default ParentDashboard;










