import React, { lazy, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Offcanvas, Spinner } from 'react-bootstrap';
import {
  BarChartLine, Bell, Building, Calendar2Check, Clipboard2Pulse,
  Diagram3, ExclamationDiamond, FileEarmarkBarGraph, Gear, Grid, HeartPulse, List, People,
  PersonBadge, PersonVcard, Search, ShieldCheck, Sliders, Unity, BoxArrowRight
} from 'react-bootstrap-icons';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  ArcElement, CategoryScale, Chart as ChartJS, Filler, Legend, LineElement,
  LinearScale, PointElement, Tooltip
} from 'chart.js';
import { useNavigate, useParams } from 'react-router-dom';
import ContextSelector from './components/hospital/ContextSelector';
import { useInstitutionContext } from './context/InstitutionContext';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api';
import logo from './assets/logonovo.png';
import './HospitalDashboard.css';

ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip);
const HospitalWorkforce = lazy(() => import('./components/hospital/HospitalWorkforce'));
const HospitalPatients = lazy(() => import('./components/hospital/HospitalPatients'));
const HospitalAppointments = lazy(() => import('./components/hospital/HospitalAppointments'));
const HospitalAnalytics = lazy(() => import('./components/hospital/HospitalAnalytics'));
const HospitalIntegrationHub = lazy(() => import('./components/hospital/HospitalIntegrationHub'));
const HospitalAudit = lazy(() => import('./components/hospital/HospitalAudit'));
const HospitalPendingCenter = lazy(() => import('./components/hospital/HospitalPendingCenter'));
const HospitalProfileDashboard = lazy(() => import('./components/hospital/HospitalProfileDashboard'));
const HospitalInstitutionalJourney = lazy(() => import('./components/hospital/HospitalInstitutionalJourney'));
const HospitalSettings = lazy(() => import('./components/hospital/HospitalSettings'));
const ViewLoading = () => <div className="ach-loading" role="status" aria-live="polite"><Spinner animation="border" aria-hidden="true" /><span>Carregando área hospitalar…</span></div>;

const menu = [
  ['overview', 'Visão Geral', Grid], ['patients', 'Pacientes', People],
  ['patient360', 'Patient 360', PersonVcard], ['professionals', 'Profissionais', PersonBadge], ['teams', 'Equipes', Diagram3],
  ['appointments', 'Atendimentos', Calendar2Check], ['journey', 'Jornada Multidisciplinar', Unity],
  ['pending', 'Central de Pendências', ExclamationDiamond],
  ['reports', 'Relatórios', FileEarmarkBarGraph], ['indicators', 'Indicadores', BarChartLine],
  ['integrations', 'Integrações', Sliders], ['audit', 'Auditoria', ShieldCheck],
  ['settings', 'Configurações', Gear]
];

const palette = ['#1479f8', '#11b8c8', '#7048e8', '#f7ba2a', '#f05b3f', '#53708e', '#9aa9bd', '#23a36d'];

const defaultDates = () => {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth() - 7, 1);
  return { from: from.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
};

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));
const monthLabel = (month) => new Intl.DateTimeFormat('pt-BR', { month: 'short' })
  .format(new Date(`${month}-02T00:00:00`)).replace('.', '');

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <article className="ach-metric-card">
      <span className={`ach-metric-card__icon is-${tone}`}>{React.createElement(Icon)}</span>
      <div><span>{label}</span><strong>{formatNumber(value)}</strong></div>
    </article>
  );
}

function TrackingRow({ label, item, color }) {
  return (
    <div className="ach-tracking-row">
      <div><strong>{item?.percent || 0}%</strong><span>{label}</span></div>
      <small>{formatNumber(item?.count)} pacientes</small>
      <div className="ach-progress"><i style={{ width: `${item?.percent || 0}%`, background: color }} /></div>
    </div>
  );
}

export default function HospitalDashboard() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const { currentContext } = useInstitutionContext();
  const { logout } = useContext(AuthContext);
  const [filters, setFilters] = useState(() => ({ ...defaultDates(), teamId: '', specialty: '', status: 'active' }));
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [activeView, setActiveView] = useState('overview');

  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/hospitals/${hospitalId}/dashboard`, {
        params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')),
        signal
      });
      setDashboard(data);
    } catch (requestError) {
      if (requestError.name !== 'CanceledError') {
        setError(requestError.response?.data?.error || 'Não foi possível carregar o painel hospitalar.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filters, hospitalId]);

  useEffect(() => {
    if (currentContext?.key !== `hospital:${hospitalId}`) return undefined;
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [currentContext?.key, hospitalId, loadDashboard]);

  const specialtyChart = useMemo(() => ({
    labels: dashboard?.specialtyDistribution?.map((item) => item.label) || [],
    datasets: [{
      data: dashboard?.specialtyDistribution?.map((item) => item.value) || [],
      backgroundColor: palette,
      borderWidth: 0,
      hoverOffset: 5
    }]
  }), [dashboard]);

  const evolutionChart = useMemo(() => ({
    labels: dashboard?.evolution?.map((item) => monthLabel(item.month)) || [],
    datasets: [
      { label: 'Atendimentos', data: dashboard?.evolution?.map((item) => item.appointments) || [], borderColor: '#1479f8', backgroundColor: '#1479f822', tension: 0.35, fill: true },
      { label: 'Evoluções', data: dashboard?.evolution?.map((item) => item.progressRecords) || [], borderColor: '#11a987', backgroundColor: '#11a98716', tension: 0.35 },
      { label: 'Sessões ABA', data: dashboard?.evolution?.map((item) => item.abaSessions) || [], borderColor: '#7b45e7', backgroundColor: '#7b45e716', tension: 0.35 }
    ]
  }), [dashboard]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#e8eef8' } }, x: { grid: { display: false } } }
  };

  const showSoon = (label) => {
    setNotice(`${label} será disponibilizado nas próximas fases do módulo Hospital.`);
    setMenuOpen(false);
  };

  const openPatient360 = (event) => {
    event.preventDefault();
    const id = patientSearch.trim();
    if (!/^[1-9]\d*$/.test(id)) {
      setNotice('Informe um ID AutisConnect válido para abrir o Patient 360.');
      return;
    }
    navigate(`/hospital/${hospitalId}/patient/${id}`);
  };

  const sidebar = (
    <div className="ach-sidebar__inner">
      <div className="ach-brand"><img src={logo} alt="AutisConnect" /><div><b>HOSPITAL</b><small>O paciente no centro.</small></div></div>
      <div className="ach-hospital-chip"><Building /><span>{dashboard?.hospital?.name || currentContext?.name || 'Hospital'}</span></div>
      <nav aria-label="Navegação hospitalar">
        {menu.map(([key, label, Icon]) => (
          <button key={key} data-hospital-menu={key} type="button" className={key === activeView ? 'is-active' : ''} aria-current={key === activeView ? 'page' : undefined} onClick={() => {
            if (key === 'patient360') setNotice('Informe o ID AutisConnect na busca superior para abrir o Patient 360 autorizado.');
            else if (key === 'integrations' && !currentContext?.permissions?.includes('hospital.integration.manage')) setNotice('Seu papel hospitalar não possui permissão para administrar integrações.');
            else if (key === 'audit' && !currentContext?.permissions?.includes('hospital.audit.read')) setNotice('Seu papel hospitalar não possui permissão para consultar a auditoria.');
            else if (key === 'patients' && !currentContext?.permissions?.includes('hospital.patient.read')) setNotice('Seu papel hospitalar não possui permissão para consultar pacientes.');
            else if (key === 'appointments' && !currentContext?.permissions?.includes('hospital.patient.read')) setNotice('Seu papel hospitalar não possui permissão para consultar atendimentos.');
            else if (key === 'journey' && !currentContext?.permissions?.includes('hospital.patient.read')) setNotice('Seu papel hospitalar não possui permissão para consultar a Jornada Multidisciplinar.');
            else if (key === 'pending' && !currentContext?.permissions?.includes('hospital.pending.read')) setNotice('Seu papel hospitalar não possui permissão para consultar a Central de Pendências.');
            else if (['overview', 'patients', 'professionals', 'teams', 'appointments', 'journey', 'pending', 'reports', 'indicators', 'integrations', 'audit', 'settings'].includes(key)) { setActiveView(key); setMenuOpen(false); }
            else showSoon(label);
          }}>
            {React.createElement(Icon)}<span>{label}</span>{['patient360', 'professionals', 'teams', 'reports', 'indicators', 'settings'].includes(key) || (['patients', 'appointments', 'journey'].includes(key) && currentContext?.permissions?.includes('hospital.patient.read')) || (key === 'pending' && currentContext?.permissions?.includes('hospital.pending.read')) || (key === 'integrations' && currentContext?.permissions?.includes('hospital.integration.manage')) || (key === 'audit' && currentContext?.permissions?.includes('hospital.audit.read')) ? <small>Ativo</small> : (key !== 'overview' ? <small>{['patients', 'appointments', 'journey', 'pending', 'integrations', 'audit'].includes(key) ? 'Restrito' : 'Em breve'}</small> : null)}
          </button>
        ))}
      </nav>
      <button type="button" className="ach-sidebar__logout" onClick={() => logout('/')}><BoxArrowRight /><span>Sair</span></button>
      <div className="ach-sidebar__footer"><ShieldCheck /><div><strong>Ambiente protegido</strong><span>Contexto validado no servidor</span></div></div>
    </div>
  );

  return (
    <div className="ach-shell">
      <a className="ach-skip-link" href="#hospital-main">Ir para o conteúdo principal</a>
      <aside className="ach-sidebar">{sidebar}</aside>
      <Offcanvas id="hospital-mobile-navigation" show={menuOpen} onHide={() => setMenuOpen(false)} className="ach-mobile-menu">
        <Offcanvas.Header closeButton><Offcanvas.Title>AutisConnect Hospital</Offcanvas.Title></Offcanvas.Header>
        <Offcanvas.Body>{sidebar}</Offcanvas.Body>
      </Offcanvas>

      <div className="ach-workspace">
        <header className="ach-topbar">
          <button className="ach-menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu" aria-expanded={menuOpen} aria-controls="hospital-mobile-navigation"><List /></button>
          <form className="ach-search" onSubmit={openPatient360}><Search /><input value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} inputMode="numeric" aria-label="Abrir Patient 360 pelo ID AutisConnect" placeholder="Abrir Patient 360 pelo ID AutisConnect…" /></form>
          <div className="ach-topbar__actions"><ContextSelector /><button type="button" aria-label="Abrir Central de Pendências" onClick={() => currentContext?.permissions?.includes('hospital.pending.read') ? setActiveView('pending') : setNotice('Seu papel hospitalar não possui permissão para consultar a Central de Pendências.')}><Bell /></button></div>
        </header>

        <main className="ach-main" id="hospital-main" tabIndex="-1" aria-busy={loading}>
          <span className="visually-hidden" role="status" aria-live="polite">{loading ? 'Atualizando informações hospitalares.' : 'Informações hospitalares atualizadas.'}</span>
          <section className="ach-hero">
            <div><span>AUTISCONNECT HOSPITAL</span><h1>O paciente <em>no centro.</em></h1><p>Dados assistenciais conectados para uma jornada mais humana, segura e eficiente.</p></div>
            <div className="ach-hero__seal"><Clipboard2Pulse /><span>Contexto</span><strong>{currentContext?.role?.replace('hospital_', '') || 'hospitalar'}</strong></div>
          </section>

          {notice ? <Alert variant="info" dismissible onClose={() => setNotice('')}>{notice}</Alert> : null}
          {error ? <Alert variant="danger">{error}<Button size="sm" variant="outline-danger" onClick={() => loadDashboard()}>Tentar novamente</Button></Alert> : null}

          <Suspense fallback={<ViewLoading />}>{activeView === 'patients' ? <HospitalPatients hospitalId={hospitalId} canManage={currentContext?.permissions?.includes('hospital.patient.manage')} /> : activeView === 'appointments' ? <HospitalAppointments hospitalId={hospitalId} canManage={currentContext?.permissions?.includes('hospital.appointment.manage')} /> : activeView === 'journey' ? <HospitalInstitutionalJourney hospitalId={hospitalId} /> : activeView === 'pending' ? <HospitalPendingCenter hospitalId={hospitalId} /> : ['professionals', 'teams'].includes(activeView) ? <HospitalWorkforce hospitalId={hospitalId} initialView={activeView} canManage={currentContext?.permissions?.includes('hospital.team.manage')} /> : ['reports', 'indicators'].includes(activeView) ? <HospitalAnalytics hospitalId={hospitalId} filters={filters} initialView={activeView} canExport={currentContext?.permissions?.includes('hospital.report.generate')} /> : activeView === 'integrations' ? <HospitalIntegrationHub hospitalId={hospitalId} canManage={currentContext?.permissions?.includes('hospital.integration.manage')} /> : activeView === 'audit' ? <HospitalAudit hospitalId={hospitalId} /> : activeView === 'settings' ? <HospitalSettings hospitalId={hospitalId} canManage={currentContext?.permissions?.includes('hospital.settings.manage')} /> : <>
          <HospitalProfileDashboard hospitalId={hospitalId} />
          <section className="ach-filters" aria-label="Filtros do dashboard">
            <label>De<Form.Control type="date" value={filters.from} onChange={(e) => setFilters((old) => ({ ...old, from: e.target.value }))} /></label>
            <label>Até<Form.Control type="date" value={filters.to} onChange={(e) => setFilters((old) => ({ ...old, to: e.target.value }))} /></label>
            <label>Equipe<Form.Select value={filters.teamId} onChange={(e) => setFilters((old) => ({ ...old, teamId: e.target.value }))}><option value="">Todas</option>{dashboard?.filterOptions?.teams?.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</Form.Select></label>
            <label>Especialidade<Form.Select value={filters.specialty} onChange={(e) => setFilters((old) => ({ ...old, specialty: e.target.value }))}><option value="">Todas</option>{dashboard?.filterOptions?.specialties?.map((specialty) => <option key={specialty}>{specialty}</option>)}</Form.Select></label>
            <label>Status<Form.Select value={filters.status} onChange={(e) => setFilters((old) => ({ ...old, status: e.target.value }))}><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="discharged">Alta</option><option value="all">Todos</option></Form.Select></label>
          </section>

          {loading && !dashboard ? <div className="ach-loading"><Spinner animation="border" /><span>Consolidando indicadores reais…</span></div> : (
            <>
              <section className="ach-metrics" aria-label="Indicadores principais">
                <MetricCard icon={People} label="Pacientes TEA ativos" value={dashboard?.metrics?.activePatients} tone="blue" />
                <MetricCard icon={PersonBadge} label="Novos pacientes" value={dashboard?.metrics?.newPatients} tone="cyan" />
                <MetricCard icon={Calendar2Check} label="Atendimentos TEA" value={dashboard?.metrics?.appointments} tone="violet" />
                <MetricCard icon={People} label="Profissionais envolvidos" value={dashboard?.metrics?.activeProfessionals} tone="green" />
                <MetricCard icon={Diagram3} label="Equipes multidisciplinares" value={dashboard?.metrics?.activeTeams} tone="orange" />
              </section>

              <section className="ach-grid">
                <article className="ach-panel ach-panel--specialties"><header><div><span>Composição assistencial</span><h2>Distribuição por especialidade</h2></div></header><div className="ach-chart ach-chart--doughnut" role="img" aria-label="Gráfico de atendimentos por especialidade">{dashboard?.specialtyDistribution?.length ? <Doughnut data={specialtyChart} options={{ responsive: true, maintainAspectRatio: false, cutout: '67%', plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } } } }} /> : <div className="ach-empty">Nenhuma especialidade ativa no período.</div>}</div></article>
                <article className="ach-panel ach-panel--evolution"><header><div><span>Histórico do período</span><h2>Evolução da jornada</h2></div></header><div className="ach-chart" role="img" aria-label="Gráfico de evolução mensal da jornada"><Line data={evolutionChart} options={chartOptions} /></div></article>
                <article className="ach-panel ach-panel--tracking"><header><div><span>Cobertura assistencial</span><h2>Nível de acompanhamento</h2></div><strong className="ach-platform-users">{formatNumber(dashboard?.metrics?.activePlatformUsers)}<small>usuários ativos</small></strong></header><div className="ach-tracking-list"><TrackingRow label="Acompanhamento multidisciplinar" item={dashboard?.tracking?.multidisciplinary} color="#1479f8" /><TrackingRow label="Programa ABA no período" item={dashboard?.tracking?.aba} color="#7b45e7" /><TrackingRow label="Monitoramentos registrados" item={dashboard?.tracking?.monitoring} color="#11b8c8" /><TrackingRow label="Evolução registrada" item={dashboard?.tracking?.progress} color="#23a36d" /></div></article>
              </section>

              <section className="ach-foundation"><div><ShieldCheck /><span><strong>Dados reais e isolados</strong>Todos os indicadores são calculados no contexto do hospital selecionado.</span></div><div><HeartPulse /><span><strong>Jornada longitudinal</strong>ABA, monitoramentos e evolução reutilizam os registros centrais do paciente.</span></div><div><Clipboard2Pulse /><span><strong>Patient 360 disponível</strong>Abra o prontuário contextual pelo ID AutisConnect na busca superior.</span></div></section>
            </>
          )}</>}</Suspense>
        </main>
      </div>
    </div>
  );
}
