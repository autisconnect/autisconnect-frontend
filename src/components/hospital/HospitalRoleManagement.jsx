import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Spinner, Table } from 'react-bootstrap';
import { PersonGear, ShieldCheck, XCircle } from 'react-bootstrap-icons';
import apiClient from '../../services/api';

const ROLE_LABELS = {
  hospital_admin: 'Administrador hospitalar',
  hospital_manager: 'Gestor hospitalar',
  hospital_coordinator: 'Coordenador hospitalar',
  hospital_professional: 'Profissional hospitalar',
  hospital_viewer: 'Consulta hospitalar'
};
const ROLES = Object.keys(ROLE_LABELS);
const permissionLabel = (permission) => permission.replace(/^hospital\./, '').replaceAll('.', ' · ');

export default function HospitalRoleManagement({ hospitalId, canManage }) {
  const [items, setItems] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.get(`/hospitals/${hospitalId}/users/roles`);
      setItems(data.items || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível carregar os papéis hospitalares.');
    } finally { setLoading(false); }
  }, [hospitalId]);
  useEffect(() => { load(); }, [load]);

  const addRole = async (person) => {
    const role = selectedRoles[person.userId];
    if (!role) return;
    const key = `add-${person.userId}`; setBusy(key); setError(''); setSuccess('');
    try {
      await apiClient.post(`/hospitals/${hospitalId}/users/${person.userId}/roles`, { role });
      setSelectedRoles((current) => ({ ...current, [person.userId]: '' }));
      setSuccess(`Papel ${ROLE_LABELS[role] || role} atribuído a ${person.name}.`); await load();
    } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível atribuir o papel.'); }
    finally { setBusy(''); }
  };
  const revokeRole = async (person, role) => {
    const key = `remove-${person.userId}-${role}`; setBusy(key); setError(''); setSuccess('');
    try {
      await apiClient.delete(`/hospitals/${hospitalId}/users/${person.userId}/roles/${encodeURIComponent(role)}`);
      setSuccess(`Papel ${ROLE_LABELS[role] || role} removido de ${person.name}.`); await load();
    } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível remover o papel.'); }
    finally { setBusy(''); }
  };

  return <Card className="ach-settings__card" aria-labelledby="hospital-role-management-title">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3"><div><Card.Title id="hospital-role-management-title"><PersonGear className="me-2" />Papéis e permissões</Card.Title><Card.Text className="text-muted mb-0">Os papéis são acumulativos. A lista de permissões é calculada pelo servidor para este hospital.</Card.Text></div><Button variant="outline-secondary" size="sm" onClick={load} disabled={loading || Boolean(busy)}>Atualizar</Button></div>
      {error ? <Alert variant="danger">{error}</Alert> : null}{success ? <Alert variant="success">{success}</Alert> : null}
      {!canManage ? <Alert variant="info" className="mb-0"><ShieldCheck className="me-2" />Você pode consultar os papéis, mas apenas administradores e gestores podem alterá-los.</Alert> : null}
      {loading ? <div className="ach-loading"><Spinner animation="border" size="sm" /><span>Carregando papéis e permissões…</span></div> : <div className="table-responsive"><Table hover className="align-middle mb-0"><thead><tr><th>Usuário</th><th>Papéis</th><th>Permissões efetivas</th>{canManage ? <th className="text-end">Gerenciar</th> : null}</tr></thead><tbody>{items.map((person) => {
        const availableRoles = ROLES.filter((role) => !person.roles.includes(role));
        return <tr key={person.userId}><td><strong>{person.name}</strong><br /><small className="text-muted">{person.email}</small></td><td><div className="d-flex flex-wrap gap-1">{person.roles.map((role) => <Badge key={role} bg={role === person.primaryRole ? 'primary' : 'secondary'}>{ROLE_LABELS[role] || role}{canManage && role !== person.primaryRole ? <Button variant="link" className="p-0 ms-1 text-white" aria-label={`Remover ${ROLE_LABELS[role]} de ${person.name}`} disabled={busy === `remove-${person.userId}-${role}`} onClick={() => revokeRole(person, role)}><XCircle /></Button> : null}</Badge>)}</div><small className="text-muted d-block mt-1">Principal: {ROLE_LABELS[person.primaryRole] || person.primaryRole}</small></td><td><details><summary>{person.permissions.length} permissões</summary><div className="d-flex flex-wrap gap-1 mt-2">{person.permissions.map((permission) => <Badge bg="light" text="dark" key={permission}>{permissionLabel(permission)}</Badge>)}</div></details></td>{canManage ? <td><div className="d-flex gap-2 justify-content-end"><Form.Select size="sm" aria-label={`Novo papel para ${person.name}`} value={selectedRoles[person.userId] || ''} onChange={(event) => setSelectedRoles((current) => ({ ...current, [person.userId]: event.target.value }))}><option value="">Adicionar papel…</option>{availableRoles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</Form.Select><Button size="sm" onClick={() => addRole(person)} disabled={!selectedRoles[person.userId] || busy === `add-${person.userId}`}>Adicionar</Button></div></td> : null}</tr>;
      })}{items.length === 0 ? <tr><td colSpan={canManage ? 4 : 3} className="text-center text-muted py-4">Não há usuários ativos vinculados a este hospital.</td></tr> : null}</tbody></Table></div>}
    </Card.Body>
  </Card>;
}
