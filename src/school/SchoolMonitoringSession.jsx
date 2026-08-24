import React from 'react';
import { Button } from 'react-bootstrap';
import {
  ClockHistory,
  PauseCircle,
  PlayCircle,
  StopCircle
} from 'react-bootstrap-icons';
import {
  SchoolSectionCard,
  SchoolStatusBadge,
  formatClockDuration,
  formatDateTimeLabel,
  getEmotionLabel
} from './SchoolShell';

export default function SchoolMonitoringSession({
  session,
  sessionConfig,
  stage,
  sessionClock,
  students,
  localEvents,
  onPauseResume,
  onEnd,
  onRegisterContext
}) {
  const durationMs = session
    ? Math.max(0, sessionClock - new Date(session.startedAt).getTime() - (session.totalPausedMs || 0))
    : 0;

  return (
    <div className="ac-school-monitor-layout">
      <div className="ac-school-monitor-layout__main">
        <SchoolSectionCard
          eyebrow="Sessão ativa"
          title={session?.cameraName || sessionConfig?.camera?.name || 'Monitoramento por câmera'}
          actions={
            <div className="ac-school-actions-row">
              <Button variant="outline-secondary" onClick={onPauseResume}>
                {stage === 'monitoring' ? <PauseCircle className="me-2" /> : <PlayCircle className="me-2" />}
                {stage === 'monitoring' ? 'Pausar' : 'Retomar'}
              </Button>
              <Button variant="outline-danger" onClick={onEnd}>
                <StopCircle className="me-2" />
                Encerrar
              </Button>
            </div>
          }
        >
          <div className="ac-school-monitor-layout__summary">
            <div>
              <span>Ambiente</span>
              <strong>{sessionConfig?.location?.name || session?.locationName || 'Não informado'}</strong>
            </div>
            <div>
              <span>Turma esperada</span>
              <strong>{sessionConfig?.classroom?.name || session?.classroomName || 'Sessão flexível'}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{session?.status || stage}</strong>
            </div>
            <div>
              <span>Tempo</span>
              <strong>{formatClockDuration(durationMs)}</strong>
            </div>
          </div>
        </SchoolSectionCard>
      </div>

      <div className="ac-school-monitor-layout__side">
        <SchoolSectionCard eyebrow="Alunos monitorados" title="Painel lateral" compact>
          {(students || []).length === 0 ? (
            <p className="ac-school-muted mb-0">Nenhum aluno autorizado foi carregado para esta sessão.</p>
          ) : (
            <div className="ac-school-monitoring-student-list">
              {students.map((student) => (
                <article key={student.patientId} className="ac-school-monitoring-student">
                  <div className="ac-school-monitoring-student__row">
                    <strong>{student.name}</strong>
                    <SchoolStatusBadge tone={student.status === 'tracking' ? 'success' : student.status === 'identified' ? 'info' : 'neutral'}>
                      {student.status === 'tracking'
                        ? 'Identificado'
                        : student.status === 'identified'
                          ? 'Confirmando'
                          : student.status === 'temporarily_lost'
                            ? 'Temporariamente fora'
                            : 'Fora do campo'}
                    </SchoolStatusBadge>
                  </div>
                  <div className="ac-school-monitoring-student__emotion">
                    {student.emotion
                      ? `Indicador facial predominante: ${getEmotionLabel(student.emotion)}`
                      : 'Sem leitura estável'}
                  </div>
                  <div className="ac-school-monitoring-student__meta">
                    <span>Identidade: {Math.round((student.identityConfidence || 0) * 100)}%</span>
                    <span>Expressão: {Math.round((student.emotionConfidence || 0) * 100)}%</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SchoolSectionCard>

        <SchoolSectionCard eyebrow="Eventos recentes" title="Sessão" compact>
          {(localEvents || []).length === 0 ? (
            <p className="ac-school-muted mb-0">Os eventos persistidos aparecerão aqui assim que a sessão encontrar mudanças estáveis.</p>
          ) : (
            <div className="ac-school-list">
              {localEvents.slice(0, 8).map((event) => (
                <article key={event.id} className="ac-school-list-card">
                  <div>
                    <h4>{event.patientName}</h4>
                    <p>{formatDateTimeLabel(event.startedAt)}</p>
                    <div className="ac-school-list-card__meta">
                      <span className="ac-school-pill">{getEmotionLabel(event.dominantEmotion)}</span>
                      <span className="ac-school-pill">{Math.round((event.averageConfidence || 0) * 100)}%</span>
                      <span className="ac-school-pill">{Math.round((event.durationMs || 0) / 1000)}s</span>
                    </div>
                  </div>
                  {event.persisted ? (
                    <Button variant="outline-primary" onClick={() => onRegisterContext?.(event)}>
                      <ClockHistory className="me-2" />
                      Contexto
                    </Button>
                  ) : (
                    <SchoolStatusBadge tone="warning">Sincronizando</SchoolStatusBadge>
                  )}
                </article>
              ))}
            </div>
          )}
        </SchoolSectionCard>
      </div>
    </div>
  );
}
