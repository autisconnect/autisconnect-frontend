import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Form, Spinner } from 'react-bootstrap';
import { ArrowRepeat, Check2Square, ClockHistory, ExclamationDiamond, PersonVcard, Search } from 'react-bootstrap-icons';
import apiClient from '../../services/api';
import './HospitalPendingCenter.css';

const typeLabels = {
  appointment_followup: 'Atendimento sem evolução', evolution_review: 'Evolução',
  pdi_review: 'Revisão de PDI', pdi_deadline: 'Prazo do PDI', report_review: 'Relatório'
};
const priorityLabels = { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa' };
const priorityTones = { critical: 'danger', high: 'warning', medium: 'primary', low: 'secondary' };
const formatDate = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Sem prazo definido';

export default function HospitalPendingCenter({ hospitalId }) {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ type: '', priority: '', search: '', page: 1 });
  const [searchDraft, setSearchDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (signal) => {
    setLoading(true); setError('');
    try {
      const { data: result } = await apiClient.get(`/hospitals/${hospitalId}/pending`, { params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')), signal });
      setData(result);
    } catch (requestError) {
      if (requestError.name !== 'CanceledError') setError(requestError.response?.data?.error || 'Não foi possível carregar a Central de Pendências.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [filters, hospitalId]);

  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  const updateFilter = (key, value) => setFilters((old) => ({ ...old, [key]: value, page: 1 }));
  const submitSearch = (event) => { event.preventDefault(); updateFilter('search', searchDraft.trim()); };
  const openPatient = (item) => {
    const url = new URL(`/hospital/${hospitalId}/patient/${item.patient.id}`, window.location.origin);
    if (item.targetSection) url.searchParams.set('section', item.targetSection);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };
  const counts = data?.counts || { total: 0, byPriority: {} };
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return <section className="ach-pending" aria-labelledby="hospital-pending-title">
    <header><div><span>Coordenação assistencial</span><h2 id="hospital-pending-title">Central de Pendências</h2><p>{data?.scope === 'care_relationship' ? 'Itens dos pacientes vinculados às suas equipes e grants ativos.' : 'Fila institucional de ações objetivas que exigem acompanhamento.'}</p></div><Button variant="outline-primary" onClick={() => load()} disabled={loading}><ArrowRepeat /> Atualizar</Button></header>
    <Alert variant="info" className="ach-pending__explanation"><Check2Square /><span><strong>Regras operacionais explicáveis</strong>{data?.rules?.description || 'Os itens são calculados a partir de estados e prazos registrados; não representam conclusão clínica.'}</span></Alert>

    <div className="ach-pending__metrics" aria-label="Resumo das pendências">
      <article><ExclamationDiamond /><span>Total ativo<strong>{counts.total}</strong></span></article>
      <article className="is-critical"><span>Críticas<strong>{counts.byPriority?.critical || 0}</strong></span></article>
      <article className="is-high"><span>Alta prioridade<strong>{counts.byPriority?.high || 0}</strong></span></article>
      <article className="is-review"><span>Em acompanhamento<strong>{(counts.byPriority?.medium || 0) + (counts.byPriority?.low || 0)}</strong></span></article>
    </div>

    <div className="ach-pending__filters">
      <form role="search" onSubmit={submitSearch}><Search /><Form.Control value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} aria-label="Buscar pendências" placeholder="Paciente, responsável ou item" /><Button type="submit">Buscar</Button></form>
      <Form.Select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} aria-label="Filtrar pendências por tipo"><option value="">Todos os tipos</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Form.Select>
      <Form.Select value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)} aria-label="Filtrar pendências por prioridade"><option value="">Todas as prioridades</option>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Form.Select>
    </div>

    {error ? <Alert variant="danger">{error}<Button size="sm" variant="outline-danger" onClick={() => load()}>Tentar novamente</Button></Alert> : null}
    {loading && !data ? <div className="ach-pending__state" role="status"><Spinner animation="border" /><span>Consolidando pendências objetivas…</span></div> : null}
    {!loading && !data?.items?.length ? <div className="ach-pending__state"><Check2Square /><div><strong>Nenhuma pendência encontrada</strong><span>A fila está em dia para os filtros e vínculos atuais.</span></div></div> : null}

    {data?.items?.length ? <div className="ach-pending__list">{data.items.map((item) => <article key={item.id} className={`is-${item.priority}`}>
      <div className="ach-pending__priority"><Badge bg={priorityTones[item.priority]}>{priorityLabels[item.priority]}</Badge><span>{typeLabels[item.type] || item.type}</span></div>
      <div className="ach-pending__body"><h3>{item.title}</h3><p>{item.detail}</p><div><strong>{item.patient.name}</strong><span>{item.patient.externalPatientId || `AutisConnect #${item.patient.id}`}</span></div></div>
      <div className="ach-pending__meta"><span><ClockHistory /> {formatDate(item.dueAt || item.occurredAt)}</span><small>{item.responsible?.name || 'Responsável não definido'}</small>{item.heuristic ? <small>Regra heurística operacional</small> : null}</div>
      <Button variant="outline-primary" size="sm" onClick={() => openPatient(item)} aria-label={`Abrir pendência de ${item.patient.name} no Patient 360`}><PersonVcard /> Abrir no Patient 360</Button>
    </article>)}</div> : null}

    {pagination.pages > 1 ? <footer className="ach-pending__pagination"><Button variant="outline-primary" disabled={loading || pagination.page <= 1} onClick={() => setFilters((old) => ({ ...old, page: old.page - 1 }))}>Anterior</Button><span>Página {pagination.page} de {pagination.pages}</span><Button variant="outline-primary" disabled={loading || pagination.page >= pagination.pages} onClick={() => setFilters((old) => ({ ...old, page: old.page + 1 }))}>Próxima</Button></footer> : null}
  </section>;
}
