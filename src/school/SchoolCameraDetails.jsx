import React, { useEffect, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { CameraVideo, PlayCircle } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import SchoolShell, {
  SchoolEmptyState,
  SchoolSectionCard,
  SchoolStatusBadge,
  formatDateTimeLabel
} from './SchoolShell';
import { openSchoolCameraMonitorTab } from './schoolMonitoringLinks';
import {
  fetchSchoolCameraDetails,
  testSchoolCamera
} from './schoolApi';

export default function SchoolCameraDetails() {
  const navigate = useNavigate();
  const { cameraId } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadCamera() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchSchoolCameraDetails(cameraId);
        if (!isMounted) return;
        setPayload(response);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Não foi possível carregar os detalhes da câmera.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCamera();
    return () => {
      isMounted = false;
    };
  }, [cameraId]);

  async function handleTestCamera() {
    setError('');
    setSuccess('');

    try {
      const response = await testSchoolCamera(cameraId);
      setSuccess(response?.message || 'Teste concluído.');
      const refreshed = await fetchSchoolCameraDetails(cameraId);
      setPayload(refreshed);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.error || 'Não foi possível testar a câmera.');
    }
  }

  const camera = payload?.camera;

  return (
    <SchoolShell
      pageKey="cameras"
      breadcrumb="School / Câmeras / Detalhes"
      title={camera?.name || 'Detalhes da câmera'}
      description="Veja o ambiente associado, a situação operacional e o histórico recente de sessões ligadas a esta fonte de monitoramento."
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {success ? <Alert variant="success" className="ac-school-feedback">{success}</Alert> : null}
        </>
      }
      actions={
        <div className="ac-school-actions-row">
          <Button variant="outline-secondary" onClick={handleTestCamera}>
            Testar conexão
          </Button>
          <Button onClick={() => openSchoolCameraMonitorTab(cameraId)}>
            <PlayCircle className="me-2" />
            Abrir monitor
          </Button>
        </div>
      }
    >
      <section className="ac-school-report-grid">
        <SchoolSectionCard eyebrow="Camera" title="Status e configuração">
          <div className="ac-school-detail-grid">
            <div>
              <span>Status</span>
              <strong>{camera?.status || 'offline'}</strong>
            </div>
            <div>
              <span>Ambiente</span>
              <strong>{payload?.location?.name || 'Não informado'}</strong>
            </div>
            <div>
              <span>Tipo</span>
              <strong>{camera?.cameraType || '-'}</strong>
            </div>
            <div>
              <span>Conexão</span>
              <strong>{camera?.streamType || '-'}</strong>
            </div>
          </div>
        </SchoolSectionCard>

        <SchoolSectionCard eyebrow="Ambiente" title="Turmas relacionadas">
          {(payload?.classrooms || []).length === 0 ? (
            <p className="ac-school-muted mb-0">Nenhuma turma foi relacionada a este ambiente ainda.</p>
          ) : (
            <div className="ac-school-list">
              {payload.classrooms.map((classroom) => (
                <article key={classroom.id} className="ac-school-list-card">
                  <div>
                    <h4>{classroom.name}</h4>
                    <p>{classroom.grade || 'Sem série definida'}</p>
                  </div>
                  <SchoolStatusBadge tone={classroom.isPrimary ? 'success' : 'info'}>
                    {classroom.isPrimary ? 'Principal' : 'Relacionada'}
                  </SchoolStatusBadge>
                </article>
              ))}
            </div>
          )}
        </SchoolSectionCard>
      </section>

      <SchoolSectionCard eyebrow="Histórico" title="Sessões recentes">
        {(payload?.sessions || []).length === 0 ? (
          <SchoolEmptyState
            title="Nenhuma sessão encontrada"
            description="Inicie a primeira sessão por câmera para preencher o histórico operacional."
            icon={CameraVideo}
          />
        ) : (
          <div className="ac-school-list">
            {payload.sessions.map((session) => (
              <article key={session.id} className="ac-school-list-card">
                <div>
                  <h4>{session.classroomName || 'Sessão flexível'}</h4>
                  <p>{session.locationName || 'Ambiente não informado'}</p>
                  <div className="ac-school-list-card__meta">
                    <SchoolStatusBadge tone={session.status === 'active' ? 'success' : session.status === 'paused' ? 'warning' : 'info'}>
                      {session.status}
                    </SchoolStatusBadge>
                    <span className="ac-school-pill">{session.monitoredPatients || 0} monitorados</span>
                    <span className="ac-school-pill">{session.eventCount || 0} eventos</span>
                    <span className="ac-school-pill">{formatDateTimeLabel(session.startedAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SchoolSectionCard>
    </SchoolShell>
  );
}
