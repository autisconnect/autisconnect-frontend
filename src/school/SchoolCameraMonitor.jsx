import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal, Form } from 'react-bootstrap';
import { CameraVideo, Cpu } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import SchoolShell, {
  SchoolEmptyState,
  SchoolSectionCard
} from './SchoolShell';
import { getStoredSchoolCameraBinding } from './browserCameraRegistry';
import SchoolCameraSetup from './SchoolCameraSetup';
import SchoolMonitoringSession from './SchoolMonitoringSession';
import useSchoolMonitoringEngine from './useSchoolMonitoringEngine';
import {
  createSchoolEventContext,
  createSchoolMonitoringSession,
  endSchoolMonitoringSession,
  fetchSchoolCameraDetails,
  fetchSchoolMonitoringSessionConfig,
  fetchSchoolMonitoringSessions,
  fetchSchoolStudents,
  pauseSchoolMonitoringSession,
  resumeSchoolMonitoringSession
} from './schoolApi';

const initialContextForm = {
  eventId: '',
  contextType: 'Atividade pedagogica',
  notes: ''
};

export default function SchoolCameraMonitor() {
  const navigate = useNavigate();
  const { cameraId } = useParams();
  const [payload, setPayload] = useState(null);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionConfig, setSessionConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showContextModal, setShowContextModal] = useState(false);
  const [contextForm, setContextForm] = useState(initialContextForm);
  const [preferredDeviceId, setPreferredDeviceId] = useState('');

  const camera = payload?.camera || null;
  const location = payload?.location || null;
  const classrooms = payload?.classrooms || [];

  const {
    videoRef,
    canvasRef,
    stage,
    cameraReady,
    studentStates,
    localEvents,
    syncWarning,
    engineError,
    engineInfo,
    sessionClock,
    startEngine,
    stopEngine,
    pauseEngine,
    resumeEngine
  } = useSchoolMonitoringEngine({
    session: currentSession,
    sessionConfig,
    camera,
    preferredDeviceId
  });

  useEffect(() => {
    const storedBinding = getStoredSchoolCameraBinding(cameraId);
    setPreferredDeviceId(storedBinding?.deviceId || '');
  }, [cameraId]);

  useEffect(() => {
    let isMounted = true;

    async function loadMonitorContext() {
      setLoading(true);
      setError('');

      try {
        const [cameraResponse, studentResponse, sessionResponse] = await Promise.all([
          fetchSchoolCameraDetails(cameraId),
          fetchSchoolStudents({ status: 'approved', monitoring: 'authorized' }),
          fetchSchoolMonitoringSessions({ cameraId })
        ]);

        if (!isMounted) return;

        setPayload(cameraResponse);
        setApprovedStudents(studentResponse?.items || []);

        const activeSession = (sessionResponse?.items || []).find((session) => ['preparing', 'active', 'paused'].includes(session.status));
        setCurrentSession(activeSession || null);

        if (activeSession) {
          const configResponse = await fetchSchoolMonitoringSessionConfig(activeSession.id);
          if (!isMounted) return;
          setSessionConfig(configResponse);
        } else {
          setSessionConfig(null);
        }
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Não foi possível carregar o monitoramento desta câmera.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMonitorContext();
    return () => {
      isMounted = false;
    };
  }, [cameraId]);

  useEffect(() => {
    if (!camera || !currentSession || !sessionConfig) {
      return;
    }

    if ((camera.streamType === 'browser' || camera.stream_type === 'browser') && currentSession.status === 'active' && stage === 'idle') {
      void startEngine();
    }
  }, [camera, currentSession, sessionConfig, stage]);

  const defaultClassroomId = classrooms.find((classroom) => classroom.isPrimary)?.id || '';

  async function refreshSessionState(nextSessionId = null) {
    const sessionResponse = await fetchSchoolMonitoringSessions({ cameraId });
    const activeSession = nextSessionId
      ? (sessionResponse?.items || []).find((item) => String(item.id) === String(nextSessionId))
      : (sessionResponse?.items || []).find((item) => ['preparing', 'active', 'paused'].includes(item.status));

    setCurrentSession(activeSession || null);

    if (activeSession) {
      const configResponse = await fetchSchoolMonitoringSessionConfig(activeSession.id);
      setSessionConfig(configResponse);
    } else {
      setSessionConfig(null);
    }
  }

  async function handleStartSession(values) {
    setStarting(true);
    setError('');
    setSuccess('');

    try {
      const response = await createSchoolMonitoringSession({
        cameraId: Number(cameraId),
        locationId: camera?.locationId,
        classroomId: values.classroomId || null,
        additionalPatientIds: values.additionalPatientIds || [],
        monitoringMode: values.monitoringMode || 'browser',
        monitoringSource: values.monitoringMode || 'browser'
      });

      setCurrentSession(response?.session || null);
      setSessionConfig(response?.config || null);
      setSuccess('Sessão criada com sucesso.');

      if ((camera?.streamType || camera?.stream_type) === 'browser') {
        await startEngine();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível iniciar a sessão desta câmera.');
    } finally {
      setStarting(false);
    }
  }

  async function handlePauseResume() {
    if (!currentSession) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      if (currentSession.status === 'active') {
        await pauseSchoolMonitoringSession(currentSession.id);
        pauseEngine();
      } else {
        await resumeSchoolMonitoringSession(currentSession.id);
        if ((camera?.streamType || camera?.stream_type) === 'browser') {
          if (stage === 'paused') {
            resumeEngine();
          } else {
            await startEngine();
          }
        }
      }

      await refreshSessionState(currentSession.id);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível atualizar o status da sessão.');
    }
  }

  async function handleEndSession() {
    if (!currentSession) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      stopEngine({ finalizeEvents: true, stopStream: true });
      await endSchoolMonitoringSession(currentSession.id, {
        summary: {
          localEvents: localEvents.length
        }
      });
      setSuccess('Sessão encerrada com sucesso.');
      await refreshSessionState();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível encerrar a sessão.');
    }
  }

  async function handleSaveContext(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      await createSchoolEventContext(contextForm);
      setSuccess('Contexto registrado com sucesso.');
      setShowContextModal(false);
      setContextForm(initialContextForm);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível registrar o contexto deste evento.');
    }
  }

  return (
    <SchoolShell
      pageKey="monitoring"
      breadcrumb="School / Monitoramento / Câmera"
      title={camera?.name || 'Monitor por câmera'}
      description="Acompanhe a sessão por câmera, o público autorizado daquele ambiente e os eventos estruturados associados ao AutisConnect."
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {success ? <Alert variant="success" className="ac-school-feedback">{success}</Alert> : null}
          {syncWarning ? <Alert variant="warning" className="ac-school-feedback">{syncWarning}</Alert> : null}
          {engineError ? <Alert variant="danger" className="ac-school-feedback">{engineError}</Alert> : null}
          {engineInfo ? <Alert variant="info" className="ac-school-feedback">{engineInfo}</Alert> : null}
        </>
      }
      actions={
        <div className="ac-school-actions-row">
          <Button variant="outline-secondary" onClick={() => navigate(`/school/cameras/${cameraId}`)}>
            Ver detalhes
          </Button>
        </div>
      }
    >
      {!currentSession ? (
        <section className="ac-school-report-grid">
          <SchoolCameraSetup
            camera={camera}
            classrooms={classrooms}
            approvedStudents={approvedStudents}
            defaultClassroomId={defaultClassroomId}
            starting={starting}
            onStart={handleStartSession}
          />

          <SchoolSectionCard eyebrow="Privacidade" title="Regras da sessão">
            <div className="ac-school-premium-note">
              <Cpu />
              <div>
                <strong>Somente alunos vinculados, autorizados e incluídos na sessão podem ser associados ao prontuário.</strong>
                <p className="mb-0">
                  Outras faces continuam fora do escopo clínico-educacional: não são identificadas, não geram prontuário e não ficam persistidas.
                </p>
              </div>
            </div>
          </SchoolSectionCard>
        </section>
      ) : (
        <>
          <section className="ac-school-monitor-stage">
            <SchoolSectionCard eyebrow="Visual" title="Janela da câmera">
              {(camera?.streamType || camera?.stream_type) === 'browser' ? (
                <div className={cameraReady ? 'ac-school-monitor-preview' : 'ac-school-monitor-preview ac-school-monitor-preview--placeholder'}>
                  <video ref={videoRef} className="ac-school-monitor-preview__video" muted playsInline />
                  <canvas ref={canvasRef} className="ac-school-monitor-preview__canvas" />
                </div>
              ) : (
                <div className="ac-school-monitor-preview ac-school-monitor-preview--placeholder">
                  <CameraVideo size={28} />
                  <h3>Preview preparado para edge/gateway</h3>
                  <p>
                    Esta câmera já participa da arquitetura da central, mas a reprodução/IA distribuída para streams externos fica preparada para a próxima fase com AutisConnect Edge.
                  </p>
                </div>
              )}
            </SchoolSectionCard>
          </section>

          <SchoolMonitoringSession
            session={currentSession}
            sessionConfig={sessionConfig}
            stage={stage === 'idle' ? currentSession.status : stage}
            sessionClock={sessionClock}
            students={studentStates}
            localEvents={localEvents}
            onPauseResume={handlePauseResume}
            onEnd={handleEndSession}
            onRegisterContext={(item) => {
              setContextForm({
                eventId: item.id,
                contextType: 'Atividade pedagogica',
                notes: ''
              });
              setShowContextModal(true);
            }}
          />
        </>
      )}

      <Modal show={showContextModal} onHide={() => setShowContextModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Registrar contexto escolar</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveContext}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Contexto</Form.Label>
              <Form.Select
                value={contextForm.contextType}
                onChange={(event) => setContextForm((current) => ({ ...current, contextType: event.target.value }))}
              >
                <option value="Atividade pedagogica">Atividade pedagógica</option>
                <option value="Mudanca de atividade">Mudança de atividade</option>
                <option value="Mudanca de rotina">Mudança de rotina</option>
                <option value="Ambiente barulhento">Ambiente barulhento</option>
                <option value="Interacao social">Interação social</option>
                <option value="Recreio">Recreio</option>
                <option value="Alimentacao">Alimentação</option>
                <option value="Avaliacao/prova">Avaliação / prova</option>
                <option value="Atividade fisica">Atividade física</option>
                <option value="Outro">Outro</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={contextForm.notes}
                onChange={(event) => setContextForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="O que estava acontecendo no ambiente no momento do evento?"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowContextModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar contexto</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </SchoolShell>
  );
}
