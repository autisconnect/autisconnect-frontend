import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChartLine,
  CashStack,
  People
} from 'react-bootstrap-icons';
import { Alert, Badge, Card, Col, Form, Placeholder, Row, Table } from 'react-bootstrap';
import apiClient from '../services/api';

const ExecutiveDashboardCharts = lazy(() => import('./ExecutiveDashboardCharts'));

const money = (value) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const initial = { loading: true, data: null, error: '' };

const PERIOD_OPTIONS = [
  { value: 'current_month', label: 'Mes atual' },
  { value: 'previous_month', label: 'Mes anterior' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Ano' },
  { value: 'custom', label: 'Intervalo personalizado' }
];

const PERIOD_LABELS = Object.fromEntries(
  PERIOD_OPTIONS.map((option) => [option.value, option.label])
);

const numberValue = (value) => Number(value || 0).toLocaleString('pt-BR');

const percentValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  return `${Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
};

const signedPercent = (value) => {
  const formatted = percentValue(value);
  if (!formatted) {
    return null;
  }

  return Number(value) > 0 ? `+${formatted}` : formatted;
};

const label = (value) => {
  if (value === null || value === undefined) {
    return 'Nao monitorado';
  }

  if (typeof value === 'number') {
    return numberValue(value);
  }

  return value;
};

const moneySum = (items = []) => items.reduce(
  (total, item) => total + Number(item?.amount || 0),
  0
);

const formatDueDate = (value) => {
  if (!value) {
    return 'Data nao informada';
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).format(parsed);
};

const formatPaymentStatus = (value) => {
  const normalized = String(value || '').toLowerCase();

  if (!normalized) {
    return { label: 'Nao informado', tone: 'neutral' };
  }

  if (['paid', 'pago', 'received', 'recebido'].includes(normalized)) {
    return { label: 'Pago', tone: 'positive' };
  }

  if (['pending', 'pendente'].includes(normalized)) {
    return { label: 'Pendente', tone: 'warning' };
  }

  if (['overdue', 'vencido'].includes(normalized)) {
    return { label: 'Vencido', tone: 'negative' };
  }

  return { label: value, tone: 'neutral' };
};

const getTrendTone = (value) => {
  if (value === null || value === undefined) {
    return 'neutral';
  }

  if (Number(value) > 0) {
    return 'positive';
  }

  if (Number(value) < 0) {
    return 'negative';
  }

  return 'neutral';
};

const SectionHeader = ({ eyebrow, title, description }) => (
  <div className="executive-section-header">
    <span className="executive-section-header__eyebrow">{eyebrow}</span>
    <h3>{title}</h3>
    {description ? <p>{description}</p> : null}
  </div>
);

const ExecutiveHome = ({ cards = [] }) => {
  const [period, setPeriod] = useState('current_month');
  const [dates, setDates] = useState({ startDate: '', endDate: '' });
  const [blocks, setBlocks] = useState({
    summary: initial,
    revenue: initial,
    operations: initial,
    professionals: initial,
    alerts: initial
  });

  const params = useMemo(
    () => (period === 'custom' ? { period, ...dates } : { period }),
    [period, dates]
  );

  useEffect(() => {
    if (period === 'custom' && (!dates.startDate || !dates.endDate)) {
      return undefined;
    }

    let active = true;
    const paths = {
      summary: '/executive/dashboard/summary',
      revenue: '/executive/dashboard/revenue',
      operations: '/executive/dashboard/operations',
      professionals: '/executive/dashboard/top-professionals',
      alerts: '/executive/dashboard/alerts'
    };

    const loadBlock = async (key, path) => {
      if (active) {
        setBlocks((current) => ({
          ...current,
          [key]: { loading: true, data: current[key].data, error: '' }
        }));
      }

      try {
        const response = await apiClient.get(path, { params });
        if (active) {
          setBlocks((current) => ({
            ...current,
            [key]: { loading: false, data: response.data, error: '' }
          }));
        }
      } catch (requestError) {
        if (active) {
          setBlocks((current) => ({
            ...current,
            [key]: {
              loading: false,
              data: current[key].data,
              error:
                requestError.response?.data?.error
                || 'Nao foi possivel carregar este bloco.'
            }
          }));
        }
      }
    };

    (async () => {
      await Promise.all(
        Object.entries(paths).map(([key, path]) => loadBlock(key, path))
      );
    })();

    return () => {
      active = false;
    };
  }, [params, period, dates.startDate, dates.endDate]);

  const summary = blocks.summary.data?.kpis;
  const revenueComparison = blocks.revenue.data?.comparison;
  const operationsSummary = blocks.operations.data?.summary;
  const agendaItems = blocks.operations.data?.agenda || [];
  const overdueItems = blocks.alerts.data?.overdue || [];
  const upcomingItems = blocks.alerts.data?.upcoming || [];
  const topProduction = blocks.professionals.data?.byProduction || [];
  const topRevenue = blocks.professionals.data?.byRevenue || [];
  const topOccupancy = blocks.professionals.data?.byOccupancy || [];
  const hasAnyError = Object.values(blocks).some((item) => item.error);
  const profitMargin = summary?.revenue
    ? Number(summary.profit || 0) / Number(summary.revenue || 0) * 100
    : null;
  const selectedPeriodLabel = PERIOD_LABELS[period] || 'Periodo selecionado';
  const monitoredDomains = cards
    .map((card) => card?.title)
    .filter(Boolean)
    .slice(0, 7);

  const kpiCards = [
    {
      key: 'revenue',
      label: 'Receita',
      value:
        summary?.revenue === null || summary?.revenue === undefined
          ? '—'
          : money(summary.revenue),
      context:
        revenueComparison?.percentage === null || revenueComparison?.percentage === undefined
          ? 'Sem base comparativa disponivel'
          : 'vs periodo anterior',
      trend: signedPercent(revenueComparison?.percentage),
      tone: getTrendTone(revenueComparison?.percentage),
      icon: CashStack
    },
    {
      key: 'profit',
      label: 'Lucro',
      value:
        summary?.profit === null || summary?.profit === undefined
          ? '—'
          : money(summary.profit),
      context:
        profitMargin === null
          ? 'Resultado estimado no periodo'
          : `Margem ${percentValue(profitMargin)}`,
      trend: null,
      tone: getTrendTone(summary?.profit),
      icon: BarChartLine
    },
    {
      key: 'cash-balance',
      label: 'Saldo de caixa',
      value:
        summary?.cashBalance === null || summary?.cashBalance === undefined
          ? '—'
          : money(summary.cashBalance),
      context: 'Entradas menos saidas do caixa no periodo',
      trend: Number(summary?.cashBalance || 0) >= 0 ? 'Fluxo positivo' : 'Fluxo pressionado',
      tone: getTrendTone(summary?.cashBalance),
      icon: CashStack
    },
    {
      key: 'patients',
      label: 'Pacientes ativos',
      value:
        summary?.activePatients === null || summary?.activePatients === undefined
          ? '—'
          : numberValue(summary.activePatients),
      context: 'Base com atividade registrada no periodo',
      trend: null,
      tone: 'neutral',
      icon: Activity
    },
    {
      key: 'professionals',
      label: 'Profissionais ativos',
      value:
        summary?.activeProfessionals === null || summary?.activeProfessionals === undefined
          ? '—'
          : numberValue(summary.activeProfessionals),
      context: 'Equipe com movimentacao no periodo',
      trend: null,
      tone: 'neutral',
      icon: People
    }
  ];

  const signalCards = [
    {
      key: 'forecast',
      label: 'Atendimentos previstos',
      value: label(operationsSummary?.forecast),
      context: selectedPeriodLabel
    },
    {
      key: 'agenda',
      label: 'Agenda de hoje',
      value: numberValue(agendaItems.length),
      context:
        agendaItems.length > 0
          ? `${agendaItems.length} compromisso(s) para hoje`
          : 'Sem compromissos registrados para hoje'
    },
    {
      key: 'alerts',
      label: 'Alertas financeiros',
      value: numberValue(overdueItems.length + upcomingItems.length),
      context:
        overdueItems.length > 0
          ? `${overdueItems.length} item(ns) vencido(s)`
          : 'Nenhum vencimento critico no momento'
    },
    {
      key: 'leader',
      label: 'Lider de producao',
      value: topProduction[0]?.name || 'Nao monitorado',
      context:
        topProduction[0]
          ? `${numberValue(topProduction[0].production)} atendimento(s) no periodo`
          : 'Sem historico consolidado disponivel'
    }
  ];

  return (
    <section aria-label="Visao estrategica da clinica">
      <section className="executive-page-intro">
        <div className="executive-page-intro__copy">
          <span className="executive-page-intro__eyebrow">Visao Executiva</span>
          <h2>Indicadores estrategicos de desempenho da sua operacao.</h2>
          <p>
            Performance, crescimento e eficiencia em uma unica visao para apoiar
            decisoes da gestao.
          </p>

          {monitoredDomains.length > 0 && (
            <div className="executive-chip-row">
              {monitoredDomains.map((item) => (
                <span key={item} className="executive-chip">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="executive-page-intro__actions">
          <div className="executive-filter-panel">
            <span className="executive-filter-panel__label">Periodo</span>
            <div className="executive-filter-panel__row">
              <Form.Select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                aria-label="Periodo"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </div>

            {period === 'custom' && (
              <div className="executive-filter-panel__dates">
                <Form.Control
                  required
                  type="date"
                  value={dates.startDate}
                  onChange={(event) =>
                    setDates((current) => ({
                      ...current,
                      startDate: event.target.value
                    }))
                  }
                  aria-label="Data inicial"
                />
                <Form.Control
                  required
                  type="date"
                  value={dates.endDate}
                  onChange={(event) =>
                    setDates((current) => ({
                      ...current,
                      endDate: event.target.value
                    }))
                  }
                  aria-label="Data final"
                />
              </div>
            )}

            <p className="executive-filter-panel__hint">
              Leitura consolidada com os filtros ja suportados pela estrutura atual.
            </p>
          </div>
        </div>
      </section>

      {hasAnyError && (
        <Alert variant="warning">
          Alguns blocos nao puderam ser atualizados. Os demais dados continuam
          disponiveis.
        </Alert>
      )}

      <div className="executive-scorecard-grid">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key} className={`executive-kpi-card executive-kpi-card--${item.tone}`}>
              <Card.Body>
                {blocks.summary.loading && !summary ? (
                  <Placeholder as="div" animation="glow">
                    <Placeholder xs={4} className="mb-3" />
                    <Placeholder xs={10} size="lg" className="mb-2" />
                    <Placeholder xs={8} />
                  </Placeholder>
                ) : (
                  <>
                    <div className="executive-kpi-card__top">
                      <span className="executive-kpi-card__icon" aria-hidden="true">
                        <Icon size={18} />
                      </span>
                      {item.trend ? (
                        <span className={`executive-kpi-card__badge is-${item.tone}`}>
                          {item.trend}
                        </span>
                      ) : null}
                    </div>
                    <span className="executive-kpi-card__label">{item.label}</span>
                    <strong className="executive-kpi-card__value">{item.value}</strong>
                    <div className="executive-kpi-card__footer">
                      <span>{item.context}</span>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          );
        })}
      </div>

      <div className="executive-signal-grid">
        {signalCards.map((item) => (
          <Card key={item.key} className="executive-signal-card">
            <Card.Body>
              <span className="executive-signal-card__label">{item.label}</span>
              <strong className="executive-signal-card__value">{item.value}</strong>
              <span className="executive-signal-card__context">{item.context}</span>
            </Card.Body>
          </Card>
        ))}
      </div>

      <section className="executive-panel">
        <SectionHeader
          eyebrow="Crescimento & performance"
          title="Evolucao da operacao"
          description="Comparativos reais do periodo com foco em receita e concentracao de saidas."
        />

        {blocks.revenue.error ? (
          <Alert variant="danger">Receita: {blocks.revenue.error}</Alert>
        ) : (
          <Suspense
            fallback={
              <Placeholder animation="glow">
                <Placeholder xs={12} style={{ height: 320, borderRadius: 24 }} />
              </Placeholder>
            }
          >
            <ExecutiveDashboardCharts revenue={blocks.revenue.data} />
          </Suspense>
        )}
      </section>

      <Row className="g-4">
        <Col xl={8}>
          <section className="executive-panel h-100">
            <SectionHeader
              eyebrow="Equipe"
              title="Rankings estrategicos dos profissionais"
              description="Leitura rapida dos destaques de producao, receita e ocupacao."
            />
            <Row className="g-4">
              <Col lg={4}>
                <ProfessionalCard
                  title="Maior producao"
                  items={topProduction}
                  value="production"
                  emptyMessage="Nao monitorado: nao ha historico de producao suficiente."
                />
              </Col>
              <Col lg={4}>
                <ProfessionalCard
                  title="Maior receita registrada"
                  items={topRevenue}
                  value="revenue"
                  monetary
                  emptyMessage="Nao monitorado: nao ha receita registrada no periodo."
                />
              </Col>
              <Col lg={4}>
                <ProfessionalCard
                  title="Maior taxa de ocupacao"
                  items={topOccupancy}
                  value="occupancy"
                  emptyMessage="Nao monitorado: nao ha fonte confiavel de capacidade."
                />
              </Col>
            </Row>
          </section>
        </Col>

        <Col xl={4}>
          <section className="executive-panel h-100">
            <SectionHeader
              eyebrow="Operacao"
              title="Resumo do periodo"
              description="Visao consolidada dos atendimentos suportados pela estrutura atual."
            />
            <div className="executive-summary-list">
              {[
                ['Previstos', operationsSummary?.forecast],
                ['Realizados', operationsSummary?.completed],
                ['Cancelados', operationsSummary?.cancelled],
                ['No-show', operationsSummary?.noShow]
              ].map(([title, value]) => (
                <div key={title} className="executive-summary-row">
                  <span>{title}</span>
                  <strong>{label(value)}</strong>
                </div>
              ))}
            </div>
            <p className="executive-note">
              Status de comparecimento so aparece quando a base atual possui rastreabilidade
              estruturada para esse dado.
            </p>
          </section>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xl={7}>
          <section className="executive-panel h-100">
            <SectionHeader
              eyebrow="Agenda executiva"
              title="Compromissos do dia"
              description="Agenda do dia para antecipar gargalos e alinhamentos operacionais."
            />
            <div className="executive-table-wrap">
              <Table responsive size="sm">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Paciente</th>
                    <th>Profissional</th>
                    <th>Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {agendaItems.map((item) => {
                    const paymentStatus = formatPaymentStatus(item.payment_status);
                    return (
                      <tr key={item.id}>
                        <td>{item.appointment_time || 'Horario nao informado'}</td>
                        <td>{item.patientName}</td>
                        <td>{item.professional_id ? `Profissional #${item.professional_id}` : 'Nao informado'}</td>
                        <td>
                          <span className={`executive-status-pill is-${paymentStatus.tone}`}>
                            {paymentStatus.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {!blocks.operations.loading && agendaItems.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center">
                        Sem atendimentos registrados para hoje.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </section>
        </Col>

        <Col xl={5}>
          <section className="executive-panel h-100">
            <SectionHeader
              eyebrow="Riscos & atencao"
              title="Alertas financeiros"
              description="Priorize vencimentos e itens sensiveis que exigem decisao da gestao."
            />
            <Row className="g-4">
              <Col xs={12}>
                <AlertCard
                  title="Contas vencidas"
                  items={overdueItems}
                  amount={moneySum(overdueItems)}
                />
              </Col>
              <Col xs={12}>
                <AlertCard
                  title="Vencimentos proximos (7 dias)"
                  items={upcomingItems}
                  amount={moneySum(upcomingItems)}
                />
              </Col>
              <Col md={6}>
                <AlertCard
                  title="Contratos proximos do fim"
                  items={blocks.alerts.data?.contracts}
                  unavailable
                />
              </Col>
              <Col md={6}>
                <AlertCard
                  title="Anomalias financeiras"
                  items={blocks.alerts.data?.anomalies}
                  unavailable
                />
              </Col>
            </Row>
          </section>
        </Col>
      </Row>
    </section>
  );
};

const formatRankingValue = (item, key, monetary = false) => {
  const value = item?.[key];

  if (value === null || value === undefined || value === '') {
    return 'Nao monitorado';
  }

  if (monetary) {
    return money(value);
  }

  if (key === 'occupancy') {
    return percentValue(value) || 'Nao monitorado';
  }

  return numberValue(value);
};

const ProfessionalCard = ({
  title,
  items = [],
  value,
  monetary = false,
  emptyMessage
}) => (
  <Card className="executive-ranking-card h-100">
    <Card.Body>
      <div className="executive-panel__header">
        <div>
          <span className="executive-panel__eyebrow">Ranking</span>
          <h3>{title}</h3>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="executive-ranking-list">
          {items.slice(0, 5).map((item, index) => (
            <div key={`${title}-${item.professionalId}-${index}`} className="executive-ranking-item">
              <span className="executive-ranking-item__position">#{index + 1}</span>
              <div className="executive-ranking-item__content">
                <strong className="executive-ranking-item__name">{item.name}</strong>
                <span className="executive-ranking-item__meta">
                  {formatRankingValue(item, value, monetary)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="executive-empty-state">{emptyMessage}</div>
      )}
    </Card.Body>
  </Card>
);

const AlertCard = ({ title, items = [], amount = 0, unavailable = false }) => (
  <Card className="h-100">
    <Card.Body>
      <div className="executive-panel__header">
        <div>
          <span className="executive-panel__eyebrow">Alerta</span>
          <h3>{title}</h3>
        </div>
        {!unavailable && (
          <Badge bg="light" text="dark">
            {items.length} item(ns)
          </Badge>
        )}
      </div>

      {unavailable ? (
        <div className="executive-empty-state">
          Nao monitorado: nao ha fonte confiavel disponivel nesta estrutura.
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="executive-alert-list">
            {items.slice(0, 4).map((item) => (
              <div
                className="executive-alert-item"
                key={`${title}-${item.type}-${item.id}`}
              >
                <div className="executive-alert-item__top">
                  <strong className="executive-alert-item__title">
                    {item.description}
                  </strong>
                  <span className="executive-alert-item__amount">
                    {money(item.amount)}
                  </span>
                </div>
                <span className="executive-alert-item__meta">
                  {item.type === 'receivable' ? 'Receber' : 'Pagar'} ·{' '}
                  {formatDueDate(item.due_date)}
                </span>
              </div>
            ))}
          </div>
          <p className="executive-note">
            Impacto acumulado monitorado: <strong>{money(amount)}</strong>
          </p>
        </>
      ) : (
        <div className="executive-empty-state">
          Nenhum alerta encontrado para esta janela.
        </div>
      )}
    </Card.Body>
  </Card>
);

export default ExecutiveHome;
