import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Calendar2Check, PencilSquare, People, PersonPlus, PersonVcard, Search } from 'react-bootstrap-icons';
import apiClient from '../../services/api';
import './HospitalPatients.css';

const date = (value) => value
  ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${`${value}`.slice(0, 10)}T00:00:00Z`))
  : 'Não informado';

const statusLabel = { active: 'Ativo', inactive: 'Inativo', discharged: 'Alta' };
const statusTone = { active: 'success', inactive: 'secondary', discharged: 'info' };

const blankLink = () => ({ patientId: '', externalPatientId: '', admissionDate: new Date().toISOString().slice(0, 10), dischargeDate: '', status: 'active' });

export default function HospitalPatients({ hospitalId, canManage = false }) {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: 'active', teamId: '', page: 1 });
  const [searchDraft, setSearchDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkForm, setLinkForm] = useState(blankLink);
  const [editingLink, setEditingLink] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [savingLink, setSavingLink] = useState(false);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/hospitals/${hospitalId}/patients`, {
        params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')),
        signal
      });
      setData(response.data);
    } catch (requestError) {
      if (requestError.name !== 'CanceledError') setError(requestError.response?.data?.error || 'Não foi possível carregar os pacientes.');
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
  const updateFilter = (key, value) => setFilters((old) => ({ ...old, [key]: value, page: 1 }));
  const openDashboard = (patientId) => {
    const url = new URL(`/hospital/${hospitalId}/patient/${patientId}`, window.location.origin);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };
  const openAdmission = () => { setEditingLink(false); setLinkForm(blankLink()); setError(''); setShowLinkForm(true); };
  const openMaintenance = (patient) => { setEditingLink(true); setLinkForm({ patientId: `${patient.id}`, externalPatientId: patient.externalPatientId || '', admissionDate: `${patient.admissionDate || ''}`.slice(0, 10), dischargeDate: `${patient.dischargeDate || ''}`.slice(0, 10), status: patient.status || 'active' }); setError(''); setShowLinkForm(true); };
  const changeLink = (field, value) => setLinkForm((current) => ({ ...current, [field]: value }));
  const saveLink = async (event) => {
    event.preventDefault(); setSavingLink(true); setError('');
    try {
      if (editingLink) await apiClient.patch(`/hospitals/${hospitalId}/patient-links/${linkForm.patientId}`, { externalPatientId: linkForm.externalPatientId, admissionDate: linkForm.admissionDate, dischargeDate: linkForm.dischargeDate, status: linkForm.status });
      else await apiClient.post(`/hospitals/${hospitalId}/patient-links`, { patientId: linkForm.patientId, externalPatientId: linkForm.externalPatientId, admissionDate: linkForm.admissionDate });
      setShowLinkForm(false); await load();
    } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível salvar o vínculo hospitalar.'); }
    finally { setSavingLink(false); }
  };
  const items = data?.items || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <section className="ach-patients" aria-labelledby="hospital-patients-title">
      <header>
        <div><span>Gestão assistencial</span><h2 id="hospital-patients-title">Pacientes</h2><p>{data?.scope === 'care_relationship' ? 'Pacientes autorizados pelas suas equipes e grants ativos.' : 'Diretório de pacientes vinculados ao hospital.'}</p></div>
        <div className="ach-patients__header-actions"><div className="ach-patients__count"><People /><strong>{pagination.total}</strong><small>paciente(s)</small></div>{canManage ? <Button onClick={openAdmission}><PersonPlus /> Admitir paciente</Button> : null}</div>
      </header>

      <div className="ach-patients__filters">
        <form onSubmit={submitSearch} role="search"><Search aria-hidden="true" /><Form.Control value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Nome, ID hospitalar ou AutisConnect" aria-label="Buscar pacientes" /><Button type="submit">Buscar</Button></form>
        <Form.Select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} aria-label="Filtrar pacientes por status"><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="discharged">Alta</option><option value="all">Todos</option></Form.Select>
        <Form.Select value={filters.teamId} onChange={(event) => updateFilter('teamId', event.target.value)} aria-label="Filtrar pacientes por equipe"><option value="">Todas as equipes</option>{data?.filterOptions?.teams?.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</Form.Select>
      </div>

      {error ? <Alert variant="danger">{error}<Button size="sm" variant="outline-danger" onClick={() => load()}>Tentar novamente</Button></Alert> : null}
      {loading && !data ? <div className="ach-patients__state" role="status"><Spinner animation="border" /><span>Carregando pacientes…</span></div> : null}
      {!loading && !items.length ? <div className="ach-patients__state"><People /><div><strong>Nenhum paciente encontrado</strong><span>Ajuste os filtros ou confirme os vínculos e permissões hospitalares.</span></div></div> : null}

      {items.length ? <div className="ach-patients__table-wrap">
        <table aria-label="Pacientes vinculados ao hospital">
          <thead><tr><th>Paciente</th><th>Identificação</th><th>Equipe</th><th>Acompanhamento</th><th>Status</th><th><span className="visually-hidden">Ações</span></th></tr></thead>
          <tbody>{items.map((patient) => <tr key={patient.id}>
            <td data-label="Paciente"><div className="ach-patients__identity"><span>{patient.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><div><strong>{patient.name}</strong><small>Cadastro hospitalar</small></div></div></td>
            <td data-label="Identificação"><strong>{patient.externalPatientId || 'Sem ID hospitalar'}</strong><small>AutisConnect #{patient.id}</small></td>
            <td data-label="Equipe"><strong>{patient.teams || 'Sem equipe ativa'}</strong><small>{patient.professionalCount} profissional(is)</small></td>
            <td data-label="Acompanhamento"><span><Calendar2Check /> Próximo: {date(patient.nextAppointment)}</span><small>Admissão: {date(patient.admissionDate)}</small></td>
            <td data-label="Status"><Badge bg={statusTone[patient.status] || 'secondary'}>{statusLabel[patient.status] || patient.status}</Badge></td>
            <td>{patient.canOpen
              ? <Button size="sm" variant="outline-primary" onClick={() => openDashboard(patient.id)} aria-label={`Abrir Dashboard do Paciente de ${patient.name} em nova aba`}><PersonVcard /> Dashboard do Paciente</Button>
              : <span className="text-muted small d-inline-flex align-items-center gap-1"><PersonVcard /> Relação assistencial necessária</span>}
              {canManage ? <Button size="sm" variant="outline-secondary" className="mt-1" onClick={() => openMaintenance(patient)} aria-label={`Gerenciar vínculo hospitalar de ${patient.name}`}><PencilSquare /> Vínculo</Button> : null}
            </td>
          </tr>)}</tbody>
        </table>
      </div> : null}

      {pagination.pages > 1 ? <footer className="ach-patients__pagination" aria-label="Paginação de pacientes"><Button variant="outline-primary" disabled={loading || pagination.page <= 1} onClick={() => setFilters((old) => ({ ...old, page: old.page - 1 }))}>Anterior</Button><span>Página {pagination.page} de {pagination.pages}</span><Button variant="outline-primary" disabled={loading || pagination.page >= pagination.pages} onClick={() => setFilters((old) => ({ ...old, page: old.page + 1 }))}>Próxima</Button></footer> : null}
      <Modal show={showLinkForm} onHide={() => !savingLink && setShowLinkForm(false)} centered><Form onSubmit={saveLink}><Modal.Header closeButton><Modal.Title>{editingLink ? 'Manter vínculo hospitalar' : 'Admitir paciente'}</Modal.Title></Modal.Header><Modal.Body><Alert variant="info">O prontuário do paciente não é duplicado. Esta operação altera somente o vínculo com este hospital.</Alert><Form.Group className="mb-3"><Form.Label>ID AutisConnect do paciente</Form.Label><Form.Control required inputMode="numeric" value={linkForm.patientId} disabled={editingLink} onChange={(event) => changeLink('patientId', event.target.value.replace(/\D/g, ''))} /></Form.Group><Form.Group className="mb-3"><Form.Label>ID hospitalar / prontuário externo</Form.Label><Form.Control maxLength={100} value={linkForm.externalPatientId} onChange={(event) => changeLink('externalPatientId', event.target.value)} /></Form.Group><Form.Group className="mb-3"><Form.Label>Data de admissão</Form.Label><Form.Control required type="date" value={linkForm.admissionDate} onChange={(event) => changeLink('admissionDate', event.target.value)} /></Form.Group>{editingLink ? <><Form.Group className="mb-3"><Form.Label>Situação do vínculo</Form.Label><Form.Select value={linkForm.status} onChange={(event) => changeLink('status', event.target.value)}><option value="active">Ativo</option><option value="inactive">Inativo</option><option value="discharged">Alta</option></Form.Select></Form.Group>{linkForm.status === 'discharged' ? <Form.Group><Form.Label>Data de alta</Form.Label><Form.Control type="date" value={linkForm.dischargeDate} onChange={(event) => changeLink('dischargeDate', event.target.value)} /></Form.Group> : null}</> : null}</Modal.Body><Modal.Footer><Button variant="outline-secondary" disabled={savingLink} onClick={() => setShowLinkForm(false)}>Cancelar</Button><Button type="submit" disabled={savingLink}>{savingLink ? 'Salvando…' : editingLink ? 'Salvar vínculo' : 'Confirmar admissão'}</Button></Modal.Footer></Form></Modal>
    </section>
  );
}
