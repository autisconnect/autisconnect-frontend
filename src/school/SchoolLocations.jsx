import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { GeoAlt, PencilSquare, PlusCircle } from 'react-bootstrap-icons';
import SchoolShell, {
  SchoolEmptyState,
  SchoolSectionCard,
  SchoolStatusBadge
} from './SchoolShell';
import {
  createSchoolLocation,
  fetchSchoolClassrooms,
  fetchSchoolLocations,
  updateSchoolLocation
} from './schoolApi';

const LOCATION_OPTIONS = [
  { value: 'classroom', label: 'Sala de aula' },
  { value: 'sensory_room', label: 'Sala sensorial' },
  { value: 'resource_room', label: 'Sala de recursos' },
  { value: 'cafeteria', label: 'Refeitório' },
  { value: 'playground', label: 'Pátio' },
  { value: 'library', label: 'Biblioteca' },
  { value: 'gym', label: 'Quadra' },
  { value: 'hallway', label: 'Corredor' },
  { value: 'common_area', label: 'Área comum' },
  { value: 'other', label: 'Outro' }
];

const initialForm = {
  id: null,
  name: '',
  type: 'classroom',
  description: '',
  floor: '',
  status: 'active',
  primaryClassroomId: '',
  classroomIds: []
};

export default function SchoolLocations() {
  const [locations, setLocations] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [locationResponse, classroomResponse] = await Promise.all([
          fetchSchoolLocations(),
          fetchSchoolClassrooms()
        ]);

        if (!isMounted) return;
        setLocations(locationResponse?.items || []);
        setClassrooms(classroomResponse?.items || []);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Não foi possível carregar os ambientes escolares.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  function openCreateModal() {
    setForm(initialForm);
    setShowModal(true);
  }

  function openEditModal(location) {
    setForm({
      id: location.id,
      name: location.name,
      type: location.type,
      description: location.description || '',
      floor: location.floor || '',
      status: location.status || 'active',
      primaryClassroomId: location.primaryClassroomId ? String(location.primaryClassroomId) : '',
      classroomIds: []
    });
    setShowModal(true);
  }

  async function reloadLocations() {
    const response = await fetchSchoolLocations();
    setLocations(response?.items || []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name,
        type: form.type,
        description: form.description,
        floor: form.floor,
        status: form.status,
        primaryClassroomId: form.primaryClassroomId ? Number(form.primaryClassroomId) : null,
        classroomIds: form.classroomIds.map((item) => Number(item))
      };

      if (form.id) {
        await updateSchoolLocation(form.id, payload);
        setSuccess('Ambiente atualizado com sucesso.');
      } else {
        await createSchoolLocation(payload);
        setSuccess('Ambiente criado com sucesso.');
      }

      await reloadLocations();
      setShowModal(false);
      setForm(initialForm);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível salvar o ambiente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SchoolShell
      pageKey="locations"
      breadcrumb="School / Ambientes"
      title="Ambientes da instituição"
      description="Organize salas, áreas comuns e espaços compartilhados para que o monitoramento escolar seja guiado pelo ambiente físico."
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {success ? <Alert variant="success" className="ac-school-feedback">{success}</Alert> : null}
        </>
      }
      actions={
        <Button onClick={openCreateModal}>
          <PlusCircle className="me-2" />
          Novo ambiente
        </Button>
      }
    >
      <SchoolSectionCard eyebrow="Ambientes" title="Mapa operacional">
        {locations.length === 0 ? (
          <SchoolEmptyState
            title="Nenhum ambiente cadastrado"
            description="Cadastre salas, áreas comuns e espaços compartilhados para estruturar a central de câmeras."
            actionLabel="Criar ambiente"
            onAction={openCreateModal}
            icon={GeoAlt}
          />
        ) : (
          <div className="ac-school-list">
            {locations.map((location) => (
              <article key={location.id} className="ac-school-list-card">
                <div>
                  <h4>{location.name}</h4>
                  <p>{LOCATION_OPTIONS.find((option) => option.value === location.type)?.label || location.type}</p>
                  <div className="ac-school-list-card__meta">
                    <span className="ac-school-pill">{location.cameraCount || 0} câmeras</span>
                    <span className="ac-school-pill">{location.classroomCount || 0} turmas relacionadas</span>
                    <span className="ac-school-pill">{location.activeSessionCount || 0} sessões ativas</span>
                    <SchoolStatusBadge tone={location.status === 'active' ? 'success' : 'neutral'}>
                      {location.status === 'active' ? 'Operacional' : location.status}
                    </SchoolStatusBadge>
                  </div>
                  <div className="ac-school-list-card__meta">
                    <span className="ac-school-muted">Turma principal: {location.primaryClassroomName || 'Não definida'}</span>
                    <span className="ac-school-muted">Piso: {location.floor || 'Não informado'}</span>
                  </div>
                </div>
                <Button variant="outline-primary" onClick={() => openEditModal(location)}>
                  <PencilSquare className="me-2" />
                  Editar
                </Button>
              </article>
            ))}
          </div>
        )}
      </SchoolSectionCard>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{form.id ? 'Editar ambiente' : 'Criar ambiente'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="ac-school-form-grid">
              <Form.Group>
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Tipo</Form.Label>
                <Form.Select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                >
                  {LOCATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Piso</Form.Label>
                <Form.Control
                  value={form.floor}
                  onChange={(event) => setForm((current) => ({ ...current, floor: event.target.value }))}
                  placeholder="Ex.: Térreo"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </Form.Select>
              </Form.Group>
            </div>

            <Form.Group className="mt-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Turma principal</Form.Label>
              <Form.Select
                value={form.primaryClassroomId}
                onChange={(event) => setForm((current) => ({ ...current, primaryClassroomId: event.target.value }))}
              >
                <option value="">Não definir agora</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
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
              {submitting ? 'Salvando...' : 'Salvar ambiente'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </SchoolShell>
  );
}
