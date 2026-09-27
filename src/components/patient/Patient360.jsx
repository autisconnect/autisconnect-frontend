import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Spinner } from 'react-bootstrap';
import {
  Activity, ArrowLeft, BarChartLine, Calendar3, Clipboard2Pulse, Controller,
  Diagram3, EmojiSmile, FileEarmarkMedical, HeartPulse, HouseDoor, JournalText,
  Mic, PersonBadge, ShieldCheck, Stars, Bullseye
} from 'react-bootstrap-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../services/api';
import Patient360AssistentialSummary from './Patient360AssistentialSummary';
import HospitalEvolutions from './HospitalEvolutions';
import HospitalPdi from './HospitalPdi';
import HospitalMultidisciplinaryReports from './HospitalMultidisciplinaryReports';
import './Patient360.css';

const sections = [
  ['overview', 'Resumo', HouseDoor],
  ['journey', 'Jornada', Activity, 'journeyRead'],
  ['team', 'Equipe multidisciplinar', Diagram3, 'teamRead'],
  ['progress', 'Evolução', BarChartLine, 'evolutionRead'],
  ['pdi', 'PDI', Bullseye, 'pdiRead'],
  ['appointments', 'Atendimentos', Calendar3, 'appointmentRead'],
  ['aba', 'ABA', HeartPulse, 'abaRead'],
  ['monitoring', 'Monitoramentos', EmojiSmile, 'monitoringRead'],
  ['activities', 'Atividades', Controller, 'journeyRead'],
  ['reports', 'Relatórios', FileEarmarkMedical, 'reportRead'],
  ['history', 'Histórico', JournalText, 'journeyRead'],
  ['insights', 'IA / Insights', Stars]
];
const sourceLabels = { hospital: 'Hospital', clinic: 'Clínica', professional: 'Profissional', family: 'Família', school: 'Escola', autisconnect: 'AutisConnect' };

const date = (value, withTime = false) => {
  if (!value) return 'Não informado';
  const rawValue = `${value}`;
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(rawValue) ? `${rawValue}T12:00:00` : rawValue);
  if (Number.isNaN(parsed.getTime())) return `${value}`;
  return new Intl.DateTimeFormat('pt-BR', withTime
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { dateStyle: 'short' }).format(parsed);
};

const Empty = ({ children }) => <div className="ac360-empty">{children}</div>;

export default function Patient360({ patientId, contextType = 'hospital', contextId }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const requestedSection = searchParams.get('section');
  const [section, setSection] = useState(sections.some(([key]) => key === requestedSection) ? requestedSection : 'overview');
  const [assistentialSummary, setAssistentialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);
  const endpointBase = contextType === 'hospital' && contextId && patientId ? `/hospitals/${contextId}/patients/${patientId}/360` : '';

  useEffect(() => {
    if (!endpointBase) return undefined;
    const controller = new AbortController();
    setAssistentialSummary(null);
    apiClient.get(`${endpointBase}/summary`, { signal: controller.signal })
      .then(({ data: response }) => setAssistentialSummary(response))
      .catch(() => {});
    return () => controller.abort();
  }, [endpointBase, reloadKey]);

  useEffect(() => {
    if (contextType !== 'hospital' || !contextId || !patientId) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiClient.get(endpointBase, { signal: controller.signal })
      .then(({ data: response }) => setData(response))
      .catch((requestError) => {
        if (requestError.name !== 'CanceledError') {
          setError(requestError.response?.data?.error || 'Não foi possível carregar o Patient 360.');
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [contextId, contextType, endpointBase, patientId, reloadKey]);

  useEffect(() => {
    if (sections.some(([key]) => key === requestedSection) && requestedSection !== section) setSection(requestedSection);
  }, [requestedSection, section]);

  const selectSection = (key) => {
    setSection(key);
    const next = new URLSearchParams(searchParams);
    if (key === 'overview') next.delete('section'); else next.set('section', key);
    setSearchParams(next, { replace: true });
  };

  const visibleSections = useMemo(() => sections.filter(([, , , capability]) =>
    !capability || data?.capabilities?.[capability]
  ), [data]);
  const journeySources = useMemo(() => [...new Set((data?.journey || []).map((item) => item.source.type))], [data]);
  const filteredJourney = useMemo(() => sourceFilter === 'all'
    ? (data?.journey || [])
    : (data?.journey || []).filter((item) => item.source.type === sourceFilter), [data, sourceFilter]);
  const sourceLabel = (item) => item.source.type === 'hospital' && item.source.institutionId === Number(contextId)
    ? data.institution.name
    : sourceLabels[item.source.type] || item.source.type;

  const renderOverview = () => (
    <>
      <Patient360AssistentialSummary summary={assistentialSummary} endpointBase={endpointBase} />
      <div className="ac360-metrics">
        {[['Equipes', data.summary.teams, Diagram3], ['Profissionais', data.summary.professionals, PersonBadge], ['Atendimentos', data.summary.appointments, Calendar3], ['Evoluções', data.summary.progressRecords, BarChartLine], ['Sessões ABA', data.summary.abaSessions, HeartPulse], ['Monitoramentos', data.summary.monitoringRecords, Activity]].map(([label, value, Icon]) => (
          <article key={label}><span>{React.createElement(Icon)}</span><div><small>{label}</small><strong>{value}</strong></div></article>
        ))}
      </div>
      <div className="ac360-columns">
        <article className="ac360-card"><header><h2>Resumo da pessoa</h2><Badge bg="primary">Patient 360</Badge></header><dl><div><dt>Data de nascimento</dt><dd>{date(data.patient.birthDate)}</dd></div><div><dt>Status no hospital</dt><dd>{data.institution.status}</dd></div><div><dt>Admissão</dt><dd>{date(data.institution.admissionDate)}</dd></div><div><dt>Identificador hospitalar</dt><dd>{data.institution.externalPatientId || 'Não informado'}</dd></div><div><dt>Diagnóstico registrado</dt><dd>{data.patient.diagnosis || 'Não informado'}</dd></div><div><dt>Contato</dt><dd>{data.patient.phone || data.patient.email || 'Não informado'}</dd></div></dl></article>
        <article className="ac360-card"><header><h2>Eventos recentes</h2></header>{data.journey.slice(0, 5).length ? <div className="ac360-mini-timeline">{data.journey.slice(0, 5).map((item) => <div key={item.id}><i /><span><strong>{item.title}</strong><small>{date(item.occurredAt, true)} · {item.source.type}</small></span></div>)}</div> : <Empty>Nenhum evento disponível.</Empty>}</article>
      </div>
    </>
  );

  const renderJourney = (items = data.journey) => items.length ? (
    <div className="ac360-timeline">{items.map((item) => <article key={item.id}><div className="ac360-timeline__date">{date(item.occurredAt)}</div><i /><div><span>{sourceLabel(item)}</span><h3>{item.title}</h3><p>{item.summary || 'Registro disponível na jornada.'}</p><small>{item.source.createdBy ? `Responsável pelo registro: #${item.source.createdBy}` : 'Registro observacional/legado'}{item.eventReferenceId ? ` · Referência ${item.eventType} #${item.eventReferenceId}` : ''}</small></div></article>)}</div>
  ) : <Empty>Nenhum registro na jornada.</Empty>;

  const renderTeam = () => data.teams.length ? <div className="ac360-card-grid">{data.teams.map((team) => <article className="ac360-card" key={team.id}><header><div><span>{team.isPrimary ? 'Equipe principal' : 'Equipe assistencial'}</span><h2>{team.name}</h2></div><Diagram3 /></header>{team.professionals.length ? <ul className="ac360-people">{team.professionals.map((person) => <li key={person.id}><PersonBadge /><span><strong>{person.name || `Profissional #${person.id}`}</strong><small>{person.specialty || person.teamRole || 'Especialidade não informada'}</small></span></li>)}</ul> : <Empty>Equipe sem profissionais ativos.</Empty>}</article>)}</div> : <Empty>Nenhuma equipe ativa atribuída.</Empty>;

  const renderProgress = () => <><HospitalEvolutions hospitalId={contextId} patientId={patientId} capabilities={data.capabilities} /><article className="ac360-card"><header><div><span>Fonte preservada</span><h2>Registros legados de progresso</h2></div></header>{data.progress.length ? <div className="ac360-records">{data.progress.map((item) => <article key={item.id}><span className="ac360-score">{item.score ?? '—'}</span><div><h3>{item.metric_type || 'Evolução'}</h3><p>{item.notes || 'Registro de evolução sem observação textual.'}</p><small>{date(item.recorded_date)}</small></div></article>)}</div> : <Empty>Nenhum registro legado de progresso.</Empty>}</article></>;
  const renderPdi = () => <HospitalPdi hospitalId={contextId} patientId={patientId} capabilities={data.capabilities} />;

  const renderAppointments = () => data.appointments.length ? <div className="ac360-table-wrap"><table><caption className="visually-hidden">Atendimentos hospitalares do paciente</caption><thead><tr><th scope="col">Data</th><th scope="col">Tipo</th><th scope="col">Profissional</th><th scope="col">Especialidade</th><th scope="col">Status</th></tr></thead><tbody>{data.appointments.map((item) => <tr key={item.id}><td>{date(item.date)} {item.time?.slice(0, 5)}</td><td>{item.type || 'Atendimento'}</td><td>{item.professional_name || `#${item.professional_id}`}</td><td>{item.specialty || '—'}</td><td><Badge bg="light" text="dark">{item.status || 'Registrado'}</Badge></td></tr>)}</tbody></table></div> : <Empty>Nenhum atendimento hospitalar localizado.</Empty>;

  const renderAba = () => data.aba?.sessions?.length ? <div className="ac360-records">{data.aba.sessions.map((item) => <article key={item.id}><span className="ac360-score">{item.correct_trials ?? 0}/{item.total_trials ?? 0}</span><div><h3>{item.program_name || 'Programa ABA'}</h3><p>{item.session_type || 'Sessão'} · {item.prompts_used ?? 0} apoio(s) registrado(s)</p><small>{date(item.session_date)}</small></div></article>)}</div> : <Empty>Nenhuma sessão ABA disponível.</Empty>;

  const renderMonitoring = () => {
    const groups = [
      ['Expressões faciais', data.monitoring?.emotions || [], (item) => `${item.emotion || 'Emoção'} · ${item.percentage ?? 0}%`, EmojiSmile],
      ['Estereotipias', data.monitoring?.stereotypies || [], (item) => item.type || 'Registro observacional', Activity],
      ['Vocalizações', data.monitoring?.vocalizations || [], () => 'Análise observacional de vocalização', Mic],
      ['Gatilhos', data.monitoring?.triggers || [], (item) => item.type || item.description || 'Gatilho registrado', Clipboard2Pulse]
    ];
    return <div className="ac360-monitor-grid">{groups.map(([label, items, describe, Icon]) => <article className="ac360-card" key={label}><header><div><span>Registros observacionais</span><h2>{label}</h2></div>{React.createElement(Icon)}</header>{items.length ? <ul>{items.slice(0, 8).map((item) => <li key={item.id}><strong>{describe(item)}</strong><small>{date(item.date)}</small></li>)}</ul> : <Empty>Sem registros.</Empty>}</article>)}</div>;
  };

  const renderActivities = () => data.activities.length ? <div className="ac360-card-grid">{data.activities.map((item) => <article className="ac360-card" key={item.id}><header><div><span>Atividade terapêutica</span><h2>{item.game_key}</h2></div><Controller /></header><p>Nível {item.level_id || '—'} · Aproveitamento {item.success_rate ?? '—'}%</p><small>{date(item.started_at, true)}</small></article>)}</div> : <Empty>Nenhuma atividade registrada.</Empty>;

  const renderReports = () => <HospitalMultidisciplinaryReports hospitalId={contextId} patientId={patientId} capabilities={data.capabilities} />;

  const renderHistory = () => <div className="ac360-columns"><article className="ac360-card"><header><h2>Registros profissionais</h2></header>{data.notes.length ? <div className="ac360-notes">{data.notes.map((note) => <div key={note.id}><h3>{note.title || 'Registro clínico'}</h3><p>{note.content || 'Sem conteúdo textual.'}</p><small>{note.professional_name || 'Profissional'} · {date(note.created_at, true)}</small></div>)}</div> : <Empty>Nenhum registro profissional do hospital.</Empty>}</article><article className="ac360-card"><header><h2>Linha do tempo consolidada</h2></header>{renderJourney(data.journey.slice(0, 10))}</article></div>;

  const renderInsights = () => <div className="ac360-card ac360-insights"><Stars /><div><span>{data.insights.label}</span><h2>Indicadores para apoio à avaliação profissional</h2><ul>{data.insights.statements.map((statement) => <li key={statement}>{statement}</li>)}</ul><Alert variant="info">{data.insights.disclaimer}</Alert></div></div>;

  const content = () => ({ overview: renderOverview, journey: () => renderJourney(filteredJourney), team: renderTeam, progress: renderProgress, pdi: renderPdi, appointments: renderAppointments, aba: renderAba, monitoring: renderMonitoring, activities: renderActivities, reports: renderReports, history: renderHistory, insights: renderInsights }[section] || renderOverview)();

  if (loading && !assistentialSummary) return <div className="ac360-state" role="status" aria-live="polite"><Spinner animation="border" aria-hidden="true" /><span>Organizando a jornada autorizada…</span></div>;
  if (loading && assistentialSummary) return <div className="ac360-shell"><main className="ac360-summary-first" aria-live="polite"><Patient360AssistentialSummary summary={assistentialSummary} endpointBase={endpointBase} /><div className="ac360-detail-loading"><Spinner animation="border" size="sm" /><span>Carregando detalhes autorizados…</span></div></main></div>;
  if (error) return <div className="ac360-state"><Alert variant="danger"><Alert.Heading>Patient 360 indisponível</Alert.Heading><p>{error}</p><div className="d-flex gap-2"><Button variant="danger" onClick={() => setReloadKey((value) => value + 1)}>Tentar novamente</Button><Button variant="outline-danger" onClick={() => navigate(`/hospital/${contextId}/dashboard`)}>Voltar ao hospital</Button></div></Alert></div>;
  if (!data) return null;

  const initials = data.patient.name?.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';
  return (
    <div className="ac360-shell">
      <header className="ac360-header">
        <button type="button" aria-label="Voltar ao dashboard hospitalar" onClick={() => navigate(`/hospital/${contextId}/dashboard`)}><ArrowLeft /> Dashboard</button>
        <div className="ac360-header__identity"><span>{initials}</span><div><small>Dashboard do Paciente · {data.institution.name}</small><h1>{data.patient.name}</h1><p>AutisConnect #{data.patient.id} · Hospital {data.institution.externalPatientId || 'sem ID externo'}</p></div></div>
        <div className="ac360-header__security"><ShieldCheck /><span>Contexto autorizado<strong>{data.institution.status}</strong></span></div>
      </header>
      <div className="ac360-layout">
        <aside aria-label="Seções do Patient 360"><span className="ac360-nav-title">Jornada do paciente</span>{visibleSections.map(([key, label, Icon]) => <button key={key} type="button" className={section === key ? 'is-active' : ''} aria-current={section === key ? 'page' : undefined} aria-controls="ac360-content" onClick={() => selectSection(key)}>{React.createElement(Icon)}<span>{label}</span></button>)}</aside>
        <main id="ac360-content" tabIndex="-1"><div className="ac360-section-title"><span>Uma pessoa. Uma jornada.</span><h2>{visibleSections.find(([key]) => key === section)?.[1] || 'Resumo'}</h2><p>Informações apresentadas conforme o vínculo, a finalidade e as permissões do contexto hospitalar.</p>{section === 'journey' && journeySources.length > 1 ? <label className="ac360-source-filter">Origem<select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">Todas</option>{journeySources.map((source) => <option key={source} value={source}>{sourceLabels[source] || source}</option>)}</select></label> : null}</div>{content()}</main>
      </div>
    </div>
  );
}
