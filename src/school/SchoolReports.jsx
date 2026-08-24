import React, { useEffect, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  Legend,
  Tooltip as ChartTooltip
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import SchoolShell, {
  SchoolEmptyState,
  SchoolSectionCard,
  SchoolStatusBadge,
  formatMinutes
} from './SchoolShell';
import {
  exportSchoolReportsPdf,
  fetchSchoolClassrooms,
  fetchSchoolReports,
  fetchSchoolStudents
} from './schoolApi';

ChartJS.register(ArcElement, DoughnutController, CategoryScale, Legend, ChartTooltip);

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 10
      }
    }
  }
};

const palette = ['#0f766e', '#0891b2', '#b45309', '#15803d', '#b91c1c', '#334155'];

function getExportPdfStatusLabel(status) {
  switch (`${status || ''}`.trim().toLowerCase()) {
    case 'ready':
      return 'Disponivel';
    case 'in_preparation':
    case 'not_ready':
      return 'Em preparacao';
    default:
      return status || 'Em preparacao';
  }
}

function getExportPdfStatusTone(status) {
  switch (`${status || ''}`.trim().toLowerCase()) {
    case 'ready':
      return 'success';
    case 'in_preparation':
    case 'not_ready':
      return 'warning';
    default:
      return 'neutral';
  }
}

export default function SchoolReports() {
  const [payload, setPayload] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportInfo, setExportInfo] = useState('');
  const [filters, setFilters] = useState({
    classroomId: '',
    patientId: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const [classroomResponse, studentResponse] = await Promise.all([
          fetchSchoolClassrooms(),
          fetchSchoolStudents()
        ]);

        if (!isMounted) return;
        setClassrooms(classroomResponse?.items || []);
        setStudents(studentResponse?.items || []);
      } catch (requestError) {
        if (!isMounted) return;
        setClassrooms([]);
        setStudents([]);
      }
    }

    loadOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchSchoolReports({
          classroomId: filters.classroomId || undefined,
          patientId: filters.patientId || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined
        });
        if (!isMounted) return;
        setPayload(response);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.response?.data?.error || 'Nao foi possivel carregar os relatorios escolares.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReports();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  async function handleExportPdf() {
    setExportingPdf(true);
    setExportInfo('');
    setError('');

    try {
      const result = await exportSchoolReportsPdf({
        classroomId: filters.classroomId || undefined,
        patientId: filters.patientId || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined
      });
      setExportInfo(`PDF exportado com sucesso: ${result.filename}`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Nao foi possivel exportar o PDF escolar.');
    } finally {
      setExportingPdf(false);
    }
  }

  const emotionChart = {
    labels: (payload?.byEmotion || []).map((item) => item.label),
    datasets: [
      {
        data: (payload?.byEmotion || []).map((item) => item.value),
        backgroundColor: palette
      }
    ]
  };

  const contextChart = {
    labels: (payload?.byContext || []).map((item) => item.label),
    datasets: [
      {
        data: (payload?.byContext || []).map((item) => item.value),
        backgroundColor: palette
      }
    ]
  };

  return (
    <SchoolShell
      pageKey="reports"
      breadcrumb="School / Relatorios"
      title="Relatorios e indicadores escolares"
      description="Explore os dados consolidados por turma, aluno e periodo sem transformar leituras emocionais em rotulos comportamentais."
      loading={loading}
      feedback={
        <>
          {error ? <Alert variant="danger" className="ac-school-feedback">{error}</Alert> : null}
          {exportInfo ? <Alert variant="success" className="ac-school-feedback">{exportInfo}</Alert> : null}
        </>
      }
      actions={(
        <div className="ac-school-actions-row">
          <Button onClick={handleExportPdf} disabled={loading || exportingPdf}>
            {exportingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
          </Button>
        </div>
      )}
    >
      <SchoolSectionCard eyebrow="Filtros" title="Recorte analitico">
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
            <Form.Label>Aluno</Form.Label>
            <Form.Select
              value={filters.patientId}
              onChange={(event) => setFilters((current) => ({ ...current, patientId: event.target.value }))}
            >
              <option value="">Todos</option>
              {students.map((student) => (
                <option key={student.linkId} value={student.patientId}>
                  {student.name}
                </option>
              ))}
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

      <section className="ac-school-grid">
        <article className="ac-school-stat-card">
          <div className="ac-school-stat-card__copy">
            <span>Sessoes</span>
            <strong>{payload?.summary?.sessions || 0}</strong>
            <small>Sessoes no periodo</small>
          </div>
        </article>
        <article className="ac-school-stat-card">
          <div className="ac-school-stat-card__copy">
            <span>Tempo monitorado</span>
            <strong>{formatMinutes(payload?.summary?.monitoredMinutes || 0)}</strong>
            <small>Tempo total consolidado</small>
          </div>
        </article>
        <article className="ac-school-stat-card">
          <div className="ac-school-stat-card__copy">
            <span>Eventos</span>
            <strong>{payload?.summary?.events || 0}</strong>
            <small>Eventos persistidos</small>
          </div>
        </article>
        <article className="ac-school-stat-card">
          <div className="ac-school-stat-card__copy">
            <span>Contextos</span>
            <strong>{payload?.summary?.contexts || 0}</strong>
            <small>Registros contextualizados</small>
          </div>
        </article>
      </section>

      <section className="ac-school-report-grid">
        <SchoolSectionCard eyebrow="Expressoes" title="Distribuicao de expressoes">
          {(payload?.byEmotion || []).length === 0 ? (
            <SchoolEmptyState
              title="Sem distribuicao disponivel."
              description="Conclua sessoes com alunos autorizados para liberar a leitura consolidada das expressoes."
            />
          ) : (
            <div className="ac-school-chart-shell">
              <Doughnut data={emotionChart} options={doughnutOptions} />
            </div>
          )}
        </SchoolSectionCard>

        <SchoolSectionCard eyebrow="Contextos" title="Contextos mais registrados">
          {(payload?.byContext || []).length === 0 ? (
            <SchoolEmptyState
              title="Nenhum contexto registrado."
              description="Registre o contexto escolar de eventos relevantes para liberar as associacoes historicas."
            />
          ) : (
            <div className="ac-school-chart-shell">
              <Doughnut data={contextChart} options={doughnutOptions} />
            </div>
          )}
        </SchoolSectionCard>
      </section>

      <section className="ac-school-report-grid">
        <SchoolSectionCard eyebrow="Sessões" title="Historico recente">
          {(payload?.sessions || []).length === 0 ? (
            <SchoolEmptyState
              title="Nenhuma sessao no recorte atual."
              description="Ajuste os filtros ou inicie novas sessoes para gerar relatorios operacionais."
            />
          ) : (
            <div className="ac-school-list">
              {payload.sessions.map((session) => (
                <article key={session.id} className="ac-school-list-card">
                  <div>
                    <h4>{session.classroomName}</h4>
                    <p>{session.location || 'Sala de aula'}</p>
                    <div className="ac-school-list-card__meta">
                      <SchoolStatusBadge tone={session.status === 'completed' ? 'success' : session.status === 'active' ? 'info' : 'warning'}>
                        {session.status}
                      </SchoolStatusBadge>
                      <span className="ac-school-pill">{formatMinutes(Math.round((session.durationMs || 0) / 60000))}</span>
                      <span className="ac-school-pill">{session.eventCount} eventos</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SchoolSectionCard>

        <SchoolSectionCard eyebrow="Alunos" title="Leituras consolidadas">
          {(payload?.students || []).length === 0 ? (
            <SchoolEmptyState
              title="Sem consolidado por aluno."
              description="Os indicadores individuais aparecem quando ha eventos autorizados persistidos."
            />
          ) : (
            <div className="ac-school-list">
              {payload.students.map((student) => (
                <article key={student.patientId} className="ac-school-list-card">
                  <div>
                    <h4>{student.name}</h4>
                    <div className="ac-school-list-card__meta">
                      <span className="ac-school-pill">{student.eventCount} eventos</span>
                      <span className="ac-school-pill">{student.persistentChanges} alteracoes persistentes</span>
                      <SchoolStatusBadge tone="info">
                        Confiança média {Math.round((student.averageConfidence || 0) * 100)}%
                      </SchoolStatusBadge>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SchoolSectionCard>
      </section>

      <SchoolSectionCard
        eyebrow="Exportacao"
        title="Disponibilidade do servico"
        actions={(
          <Button variant="outline-primary" onClick={handleExportPdf} disabled={loading || exportingPdf}>
            {exportingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
          </Button>
        )}
      >
        <SchoolStatusBadge tone={getExportPdfStatusTone(payload?.availability?.exportPdf)}>
          Exportar PDF: {getExportPdfStatusLabel(payload?.availability?.exportPdf)}
        </SchoolStatusBadge>
        <p className="ac-school-muted mb-0 mt-3">
          O arquivo e gerado com o mesmo recorte atualmente aplicado nos filtros desta tela.
        </p>
      </SchoolSectionCard>
    </SchoolShell>
  );
}
