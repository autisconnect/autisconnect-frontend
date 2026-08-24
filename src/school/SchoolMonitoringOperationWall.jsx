import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import {
  ArrowClockwise,
  CameraVideo,
  PauseCircle,
  PlayCircle,
  StopCircle
} from 'react-bootstrap-icons';
import {
  clearSchoolCameraBinding,
  listSchoolVideoDevices,
  resolvePreferredSchoolDeviceId,
  saveSchoolCameraBinding
} from './browserCameraRegistry';
import {
  endSchoolMonitoringSession,
  fetchSchoolMonitoringSession,
  pauseSchoolMonitoringSession,
  resumeSchoolMonitoringSession
} from './schoolApi';
import useSchoolMonitoringEngine from './useSchoolMonitoringEngine';
import {
  SchoolEmptyState,
  SchoolSectionCard,
  SchoolStatusBadge,
  formatClockDuration,
  getEmotionLabel
} from './SchoolShell';

function resolveSessionTone(status) {
  if (status === 'active') return 'success';
  if (status === 'paused') return 'warning';
  if (status === 'completed') return 'neutral';
  return 'info';
}

function MonitoringTile({ item, availableDevices, onDevicesReloaded, onSessionChanged }) {
  const [sessionState, setSessionState] = useState(item.session || null);
  const [sessionConfig, setSessionConfig] = useState(item.config || null);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tileError, setTileError] = useState('');
  const [tileInfo, setTileInfo] = useState('');

  const camera = item.camera;
  const isBrowserCamera = (camera?.streamType || camera?.stream_type) === 'browser';

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
    session: sessionState,
    sessionConfig,
    camera,
    preferredDeviceId: selectedDeviceId
  });

  useEffect(() => {
    setSessionState(item.session || null);
    setSessionConfig(item.config || null);
  }, [item]);

  useEffect(() => {
    if (!isBrowserCamera) {
      setSelectedDeviceId('');
      return;
    }

    const preferredDeviceId = resolvePreferredSchoolDeviceId(camera?.id, availableDevices);
    if (!preferredDeviceId) {
      return;
    }

    setSelectedDeviceId((current) => (current ? current : preferredDeviceId));

    const preferredDevice = availableDevices.find((device) => device.deviceId === preferredDeviceId);
    if (preferredDevice) {
      saveSchoolCameraBinding(camera?.id, preferredDevice);
    }
  }, [availableDevices, camera?.id, isBrowserCamera]);

  useEffect(() => {
    if (!camera || !sessionState || !sessionConfig || !isBrowserCamera) {
      return;
    }

    if (sessionState.status !== 'active' || stage !== 'idle') {
      return;
    }

    if (!selectedDeviceId && availableDevices.length > 1) {
      setTileInfo('Selecione a webcam local desta sala para iniciar o monitoramento simultaneo.');
      return;
    }

    setTileInfo('');
    void startEngine();
  }, [availableDevices.length, camera, isBrowserCamera, selectedDeviceId, sessionConfig, sessionState, stage, startEngine]);

  async function refreshSessionState(nextSessionId = null) {
    const targetSessionId = nextSessionId || sessionState?.id;
    if (!targetSessionId) {
      return;
    }

    const response = await fetchSchoolMonitoringSession(targetSessionId);
    setSessionState(response?.session || null);
    setSessionConfig(response?.config || null);
  }

  async function handlePauseResume() {
    if (!sessionState) {
      return;
    }

    if (isBrowserCamera && sessionState.status !== 'active' && !selectedDeviceId && availableDevices.length > 1) {
      setTileError('Selecione primeiro a webcam correspondente a esta sala.');
      return;
    }

    setActionLoading(true);
    setTileError('');
    setTileInfo('');

    try {
      if (sessionState.status === 'active') {
        await pauseSchoolMonitoringSession(sessionState.id);
        pauseEngine();
        setTileInfo('Sessao pausada nesta sala.');
      } else {
        await resumeSchoolMonitoringSession(sessionState.id);
        if (isBrowserCamera) {
          if (stage === 'paused') {
            resumeEngine();
          } else {
            await startEngine();
          }
        }
        setTileInfo('Sessao retomada nesta sala.');
      }

      await refreshSessionState(sessionState.id);
      onSessionChanged?.();
    } catch (error) {
      setTileError(error.response?.data?.error || 'Nao foi possivel atualizar a sessao desta sala.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEndSession() {
    if (!sessionState) {
      return;
    }

    setActionLoading(true);
    setTileError('');
    setTileInfo('');

    try {
      stopEngine({ finalizeEvents: true, stopStream: true });
      await endSchoolMonitoringSession(sessionState.id, {
        summary: {
          localEvents: localEvents.length
        }
      });
      await refreshSessionState(sessionState.id);
      setTileInfo('Sessao encerrada com sucesso.');
      onSessionChanged?.();
    } catch (error) {
      setTileError(error.response?.data?.error || 'Nao foi possivel encerrar a sessao desta sala.');
    } finally {
      setActionLoading(false);
    }
  }

  const durationMs = sessionState
    ? Math.max(0, sessionClock - new Date(sessionState.startedAt).getTime() - (sessionState.totalPausedMs || 0))
    : 0;

  const visibleStudents = (studentStates || []).slice(0, 4);

  return (
    <article className="ac-school-operation-tile">
      <div className="ac-school-operation-tile__header">
        <div>
          <span className="ac-school-card__eyebrow">Operacao simultanea</span>
          <h3>{camera?.name || 'Camera escolar'}</h3>
          <p>{camera?.locationName || sessionConfig?.location?.name || 'Ambiente nao informado'}</p>
        </div>
        <div className="ac-school-operation-tile__badges">
          <SchoolStatusBadge tone={resolveSessionTone(sessionState?.status || item.action)}>
            {sessionState?.status || item.action}
          </SchoolStatusBadge>
          <SchoolStatusBadge tone={isBrowserCamera ? 'info' : 'neutral'}>
            {isBrowserCamera ? 'Browser local' : 'Camera / edge'}
          </SchoolStatusBadge>
        </div>
      </div>

      {tileError ? <Alert variant="danger" className="ac-school-feedback mb-3">{tileError}</Alert> : null}
      {syncWarning ? <Alert variant="warning" className="ac-school-feedback mb-3">{syncWarning}</Alert> : null}
      {engineError ? <Alert variant="danger" className="ac-school-feedback mb-3">{engineError}</Alert> : null}
      {tileInfo || engineInfo ? <Alert variant="info" className="ac-school-feedback mb-3">{tileInfo || engineInfo}</Alert> : null}

      {isBrowserCamera ? (
        <div className="ac-school-operation-tile__device">
          <Form.Group>
            <Form.Label>Webcam local vinculada</Form.Label>
            <Form.Select
              value={selectedDeviceId}
              onChange={(event) => {
                const nextDeviceId = event.target.value;
                setSelectedDeviceId(nextDeviceId);

                if (!nextDeviceId) {
                  clearSchoolCameraBinding(camera?.id);
                  return;
                }

                const selectedDevice = availableDevices.find((device) => device.deviceId === nextDeviceId);
                if (selectedDevice) {
                  saveSchoolCameraBinding(camera?.id, selectedDevice);
                  setTileError('');
                  setTileInfo('Webcam local vinculada e pronta para as proximas operacoes.');
                }
              }}
            >
              <option value="">Selecionar webcam desta sala</option>
              {availableDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Button variant="outline-secondary" onClick={onDevicesReloaded}>
            <ArrowClockwise className="me-2" />
            Atualizar dispositivos
          </Button>
        </div>
      ) : null}

      <div className={cameraReady ? 'ac-school-monitor-preview ac-school-monitor-preview--compact' : 'ac-school-monitor-preview ac-school-monitor-preview--compact ac-school-monitor-preview--placeholder'}>
        {isBrowserCamera ? (
          <>
            <video ref={videoRef} className="ac-school-monitor-preview__video" muted playsInline />
            <canvas ref={canvasRef} className="ac-school-monitor-preview__canvas" />
            {!cameraReady ? (
              <div className="ac-school-operation-tile__overlay">
                <CameraVideo size={28} />
                <span>Aguardando stream local desta sala</span>
              </div>
            ) : null}
          </>
        ) : (
          <div className="ac-school-operation-tile__overlay">
            <CameraVideo size={28} />
            <span>Fluxo preparado para edge/gateway na operacao central</span>
          </div>
        )}
      </div>

      <div className="ac-school-operation-tile__summary">
        <span>Turma: {sessionConfig?.classroom?.name || sessionState?.classroomName || 'Flexivel'}</span>
        <span>Tempo: {formatClockDuration(durationMs)}</span>
        <span>Alunos: {studentStates.length || sessionState?.authorizedPatients || 0}</span>
        <span>Eventos locais: {localEvents.length}</span>
      </div>

      {visibleStudents.length > 0 ? (
        <div className="ac-school-operation-tile__students">
          {visibleStudents.map((student) => (
            <article key={student.patientId} className="ac-school-monitoring-student">
              <div className="ac-school-monitoring-student__row">
                <strong>{student.name}</strong>
                <SchoolStatusBadge tone={student.status === 'tracking' ? 'success' : student.status === 'identified' ? 'info' : 'neutral'}>
                  {student.status === 'tracking'
                    ? 'Identificado'
                    : student.status === 'identified'
                      ? 'Confirmando'
                      : student.status === 'temporarily_lost'
                        ? 'Fora por instantes'
                        : 'Fora do campo'}
                </SchoolStatusBadge>
              </div>
              <div className="ac-school-monitoring-student__meta">
                <span>{student.emotion ? getEmotionLabel(student.emotion) : 'Sem leitura estavel'}</span>
                <span>{Math.round((student.identityConfidence || 0) * 100)}%</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="ac-school-actions-row">
        <Button variant="outline-secondary" disabled={actionLoading || !sessionState || sessionState.status === 'completed'} onClick={handlePauseResume}>
          {actionLoading ? <Spinner animation="border" size="sm" className="me-2" /> : (sessionState?.status === 'active' ? <PauseCircle className="me-2" /> : <PlayCircle className="me-2" />)}
          {sessionState?.status === 'active' ? 'Pausar' : 'Retomar'}
        </Button>
        <Button variant="outline-danger" disabled={actionLoading || !sessionState || sessionState.status === 'completed'} onClick={handleEndSession}>
          <StopCircle className="me-2" />
          Encerrar
        </Button>
      </div>
    </article>
  );
}

export default function SchoolMonitoringOperationWall({ operation, onSessionChanged }) {
  const [availableDevices, setAvailableDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devicesError, setDevicesError] = useState('');

  const readyItems = (operation?.items || []).filter((item) => item.session);
  const skippedItems = (operation?.items || []).filter((item) => item.action === 'skipped');
  const hasBrowserSessions = readyItems.some((item) => item.requiresBrowserDevice);

  useEffect(() => {
    if (!hasBrowserSessions) {
      setAvailableDevices([]);
      return;
    }

    void handleReloadDevices(true);
  }, [hasBrowserSessions]);

  async function handleReloadDevices(requestPermission = false) {
    if (!hasBrowserSessions) {
      return;
    }

    setLoadingDevices(true);
    setDevicesError('');

    try {
      const devices = await listSchoolVideoDevices({ requestPermission });
      setAvailableDevices(devices);
    } catch (error) {
      setDevicesError(error.message || 'Nao foi possivel listar as webcams locais deste navegador.');
    } finally {
      setLoadingDevices(false);
    }
  }

  if (!operation) {
    return null;
  }

  if (readyItems.length === 0) {
    return (
      <SchoolSectionCard eyebrow="Operacao do dia" title="Nenhuma sessao pronta">
        <SchoolEmptyState
          title="Nenhuma sala elegivel foi preparada"
          description="Revise as cameras, o vinculo dos alunos autorizados e a associacao das turmas aos ambientes antes de tentar novamente."
          icon={CameraVideo}
        />
      </SchoolSectionCard>
    );
  }

  return (
    <section className="ac-school-operation-wall">
      <SchoolSectionCard
        eyebrow="Operacao do dia"
        title="Salas em paralelo"
        actions={hasBrowserSessions ? (
          <Button variant="outline-secondary" disabled={loadingDevices} onClick={() => handleReloadDevices(true)}>
            <ArrowClockwise className="me-2" />
            {loadingDevices ? 'Atualizando...' : 'Detectar webcams locais'}
          </Button>
        ) : null}
      >
        <div className="ac-school-camera-card__stats">
          <span>{operation.summary?.readySessions || readyItems.length} sessoes prontas</span>
          <span>{operation.summary?.createdSessions || 0} iniciadas agora</span>
          <span>{operation.summary?.resumedSessions || 0} retomadas</span>
          <span>{operation.summary?.reusedSessions || 0} reaproveitadas</span>
        </div>

        {devicesError ? <Alert variant="warning" className="ac-school-feedback mt-3">{devicesError}</Alert> : null}
        {skippedItems.length > 0 ? (
          <Alert variant="warning" className="ac-school-feedback mt-3">
            {skippedItems.length} camera(s) ficaram fora da operacao atual. Revise os ambientes e os alunos autorizados para concluir a cobertura total.
          </Alert>
        ) : null}
      </SchoolSectionCard>

      <div className="ac-school-operation-grid">
        {readyItems.map((item) => (
          <MonitoringTile
            key={`${item.camera?.id || 'camera'}-${item.session?.id || item.action}`}
            item={item}
            availableDevices={availableDevices}
            onDevicesReloaded={() => handleReloadDevices(true)}
            onSessionChanged={onSessionChanged}
          />
        ))}
      </div>
    </section>
  );
}
