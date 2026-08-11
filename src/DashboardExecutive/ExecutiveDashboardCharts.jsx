import { Bar, Line } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js';
import { Badge, Card, Col, Row } from 'react-bootstrap';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

const money = (value) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const percent = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  return `${Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => ` ${money(context.parsed.y)}`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b' }
    },
    y: {
      grid: { color: 'rgba(148, 163, 184, 0.18)' },
      ticks: {
        color: '#64748b',
        callback: (value) => money(value)
      }
    }
  }
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => ` ${money(context.parsed.y)}`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b' }
    },
    y: {
      grid: { color: 'rgba(148, 163, 184, 0.18)' },
      ticks: {
        color: '#64748b',
        callback: (value) => money(value)
      }
    }
  }
};

const emptyState = (message) => (
  <div className="executive-empty-state executive-empty-state--chart">{message}</div>
);

const formatPeriodLabel = (label) => {
  if (!label || !/^\d{4}-\d{2}$/.test(label)) {
    return label || 'Sem periodo';
  }

  const [year, month] = label.split('-').map(Number);
  const parsed = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric'
  }).format(parsed);
};

const ExecutiveDashboardCharts = ({ revenue }) => {
  const safeRevenue = revenue && typeof revenue === 'object' ? revenue : {};
  const monthly = Array.isArray(safeRevenue.monthly) ? safeRevenue.monthly : [];
  const expenses = Array.isArray(safeRevenue.expenseByCategory)
    ? safeRevenue.expenseByCategory
    : [];
  const comparison = safeRevenue.comparison && typeof safeRevenue.comparison === 'object'
    ? safeRevenue.comparison
    : { current: 0, previous: 0, percentage: null };

  const percentage = comparison.percentage === null || comparison.percentage === undefined
    ? null
    : Number(comparison.percentage);
  const highestMonth = monthly.reduce((best, current) => (
    Number(current?.amount || 0) > Number(best?.amount || 0) ? current : best
  ), null);
  const leadingExpense = expenses[0] || null;
  const comparisonTone = percentage === null
    ? 'neutral'
    : percentage > 0
      ? 'positive'
      : percentage < 0
        ? 'negative'
        : 'neutral';

  return (
    <Row className="g-4">
      <Col xl={8}>
        <Card className="executive-panel h-100">
          <Card.Body>
            <div className="executive-panel__header">
              <div>
                <span className="executive-panel__eyebrow">Receita</span>
                <h3>Evolucao da operacao</h3>
              </div>
              <span className="executive-panel__note">
                {monthly.length > 0 ? `${monthly.length} ponto(s) monitorado(s)` : 'Sem historico consolidado'}
              </span>
            </div>

            {monthly.length > 0 ? (
              <div className="executive-chart executive-chart--lg">
                <Line
                  data={{
                    labels: monthly.map((item) => formatPeriodLabel(item?.label)),
                    datasets: [
                      {
                        label: 'Entradas de caixa',
                        data: monthly.map((item) => Number(item?.amount || 0)),
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.14)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.34,
                        pointRadius: 3,
                        pointHoverRadius: 4
                      }
                    ]
                  }}
                  options={lineOptions}
                />
              </div>
            ) : (
              emptyState('Sem entradas de caixa no periodo selecionado.')
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col xl={4}>
        <Card className="executive-panel h-100">
          <Card.Body>
            <div className="executive-panel__header">
              <div>
                <span className="executive-panel__eyebrow">Comparacao</span>
                <h3>Receita vs periodo anterior</h3>
              </div>
              {percentage !== null && (
                <span className={`executive-kpi-card__badge is-${comparisonTone}`}>
                  {percentage > 0 ? `+${percent(percentage)}` : percent(percentage)}
                </span>
              )}
            </div>

            <div className="executive-comparison-stack">
              <strong className="executive-comparison__value">
                {money(comparison.current)}
              </strong>
              <div className="executive-comparison__row">
                <span className="executive-comparison__label">Periodo anterior</span>
                <strong>{comparison.previous ? money(comparison.previous) : 'Sem base comparativa'}</strong>
              </div>
              <div className="executive-comparison__row">
                <span className="executive-comparison__label">Leitura executiva</span>
                <strong>
                  {percentage === null
                    ? 'Sem historico suficiente'
                    : percentage > 0
                      ? 'Trajetoria de crescimento'
                      : percentage < 0
                        ? 'Atencao para desaceleracao'
                        : 'Estabilidade no periodo'}
                </strong>
              </div>
            </div>

            <div className="executive-insight-list">
              <div className="executive-insight-item">
                <span className="executive-insight-item__label">Pico de receita</span>
                <strong className="executive-insight-item__value">
                  {highestMonth ? `${formatPeriodLabel(highestMonth.label)} · ${money(highestMonth.amount)}` : 'Sem historico'}
                </strong>
              </div>
              <div className="executive-insight-item">
                <span className="executive-insight-item__label">Maior saida</span>
                <strong className="executive-insight-item__value">
                  {leadingExpense ? `${leadingExpense.label} · ${money(leadingExpense.amount)}` : 'Sem saidas categorizadas'}
                </strong>
              </div>
              <div className="executive-insight-item">
                <span className="executive-insight-item__label">Especialidades</span>
                <strong className="executive-insight-item__value">
                  Nao monitorado na estrutura atual
                </strong>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col xl={7}>
        <Card className="executive-panel h-100">
          <Card.Body>
            <div className="executive-panel__header">
              <div>
                <span className="executive-panel__eyebrow">Despesas</span>
                <h3>Concentracao de saidas por categoria</h3>
              </div>
            </div>

            {expenses.length > 0 ? (
              <div className="executive-chart executive-chart--md">
                <Bar
                  data={{
                    labels: expenses.map((item) => item?.label || ''),
                    datasets: [
                      {
                        label: 'Saidas de caixa',
                        data: expenses.map((item) => Number(item?.amount || 0)),
                        backgroundColor: [
                          '#2563eb',
                          '#3860f8',
                          '#06b6d4',
                          '#7c3aed',
                          '#f59e0b',
                          '#0f172a'
                        ],
                        borderRadius: 12,
                        maxBarThickness: 40
                      }
                    ]
                  }}
                  options={barOptions}
                />
              </div>
            ) : (
              emptyState('Sem despesas categorizadas no periodo selecionado.')
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col xl={5}>
        <Card className="executive-panel h-100">
          <Card.Body>
            <div className="executive-panel__header">
              <div>
                <span className="executive-panel__eyebrow">Contexto</span>
                <h3>Sinais do periodo</h3>
              </div>
              <Badge bg="light" text="dark">
                Receita registrada
              </Badge>
            </div>

            <div className="executive-insight-list">
              <div className="executive-insight-item">
                <span className="executive-insight-item__label">Receita atual</span>
                <strong className="executive-insight-item__value">
                  {money(comparison.current)}
                </strong>
              </div>
              <div className="executive-insight-item">
                <span className="executive-insight-item__label">Base anterior</span>
                <strong className="executive-insight-item__value">
                  {comparison.previous ? money(comparison.previous) : 'Sem historico'}
                </strong>
              </div>
              <div className="executive-insight-item">
                <span className="executive-insight-item__label">Maior categoria de saida</span>
                <strong className="executive-insight-item__value">
                  {leadingExpense?.label || 'Sem categoria dominante'}
                </strong>
              </div>
              <div className="executive-insight-item">
                <span className="executive-insight-item__label">Leitura gerencial</span>
                <strong className="executive-insight-item__value">
                  {percentage === null
                    ? 'Sem comparacao historica suficiente'
                    : percentage >= 0
                      ? 'Receita sustentada no periodo atual'
                      : 'Necessita atencao sobre tracao de receita'}
                </strong>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ExecutiveDashboardCharts;
