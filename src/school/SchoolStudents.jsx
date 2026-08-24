import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Table } from 'react-bootstrap';
import { Link45deg, PersonLinesFill, Search } from 'react-bootstrap-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import SchoolShell, {
  SchoolEmptyState,
  SchoolSectionCard,
  SchoolStatusBadge,
  formatDateTimeLabel
} from './SchoolShell';
import {
  createSchoolPatientLink,
  fetchSchoolClassrooms,
  fetchSchoolStudents
} from './schoolApi';

const initialLinkForm = {
  patientId: '',
  classroomId: '',
  status: 'pending',
  allowBasicProfile: true,
  allowEmotionMonitoring: false,
  allowBehaviorEvents: false,
  allowSchoolReports: false,
  allowTriggerContext: false,
  allowProfessionalNotes: false
};

export default function SchoolStudents() {
  const navigate = useNavigate();
  const location = useLocation();
  const [payload, setPayload] = useState({ items: [], filters: { classrooms: [] } });
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState(() => {
    const queryParams = new URLSearchParams(location.search);
    return {
      search: '',
      classroomId: queryParams.get('classroomId') || '',
      status: '',
      monitoring: ''
    };
  });
  const [linkForm, setLinkForm] = useState(initialLinkForm);

  useEffect(() => {
    let isMounted = true;

    async function loadClassrooms() {
      try {
        const response = await fetchSchoolClassrooms();
        if (!isMounted) return;
        setClassrooms(response?.items || []);
      } catch (requestError) {
        if (!isMounted) return;
        setClassrooms([]);
      }
    }

    loadClassrooms();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchSchoolStudents({
          search: filters.search || undefined,
          classroomId: filters.classroomId || undefined,
          status: filters.status || undefined,
          monitoring: filters.monitoring || undefined
        });
        if (!isMounted) return;
        setPayload(response || { items: [], filters: { classrooms: [] } });
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Nao foi possivel carregar os alunos da escola.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStudents();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  async function handleCreateLink(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createSchoolPatientLink({
        ...linkForm,
        patientId: Number(linkForm.patientId),
        classroomId: Number(linkForm.classroomId)
      });
      setSuccess('Solicitacao de vinculo escolar registrada com sucesso.');
      setShowLinkModal(false);
      setLinkForm(initialLinkForm);
      const refreshed = await fetchSchoolStudents({
        search: filters.search || undefined,
        classroomId: filters.classroomId || undefined,
        status: filters.status || undefined,
        monitoring: filters.monitoring || undefined
      });
      setPayload(refreshed || { items: [], filters: { classrooms: [] } });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nao foi possivel registrar o vinculo escolar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SchoolShell
      pageKey="students"
      breadcrumb="School / Alunos"
      title="Alunos vinculados"
      description="Acompanhe o status dos vinculos escolares, as permissoes ativas e o historico essencial de cada aluno autorizado."
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {success ? <Alert variant="success" className="ac-school-feedback">{success}</Alert> : null}
        </>
      }
      actions={
        <Button onClick={() => setShowLinkModal(true)}>
          <Link45deg className="me-2" />
          Solicitar vinculo
        </Button>
      }
    >
      <SchoolSectionCard eyebrow="Filtros" title="Pesquisar e organizar">
        <div className="ac-school-form-grid">
          <Form.Group>
            <Form.Label>Pesquisar aluno</Form.Label>
            <div className="position-relative">
              <Search className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
              <Form.Control
                style={{ paddingLeft: '2.5rem' }}
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Nome do aluno"
              />
            </div>
          </Form.Group>

          <Form.Group>
            <Form.Label>Turma</Form.Label>
            <Form.Select
              value={filters.classroomId}
              onChange={(event) => setFilters((current) => ({ ...current, classroomId: event.target.value }))}
            >
              <option value="">Todas as turmas</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Status do vinculo</Form.Label>
            <Form.Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="">Todos</option>
              <option value="approved">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="rejected">Recusado</option>
              <option value="revoked">Revogado</option>
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Monitoramento</Form.Label>
            <Form.Select
              value={filters.monitoring}
              onChange={(event) => setFilters((current) => ({ ...current, monitoring: event.target.value }))}
            >
              <option value="">Todos</option>
              <option value="authorized">Autorizado</option>
              <option value="blocked">Nao autorizado</option>
            </Form.Select>
          </Form.Group>
        </div>
      </SchoolSectionCard>

      <SchoolSectionCard eyebrow="Operacao" title="Tabela de alunos">
        {payload.items.length === 0 ? (
          <SchoolEmptyState
            title="Nenhum aluno vinculado."
            description="Solicite o vinculo de um aluno existente do AutisConnect para iniciar o acompanhamento escolar."
            actionLabel="Solicitar vinculo"
            onAction={() => setShowLinkModal(true)}
            icon={PersonLinesFill}
          />
        ) : (
          <div className="ac-school-table-shell">
            <Table responsive className="ac-school-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Turma</th>
                  <th>Vinculo</th>
                  <th>Monitoramento</th>
                  <th>Ultima sessao</th>
                  <th>Ultimo evento</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {payload.items.map((item) => (
                  <tr key={item.linkId}>
                    <td>
                      <strong>{item.name}</strong>
                      <div className="ac-school-muted">{item.age ? `${item.age} anos` : 'Idade nao informada'}</div>
                    </td>
                    <td>{item.classroomName || 'Sem turma'}</td>
                    <td>
                      <SchoolStatusBadge
                        tone={
                          item.linkStatus === 'approved'
                            ? 'success'
                            : item.linkStatus === 'pending'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {item.linkStatus === 'approved'
                          ? 'Vinculo ativo'
                          : item.linkStatus === 'pending'
                            ? 'Solicitacao enviada'
                            : item.linkStatus === 'revoked'
                              ? 'Revogado'
                              : 'Recusado'}
                      </SchoolStatusBadge>
                    </td>
                    <td>
                      <SchoolStatusBadge tone={item.monitoringAllowed ? 'success' : 'neutral'}>
                        {item.monitoringAllowed ? 'Autorizado' : 'Nao autorizado'}
                      </SchoolStatusBadge>
                    </td>
                    <td>{formatDateTimeLabel(item.lastSessionAt)}</td>
                    <td>{formatDateTimeLabel(item.lastEventAt)}</td>
                    <td>
                      <Button variant="outline-primary" onClick={() => navigate(`/school/students/${item.patientId}`)}>
                        Visualizar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </SchoolSectionCard>

      <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Solicitar vinculo escolar</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateLink}>
          <Modal.Body>
            <Alert variant="light">
              Informe o <strong>ID do paciente</strong> ja existente no AutisConnect. Nesta primeira versao, nao exibimos um diretório amplo de pacientes para preservar privacidade.
            </Alert>

            <div className="ac-school-modal-grid">
              <Form.Group>
                <Form.Label>ID do paciente</Form.Label>
                <Form.Control
                  required
                  value={linkForm.patientId}
                  onChange={(event) => setLinkForm((current) => ({ ...current, patientId: event.target.value }))}
                  placeholder="Ex.: 42"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Turma</Form.Label>
                <Form.Select
                  required
                  value={linkForm.classroomId}
                  onChange={(event) => setLinkForm((current) => ({ ...current, classroomId: event.target.value }))}
                >
                  <option value="">Selecione</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            <div className="mt-4">
              <span className="ac-school-card__eyebrow">Permissoes iniciais</span>
              <div className="ac-school-form-grid">
                <Form.Check
                  type="switch"
                  label="Permitir perfil basico"
                  checked={linkForm.allowBasicProfile}
                  onChange={(event) => setLinkForm((current) => ({ ...current, allowBasicProfile: event.target.checked }))}
                />
                <Form.Check
                  type="switch"
                  label="Permitir monitoramento emocional"
                  checked={linkForm.allowEmotionMonitoring}
                  onChange={(event) => setLinkForm((current) => ({ ...current, allowEmotionMonitoring: event.target.checked }))}
                />
                <Form.Check
                  type="switch"
                  label="Permitir eventos comportamentais"
                  checked={linkForm.allowBehaviorEvents}
                  onChange={(event) => setLinkForm((current) => ({ ...current, allowBehaviorEvents: event.target.checked }))}
                />
                <Form.Check
                  type="switch"
                  label="Permitir relatorios escolares"
                  checked={linkForm.allowSchoolReports}
                  onChange={(event) => setLinkForm((current) => ({ ...current, allowSchoolReports: event.target.checked }))}
                />
                <Form.Check
                  type="switch"
                  label="Permitir registro de contexto"
                  checked={linkForm.allowTriggerContext}
                  onChange={(event) => setLinkForm((current) => ({ ...current, allowTriggerContext: event.target.checked }))}
                />
                <Form.Check
                  type="switch"
                  label="Permitir notas profissionais"
                  checked={linkForm.allowProfessionalNotes}
                  onChange={(event) => setLinkForm((current) => ({ ...current, allowProfessionalNotes: event.target.checked }))}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowLinkModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar solicitacao'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </SchoolShell>
  );
}
