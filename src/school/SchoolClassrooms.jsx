import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { Collection, PlusCircle } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import SchoolShell, {
  SchoolEmptyState,
  SchoolSectionCard,
  SchoolStatusBadge
} from './SchoolShell';
import { createSchoolClassroom, fetchSchoolClassrooms } from './schoolApi';
import { openSchoolMonitoringCenterTab } from './schoolMonitoringLinks';

const initialForm = {
  name: '',
  grade: '',
  shift: '',
  academicYear: String(new Date().getFullYear()),
  teacherUserId: ''
};

export default function SchoolClassrooms() {
  const navigate = useNavigate();
  const [payload, setPayload] = useState({ items: [], teachers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    let isMounted = true;

    async function loadClassrooms() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchSchoolClassrooms();
        if (!isMounted) return;
        setPayload(response || { items: [], teachers: [] });
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Nao foi possivel carregar as turmas da escola.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadClassrooms();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createSchoolClassroom({
        ...form,
        teacherUserId: form.teacherUserId ? Number(form.teacherUserId) : null
      });
      const response = await fetchSchoolClassrooms();
      setPayload(response || { items: [], teachers: [] });
      setSuccess('Turma criada com sucesso.');
      setForm(initialForm);
      setShowModal(false);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nao foi possivel criar a turma.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SchoolShell
      pageKey="classrooms"
      breadcrumb="School / Turmas"
      title="Turmas e organizacao escolar"
      description="Estruture a instituicao em turmas, atribua responsaveis internos e acompanhe a capacidade de monitoramento autorizada."
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {success ? <Alert variant="success" className="ac-school-feedback">{success}</Alert> : null}
        </>
      }
      actions={
        <Button onClick={() => setShowModal(true)}>
          <PlusCircle className="me-2" />
          Nova turma
        </Button>
      }
    >
      <SchoolSectionCard eyebrow="Turmas" title="Visao da instituicao">
        {payload.items.length === 0 ? (
          <SchoolEmptyState
            title="Nenhuma turma cadastrada."
            description="Cadastre ao menos uma turma para organizar o vinculo dos alunos e iniciar o monitoramento escolar."
            actionLabel="Criar turma"
            onAction={() => setShowModal(true)}
            icon={Collection}
          />
        ) : (
          <div className="ac-school-list">
            {payload.items.map((item) => (
              <article key={item.id} className="ac-school-list-card">
                <div>
                  <h4>{item.name}</h4>
                  <p>
                    {item.grade || 'Serie nao informada'} • {item.shift || 'Turno nao informado'}
                  </p>
                  <div className="ac-school-list-card__meta">
                    <span className="ac-school-pill">{item.totalStudents} alunos</span>
                    <span className="ac-school-pill">{item.linkedStudents} vinculados ao AutisConnect</span>
                    <span className="ac-school-pill">{item.authorizedStudents} autorizados para monitoramento</span>
                    <SchoolStatusBadge tone={item.status === 'active' ? 'success' : 'warning'}>
                      {item.status === 'active' ? 'Operacional' : item.status}
                    </SchoolStatusBadge>
                  </div>
                  <div className="ac-school-list-card__meta">
                    <span className="ac-school-muted">Professor: {item.teacherName || 'Nao atribuido'}</span>
                    <span className="ac-school-muted">Sessoes no mes: {item.sessionsThisMonth}</span>
                    <span className="ac-school-muted">Eventos: {item.eventCount}</span>
                  </div>
                </div>
                <div className="ac-school-actions-row">
                  <Button variant="outline-primary" onClick={() => openSchoolMonitoringCenterTab({ classroomId: item.id })}>
                    Monitorar
                  </Button>
                  <Button variant="outline-secondary" onClick={() => navigate(`/school/students?classroomId=${item.id}`)}>
                    Ver alunos
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </SchoolSectionCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Criar turma</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            <div className="ac-school-modal-grid">
              <Form.Group>
                <Form.Label>Nome da turma</Form.Label>
                <Form.Control
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex.: 3º Ano A"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Serie</Form.Label>
                <Form.Control
                  value={form.grade}
                  onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value }))}
                  placeholder="Ex.: Ensino Fundamental"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Turno</Form.Label>
                <Form.Control
                  value={form.shift}
                  onChange={(event) => setForm((current) => ({ ...current, shift: event.target.value }))}
                  placeholder="Ex.: Manha"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Ano letivo</Form.Label>
                <Form.Control
                  value={form.academicYear}
                  onChange={(event) => setForm((current) => ({ ...current, academicYear: event.target.value }))}
                />
              </Form.Group>
            </div>

            <Form.Group className="mt-3">
              <Form.Label>Professor ou responsavel interno</Form.Label>
              <Form.Select
                value={form.teacherUserId}
                onChange={(event) => setForm((current) => ({ ...current, teacherUserId: event.target.value }))}
              >
                <option value="">Nao atribuir agora</option>
                {payload.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} • {teacher.role}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Criar turma'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </SchoolShell>
  );
}
