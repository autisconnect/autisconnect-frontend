import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Spinner } from 'react-bootstrap';
import { Activity, BarChartLine, Calendar2Check, Diagram3, FileEarmarkText, HeartPulse, JournalText, People, ShieldCheck } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import ContextSelector from './ContextSelector';
import apiClient from '../../services/api';
import './HospitalProfessionalDashboard.css';

const date = (value) => {
  if (!value) return 'Não informado';
  const raw = `${value}`;
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw);
  return Number.isNaN(parsed.getTime()) ? raw : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(parsed);
};

export default function HospitalProfessionalDashboard({ context }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [section, setSection] = useState('overview');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    apiClient.get(`/hospitals/${context.institutionId}/professional-dashboard`, { signal: controller.signal })
      .then((response) => setData(response.data))
      .catch((requestError) => { if (requestError.name !== 'CanceledError') setError(requestError.response?.data?.error || 'Não foi possível carregar sua atuação hospitalar.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [context.institutionId]);

  const upcoming = useMemo(() => data?.appointments?.filter((item) => new Date(`${item.date}T${item.time || '00:00:00'}`) >= new Date()).reverse() || [], [data]);
  if (loading) return <div className="ac-hpd-state"><Spinner animation="border" /><span>Carregando atuação em {context.name}…</span></div>;
  if (error) return <div className="ac-hpd-state"><Alert variant="danger">{error}</Alert><ContextSelector /></div>;

  const nav = [
    ['overview', 'Visão geral', BarChartLine], ['patients', 'Pacientes', People], ['appointments', 'Agenda', Calendar2Check],
    ['activities', 'Atividades', Activity], ['records', 'Registros', JournalText],
    ...(data.capabilities.abaRead ? [['aba', 'ABA', HeartPulse]] : []),
    ...(data.capabilities.monitoringRead ? [['monitoring', 'Monitoramentos', Activity]] : []),
    ...(data.capabilities.reportRead ? [['reports', 'Relatórios', FileEarmarkText]] : [])
  ];
  const content = {
    patients: <div className="ac-hpd-list">{data.patients.map((patient) => <button key={patient.id} type="button" onClick={() => navigate(`/hospital/${context.institutionId}/patient/${patient.id}`)}><span><strong>{patient.name}</strong><small>{patient.teams || 'Equipe assistencial'} · {patient.externalPatientId || `AutisConnect #${patient.id}`}</small></span><Badge bg="light" text="primary">Abrir Patient 360</Badge></button>)}</div>,
    appointments: <div className="ac-hpd-table"><table><thead><tr><th>Data</th><th>Horário</th><th>Paciente</th><th>Tipo</th><th>Status</th></tr></thead><tbody>{data.appointments.map((item) => <tr key={item.id}><td>{date(item.date)}</td><td>{`${item.time || ''}`.slice(0, 5)}</td><td>{item.patientName}</td><td>{item.type || 'Atendimento'}</td><td>{item.status}</td></tr>)}</tbody></table></div>,
    activities: <div className="ac-hpd-list">{data.activities.map((item) => <article key={item.id}><Activity /><span><strong>{item.patientName}</strong><small>{item.gameKey} · {date(item.startedAt)} · aproveitamento {item.successRate ?? '—'}%</small></span></article>)}</div>,
    records: <div className="ac-hpd-list">{data.records.map((item) => <article key={item.id}><JournalText /><span><strong>{item.title || 'Registro profissional'}</strong><small>{item.patientName} · {date(item.createdAt)}</small></span></article>)}</div>,
    aba: <div className="ac-hpd-list">{data.patients.map((patient) => <button key={patient.id} type="button" onClick={() => navigate(`/hospital/${context.institutionId}/patient/${patient.id}`)}><HeartPulse /><span><strong>{patient.name}</strong><small>Abrir sessões e indicadores ABA autorizados no Patient 360</small></span></button>)}</div>,
    monitoring: <div className="ac-hpd-list">{data.patients.map((patient) => <button key={patient.id} type="button" onClick={() => navigate(`/hospital/${context.institutionId}/patient/${patient.id}`)}><Activity /><span><strong>{patient.name}</strong><small>Abrir registros observacionais autorizados no Patient 360</small></span></button>)}</div>,
    reports: <div className="ac-hpd-list">{data.patients.map((patient) => <button key={patient.id} type="button" onClick={() => navigate(`/hospital/${context.institutionId}/patient/${patient.id}`)}><FileEarmarkText /><span><strong>{patient.name}</strong><small>Acessar dados autorizados para relatórios no Patient 360</small></span></button>)}</div>
  };
  const empty = { patients: 'Nenhum paciente vinculado às suas equipes.', appointments: 'Nenhum atendimento pertinente.', activities: 'Nenhuma atividade recente.', records: 'Nenhum registro recente.', aba: 'Nenhum paciente com acesso ABA.', monitoring: 'Nenhum paciente com monitoramentos autorizados.', reports: 'Nenhum paciente disponível para relatórios.' };
  const items = section === 'appointments' ? data.appointments : section === 'activities' ? data.activities : section === 'records' ? data.records : data.patients;

  return <div className="ac-hpd-shell"><aside><div className="ac-hpd-brand"><HeartPulse /><span><strong>AutisConnect</strong><small>Atuação hospitalar</small></span></div><div className="ac-hpd-hospital"><ShieldCheck /><span><small>Hospital atual</small><strong>{data.professional.hospitalName}</strong></span></div><nav>{nav.map(([key, label, Icon]) => <button type="button" key={key} className={section === key ? 'is-active' : ''} onClick={() => setSection(key)}>{React.createElement(Icon)} {label}</button>)}</nav></aside><main><header><div><small>Minha atuação / {context.name}</small><h1>{section === 'overview' ? `Olá, ${data.professional.name}` : nav.find(([key]) => key === section)?.[1]}</h1></div><ContextSelector /></header>{section === 'overview' ? <><section className="ac-hpd-metrics"><article><People /><span><strong>{data.patients.length}</strong><small>Pacientes autorizados</small></span></article><article><Diagram3 /><span><strong>{data.teams.length}</strong><small>Equipes ativas</small></span></article><article><Calendar2Check /><span><strong>{upcoming.length}</strong><small>Próximos atendimentos</small></span></article><article><FileEarmarkText /><span><strong>{data.records.length}</strong><small>Registros recentes</small></span></article></section><section className="ac-hpd-grid"><article><h2>Minhas equipes</h2>{data.teams.map((team) => <div className="ac-hpd-team" key={team.id}><Diagram3 /><span><strong>{team.name}</strong><small>{team.teamRole || 'Membro'} · {team.patientCount} paciente(s)</small></span></div>)}</article><article><h2>Próximos atendimentos</h2>{upcoming.slice(0, 5).map((item) => <div className="ac-hpd-team" key={item.id}><Calendar2Check /><span><strong>{item.patientName}</strong><small>{date(item.date)} às {`${item.time || ''}`.slice(0, 5)} · {item.type}</small></span></div>)}</article></section><div className="ac-hpd-capabilities"><span><HeartPulse /> ABA {data.capabilities.abaRead ? 'autorizado' : 'restrito'}</span><span><Activity /> Monitoramentos {data.capabilities.monitoringRead ? 'autorizados' : 'restritos'}</span><span><FileEarmarkText /> Relatórios {data.capabilities.reportRead ? 'autorizados' : 'restritos'}</span></div></> : <section className="ac-hpd-content"><h2>{nav.find(([key]) => key === section)?.[1]}</h2>{items.length ? content[section] : <div className="ac-hpd-empty">{empty[section]}</div>}</section>}</main></div>;
}
