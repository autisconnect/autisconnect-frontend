import React, { useEffect, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import {
  Activity,
  ArrowRight,
  BarChartLine,
  Calendar2Check,
  CameraVideo,
  Collection,
  People
} from 'react-bootstrap-icons';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip as ChartTooltip
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import SchoolShell, {
  SchoolEmptyState,
  SchoolSectionCard,
  SchoolStatCard,
  SchoolStatusBadge,
  formatClockDuration,
  formatDateTimeLabel,
  formatMinutes,
  getEmotionLabel
} from './SchoolShell';
import { fetchSchoolDashboard } from './schoolApi';
import { openSchoolMonitoringCenterTab } from './schoolMonitoringLinks';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Legend, Filler);

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 10,
        color: '#5f6f82',
        font: {
          size: 12,
          weight: 600
        }
      }
    },
    tooltip: {
      backgroundColor: '#102133',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      padding: 12
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6c7b8d' }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(148, 163, 184, 0.16)'
      },
      ticks: { color: '#6c7b8d' }
    }
  }
};

export default function SchoolDashboard() {
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchSchoolDashboard();
        if (!isMounted) return;
        setPayload(response);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Nao foi possivel carregar o dashboard escolar.');
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

  const summary = payload?.summary || {};
  const trend = payload?.trend || [];
  const recentEvents = payload?.recentEvents || [];
  const highlightedStudents = payload?.highlightedStudents || [];
  const activeMonitoring = payload?.activeMonitoring || null;
  const chartData = {
    labels: trend.map((item) => item.label),
    datasets: [
      {
        label: 'Sessoes',
        data: trend.map((item) => item.sessions),
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.14)',
        fill: true,
        tension: 0.35
      },
      {
        label: 'Eventos',
        data: trend.map((item) => item.events),
        borderColor: '#0891b2',
        backgroundColor: 'rgba(8, 145, 178, 0.14)',
        fill: true,
        tension: 0.35
      },
      {
        label: 'Contextos',
        data: trend.map((item) => item.contexts),
        borderColor: '#b45309',
        backgroundColor: 'rgba(180, 83, 9, 0.12)',
        fill: true,
        tension: 0.35
      }
    ]
  };

  return (
    <SchoolShell
      pageKey="dashboard"
      breadcrumb="School / Visao geral"
      title={`Bom dia, ${payload?.school?.name || 'AutisConnect School'}`}
      description="Acompanhe seus alunos vinculados, os indicadores da instituicao e o status operacional do monitoramento escolar."
      loading={loading}
      feedback={error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
      actions={
        <Button onClick={() => openSchoolMonitoringCenterTab()}>
          <CameraVideo className="me-2" />
          Ir para o monitoramento
        </Button>
      }
    >
      <section className="ac-school-grid">
        <SchoolStatCard
          icon={People}
          label="Alunos vinculados"
          value={summary.linkedStudents || 0}
          meta="Alunos com vinculo escolar aprovado"
          tone="blue"
        />
        <SchoolStatCard
          icon={Collection}
          label="Turmas"
          value={summary.classrooms || 0}
          meta="Estrutura atual da instituicao"
          tone="emerald"
        />
        <SchoolStatCard
          icon={CameraVideo}
          label="Monitoramentos hoje"
          value={summary.monitoringsToday || 0}
          meta="Sessoes iniciadas hoje"
          tone="blue"
        />
        <SchoolStatCard
          icon={Activity}
          label="Eventos registrados"
          value={summary.eventsToday || 0}
          meta="Leituras persistidas hoje"
          tone="amber"
        />
        <SchoolStatCard
          icon={Calendar2Check}
          label="Alunos monitorados hoje"
          value={summary.studentsMonitoredToday || 0}
          meta="Alunos identificados com autorizacao ativa"
          tone="red"
        />
      </section>

      <section className="ac-school-overview-grid">
        <SchoolSectionCard
          eyebrow="Operacao"
          title="Monitoramento agora"
          actions={
            <Button variant="outline-primary" onClick={() => openSchoolMonitoringCenterTab()}>
              Visualizar
            </Button>
          }
        >
          {activeMonitoring ? (
            <div className="ac-school-list-card">
              <div>
                <h4>{activeMonitoring.classroomName}</h4>
                <p>{activeMonitoring.location || 'Sala de aula'}</p>
                <div className="ac-school-kpi-row">
                  <SchoolStatusBadge tone="success">Sessao ativa</SchoolStatusBadge>
                  <span className="ac-school-pill">{formatClockDuration(activeMonitoring.durationMs)}</span>
                  <span className="ac-school-pill">{activeMonitoring.eventCount} eventos</span>
                </div>
              </div>
              <Button onClick={() => openSchoolMonitoringCenterTab()}>
                Abrir
              </Button>
            </div>
          ) : (
            <SchoolEmptyState
              title="Nenhum monitoramento ativo neste momento."
              description="Selecione uma turma e inicie uma sessao escolar para acompanhar os alunos autorizados."
              actionLabel="Iniciar monitoramento"
              onAction={() => openSchoolMonitoringCenterTab()}
              icon={CameraVideo}
            />
          )}
        </SchoolSectionCard>

        <SchoolSectionCard eyebrow="Eventos" title="Eventos recentes">
          {recentEvents.length === 0 ? (
            <SchoolEmptyState
              title="Nenhum evento recente."
              description="Assim que as sessoes escolares registrarem leituras persistentes, os eventos aparecerao aqui."
              icon={Activity}
            />
          ) : (
            <div className="ac-school-list">
              {recentEvents.map((event) => (
                <article key={event.id} className="ac-school-list-card">
                  <div>
                    <h4>{event.patientName || 'Aluno autorizado'}</h4>
                    <p>{event.classroomName || 'Turma nao informada'}</p>
                    <div className="ac-school-list-card__meta">
                      <SchoolStatusBadge tone={event.eventType === 'persistent_change' ? 'warning' : 'info'}>
                        {event.eventType === 'persistent_change' ? 'Alteracao persistente' : 'Expressao estavel'}
                      </SchoolStatusBadge>
                      <span className="ac-school-pill">{getEmotionLabel(event.dominantEmotion)}</span>
                      <span className="ac-school-pill">{formatDateTimeLabel(event.startedAt)}</span>
                    </div>
                  </div>
                  <Button variant="outline-primary" onClick={() => navigate('/school/events')}>
                    <ArrowRight />
                  </Button>
                </article>
              ))}
            </div>
          )}
        </SchoolSectionCard>
      </section>

      <section className="ac-school-overview-grid">
        <SchoolSectionCard eyebrow="Acompanhamento" title="Alunos em foco">
          {highlightedStudents.length === 0 ? (
            <SchoolEmptyState
              title="Nenhum aluno vinculado."
              description="Vincule alunos a uma turma para acompanhar o historico e habilitar o monitoramento autorizado."
              actionLabel="Gerenciar alunos"
              onAction={() => navigate('/school/students')}
              icon={People}
            />
          ) : (
            <div className="ac-school-list">
              {highlightedStudents.map((student) => (
                <article key={student.linkId} className="ac-school-list-card">
                  <div>
                    <h4>{student.name}</h4>
                    <p>{student.classroomName || 'Turma nao informada'}</p>
                    <div className="ac-school-list-card__meta">
                      <SchoolStatusBadge tone={student.monitoringAllowed ? 'success' : 'warning'}>
                        {student.statusLabel}
                      </SchoolStatusBadge>
                      <span className="ac-school-pill">
                        Ultima atividade: {formatDateTimeLabel(student.lastActivity)}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline-primary" onClick={() => navigate(`/school/students/${student.patientId}`)}>
                    Visualizar
                  </Button>
                </article>
              ))}
            </div>
          )}
        </SchoolSectionCard>

        <SchoolSectionCard eyebrow="Ultimos 7 dias" title="Atividade da instituicao">
          {trend.length === 0 ? (
            <SchoolEmptyState
              title="Sem historico recente suficiente."
              description="As sessoes e eventos escolares aparecerao neste grafico assim que a operacao da escola ganhar volume."
              icon={BarChartLine}
            />
          ) : (
            <>
              <div className="ac-school-kpi-row">
                <span className="ac-school-pill">{summary.sessionsLast7Days || 0} sessoes</span>
                <span className="ac-school-pill">{formatMinutes(summary.monitoredMinutesLast7Days || 0)} monitorados</span>
                <span className="ac-school-pill">{summary.contextsLast7Days || 0} contextos</span>
              </div>
              <div className="ac-school-chart-shell">
                <Line data={chartData} options={lineOptions} />
              </div>
            </>
          )}
        </SchoolSectionCard>
      </section>
    </SchoolShell>
  );
}
