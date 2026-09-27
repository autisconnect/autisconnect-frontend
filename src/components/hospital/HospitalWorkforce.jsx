import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Modal, Spinner, Tab, Tabs } from 'react-bootstrap';
import { Diagram3, People, PersonBadge, PersonPlus, PlusLg, Trash } from 'react-bootstrap-icons';
import apiClient from '../../services/api';
import './HospitalWorkforce.css';

export default function HospitalWorkforce({ hospitalId, initialView = 'teams', canManage = false }) {
  const [view, setView] = useState(initialView);
  const [data, setData] = useState({ professionals: [], patients: [], teams: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [teamModal, setTeamModal] = useState(null);
  const [bindModal, setBindModal] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', status: 'active' });
  const [bindForm, setBindForm] = useState({ entityId: '', role: '', isPrimary: false });

  useEffect(() => setView(initialView), [initialView]);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/hospitals/${hospitalId}/workforce`);
      setData(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível carregar profissionais e equipes.');
    } finally { setLoading(false); }
  }, [hospitalId]);
  useEffect(() => { load(); }, [load]);

  const assignedProfessionalIds = useMemo(() => new Set(bindModal?.team?.members.map((item) => Number(item.professionalId)) || []), [bindModal]);
  const assignedPatientIds = useMemo(() => new Set(bindModal?.team?.patients.map((item) => Number(item.patientId)) || []), [bindModal]);

  const saveTeam = async (event) => {
    event.preventDefault();
    try {
      if (teamModal?.id) await apiClient.patch(`/hospitals/${hospitalId}/teams/${teamModal.id}`, teamForm);
      else await apiClient.post(`/hospitals/${hospitalId}/teams`, teamForm);
      setNotice(teamModal?.id ? 'Equipe atualizada.' : 'Equipe criada.');
      setTeamModal(null);
      await load();
    } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível salvar a equipe.'); }
  };

  const bind = async (event) => {
    event.preventDefault();
    const base = `/hospitals/${hospitalId}/teams/${bindModal.team.id}`;
    try {
      if (bindModal.type === 'professional') {
        await apiClient.post(`${base}/professionals`, { professionalId: bindForm.entityId, role: bindForm.role });
      } else {
        await apiClient.post(`${base}/patients`, { patientId: bindForm.entityId, isPrimary: bindForm.isPrimary });
      }
      setNotice(bindModal.type === 'professional' ? 'Profissional vinculado à equipe.' : 'Paciente vinculado à equipe.');
      setBindModal(null);
      await load();
    } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível criar o vínculo.'); }
  };

  const remove = async (teamId, type, entityId) => {
    if (!window.confirm('Remover este vínculo da equipe?')) return;
    try {
      await apiClient.delete(`/hospitals/${hospitalId}/teams/${teamId}/${type}/${entityId}`);
      setNotice('Vínculo removido.');
      await load();
    } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível remover o vínculo.'); }
  };

  const openCreate = () => { setTeamForm({ name: '', description: '', status: 'active' }); setTeamModal({}); };
  const openEdit = (team) => { setTeamForm({ name: team.name, description: team.description || '', status: team.status }); setTeamModal(team); };
  const openBind = (team, type) => { setBindForm({ entityId: '', role: '', isPrimary: false }); setBindModal({ team, type }); };

  if (loading) return <div className="ach-workforce-state" role="status" aria-live="polite"><Spinner animation="border" aria-hidden="true" /><span>Carregando equipe assistencial…</span></div>;
  return (
    <section className="ach-workforce">
      <header><div><span>Gestão assistencial</span><h2>Profissionais e equipes</h2><p>Vínculos sempre limitados ao hospital atual.</p></div>{canManage && view === 'teams' ? <Button onClick={openCreate}><PlusLg /> Nova equipe</Button> : null}</header>
      {error ? <Alert variant="danger" dismissible onClose={() => setError('')}>{error}<Button size="sm" variant="outline-danger" onClick={load}>Tentar novamente</Button></Alert> : null}
      {notice ? <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert> : null}
      <Tabs activeKey={view} onSelect={(key) => setView(key || 'teams')}>
        <Tab eventKey="professionals" title={`Profissionais (${data.professionals.length})`}>
          <div className="ach-professional-list">
            {data.professionals.map((professional) => <article key={professional.id}><span className="ach-person-avatar"><PersonBadge /></span><div><strong>{professional.name}</strong><small>{professional.specialty || 'Especialidade não informada'} · {professional.department || 'Sem setor'}</small><em>AutisConnect #{professional.id}{professional.externalId ? ` · Hospital ${professional.externalId}` : ''}</em></div><Badge bg={professional.status === 'active' ? 'success' : 'secondary'}>{professional.status === 'active' ? 'Ativo' : 'Inativo'}</Badge></article>)}
            {!data.professionals.length ? <div className="ach-workforce-empty">Nenhum profissional vinculado.</div> : null}
          </div>
        </Tab>
        <Tab eventKey="teams" title={`Equipes (${data.teams.length})`}>
          <div className="ach-team-grid">
            {data.teams.map((team) => <article className="ach-team-card" key={team.id}><header><div><Diagram3 /><span><strong>{team.name}</strong><small>{team.description || 'Equipe multidisciplinar'}</small></span></div><Badge bg={team.status === 'active' ? 'primary' : 'secondary'}>{team.status === 'active' ? 'Ativa' : 'Inativa'}</Badge></header><div className="ach-team-columns"><section><h3><People /> Profissionais <small>{team.members.length}</small></h3>{team.members.map((member) => <div className="ach-team-row" key={member.professionalId}><span><strong>{member.name}</strong><small>{member.teamRole || member.specialty || 'Membro'}</small></span>{canManage ? <button type="button" onClick={() => remove(team.id, 'professionals', member.professionalId)} aria-label={`Remover ${member.name}`}><Trash /></button> : null}</div>)}{!team.members.length ? <p>Nenhum profissional.</p> : null}</section><section><h3><PersonBadge /> Pacientes <small>{team.patients.length}</small></h3>{team.patients.map((patient) => <div className="ach-team-row" key={patient.patientId}><span><strong>{patient.name}</strong><small>{patient.externalPatientId || `AutisConnect #${patient.patientId}`}{patient.isPrimary ? ' · Principal' : ''}</small></span>{canManage ? <button type="button" onClick={() => remove(team.id, 'patients', patient.patientId)} aria-label={`Remover ${patient.name}`}><Trash /></button> : null}</div>)}{!team.patients.length ? <p>Nenhum paciente.</p> : null}</section></div>{canManage ? <footer><Button size="sm" variant="outline-primary" onClick={() => openBind(team, 'professional')}><PersonPlus /> Profissional</Button><Button size="sm" variant="outline-primary" onClick={() => openBind(team, 'patient')}><People /> Paciente</Button><Button size="sm" variant="light" onClick={() => openEdit(team)}>Editar</Button></footer> : null}</article>)}
            {!data.teams.length ? <div className="ach-workforce-empty">Nenhuma equipe cadastrada.</div> : null}
          </div>
        </Tab>
      </Tabs>

      <Modal show={teamModal !== null} onHide={() => setTeamModal(null)} centered><Form onSubmit={saveTeam}><Modal.Header closeButton><Modal.Title>{teamModal?.id ? 'Editar equipe' : 'Nova equipe'}</Modal.Title></Modal.Header><Modal.Body><Form.Group className="mb-3"><Form.Label>Nome</Form.Label><Form.Control required maxLength={150} value={teamForm.name} onChange={(e) => setTeamForm((old) => ({ ...old, name: e.target.value }))} /></Form.Group><Form.Group className="mb-3"><Form.Label>Descrição</Form.Label><Form.Control as="textarea" rows={3} value={teamForm.description} onChange={(e) => setTeamForm((old) => ({ ...old, description: e.target.value }))} /></Form.Group>{teamModal?.id ? <Form.Group><Form.Label>Status</Form.Label><Form.Select value={teamForm.status} onChange={(e) => setTeamForm((old) => ({ ...old, status: e.target.value }))}><option value="active">Ativa</option><option value="inactive">Inativa</option></Form.Select></Form.Group> : null}</Modal.Body><Modal.Footer><Button variant="light" onClick={() => setTeamModal(null)}>Cancelar</Button><Button type="submit">Salvar</Button></Modal.Footer></Form></Modal>

      <Modal show={bindModal !== null} onHide={() => setBindModal(null)} centered><Form onSubmit={bind}><Modal.Header closeButton><Modal.Title>{bindModal?.type === 'professional' ? 'Adicionar profissional' : 'Vincular paciente'}</Modal.Title></Modal.Header><Modal.Body><p className="text-muted">Equipe: <strong>{bindModal?.team.name}</strong></p><Form.Group className="mb-3"><Form.Label>{bindModal?.type === 'professional' ? 'Profissional' : 'Paciente'}</Form.Label><Form.Select required value={bindForm.entityId} onChange={(e) => setBindForm((old) => ({ ...old, entityId: e.target.value }))}><option value="">Selecione…</option>{bindModal?.type === 'professional' ? data.professionals.filter((item) => item.status === 'active' && !assignedProfessionalIds.has(Number(item.id))).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.specialty || 'Sem especialidade'}</option>) : data.patients.filter((item) => !assignedPatientIds.has(Number(item.id))).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.externalPatientId || `#${item.id}`}</option>)}</Form.Select></Form.Group>{bindModal?.type === 'professional' ? <Form.Group><Form.Label>Função na equipe</Form.Label><Form.Control maxLength={80} value={bindForm.role} onChange={(e) => setBindForm((old) => ({ ...old, role: e.target.value }))} placeholder="Ex.: profissional de referência" /></Form.Group> : <Form.Check type="switch" label="Definir como equipe principal" checked={bindForm.isPrimary} onChange={(e) => setBindForm((old) => ({ ...old, isPrimary: e.target.checked }))} />}</Modal.Body><Modal.Footer><Button variant="light" onClick={() => setBindModal(null)}>Cancelar</Button><Button type="submit">Vincular</Button></Modal.Footer></Form></Modal>
    </section>
  );
}
