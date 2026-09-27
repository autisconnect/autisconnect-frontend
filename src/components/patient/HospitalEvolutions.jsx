import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Check2Circle, ClockHistory, FileEarmarkMedical, PencilSquare, PlusLg } from 'react-bootstrap-icons';
import apiClient from '../../services/api';
import './HospitalEvolutions.css';

const labels = { draft: 'Rascunho', in_review: 'Em revisão', finalized: 'Finalizada' };
const tones = { draft: 'secondary', in_review: 'warning', finalized: 'success' };
const emptyForm = { title: '', specialty: '', appointmentId: '', observations: '', conduct: '', freeText: '' };
const date = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';

export default function HospitalEvolutions({ hospitalId, patientId, capabilities = {} }) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const endpoint = `/hospitals/${hospitalId}/patients/${patientId}/evolutions`;

  const load = useCallback(async () => {
    setState((old) => ({ ...old, loading: true, error: '' }));
    try {
      const { data } = await apiClient.get(endpoint);
      setState({ items: data.items || [], loading: false, error: '' });
    } catch (error) {
      setState({ items: [], loading: false, error: error.response?.data?.error || 'Não foi possível carregar as evoluções.' });
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const create = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      await apiClient.post(endpoint, {
        title: form.title, specialty: form.specialty || null,
        appointmentId: form.appointmentId || null, freeText: form.freeText || null,
        structuredContent: { observations: form.observations || null, conduct: form.conduct || null }
      });
      setForm(emptyForm); setShowForm(false); await load();
    } catch (error) { setState((old) => ({ ...old, error: error.response?.data?.error || 'Não foi possível salvar o rascunho.' })); }
    finally { setSaving(false); }
  };

  const action = async (item, operation) => {
    setSaving(true);
    try {
      await apiClient.post(`${endpoint}/${item.id}/${operation}`);
      await load();
    } catch (error) { setState((old) => ({ ...old, error: error.response?.data?.error || 'Não foi possível atualizar a evolução.' })); }
    finally { setSaving(false); }
  };

  const openHistory = async (item) => {
    try { const { data } = await apiClient.get(`${endpoint}/${item.id}`); setSelected(data); }
    catch (error) { setState((old) => ({ ...old, error: error.response?.data?.error || 'Não foi possível consultar o histórico.' })); }
  };

  if (state.loading) return <div className="ac-evolution-state"><Spinner size="sm" /><span>Carregando evoluções estruturadas…</span></div>;
  return (
    <section className="ac-evolutions" aria-labelledby="hospital-evolutions-title">
      <header><div><span>Registro multiprofissional versionado</span><h2 id="hospital-evolutions-title">Evoluções hospitalares</h2></div>{capabilities.evolutionCreate ? <Button size="sm" onClick={() => setShowForm(true)}><PlusLg /> Nova evolução</Button> : null}</header>
      {state.error ? <Alert variant="danger" dismissible onClose={() => setState((old) => ({ ...old, error: '' }))}>{state.error}</Alert> : null}
      {state.items.length ? <div className="ac-evolution-list">{state.items.map((item) => <article key={item.id}>
        <div className="ac-evolution-list__main"><FileEarmarkMedical /><div><div className="ac-evolution-list__title"><h3>{item.title}</h3><Badge bg={tones[item.status] || 'secondary'}>{labels[item.status] || item.status}</Badge></div><p>{item.freeText || item.structuredContent?.observations || 'Registro estruturado sem narrativa livre.'}</p><small>{item.professionalName} · {item.specialty || 'Especialidade não informada'} · versão {item.currentVersion} · {date(item.updatedAt)}</small></div></div>
        <div className="ac-evolution-list__actions"><Button size="sm" variant="outline-secondary" onClick={() => openHistory(item)}><ClockHistory /> Histórico</Button>{item.allowedActions?.submitReview ? <Button size="sm" variant="outline-primary" disabled={saving} onClick={() => action(item, 'review')}><PencilSquare /> Enviar para revisão</Button> : null}{item.allowedActions?.finalize ? <Button size="sm" variant="success" disabled={saving} onClick={() => action(item, 'finalize')}><Check2Circle /> Finalizar e assinar</Button> : null}</div>
      </article>)}</div> : <div className="ac360-empty">Nenhuma evolução hospitalar registrada. Os registros legados continuam preservados abaixo.</div>}

      <Modal show={showForm} onHide={() => !saving && setShowForm(false)} centered size="lg">
        <Form onSubmit={create}><Modal.Header closeButton><Modal.Title>Nova evolução — rascunho</Modal.Title></Modal.Header><Modal.Body><Alert variant="info">O registro será criado como rascunho e poderá ser revisado antes da finalização.</Alert><div className="ac-evolution-form"><Form.Group controlId="evolution-title"><Form.Label>Título</Form.Label><Form.Control required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Form.Group><Form.Group controlId="evolution-specialty"><Form.Label>Especialidade</Form.Label><Form.Control maxLength={150} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Preenchida pelo vínculo se deixada em branco" /></Form.Group><Form.Group controlId="evolution-appointment"><Form.Label>ID do atendimento relacionado (opcional)</Form.Label><Form.Control type="number" min="1" value={form.appointmentId} onChange={(e) => setForm({ ...form, appointmentId: e.target.value })} /></Form.Group><Form.Group controlId="evolution-observations" className="is-wide"><Form.Label>Observações estruturadas</Form.Label><Form.Control as="textarea" rows={3} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} /></Form.Group><Form.Group controlId="evolution-conduct" className="is-wide"><Form.Label>Conduta / próximos passos</Form.Label><Form.Control as="textarea" rows={3} value={form.conduct} onChange={(e) => setForm({ ...form, conduct: e.target.value })} /></Form.Group><Form.Group controlId="evolution-free-text" className="is-wide"><Form.Label>Narrativa livre complementar</Form.Label><Form.Control as="textarea" rows={4} maxLength={30000} value={form.freeText} onChange={(e) => setForm({ ...form, freeText: e.target.value })} /></Form.Group></div></Modal.Body><Modal.Footer><Button variant="outline-secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar rascunho'}</Button></Modal.Footer></Form>
      </Modal>

      <Modal show={Boolean(selected)} onHide={() => setSelected(null)} centered size="lg"><Modal.Header closeButton><Modal.Title>Histórico versionado</Modal.Title></Modal.Header><Modal.Body><h3 className="h6">{selected?.title}</h3><div className="ac-evolution-history">{selected?.versions?.map((version) => <article key={version.id}><div><strong>Versão {version.version_number}</strong><Badge bg={version.version_type === 'addendum' ? 'info' : 'light'} text={version.version_type === 'addendum' ? undefined : 'dark'}>{version.version_type === 'addendum' ? 'Adendo' : 'Conteúdo'}</Badge></div><p>{version.free_text || version.structured_content?.observations || 'Conteúdo estruturado'}</p><small>{version.change_reason || 'Sem justificativa'} · {date(version.created_at)}</small></article>)}</div></Modal.Body></Modal>
    </section>
  );
}
