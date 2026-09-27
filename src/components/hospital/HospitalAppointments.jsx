import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Calendar2Check, CheckCircle, Clock, PersonVcard, PlusLg, Search, XCircle } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import './HospitalAppointments.css';

const statusTone = {
  Agendada: 'primary', Confirmada: 'info', Realizada: 'success', Cancelada: 'danger',
  'Não Realizada': 'warning', Remarcada: 'secondary'
};
const formatDate = (value) => value
  ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${`${value}`.slice(0, 10)}T00:00:00Z`))
  : 'Não informado';
const formatTime = (value) => `${value || ''}`.slice(0, 5) || '--:--';

function SummaryCard({ icon: Icon, label, value, tone }) {
  return <div className={`ach-appointments__summary-card is-${tone}`}><Icon /><div><strong>{value ?? 0}</strong><span>{label}</span></div></div>;
}

export default function HospitalAppointments({ hospitalId, canManage = false }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: 'all', professionalId: '', from: '', to: '', page: 1 });
  const [searchDraft, setSearchDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ patientId: '', professionalId: '', date: '', time: '', type: 'Atendimento' }); const [showForm, setShowForm] = useState(false); const [saving, setSaving] = useState(false);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/hospitals/${hospitalId}/appointments`, {
        params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== 'all')),
        signal
      });
      setData(response.data);
    } catch (requestError) {
      if (requestError.name !== 'CanceledError') setError(requestError.response?.data?.error || 'Não foi possível carregar os atendimentos.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filters, hospitalId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const submitSearch = (event) => {
    event.preventDefault();
    setFilters((old) => ({ ...old, search: searchDraft.trim(), page: 1 }));
  };
  const update = (key, value) => setFilters((old) => ({ ...old, [key]: value, page: 1 }));
  const create = async (event) => { event.preventDefault(); setSaving(true); setError(''); try { await apiClient.post(`/hospitals/${hospitalId}/appointments`, form); setShowForm(false); await load(); } catch (e) { setError(e.response?.data?.error || 'Não foi possível agendar o atendimento.'); } finally { setSaving(false); } };
  const transition = async (appointmentId, action) => { setError(''); try { await apiClient.post(`/hospitals/${hospitalId}/appointments/${appointmentId}/${action}`); await load(); } catch (e) { setError(e.response?.data?.error || 'Não foi possível atualizar o atendimento.'); } };
  const items = data?.items || [];
  const summary = data?.summary || {};
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <section className="ach-appointments" aria-labelledby="hospital-appointments-title">
      <header>
        <div><span>Agenda assistencial</span><h2 id="hospital-appointments-title">Atendimentos</h2><p>{data?.scope === 'care_relationship' ? 'Atendimentos dos pacientes sob sua relação assistencial.' : 'Agenda consolidada dos pacientes e profissionais do hospital.'}</p></div>
        <div className="d-flex align-items-center gap-2"><div className="ach-appointments__count"><Calendar2Check /><strong>{pagination.total}</strong><small>registro(s)</small></div>{canManage ? <Button onClick={() => setShowForm(true)}><PlusLg /> Agendar</Button> : null}</div>
      </header>

      <div className="ach-appointments__summary" aria-label="Resumo dos atendimentos filtrados">
        <SummaryCard icon={Calendar2Check} label="Total" value={summary.total} tone="blue" />
        <SummaryCard icon={Clock} label="Hoje" value={summary.today} tone="cyan" />
        <SummaryCard icon={Calendar2Check} label="Próximos" value={summary.upcoming} tone="violet" />
        <SummaryCard icon={CheckCircle} label="Realizados" value={summary.completed} tone="green" />
        <SummaryCard icon={XCircle} label="Cancelados/ausentes" value={summary.cancelled} tone="orange" />
      </div>

      <div className="ach-appointments__filters">
        <form onSubmit={submitSearch} role="search"><Search aria-hidden="true" /><Form.Control value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Paciente, profissional, tipo ou ID" aria-label="Buscar atendimentos" /><Button type="submit">Buscar</Button></form>
        <Form.Select value={filters.status} onChange={(event) => update('status', event.target.value)} aria-label="Filtrar atendimentos por status"><option value="all">Todos os status</option>{data?.filterOptions?.statuses?.map((status) => <option key={status}>{status}</option>)}</Form.Select>
        <Form.Select value={filters.professionalId} onChange={(event) => update('professionalId', event.target.value)} aria-label="Filtrar atendimentos por profissional"><option value="">Todos os profissionais</option>{data?.filterOptions?.professionals?.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}</option>)}</Form.Select>
        <label>De<Form.Control type="date" value={filters.from} onChange={(event) => update('from', event.target.value)} /></label>
        <label>Até<Form.Control type="date" value={filters.to} onChange={(event) => update('to', event.target.value)} /></label>
      </div>

      {error ? <Alert variant="danger">{error}<Button size="sm" variant="outline-danger" onClick={() => load()}>Tentar novamente</Button></Alert> : null}
      {loading && !data ? <div className="ach-appointments__state" role="status"><Spinner animation="border" /><span>Carregando atendimentos…</span></div> : null}
      {!loading && !items.length ? <div className="ach-appointments__state"><Calendar2Check /><div><strong>Nenhum atendimento encontrado</strong><span>Ajuste os filtros ou confirme os vínculos hospitalares.</span></div></div> : null}

      {items.length ? <div className="ach-appointments__table-wrap"><table aria-label="Atendimentos do hospital">
        <thead><tr><th>Data e hora</th><th>Paciente</th><th>Profissional</th><th>Tipo</th><th>Status</th><th><span className="visually-hidden">Ações</span></th></tr></thead>
        <tbody>{items.map((appointment) => <tr key={appointment.id}>
          <td data-label="Data e hora"><strong>{formatDate(appointment.date)}</strong><small>{formatTime(appointment.time)} · #{appointment.id}</small></td>
          <td data-label="Paciente"><strong>{appointment.patientName}</strong><small>{appointment.externalPatientId || `AutisConnect #${appointment.patientId}`}</small></td>
          <td data-label="Profissional"><strong>{appointment.professionalName}</strong><small>{appointment.specialty || 'Especialidade não informada'}</small></td>
          <td data-label="Tipo"><strong>{appointment.type || 'Atendimento'}</strong></td>
          <td data-label="Status"><Badge bg={statusTone[appointment.status] || 'secondary'}>{appointment.status || 'Não informado'}</Badge></td>
          <td>{appointment.canOpenPatient
            ? <Button size="sm" variant="outline-primary" onClick={() => navigate(`/hospital/${hospitalId}/patient/${appointment.patientId}`)} aria-label={`Abrir Patient 360 de ${appointment.patientName}`}><PersonVcard /> Patient 360</Button>
            : <span className="text-muted small d-inline-flex align-items-center gap-1"><PersonVcard /> Relação assistencial necessária</span>}
            {canManage && appointment.status === 'Agendada' ? <Button size="sm" className="mt-1" variant="outline-success" onClick={() => transition(appointment.id, 'confirm')}>Confirmar</Button> : null}{canManage && !['Cancelada', 'Realizada'].includes(appointment.status) ? <Button size="sm" className="mt-1 ms-1" variant="outline-danger" onClick={() => transition(appointment.id, 'cancel')}>Cancelar</Button> : null}
          </td>
        </tr>)}</tbody>
      </table></div> : null}

      {pagination.pages > 1 ? <footer className="ach-appointments__pagination" aria-label="Paginação de atendimentos"><Button variant="outline-primary" disabled={loading || pagination.page <= 1} onClick={() => setFilters((old) => ({ ...old, page: old.page - 1 }))}>Anterior</Button><span>Página {pagination.page} de {pagination.pages}</span><Button variant="outline-primary" disabled={loading || pagination.page >= pagination.pages} onClick={() => setFilters((old) => ({ ...old, page: old.page + 1 }))}>Próxima</Button></footer> : null}
      <Modal show={showForm} onHide={() => !saving && setShowForm(false)} centered><Form onSubmit={create}><Modal.Header closeButton><Modal.Title>Agendar atendimento</Modal.Title></Modal.Header><Modal.Body><Form.Group className="mb-2"><Form.Label>ID AutisConnect do paciente</Form.Label><Form.Control required inputMode="numeric" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value.replace(/\D/g, '') })} /></Form.Group><Form.Group className="mb-2"><Form.Label>Profissional</Form.Label><Form.Select required value={form.professionalId} onChange={(e) => setForm({ ...form, professionalId: e.target.value })}><option value="">Selecione</option>{data?.filterOptions?.professionals?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></Form.Group><Form.Group className="mb-2"><Form.Label>Data</Form.Label><Form.Control required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Form.Group><Form.Group className="mb-2"><Form.Label>Hora</Form.Label><Form.Control required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Form.Group><Form.Group><Form.Label>Tipo</Form.Label><Form.Control required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></Form.Group></Modal.Body><Modal.Footer><Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Agendar'}</Button></Modal.Footer></Form></Modal>
    </section>
  );
}
