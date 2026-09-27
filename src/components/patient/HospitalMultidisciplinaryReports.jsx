import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Check2Circle, ClockHistory, Download, FileEarmarkMedical, PlusLg } from 'react-bootstrap-icons';
import apiClient from '../../services/api';
import './HospitalMultidisciplinaryReports.css';

const labels = { draft: 'Rascunho', in_review: 'Em revisão', finalized: 'Finalizado', archived: 'Arquivado' };
const tones = { draft: 'secondary', in_review: 'warning', finalized: 'success', archived: 'dark' };
const sourceLabels = { evolutions: 'Evoluções finalizadas', aba: 'ABA', activities: 'Atividades', monitoring: 'Monitoramentos autorizados', pdi: 'PDI' };
const blank = () => ({
  title: '', periodFrom: '', periodTo: '', participantIds: '', professionalIds: '', specialties: '',
  sources: Object.keys(sourceLabels), summary: '', evolutionSummary: '', objectivesSummary: '', followUpSummary: '',
  observationalData: '', multidisciplinaryInformation: '', changeReason: '', assistedByAi: false
});
const fmt = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(`${value}`.slice(0, 10) + 'T12:00:00')) : '—';
const ids = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

export default function HospitalMultidisciplinaryReports({ hospitalId, patientId, capabilities = {} }) {
  const endpoint = `/hospitals/${hospitalId}/patients/${patientId}/multidisciplinary-reports`;
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [form, setForm] = useState(blank()); const [editingId, setEditingId] = useState(null); const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false); const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setState((old) => ({ ...old, loading: true, error: '' }));
    try { const { data } = await apiClient.get(endpoint); setState({ items: data.items || [], loading: false, error: '' }); }
    catch (error) { setState({ items: [], loading: false, error: error.response?.data?.error || 'Não foi possível carregar os relatórios.' }); }
  }, [endpoint]);
  useEffect(() => { load(); }, [load]);

  const payload = () => ({
    ...form, participantIds: ids(form.participantIds), professionalIds: ids(form.professionalIds),
    specialties: form.specialties.split(',').map((item) => item.trim()).filter(Boolean), assistedByAi: false
  });
  const save = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      if (editingId) await apiClient.patch(`${endpoint}/${editingId}`, payload()); else await apiClient.post(endpoint, payload());
      setShowForm(false); setEditingId(null); setForm(blank()); await load();
    } catch (error) { setState((old) => ({ ...old, error: error.response?.data?.error || 'Não foi possível salvar o relatório.' })); }
    finally { setSaving(false); }
  };
  const action = async (item, operation) => {
    setSaving(true);
    try { await apiClient.post(`${endpoint}/${item.id}/${operation}`); await load(); }
    catch (error) { setState((old) => ({ ...old, error: error.response?.data?.error || 'Não foi possível atualizar o relatório.' })); }
    finally { setSaving(false); }
  };
  const detail = async (item, revise = false) => {
    try {
      const { data } = await apiClient.get(`${endpoint}/${item.id}`);
      if (!revise) return setSelected(data);
      const current = data.versions.find((version) => Number(version.version_number) === Number(data.current_version)) || data.versions[0];
      const filters = current?.source_filters || {};
      setEditingId(item.id);
      setForm({
        title: data.title, periodFrom: data.period_from || '', periodTo: data.period_to || '',
        participantIds: data.participants.map((person) => person.professionalId).join(', '), professionalIds: (filters.professionalIds || []).join(', '),
        specialties: (filters.specialties || []).join(', '), sources: filters.sources || Object.keys(sourceLabels),
        summary: current?.summary || '', evolutionSummary: current?.evolution_summary || '', objectivesSummary: current?.objectives_summary || '',
        followUpSummary: current?.follow_up_summary || '', observationalData: current?.observational_data || '',
        multidisciplinaryInformation: current?.multidisciplinary_information || '', changeReason: '', assistedByAi: false
      });
      setShowForm(true);
    } catch (error) { setState((old) => ({ ...old, error: error.response?.data?.error || 'Não foi possível consultar o relatório.' })); }
  };
  const exportPdf = async (item) => {
    try {
      const { data } = await apiClient.get(`${endpoint}/${item.id}/export.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' })); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `relatorio-multidisciplinar-${item.id}-v${item.current_version}.pdf`; anchor.click(); URL.revokeObjectURL(url);
    } catch (error) { setState((old) => ({ ...old, error: error.response?.data?.error || 'Não foi possível exportar o PDF.' })); }
  };
  const toggleSource = (source) => setForm((old) => ({ ...old, sources: old.sources.includes(source) ? old.sources.filter((item) => item !== source) : [...old.sources, source] }));

  if (state.loading) return <div className="ac-report-state"><Spinner size="sm" /><span>Carregando relatórios multidisciplinares…</span></div>;
  return <section className="ac-report" aria-labelledby="report-title">
    <header><div><span>Documento longitudinal versionado</span><h2 id="report-title">Relatório multidisciplinar</h2></div>{capabilities.reportCreate ? <Button size="sm" onClick={() => { setEditingId(null); setForm(blank()); setShowForm(true); }}><PlusLg /> Novo relatório</Button> : null}</header>
    <Alert variant="info">O relatório reúne somente fontes autorizadas do período selecionado. Finalização e assinatura são sempre ações humanas.</Alert>
    {state.error ? <Alert variant="danger" dismissible onClose={() => setState((old) => ({ ...old, error: '' }))}>{state.error}</Alert> : null}
    {state.items.length ? <div className="ac-report-list">{state.items.map((item) => <article key={item.id}><div className="ac-report-list__identity"><FileEarmarkMedical /><div><div><h3>{item.title}</h3><Badge bg={tones[item.status]}>{labels[item.status]}</Badge></div><p>{fmt(item.period_from)} a {fmt(item.period_to)} · versão {item.current_version}</p><small>{item.participant_count} profissional(is) participante(s)</small></div></div><div className="ac-report-actions"><Button size="sm" variant="outline-secondary" onClick={() => detail(item)}><ClockHistory /> Histórico</Button>{item.allowedActions?.edit || item.allowedActions?.revise ? <Button size="sm" variant="outline-primary" onClick={() => detail(item, true)}>Criar revisão</Button> : null}{item.allowedActions?.submitReview ? <Button size="sm" variant="outline-primary" onClick={() => action(item, 'review')}>Enviar para revisão</Button> : null}{item.allowedActions?.finalize ? <Button size="sm" variant="success" onClick={() => action(item, 'finalize')}><Check2Circle /> Revisar e finalizar</Button> : null}{item.allowedActions?.export ? <Button size="sm" onClick={() => exportPdf(item)}><Download /> Exportar PDF</Button> : null}</div></article>)}</div> : <div className="ac360-empty">Nenhum relatório multidisciplinar criado para este paciente.</div>}

    <Modal show={showForm} onHide={() => !saving && setShowForm(false)} centered size="xl"><Form onSubmit={save}><Modal.Header closeButton><Modal.Title>{editingId ? 'Nova versão do relatório' : 'Novo relatório — rascunho'}</Modal.Title></Modal.Header><Modal.Body>
      <div className="ac-report-form"><Form.Group controlId="report-form-title"><Form.Label>Título</Form.Label><Form.Control required maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Form.Group><Form.Group controlId="report-form-participants"><Form.Label>IDs dos profissionais participantes</Form.Label><Form.Control value={form.participantIds} onChange={(event) => setForm({ ...form, participantIds: event.target.value })} placeholder="Ex.: 12, 18" /></Form.Group><Form.Group controlId="report-form-from"><Form.Label>Início do período</Form.Label><Form.Control required type="date" value={form.periodFrom} onChange={(event) => setForm({ ...form, periodFrom: event.target.value })} /></Form.Group><Form.Group controlId="report-form-to"><Form.Label>Fim do período</Form.Label><Form.Control required type="date" value={form.periodTo} onChange={(event) => setForm({ ...form, periodTo: event.target.value })} /></Form.Group><Form.Group controlId="report-form-professionals"><Form.Label>Filtrar profissionais por ID</Form.Label><Form.Control value={form.professionalIds} onChange={(event) => setForm({ ...form, professionalIds: event.target.value })} placeholder="Opcional" /></Form.Group><Form.Group controlId="report-form-specialties"><Form.Label>Filtrar especialidades</Form.Label><Form.Control value={form.specialties} onChange={(event) => setForm({ ...form, specialties: event.target.value })} placeholder="Fonoaudiologia, Psicologia" /></Form.Group></div>
      <fieldset className="ac-report-sources"><legend>Fontes autorizadas incluídas</legend>{Object.entries(sourceLabels).map(([value, label]) => <Form.Check key={value} type="checkbox" id={`report-source-${value}`} label={label} checked={form.sources.includes(value)} onChange={() => toggleSource(value)} />)}</fieldset>
      <div className="ac-report-sections">{[['summary', 'Resumo'], ['evolutionSummary', 'Evoluções'], ['objectivesSummary', 'Objetivos'], ['followUpSummary', 'Acompanhamento'], ['observationalData', 'Dados observacionais'], ['multidisciplinaryInformation', 'Informações multidisciplinares']].map(([field, label]) => <Form.Group key={field} controlId={`report-form-${field}`}><Form.Label>{label}</Form.Label><Form.Control as="textarea" rows={3} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></Form.Group>)}{editingId ? <Form.Group controlId="report-form-change-reason"><Form.Label>Motivo da nova versão</Form.Label><Form.Control required maxLength={500} value={form.changeReason} onChange={(event) => setForm({ ...form, changeReason: event.target.value })} /></Form.Group> : null}</div>
      <Alert variant="secondary">A geração assistida por IA não está habilitada neste ambiente. Nenhum texto clínico será produzido automaticamente.</Alert>
    </Modal.Body><Modal.Footer><Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando…' : editingId ? 'Salvar nova versão' : 'Salvar rascunho'}</Button></Modal.Footer></Form></Modal>

    <Modal show={Boolean(selected)} onHide={() => setSelected(null)} centered size="xl"><Modal.Header closeButton><Modal.Title>Histórico do relatório</Modal.Title></Modal.Header><Modal.Body><h3 className="h6">{selected?.title}</h3><p>{selected?.participants?.map((person) => `${person.name}${person.specialty ? ` · ${person.specialty}` : ''}`).join(', ') || 'Sem participantes informados'}</p><div className="ac-report-history">{selected?.versions?.map((version) => <article key={version.id}><header><strong>Versão {version.version_number}</strong><small>{version.change_reason}</small></header><p>{version.summary || 'Sem resumo.'}</p><dl><div><dt>Evoluções</dt><dd>{version.source_snapshot?.counts?.evolutions ?? 0}</dd></div><div><dt>PDIs</dt><dd>{version.source_snapshot?.counts?.pdis ?? 0}</dd></div><div><dt>Registros observacionais</dt><dd>{version.source_snapshot?.counts?.observations ?? 0}</dd></div></dl>{version.assisted_by_ai ? <Alert variant="warning">Conteúdo gerado com apoio de IA. Revise antes de utilizar.</Alert> : null}</article>)}</div></Modal.Body></Modal>
  </section>;
}
