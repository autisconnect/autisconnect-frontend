import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { Activity } from 'react-bootstrap-icons';
import SchoolShell, {
  SchoolEmptyState,
  SchoolSectionCard,
  SchoolStatusBadge,
  formatDateTimeLabel,
  getEmotionLabel
} from './SchoolShell';
import {
  createSchoolEventContext,
  fetchSchoolClassrooms,
  fetchSchoolEvents
} from './schoolApi';

const initialContextForm = {
  eventId: '',
  contextType: 'Atividade pedagogica',
  notes: ''
};

export default function SchoolEvents() {
  const [payload, setPayload] = useState({ items: [], contextOptions: [] });
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showContextModal, setShowContextModal] = useState(false);
  const [contextForm, setContextForm] = useState(initialContextForm);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    classroomId: '',
    eventType: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    let isMounted = true;

    async function loadBaseData() {
      try {
        const response = await fetchSchoolClassrooms();
        if (!isMounted) return;
        setClassrooms(response?.items || []);
      } catch (requestError) {
        if (!isMounted) return;
        setClassrooms([]);
      }
    }

    loadBaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchSchoolEvents({
          classroomId: filters.classroomId || undefined,
          eventType: filters.eventType || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined
        });
        if (!isMounted) return;
        setPayload(response || { items: [], contextOptions: [] });
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Nao foi possivel carregar os eventos escolares.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  async function handleContextSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createSchoolEventContext(contextForm);
      setSuccess('Contexto escolar registrado com sucesso.');
      setShowContextModal(false);
      setContextForm(initialContextForm);
      const response = await fetchSchoolEvents({
        classroomId: filters.classroomId || undefined,
        eventType: filters.eventType || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined
      });
      setPayload(response || { items: [], contextOptions: [] });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nao foi possivel registrar o contexto escolar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SchoolShell
      pageKey="events"
      breadcrumb="School / Eventos"
      title="Eventos e contexto escolar"
      description="Acompanhe os eventos emocionais relevantes, filtre por turma e registre o contexto pedagogico que ajuda a interpretar o historico."
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {success ? <Alert variant="success" className="ac-school-feedback">{success}</Alert> : null}
        </>
      }
    >
      <SchoolSectionCard eyebrow="Filtros" title="Timeline escolar">
        <div className="ac-school-form-grid">
          <Form.Group>
            <Form.Label>Turma</Form.Label>
            <Form.Select
              value={filters.classroomId}
              onChange={(event) => setFilters((current) => ({ ...current, classroomId: event.target.value }))}
            >
              <option value="">Todas</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Tipo de evento</Form.Label>
            <Form.Select
              value={filters.eventType}
              onChange={(event) => setFilters((current) => ({ ...current, eventType: event.target.value }))}
            >
              <option value="">Todos</option>
              <option value="persistent_change">Alteracao persistente</option>
              <option value="emotion_window">Expressao estavel</option>
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Data inicial</Form.Label>
            <Form.Control
              type="date"
              value={filters.fromDate}
              onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Data final</Form.Label>
            <Form.Control
              type="date"
              value={filters.toDate}
              onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
            />
          </Form.Group>
        </div>
      </SchoolSectionCard>

      <SchoolSectionCard eyebrow="Eventos recentes" title="Timeline">
        {payload.items.length === 0 ? (
          <SchoolEmptyState
            title="Nenhum evento no filtro atual."
            description="Assim que as sessoes escolares gerarem eventos persistentes, eles aparecerao aqui em formato de timeline."
            icon={Activity}
          />
        ) : (
          <div className="ac-school-timeline">
            {payload.items.map((item) => (
              <article key={item.id} className="ac-school-timeline__item">
                <div className="ac-school-timeline__time">{formatDateTimeLabel(item.startedAt)}</div>
                <div className="ac-school-timeline__content">
                  <div className="ac-school-actions-row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <h4>{item.patientName || 'Aluno autorizado'}</h4>
                      <p>{item.classroomName || 'Turma nao informada'}</p>
                    </div>
                    <SchoolStatusBadge tone={item.eventType === 'persistent_change' ? 'warning' : 'info'}>
                      {item.eventType === 'persistent_change' ? 'Alteracao persistente' : 'Expressao estavel'}
                    </SchoolStatusBadge>
                  </div>
                  <div className="ac-school-list-card__meta">
                    <span className="ac-school-pill">Expressao: {getEmotionLabel(item.dominantEmotion)}</span>
                    {item.previousEmotion ? (
                      <span className="ac-school-pill">Transicao: {getEmotionLabel(item.previousEmotion)} → {getEmotionLabel(item.dominantEmotion)}</span>
                    ) : null}
                    <span className="ac-school-pill">Duracao: {Math.round((item.durationMs || 0) / 1000)}s</span>
                  </div>
                  {item.contextType ? (
                    <div className="mt-3">
                      <SchoolStatusBadge tone="success">Contexto: {item.contextType}</SchoolStatusBadge>
                      {item.contextNotes ? <p className="mt-2 mb-0">{item.contextNotes}</p> : null}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Button
                        variant="outline-primary"
                        onClick={() => {
                          setContextForm({
                            eventId: item.id,
                            contextType: payload.contextOptions?.[0] || 'Atividade pedagogica',
                            notes: ''
                          });
                          setShowContextModal(true);
                        }}
                      >
                        Registrar contexto
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </SchoolSectionCard>

      <Modal show={showContextModal} onHide={() => setShowContextModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Registrar contexto</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleContextSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Contexto</Form.Label>
              <Form.Select
                value={contextForm.contextType}
                onChange={(event) => setContextForm((current) => ({ ...current, contextType: event.target.value }))}
              >
                {(payload.contextOptions || []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Observacoes</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={contextForm.notes}
                onChange={(event) => setContextForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="O que estava acontecendo no momento do evento?"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowContextModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar contexto'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </SchoolShell>
  );
}
