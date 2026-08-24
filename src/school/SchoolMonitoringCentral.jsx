import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import {
  Activity,
  CameraVideo,
  Cast,
  Cpu,
  Eye
} from 'react-bootstrap-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import SchoolShell, {
  SchoolSectionCard,
  SchoolStatCard,
  SchoolStatusBadge,
  formatDateTimeLabel
} from './SchoolShell';
import SchoolCameraGrid from './SchoolCameraGrid';
import SchoolMonitoringOperationWall from './SchoolMonitoringOperationWall';
import {
  fetchSchoolMonitoringCentral,
  startSchoolMonitoringCentralOperation,
  testSchoolCamera
} from './schoolApi';
import {
  openSchoolCameraMonitorTab,
  openSchoolMonitoringCenterTab
} from './schoolMonitoringLinks';

const KIOSK_PREFS_KEY = 'ac-school-monitoring-kiosk-v1';
const DEFAULT_KIOSK_PREFS = {
  autoStartOnOpen: false,
  autoRefreshSeconds: 20
};

function readKioskPrefs() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_KIOSK_PREFS;
  }

  try {
    const raw = window.localStorage.getItem(KIOSK_PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      autoStartOnOpen: Boolean(parsed?.autoStartOnOpen),
      autoRefreshSeconds: Number(parsed?.autoRefreshSeconds) >= 15 ? Number(parsed.autoRefreshSeconds) : DEFAULT_KIOSK_PREFS.autoRefreshSeconds
    };
  } catch (error) {
    return DEFAULT_KIOSK_PREFS;
  }
}

function persistKioskPrefs(nextPrefs) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(KIOSK_PREFS_KEY, JSON.stringify(nextPrefs));
}

function buildFiltersFromSearch(search) {
  const params = new URLSearchParams(search || '');
  return {
    locationId: params.get('locationId') || '',
    classroomId: params.get('classroomId') || '',
    cameraStatus: params.get('cameraStatus') || '',
    sessionStatus: params.get('sessionStatus') || ''
  };
}

export default function SchoolMonitoringCentral({ forceKiosk = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [payload, setPayload] = useState(null);
  const [filters, setFilters] = useState(() => buildFiltersFromSearch(location.search));
  const [loading, setLoading] = useState(true);
  const [startingOperation, setStartingOperation] = useState(false);
  const [operation, setOperation] = useState(null);
  const [kioskPrefs, setKioskPrefs] = useState(() => readKioskPrefs());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const autoStartAttemptsRef = useRef(new Set());

  const autoRefreshSeconds = useMemo(
    () => (forceKiosk ? 20 : Math.max(15, Number(kioskPrefs.autoRefreshSeconds) || DEFAULT_KIOSK_PREFS.autoRefreshSeconds)),
    [forceKiosk, kioskPrefs.autoRefreshSeconds]
  );
  const autoStartEnabled = forceKiosk || kioskPrefs.autoStartOnOpen;

  useEffect(() => {
    setFilters((current) => {
      const nextFilters = buildFiltersFromSearch(location.search);
      if (
        current.locationId === nextFilters.locationId
        && current.classroomId === nextFilters.classroomId
        && current.cameraStatus === nextFilters.cameraStatus
        && current.sessionStatus === nextFilters.sessionStatus
      ) {
        return current;
      }

      return nextFilters;
    });
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;

    async function loadCentral() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchSchoolMonitoringCentral({
          locationId: filters.locationId || undefined,
          classroomId: filters.classroomId || undefined,
          cameraStatus: filters.cameraStatus || undefined,
          sessionStatus: filters.sessionStatus || undefined
        });

        if (!isMounted) return;
        setPayload(response);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Não foi possível carregar a central de monitoramento.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCentral();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  async function handleTestCamera(camera) {
    setError('');
    setSuccess('');

    try {
      const response = await testSchoolCamera(camera.id);
      setSuccess(response?.message || 'Teste de câmera concluído.');
      const refreshed = await fetchSchoolMonitoringCentral({
        locationId: filters.locationId || undefined,
        classroomId: filters.classroomId || undefined,
        cameraStatus: filters.cameraStatus || undefined,
        sessionStatus: filters.sessionStatus || undefined
      });
      setPayload(refreshed);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.error || 'Não foi possível testar a câmera.');
    }
  }

  useEffect(() => {
    persistKioskPrefs(kioskPrefs);
  }, [kioskPrefs]);

  async function refreshCentralSnapshot(options = {}) {
    const { quiet = false } = options;

    try {
      const refreshed = await fetchSchoolMonitoringCentral({
        locationId: filters.locationId || undefined,
        classroomId: filters.classroomId || undefined,
        cameraStatus: filters.cameraStatus || undefined,
        sessionStatus: filters.sessionStatus || undefined
      });
      setPayload(refreshed);
    } catch (requestError) {
      if (!quiet) {
        setError(requestError.response?.data?.error || 'Não foi possível atualizar a central de monitoramento.');
      }
    }
  }

  async function handleStartOperation(options = {}) {
    const { silent = false, resumePaused = true } = options;
    setStartingOperation(true);

    if (!silent) {
      setError('');
      setSuccess('');
    }

    try {
      const response = await startSchoolMonitoringCentralOperation({
        locationId: filters.locationId || undefined,
        classroomId: filters.classroomId || undefined,
        cameraIds: (payload?.cameras || []).map((camera) => camera.id),
        resumePaused
      });

      setOperation(response);
      if (!silent || forceKiosk || autoStartEnabled) {
        setSuccess(response?.message || 'Operação do dia preparada com sucesso.');
      }
      await refreshCentralSnapshot({ quiet: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Não foi possível preparar a operação do dia.');
    } finally {
      setStartingOperation(false);
    }
  }

  useEffect(() => {
    if (!autoStartEnabled || loading || startingOperation || operation || !Array.isArray(payload?.cameras) || payload.cameras.length === 0) {
      return;
    }

    const attemptKey = JSON.stringify({
      forceKiosk,
      locationId: filters.locationId || '',
      classroomId: filters.classroomId || '',
      cameraIds: payload.cameras.map((camera) => camera.id)
    });

    if (autoStartAttemptsRef.current.has(attemptKey)) {
      return;
    }

    autoStartAttemptsRef.current.add(attemptKey);
    void handleStartOperation({ silent: true, resumePaused: true });
  }, [autoStartEnabled, filters.classroomId, filters.locationId, forceKiosk, loading, operation, payload, startingOperation]);

  useEffect(() => {
    if (!autoStartEnabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refreshCentralSnapshot({ quiet: true });
    }, autoRefreshSeconds * 1000);

    return () => window.clearInterval(intervalId);
  }, [autoRefreshSeconds, autoStartEnabled]);

  const summary = payload?.summary || {};

  return (
    <SchoolShell
      pageKey="monitoring"
      breadcrumb={forceKiosk ? 'School / Monitoramento / Kiosk' : 'School / Monitoramento'}
      title={forceKiosk ? 'Central Operacional Kiosk' : 'Central de Monitoramento'}
      description={forceKiosk
        ? 'Modo operacional contínuo com autoabertura da operação do dia, atualização recorrente e manutenção dos vínculos locais das webcams.'
        : 'Acompanhe ambientes, câmeras e sessões em uma visão operacional preparada para webcam, câmera IP e evolução futura com edge local.'}
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {success ? <Alert variant="success" className="ac-school-feedback">{success}</Alert> : null}
        </>
      }
      actions={
        <div className="ac-school-actions-row">
          <Button onClick={handleStartOperation} disabled={startingOperation || (payload?.cameras || []).length === 0}>
            <Cpu className="me-2" />
            {startingOperation ? 'Preparando operação...' : 'Iniciar / retomar operação do dia'}
          </Button>
          {!forceKiosk ? (
            <Button
              variant={autoStartEnabled ? 'outline-primary' : 'outline-secondary'}
              onClick={() => setKioskPrefs((current) => ({ ...current, autoStartOnOpen: !current.autoStartOnOpen }))}
            >
              <Activity className="me-2" />
              {autoStartEnabled ? 'Desativar autoabertura' : 'Ativar autoabertura'}
            </Button>
          ) : (
            <Button variant="outline-secondary" onClick={() => navigate('/school/monitoring')}>
              <Cast className="me-2" />
              Sair do kiosk
            </Button>
          )}
          {!forceKiosk ? (
            <Button
              variant="outline-secondary"
              onClick={() => openSchoolMonitoringCenterTab(filters)}
            >
              <Cast className="me-2" />
              Abrir modo kiosk
            </Button>
          ) : null}
          {!forceKiosk ? (
            <Button variant="outline-secondary" onClick={() => navigate('/school/cameras')}>
              <CameraVideo className="me-2" />
              Gerenciar câmeras
            </Button>
          ) : null}
        </div>
      }
    >
      <section className="ac-school-grid">
        <SchoolStatCard icon={CameraVideo} label="Câmeras cadastradas" value={summary.totalCameras || 0} meta="Base operacional da central" tone="blue" />
        <SchoolStatCard icon={Cast} label="Online" value={summary.onlineCount || 0} meta="Câmeras com comunicação recente" tone="emerald" />
        <SchoolStatCard icon={Cpu} label="Sessões ativas" value={summary.activeSessionCount || 0} meta="Preparando, ativas ou pausadas" tone="amber" />
        <SchoolStatCard icon={Eye} label="Alunos monitorados agora" value={summary.monitoredPatientCount || 0} meta="Somente alunos autorizados" tone="red" />
        <SchoolStatCard icon={Activity} label="Eventos hoje" value={summary.eventsToday || 0} meta="Eventos estruturados persistidos" tone="blue" />
      </section>

      <SchoolSectionCard eyebrow="Operação" title={forceKiosk ? 'Kiosk diário ativo' : 'Autoabertura operacional'}>
        <div className="ac-school-camera-card__stats">
          <span>{autoStartEnabled ? 'Autoabertura ativa' : 'Autoabertura desativada'}</span>
          <span>Atualização automática a cada {autoRefreshSeconds}s</span>
          <span>{forceKiosk ? 'Rota fixa para operação contínua' : 'Use o modo kiosk para um atalho operacional diário'}</span>
        </div>
      </SchoolSectionCard>

      {!forceKiosk ? (
        <>
          <SchoolSectionCard eyebrow="Filtros" title="Recorte da central">
            <div className="ac-school-form-grid">
              <Form.Group>
                <Form.Label>Ambiente</Form.Label>
                <Form.Select
                  value={filters.locationId}
                  onChange={(event) => setFilters((current) => ({ ...current, locationId: event.target.value }))}
                >
                  <option value="">Todos</option>
                  {(payload?.filters?.locations || []).map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Turma</Form.Label>
                <Form.Select
                  value={filters.classroomId}
                  onChange={(event) => setFilters((current) => ({ ...current, classroomId: event.target.value }))}
                >
                  <option value="">Todas</option>
                  {(payload?.filters?.classrooms || []).map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Status da câmera</Form.Label>
                <Form.Select
                  value={filters.cameraStatus}
                  onChange={(event) => setFilters((current) => ({ ...current, cameraStatus: event.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="connecting">Conectando</option>
                  <option value="error">Erro</option>
                  <option value="disabled">Desativada</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Status da sessão</Form.Label>
                <Form.Select
                  value={filters.sessionStatus}
                  onChange={(event) => setFilters((current) => ({ ...current, sessionStatus: event.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="preparing">Preparando</option>
                  <option value="active">Ativa</option>
                  <option value="paused">Pausada</option>
                  <option value="completed">Concluída</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="error">Erro</option>
                </Form.Select>
              </Form.Group>
            </div>
          </SchoolSectionCard>

          <SchoolSectionCard eyebrow="Central" title="Grid de câmeras">
          <SchoolCameraGrid
            cameras={payload?.cameras || []}
            onOpen={(camera) => navigate(`/school/cameras/${camera.id}`)}
            onMonitor={(camera) => openSchoolCameraMonitorTab(camera.id)}
            onTest={handleTestCamera}
          />
        </SchoolSectionCard>
        </>
      ) : null}

      {operation ? (
        <SchoolMonitoringOperationWall
          operation={operation}
          onSessionChanged={() => {
            void refreshCentralSnapshot({ quiet: true });
          }}
        />
      ) : autoStartEnabled ? (
        <SchoolSectionCard eyebrow="Operação do dia" title="Preparação automática em andamento">
          <p className="ac-school-muted mb-0">
            Assim que as câmeras elegíveis forem carregadas, a central iniciará ou retomará a operação automaticamente.
          </p>
        </SchoolSectionCard>
      ) : null}

      <section className="ac-school-report-grid">
        <SchoolSectionCard eyebrow="Sessões" title="Operação recente">
          {(payload?.sessions || []).length === 0 ? (
            <p className="ac-school-muted mb-0">Nenhuma sessão encontrada para o recorte atual.</p>
          ) : (
            <div className="ac-school-list">
              {payload.sessions.map((session) => (
                <article key={session.id} className="ac-school-list-card">
                  <div>
                    <h4>{session.cameraName || 'Câmera da sessão'}</h4>
                    <p>{session.locationName || 'Ambiente não informado'}</p>
                    <div className="ac-school-list-card__meta">
                      <SchoolStatusBadge tone={session.status === 'active' ? 'success' : session.status === 'paused' ? 'warning' : 'info'}>
                        {session.status}
                      </SchoolStatusBadge>
                      <span className="ac-school-pill">{session.classroomName || 'Sessão flexível'}</span>
                      <span className="ac-school-pill">{session.monitoredPatients || 0} monitorados</span>
                      <span className="ac-school-pill">{session.eventCount || 0} eventos</span>
                    </div>
                  </div>
                  <Button variant="outline-primary" onClick={() => openSchoolCameraMonitorTab(session.cameraId)}>
                    Abrir
                  </Button>
                </article>
              ))}
            </div>
          )}
        </SchoolSectionCard>

        <SchoolSectionCard eyebrow="Eventos recentes" title="Central de eventos">
          {(payload?.recentEvents || []).length === 0 ? (
            <p className="ac-school-muted mb-0">Os eventos recentes aparecerão aqui assim que a central registrar sessões válidas.</p>
          ) : (
            <div className="ac-school-list">
              {payload.recentEvents.map((event) => (
                <article key={event.id} className="ac-school-list-card">
                  <div>
                    <h4>{event.cameraName || 'Câmera'}</h4>
                    <p>{event.locationName || event.classroomName || 'Ambiente não informado'}</p>
                    <div className="ac-school-list-card__meta">
                      <span className="ac-school-pill">{event.patientName || 'Aluno autorizado'}</span>
                      <span className="ac-school-pill">{event.eventType === 'persistent_change' ? 'Alteração persistente' : 'Expressão estável'}</span>
                      <span className="ac-school-pill">{formatDateTimeLabel(event.startedAt)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SchoolSectionCard>
      </section>
    </SchoolShell>
  );
}
