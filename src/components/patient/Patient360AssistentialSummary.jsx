import React, { useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { Activity, Calendar3, CheckCircle, ClockHistory, Diagram3, ExclamationTriangle, HeartPulse, JournalMedical } from 'react-bootstrap-icons';
import apiClient from '../../services/api';
import './Patient360AssistentialSummary.css';

const formatDate = (value, withTime = false) => {
  if (!value) return 'Não disponível';
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(`${value}`) ? `${value}T12:00:00` : value);
  if (Number.isNaN(parsed.getTime())) return `${value}`;
  return new Intl.DateTimeFormat('pt-BR', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(parsed);
};

const appointmentText = (item) => item
  ? `${formatDate(item.date)}${item.time ? ` às ${`${item.time}`.slice(0, 5)}` : ''} · ${item.type || 'Atendimento'}`
  : 'Nenhum registro disponível';

export default function Patient360AssistentialSummary({ summary, endpointBase }) {
  const [supplement, setSupplement] = useState({ changes: null, pending: null, loading: true, error: '' });

  useEffect(() => {
    if (!endpointBase) return undefined;
    const controller = new AbortController();
    setSupplement({ changes: null, pending: null, loading: true, error: '' });
    Promise.all([
      apiClient.get(`${endpointBase}/changes`, { signal: controller.signal }),
      apiClient.get(`${endpointBase}/pending`, { signal: controller.signal })
    ]).then(([changes, pending]) => setSupplement({ changes: changes.data, pending: pending.data, loading: false, error: '' }))
      .catch((error) => {
        if (error.name !== 'CanceledError') setSupplement({ changes: null, pending: null, loading: false, error: 'Não foi possível carregar mudanças e pendências.' });
      });
    return () => controller.abort();
  }, [endpointBase]);

  if (!summary) return null;
  const care = summary.care || {};
  const facts = [
    ['Equipe principal', care.primaryTeam?.name || 'Sem equipe principal', Diagram3],
    ['Profissionais ativos', care.activeProfessionals ?? 0, Activity],
    ['Último atendimento', appointmentText(care.lastAppointment), ClockHistory],
    ['Próximo atendimento', appointmentText(care.nextAppointment), Calendar3],
    ['Último registro', care.latestClinicalRecord ? `${formatDate(care.latestClinicalRecord.recorded_at, true)} · ${{ hospital_evolution: 'Evolução hospitalar', legacy_note: 'Nota legada', legacy_progress: 'Progresso legado' }[care.latestClinicalRecord.type] || 'Registro clínico'}` : 'Sem registro disponível', JournalMedical],
    ['Última sessão ABA', care.latestAbaSession ? `${formatDate(care.latestAbaSession.recorded_at)} · ${care.latestAbaSession.program_name || 'Programa ABA'}` : 'Sem sessão disponível', HeartPulse]
  ];

  return (
    <section className="ac360-assistential" aria-labelledby="assistential-title">
      <header><div><span>Síntese baseada em registros existentes</span><h2 id="assistential-title">Resumo assistencial</h2></div><CheckCircle aria-hidden="true" /></header>
      <div className="ac360-assistential__facts">{facts.map(([label, value, Icon]) => <article key={label}>{React.createElement(Icon, { 'aria-hidden': true })}<div><small>{label}</small><strong>{value}</strong></div></article>)}</div>
      <div className="ac360-assistential__availability">
        <span><strong>Monitoramento:</strong> {care.latestMonitoring ? `${care.latestMonitoring.category} · ${formatDate(care.latestMonitoring.recorded_at)}` : 'sem registro disponível'}</span>
        <span><strong>Relatório multidisciplinar:</strong> {care.multidisciplinaryReport?.available ? 'disponível' : 'ainda não implantado'}</span>
        <span><strong>PDI:</strong> {care.pdi?.available ? 'disponível' : 'ainda não implantado'}</span>
      </div>
      {supplement.error ? <Alert variant="warning" className="mt-3 mb-0">{supplement.error}</Alert> : null}
      <div className="ac360-assistential__columns">
        <article><h3><Activity /> Mudanças recentes</h3>{supplement.loading ? <Spinner size="sm" /> : supplement.changes?.items?.length ? <ul>{supplement.changes.items.map((item) => <li key={item.id}><strong>{item.title}</strong><small>{formatDate(item.occurredAt, true)} · {item.sourceType || 'origem registrada'}</small></li>)}</ul> : <p>Nenhuma mudança recente disponível.</p>}</article>
        <article><h3><ExclamationTriangle /> Pendências operacionais</h3>{supplement.loading ? <Spinner size="sm" /> : supplement.pending?.items?.length ? <ul>{supplement.pending.items.map((item) => <li key={item.id}><strong>{item.title}</strong><small>{item.detail} · {formatDate(item.occurredAt, true)}</small></li>)}</ul> : <p>Nenhuma pendência objetiva identificada.</p>}<small className="ac360-assistential__rule">Pendências são regras operacionais explicáveis; não representam conclusão clínica.</small></article>
      </div>
    </section>
  );
}
