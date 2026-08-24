import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Table } from 'react-bootstrap';
import { PersonBadge, PlusCircle } from 'react-bootstrap-icons';
import SchoolShell, {
  SchoolEmptyState,
  SchoolSectionCard,
  SchoolStatusBadge
} from './SchoolShell';
import {
  createSchoolTeamMember,
  fetchSchoolTeam,
  updateSchoolTeamMember
} from './schoolApi';

const initialForm = {
  id: null,
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'school_teacher',
  status: 'active'
};

const roleOptions = [
  { value: 'school_admin', label: 'School Admin' },
  { value: 'school_coordinator', label: 'Coordenacao' },
  { value: 'school_teacher', label: 'Professor' },
  { value: 'school_assistant', label: 'Acompanhante' },
  { value: 'school_psychopedagogue', label: 'Psicopedagogo' }
];

export default function SchoolTeam() {
  const [payload, setPayload] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    let isMounted = true;

    async function loadTeam() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchSchoolTeam();
        if (!isMounted) return;
        setPayload(response || { items: [] });
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Nao foi possivel carregar a equipe escolar.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTeam();
    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshTeam() {
    const response = await fetchSchoolTeam();
    setPayload(response || { items: [] });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (form.id) {
        await updateSchoolTeamMember(form.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          status: form.status
        });
        setSuccess('Equipe escolar atualizada com sucesso.');
      } else {
        await createSchoolTeamMember(form);
        setSuccess('Novo membro cadastrado com sucesso.');
      }

      await refreshTeam();
      setShowModal(false);
      setForm(initialForm);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nao foi possivel salvar a equipe escolar.');
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(member) {
    setForm({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      password: '',
      role: member.role,
      status: member.status || 'active'
    });
    setShowModal(true);
  }

  return (
    <SchoolShell
      pageKey="team"
      breadcrumb="School / Equipe"
      title="Equipe interna autorizada"
      description="Gerencie perfis internos, papeis escolares e os profissionais autorizados a operar a area School."
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {success ? <Alert variant="success" className="ac-school-feedback">{success}</Alert> : null}
        </>
      }
      actions={
        <Button onClick={() => { setForm(initialForm); setShowModal(true); }}>
          <PlusCircle className="me-2" />
          Novo membro
        </Button>
      }
    >
      <SchoolSectionCard eyebrow="Equipe" title="Responsaveis internos">
        {payload.items.length === 0 ? (
          <SchoolEmptyState
            title="Nenhum membro interno cadastrado."
            description="Adicione coordenadores, professores e acompanhantes autorizados para estruturar a operacao escolar."
            actionLabel="Cadastrar membro"
            onAction={() => { setForm(initialForm); setShowModal(true); }}
            icon={PersonBadge}
          />
        ) : (
          <div className="ac-school-table-shell">
            <Table responsive className="ac-school-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {payload.items.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.name}</strong>
                    </td>
                    <td>{member.email}</td>
                    <td>{member.role}</td>
                    <td>
                      <SchoolStatusBadge tone={member.status === 'active' ? 'success' : 'warning'}>
                        {member.status === 'active' ? 'Ativo' : member.status}
                      </SchoolStatusBadge>
                    </td>
                    <td>
                      <Button variant="outline-primary" onClick={() => openEditModal(member)}>
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </SchoolSectionCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{form.id ? 'Editar membro da equipe' : 'Cadastrar membro da equipe'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="ac-school-modal-grid">
              <Form.Group>
                <Form.Label>Nome completo</Form.Label>
                <Form.Control
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Papel interno</Form.Label>
                <Form.Select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            {!form.id ? (
              <Form.Group className="mt-3">
                <Form.Label>Senha inicial</Form.Label>
                <Form.Control
                  required
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                />
              </Form.Group>
            ) : (
              <Form.Group className="mt-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </Form.Select>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </SchoolShell>
  );
}
