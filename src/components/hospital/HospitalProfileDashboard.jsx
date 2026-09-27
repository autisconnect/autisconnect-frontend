import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Spinner } from 'react-bootstrap';
import { ArrowRight, Calendar2Check, Diagram3, ExclamationDiamond, People, PersonVcard, Speedometer2 } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import './HospitalProfileDashboard.css';

const icons = { patients: People, professionals: PersonVcard, teams: Diagram3, appointments: Calendar2Check, pending: ExclamationDiamond };
const priorityTone = { critical: 'danger', high: 'warning', medium: 'primary', low: 'secondary' };

export default function HospitalProfileDashboard({ hospitalId }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async (signal) => {
    setLoading(true); setError('');
    try { const response = await apiClient.get(`/hospitals/${hospitalId}/profile-dashboard`, { signal }); setData(response.data); }
    catch (requestError) { if (requestError.name !== 'CanceledError') setError(requestError.response?.data?.error || 'Não foi possível carregar seu dashboard por perfil.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [hospitalId]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  const openItem = (item) => { if (!item.patientId) return; navigate(`/hospital/${hospitalId}/patient/${item.patientId}${item.targetSection ? `?section=${item.targetSection}` : ''}`); };
  const openPending = (item) => navigate(`/hospital/${hospitalId}/patient/${item.patient.id}${item.targetSection ? `?section=${item.targetSection}` : ''}`);
  if (loading && !data) return <div className="ach-profile__state" role="status"><Spinner animation="border" /><span>Preparando dashboard do seu perfil…</span></div>;
  if (error) return <Alert variant="danger" className="ach-profile__error">{error}<Button size="sm" variant="outline-danger" onClick={() => load()}>Tentar novamente</Button></Alert>;
  if (!data) return null;
  return <section className="ach-profile" aria-labelledby="hospital-profile-title">
    <header><div><span><Speedometer2 /> Dashboard por perfil</span><h2 id="hospital-profile-title">{data.profile.label}</h2><p>{data.profile.description}</p></div>{data.pending ? <Button variant="outline-primary" size="sm" onClick={() => document.querySelector('[data-hospital-menu="pending"]')?.click()}>Ver Central de Pendências <ArrowRight /></Button> : null}</header>
    <div className="ach-profile__metrics">{data.metrics.map((metric) => { const Icon = icons[metric.key] || Speedometer2; return <article key={metric.key} className={`is-${metric.tone}`}><Icon /><span><small>{metric.label}</small><strong>{metric.value}</strong></span></article>; })}</div>
    <div className="ach-profile__grid">
      <article><header><div><span>Prioridade imediata</span><h3>{data.focus.title}</h3></div></header>{data.focus.items?.length ? <div className="ach-profile__list">{data.focus.items.map((item) => <button type="button" key={item.id} onClick={() => openItem(item)}><Calendar2Check /><span><strong>{item.label}</strong><small>{item.detail}</small></span><ArrowRight /></button>)}</div> : <p className="ach-profile__empty">Não há itens disponíveis para este perfil.</p>}</article>
      {data.teams?.length ? <article><header><div><span>Capacidade assistencial</span><h3>Equipes em atividade</h3></div></header><div className="ach-profile__teams">{data.teams.map((team) => <div key={team.id}><Diagram3 /><span><strong>{team.name}</strong><small>{team.patientCount} paciente(s) · {team.professionalCount} profissional(is)</small></span></div>)}</div></article> : null}
      {data.pending ? <article><header><div><span>Continuidade do cuidado</span><h3>Fila de pendências</h3></div><strong className="ach-profile__total">{data.pending.total}</strong></header>{data.pending.items?.length ? <div className="ach-profile__list">{data.pending.items.map((item) => <button type="button" key={item.id} onClick={() => openPending(item)}><Badge bg={priorityTone[item.priority] || 'secondary'}>{item.priority}</Badge><span><strong>{item.patient.name}</strong><small>{item.title}</small></span><ArrowRight /></button>)}</div> : <p className="ach-profile__empty">Nenhuma pendência para os vínculos atuais.</p>}</article> : null}
    </div>
  </section>;
}
