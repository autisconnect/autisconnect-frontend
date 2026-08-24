import React, { useEffect, useState } from 'react';
import { Alert, Button, Tab, Tabs } from 'react-bootstrap';
import { ArrowRight, CameraVideo, ClockHistory, FileText, JournalText } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import PatientFaceReferencePanel from '../emotion-tracking/PatientFaceReferencePanel';
import SchoolShell, {
  SchoolSectionCard,
  SchoolStatusBadge,
  formatDateTimeLabel,
  formatMinutes,
  getEmotionLabel,
  getInitials
} from './SchoolShell';
import {
  deleteSchoolStudentFaceReference,
  fetchSchoolStudentDetails,
  fetchSchoolStudentFaceReference,
  saveSchoolStudentFaceReference
} from './schoolApi';

export default function SchoolStudentDetails() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [payload, setPayload] = useState(null);
  const [faceReference, setFaceReference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    let isMounted = true;
    setFaceReference(null);

    async function loadStudent() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchSchoolStudentDetails(patientId);
        if (!isMounted) return;
        setPayload(response);
        setFaceReference(response?.faceReference || null);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Nao foi possivel carregar o aluno selecionado.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStudent();
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const student = payload?.student || {};
  const summary = payload?.summary || {};
  const events = payload?.events || [];
  const sessions = payload?.sessions || [];
  const contexts = payload?.contexts || [];

  return (
    <SchoolShell
      pageKey="students"
      breadcrumb="School / Alunos / Detalhes"
      title={student.name || 'Aluno'}
      description="Visao escolar autorizada do aluno, com indicadores, historico de monitoramento, eventos persistentes e relatorios sem expor o prontuario clinico completo."
      loading={loading}
      feedback={error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
      actions={
        <div className="ac-school-actions-row">
          <Button variant="outline-primary" onClick={() => navigate('/school/students')}>
            Voltar
          </Button>
          <Button onClick={() => navigate(`/emotion-detector?patientId=${patientId}`)}>
            <CameraVideo className="me-2" />
            Monitoramento individual
          </Button>
        </div>
      }
    >
      <section className="ac-school-student-hero">
        <div className="ac-school-student-hero__top">
          <div className="ac-school-student-hero__identity">
            <div className="ac-school-student-hero__avatar">
              {faceReference?.referenceImageData ? (
                <img src={faceReference.referenceImageData} alt={`Foto de referencia de ${student.name || 'aluno'}`} />
              ) : (
                getInitials(student.name)
              )}
            </div>
            <div>
              <span className="ac-school-page-header__eyebrow">Aluno autorizado</span>
              <h2>{student.name || 'Aluno'}</h2>
              <div className="ac-school-student-hero__meta">
                <span className="ac-school-pill">{student.classroomName || 'Sem turma'}</span>
                {student.age ? <span className="ac-school-pill">{student.age} anos</span> : null}
                <span className="ac-school-pill">
                  {faceReference?.hasReference ? 'Foto de referencia pronta' : 'Foto de referencia pendente'}
                </span>
                <SchoolStatusBadge tone={student.linkStatus === 'approved' ? 'success' : 'warning'}>
                  {student.linkStatus === 'approved' ? 'Vinculo ativo' : student.linkStatus || 'Sem vinculo'}
                </SchoolStatusBadge>
              </div>
            </div>
          </div>
          <div className="ac-school-list-card__meta">
            <span className="ac-school-pill">Ultimo acompanhamento: {formatDateTimeLabel(student.lastMonitoringAt)}</span>
            <SchoolStatusBadge tone={student.consents?.allowEmotionMonitoring ? 'success' : 'neutral'}>
              {student.consents?.allowEmotionMonitoring ? 'Monitoramento autorizado' : 'Monitoramento nao autorizado'}
            </SchoolStatusBadge>
          </div>
        </div>
      </section>

      <SchoolSectionCard eyebrow="Identificacao" title="Foto de referencia do aluno">
        <PatientFaceReferencePanel
          patientId={patientId}
          title="Foto de referencia para reconhecimento"
          description="Use a mesma referencia facial do Emotion Detector para que o monitoramento escolar reconheca o aluno correto. Se o paciente ja tiver foto cadastrada no sistema, ela aparecera aqui automaticamente."
          openMonitorLabel="Abrir detector emocional"
          onOpenMonitor={() => navigate(`/emotion-detector?patientId=${patientId}`)}
          onReferenceChange={setFaceReference}
          fetchReference={fetchSchoolStudentFaceReference}
          saveReference={saveSchoolStudentFaceReference}
          deleteReference={deleteSchoolStudentFaceReference}
        />
      </SchoolSectionCard>

      <section className="ac-school-grid">
        <article className="ac-school-stat-card">
          <div className="ac-school-stat-card__copy">
            <span>Ultima sessao</span>
            <strong>{summary.lastSessionDate ? new Date(summary.lastSessionDate).toLocaleDateString('pt-BR') : '--'}</strong>
            <small>Ultimo registro escolar</small>
          </div>
        </article>
        <article className="ac-school-stat-card">
          <div className="ac-school-stat-card__copy">
            <span>Tempo monitorado</span>
            <strong>{formatMinutes(summary.totalMonitoredMinutes || 0)}</strong>
            <small>Tempo acumulado</small>
          </div>
        </article>
        <article className="ac-school-stat-card">
          <div className="ac-school-stat-card__copy">
            <span>Expressao predominante</span>
            <strong>{summary.dominantEmotion ? getEmotionLabel(summary.dominantEmotion) : '--'}</strong>
            <small>Linguagem de indicador, nao de diagnostico</small>
          </div>
        </article>
        <article className="ac-school-stat-card">
          <div className="ac-school-stat-card__copy">
            <span>Alteracoes persistentes</span>
            <strong>{summary.persistentChangesCount || 0}</strong>
            <small>Eventos persistidos no historico</small>
          </div>
        </article>
      </section>

      <Tabs activeKey={activeTab} onSelect={(value) => setActiveTab(value || 'summary')} className="ac-school-tabs">
        <Tab eventKey="summary" title="Resumo">
          <div className="ac-school-student-grid mt-4">
            <SchoolSectionCard eyebrow="Indicadores" title="Resumo do aluno">
              <div className="ac-school-list">
                <div className="ac-school-list-card">
                  <div>
                    <h4>Sessoes no historico</h4>
                    <p>{summary.totalSessionCount || 0} sessoes registradas</p>
                  </div>
                </div>
                <div className="ac-school-list-card">
                  <div>
                    <h4>Eventos persistidos</h4>
                    <p>{summary.eventsCount || 0} eventos com confianca media de {Math.round((summary.averageConfidence || 0) * 100)}%</p>
                  </div>
                </div>
              </div>
            </SchoolSectionCard>

            <SchoolSectionCard eyebrow="Insight" title="Associacao observada">
              {payload?.insight ? (
                <div className="ac-school-empty-state">
                  <div className="ac-school-empty-state__copy">
                    <h3>Insight AutisConnect</h3>
                    <p>{payload.insight}</p>
                  </div>
                </div>
              ) : (
                <div className="ac-school-empty-state">
                  <div className="ac-school-empty-state__copy">
                    <h3>Sem insight automatico suficiente.</h3>
                    <p>Registre contextos escolares em eventos relevantes para liberar leituras associativas mais consistentes.</p>
                  </div>
                </div>
              )}
            </SchoolSectionCard>
          </div>
        </Tab>

        <Tab eventKey="monitoring" title="Monitoramento">
          <div className="ac-school-overview-grid mt-4">
            <SchoolSectionCard eyebrow="Controle" title="Acesso ao monitoramento">
              <div className="ac-school-actions-row">
                <Button onClick={() => navigate(`/emotion-detector?patientId=${patientId}`)}>
                  <CameraVideo className="me-2" />
                  Abrir monitoramento individual
                </Button>
                <SchoolStatusBadge tone={student.consents?.allowEmotionMonitoring ? 'success' : 'warning'}>
                  {student.consents?.allowEmotionMonitoring ? 'Autorizado para a escola' : 'Nao autorizado para a escola'}
                </SchoolStatusBadge>
              </div>
            </SchoolSectionCard>

            <SchoolSectionCard eyebrow="Historico" title="Ultimas sessoes">
              <div className="ac-school-list">
                {sessions.slice(0, 5).map((session) => (
                  <article key={session.id} className="ac-school-list-card">
                    <div>
                      <h4>{session.classroomName}</h4>
                      <p>{formatDateTimeLabel(session.startedAt)}</p>
                    </div>
                    <SchoolStatusBadge tone={session.status === 'completed' ? 'success' : session.status === 'active' ? 'info' : 'warning'}>
                      {session.status}
                    </SchoolStatusBadge>
                  </article>
                ))}
              </div>
            </SchoolSectionCard>
          </div>
        </Tab>

        <Tab eventKey="events" title="Eventos">
          <SchoolSectionCard eyebrow="Timeline" title="Eventos do aluno">
            <div className="ac-school-timeline mt-4">
              {events.map((event) => (
                <article key={event.id} className="ac-school-timeline__item">
                  <div className="ac-school-timeline__time">{formatDateTimeLabel(event.startedAt)}</div>
                  <div className="ac-school-timeline__content">
                    <h4>{event.eventType === 'persistent_change' ? 'Alteracao facial persistente' : 'Expressao estavel'}</h4>
                    <p>{getEmotionLabel(event.dominantEmotion)}</p>
                    <div className="ac-school-list-card__meta">
                      <span className="ac-school-pill">{Math.round((event.averageConfidence || 0) * 100)}% de confianca media</span>
                      {event.contextType ? <span className="ac-school-pill">Contexto: {event.contextType}</span> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SchoolSectionCard>
        </Tab>

        <Tab eventKey="history" title="Historico">
          <SchoolSectionCard eyebrow="Sessoes" title="Linha do tempo de acompanhamento">
            <div className="ac-school-list mt-4">
              {sessions.map((session) => (
                <article key={session.id} className="ac-school-list-card">
                  <div>
                    <h4>{session.classroomName}</h4>
                    <p>{session.location || 'Sala de aula'}</p>
                    <div className="ac-school-list-card__meta">
                      <span className="ac-school-pill">{formatDateTimeLabel(session.startedAt)}</span>
                      <span className="ac-school-pill">{formatMinutes(Math.round((session.durationMs || 0) / 60000))}</span>
                    </div>
                  </div>
                  <Button variant="outline-primary" onClick={() => navigate('/school/reports')}>
                    <ClockHistory className="me-2" />
                    Ver relatorios
                  </Button>
                </article>
              ))}
            </div>
          </SchoolSectionCard>
        </Tab>

        <Tab eventKey="reports" title="Relatorios">
          <div className="ac-school-overview-grid mt-4">
            <SchoolSectionCard eyebrow="Relatorio individual" title="Padroes e contextos">
              <div className="ac-school-list">
                {contexts.map((context) => (
                  <article key={context.label} className="ac-school-list-card">
                    <div>
                      <h4>{context.label}</h4>
                      <p>{context.value} registros associados</p>
                    </div>
                    <Button variant="outline-secondary">
                      <FileText className="me-2" />
                      Indicador
                    </Button>
                  </article>
                ))}
              </div>
            </SchoolSectionCard>

            <SchoolSectionCard eyebrow="Observacao" title="Relatorio escolar">
              <div className="ac-school-empty-state">
                <div className="ac-school-empty-state__icon">
                  <JournalText />
                </div>
                <div className="ac-school-empty-state__copy">
                  <h3>Exportacao em preparacao.</h3>
                  <p>O modulo ja consolida os dados autorizados. A exportacao em PDF ficara desacoplada para a proxima fase sem quebrar esta primeira entrega.</p>
                </div>
              </div>
            </SchoolSectionCard>
          </div>
        </Tab>
      </Tabs>
    </SchoolShell>
  );
}
