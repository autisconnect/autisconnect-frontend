import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Spinner, Alert, Badge, Table, Button } from 'react-bootstrap';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { GraphUp, EmojiSmile, Clock, Unlock } from 'react-bootstrap-icons';
import api from '../services/api';
import './gamesReport.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const formatSeconds = (value) => {
  const total = Number(value || 0);
  if (!total) return '0s';
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const GamesReport = ({ patientId }) => {
  const games = [
    { key: 'game1', label: 'Emotional Regulation Adventures' },
    { key: 'game2', label: 'Daily Life Quest' },
    { key: 'game3', label: 'Executive Function Builders' },
    { key: 'game4', label: 'Routine Builder' }
  ];
  const [selectedGame, setSelectedGame] = useState('game1');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientId) return;
    let isMounted = true;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/games/${selectedGame}/report/${patientId}`, {
          params: { gameKey: selectedGame }
        });
        if (isMounted) {
          setReport(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Falha ao carregar relatorio de jogos.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [patientId, selectedGame]);

  const hasSessions = report && report.totalSessions > 0;
  const isGame2 = report?.gameKey === 'game2' || selectedGame === 'game2';
  const isGame3 = report?.gameKey === 'game3' || selectedGame === 'game3';
  const isGame4 = report?.gameKey === 'game4' || selectedGame === 'game4';
  const successLabel = isGame4
    ? 'Eficiencia da rotina'
    : isGame3
      ? 'Planejamento medio'
      : isGame2
        ? 'Indice de independencia'
        : 'Sucesso medio';
  const timeLabel = isGame4
    ? 'Tempo medio de conclusao'
    : isGame3
      ? 'Tempo medio de adaptacao'
      : isGame2
        ? 'Tempo medio da missao'
        : 'Tempo medio';
  const timeValue = isGame4
    ? report?.avgCompletionSeconds
    : isGame3
      ? report?.avgAdaptationSeconds
      : report?.avgRegulationSeconds;
  const successColumnLabel = isGame4 ? 'Eficiencia' : isGame3 ? 'Planejamento' : isGame2 ? 'Independencia' : 'Sucesso';

  const timelineData = useMemo(() => {
    if (!hasSessions) return null;
    const labels = report.sessionTimeline.map((item) =>
      item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'Sem data'
    );
    return {
      labels,
      datasets: [
        {
          label: isGame4
            ? 'Eficiencia por sessao'
            : isGame3
              ? 'Planejamento por sessao'
              : isGame2
                ? 'Independencia por sessao'
                : 'Sucesso por sessao',
          data: report.sessionTimeline.map((item) => item.successRate || 0),
          borderColor: '#2f7d89',
          backgroundColor: 'rgba(47, 125, 137, 0.2)',
          tension: 0.35,
          fill: true
        }
      ]
    };
  }, [hasSessions, report, isGame2, isGame3, isGame4]);

  const levelData = useMemo(() => {
    if (!hasSessions || !report.levelStats) return null;
    const labels = report.levelStats.map((level) => `Nivel ${level.level}`);
    const data = isGame4
      ? report.levelStats.map((level) => level.avgErrors || 0)
      : report.levelStats.map((level) => level.avgDysregulations || 0);
    return {
      labels,
      datasets: [
        {
          label: isGame4 ? 'Erros medios' : 'Desregulacoes medias',
          data,
          backgroundColor: 'rgba(245, 124, 124, 0.6)',
          borderColor: 'rgba(245, 124, 124, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [hasSessions, report, isGame4]);

  const strategyData = useMemo(() => {
    if (!hasSessions || !report.strategyUsage?.length) return null;
    return {
      labels: report.strategyUsage.map((item) => item.strategy),
      datasets: [
        {
          data: report.strategyUsage.map((item) => item.count),
          backgroundColor: [
            '#4c8da6',
            '#f4b266',
            '#9fd8b0',
            '#b5c5f2',
            '#f7a7b6',
            '#88d7d7',
            '#b3b3b3',
            '#f0d35e'
          ]
        }
      ]
    };
  }, [hasSessions, report]);

  const errorActivityData = useMemo(() => {
    if (!hasSessions || !isGame4 || !report?.errorActivityRanking?.length) return null;
    return {
      labels: report.errorActivityRanking.map((item) => item.activityLabel),
      datasets: [
        {
          data: report.errorActivityRanking.map((item) => item.count),
          backgroundColor: [
            '#f59e0b',
            '#f97316',
            '#fb7185',
            '#f472b6',
            '#fb923c'
          ]
        }
      ]
    };
  }, [hasSessions, report, isGame4]);

  const categoryData = useMemo(() => {
    if (!hasSessions || !report.categoryAutonomy?.length) return null;
    return {
      labels: report.categoryAutonomy.map((item) => item.category),
      datasets: [
        {
          data: report.categoryAutonomy.map((item) => item.averageIndependence || 0),
          backgroundColor: [
            '#4c8da6',
            '#f4b266',
            '#9fd8b0',
            '#b5c5f2',
            '#f7a7b6',
            '#88d7d7'
          ]
        }
      ]
    };
  }, [hasSessions, report]);

  const radarData = useMemo(() => {
    if (!hasSessions || !report?.radarMetrics) return null;
    const metrics = report.radarMetrics;
    return {
      labels: ['Planejamento', 'Memoria de trabalho', 'Flexibilidade', 'Inibicao'],
      datasets: [
        {
          label: 'Perfil executivo',
          data: [
            metrics.planning || 0,
            metrics.workingMemory || 0,
            metrics.flexibility || 0,
            metrics.inhibition || 0
          ],
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderColor: '#4f46e5',
          pointBackgroundColor: '#4f46e5',
          borderWidth: 2
        }
      ]
    };
  }, [hasSessions, report]);

  const radarOptions = useMemo(() => ({
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20 },
        pointLabels: { font: { size: 12 } }
      }
    },
    plugins: {
      legend: { display: false }
    }
  }), []);

  const offlineSuggestion = useMemo(() => {
    if (!report?.offlineSuggestions?.length) return null;
    const suggestion = report.offlineSuggestions[0];
    const labelMap = {
      higiene: 'Higiene',
      alimentacao: 'Alimentacao',
      escola: 'Rotina escolar',
      vestuario: 'Vestuario',
      organizacao: 'Organizacao'
    };
    return {
      ...suggestion,
      label: labelMap[suggestion.category] || suggestion.category
    };
  }, [report]);

  const analysis = report?.analysis;

  return (
    <div className="games-report mb-4">
      <Card className="games-report__hero shadow-sm border-0 mb-4">
        <div className="games-report__tabs">
          {games.map((game) => (
            <Button
              key={game.key}
              size="sm"
              variant={selectedGame === game.key ? 'primary' : 'outline-primary'}
              onClick={() => setSelectedGame(game.key)}
            >
              {game.label}
            </Button>
          ))}
        </div>
        <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h4 className="fw-bold mb-1">Relatorio de Jogos</h4>
            <p className="text-muted mb-0">Resumo clinico do desempenho nos jogos terapeuticos.</p>
          </div>
          <div className="d-flex flex-column align-items-end">
            <Badge bg="info" className="mb-2">{games.find((g) => g.key === selectedGame)?.label || 'Game'}</Badge>
            <small className="text-muted">
              {report?.lastSessionAt ? `Ultima sessao: ${new Date(report.lastSessionAt).toLocaleDateString('pt-BR')}` : 'Nenhuma sessao registrada'}
            </small>
          </div>
        </Card.Body>
      </Card>

      {loading && (
        <div className="text-muted d-flex align-items-center gap-2 mb-3">
          <Spinner animation="border" size="sm" /> Carregando relatorio...
        </div>
      )}

      {error && (
        <Alert variant="warning">{error}</Alert>
      )}

      {!loading && !hasSessions && (
        <Card className="games-report__empty border-0 shadow-sm">
          <Card.Body>
            <h5 className="fw-bold mb-2">Nenhuma sessao ainda</h5>
            <p className="text-muted mb-0">
              Inicie o jogo selecionado para gerar o primeiro relatorio terapeutico.
            </p>
          </Card.Body>
        </Card>
      )}

      {!loading && hasSessions && (
        <>
          <Row className="g-3 mb-4">
            <Col lg={3} md={6}>
              <Card className="games-report__metric shadow-sm border-0 h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="text-uppercase text-muted">Sessoes</h6>
                      <h3 className="fw-bold mb-0">{report.totalSessions}</h3>
                    </div>
                    <GraphUp size={28} className="text-primary" />
                  </div>
                  <small className="text-muted">Total de partidas registradas.</small>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6}>
              <Card className="games-report__metric shadow-sm border-0 h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="text-uppercase text-muted">{successLabel}</h6>
                      <h3 className="fw-bold mb-0">{formatPercent(report.avgSuccessRate)}</h3>
                    </div>
                    <EmojiSmile size={28} className="text-success" />
                  </div>
                  <small className="text-muted">
                    {isGame4
                      ? 'Organizacao eficiente da rotina.'
                      : isGame3
                        ? 'Indice medio de planejamento correto.'
                        : isGame2
                          ? 'Media de independencia nas missoes.'
                          : 'Media de regulacao bem sucedida.'}
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6}>
              <Card className="games-report__metric shadow-sm border-0 h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="text-uppercase text-muted">{timeLabel}</h6>
                      <h3 className="fw-bold mb-0">{formatSeconds(timeValue)}</h3>
                    </div>
                    <Clock size={28} className="text-warning" />
                  </div>
                  <small className="text-muted">
                    {isGame4
                      ? 'Tempo medio para concluir a rotina.'
                      : isGame3
                        ? 'Tempo medio para adaptar-se apos mudanca.'
                        : isGame2
                          ? 'Tempo medio por missao.'
                          : 'Tempo medio de regulacao.'}
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6}>
              <Card className="games-report__metric shadow-sm border-0 h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="text-uppercase text-muted">Nivel desbloqueado</h6>
                      <h3 className="fw-bold mb-0">{report.unlockedLevel}</h3>
                    </div>
                    <Unlock size={28} className="text-info" />
                  </div>
                  <small className="text-muted">Nivel maximo liberado.</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {analysis && (
            <Row className="g-3 mb-4">
              <Col lg={12}>
                <Card className="games-report__chart shadow-sm border-0">
                  <Card.Body>
                    <h6 className="fw-bold mb-2">Resumo IA</h6>
                    <p className="text-muted mb-3">{analysis.summary || 'Sem resumo disponivel.'}</p>

                    {analysis.highlights?.length > 0 && (
                      <>
                        <h6 className="text-uppercase text-muted">Destaques</h6>
                        <ul className="mb-3">
                          {analysis.highlights.map((item, index) => (
                            <li key={`highlight-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {analysis.alerts?.length > 0 && (
                      <>
                        <h6 className="text-uppercase text-danger">Alertas</h6>
                        <ul className="mb-3 text-danger">
                          {analysis.alerts.map((item, index) => (
                            <li key={`alert-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {analysis.recommendations?.length > 0 && (
                      <>
                        <h6 className="text-uppercase text-muted">Recomendacoes</h6>
                        <ul className="mb-0">
                          {analysis.recommendations.map((item, index) => (
                            <li key={`recommendation-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {isGame2 && (
            <Row className="g-3 mb-4">
              {report?.readinessScore !== undefined && (
                <Col lg={4} md={6}>
                  <Card className="games-report__metric shadow-sm border-0 h-100">
                    <Card.Body>
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 className="text-uppercase text-muted">Pronto para escola</h6>
                          <h3 className="fw-bold mb-0">{formatPercent(report.readinessScore)}</h3>
                        </div>
                        <EmojiSmile size={28} className="text-success" />
                      </div>
                      <small className="text-muted">Indice de independencia geral.</small>
                    </Card.Body>
                  </Card>
                </Col>
              )}
              <Col lg={4} md={6}>
                <Card className="games-report__metric shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-uppercase text-muted">Erros medios</h6>
                        <h3 className="fw-bold mb-0">{Number(report.avgErrors || 0).toFixed(1)}</h3>
                      </div>
                      <GraphUp size={28} className="text-danger" />
                    </div>
                    <small className="text-muted">Erros de ordem por sessao.</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="games-report__metric shadow-sm border-0 h-100">
                  <Card.Body>
                    <h6 className="text-uppercase text-muted">Sugestao offline</h6>
                    {offlineSuggestion ? (
                      <>
                        <div className="fw-bold mb-1">{offlineSuggestion.label}</div>
                        <small className="text-muted">{offlineSuggestion.suggestion}</small>
                      </>
                    ) : (
                      <small className="text-muted">Sem sugestoes no momento.</small>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {isGame3 && (
            <Row className="g-3 mb-4">
              <Col lg={4} md={6}>
                <Card className="games-report__metric shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-uppercase text-muted">Tentativas medias</h6>
                        <h3 className="fw-bold mb-0">{Number(report.avgAttempts || 0).toFixed(1)}</h3>
                      </div>
                      <GraphUp size={28} className="text-primary" />
                    </div>
                    <small className="text-muted">Tentativas por sessao.</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4} md={6}>
                <Card className="games-report__metric shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-uppercase text-muted">Perseveracao media</h6>
                        <h3 className="fw-bold mb-0">{Number(report.avgPerseverationErrors || 0).toFixed(1)}</h3>
                      </div>
                      <GraphUp size={28} className="text-danger" />
                    </div>
                    <small className="text-muted">Erros de repeticao apos mudanca.</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="games-report__metric shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-uppercase text-muted">Tempo total medio</h6>
                        <h3 className="fw-bold mb-0">{formatSeconds(report.avgSessionSeconds)}</h3>
                      </div>
                      <Clock size={28} className="text-warning" />
                    </div>
                    <small className="text-muted">Duracao media das sessoes.</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {isGame4 && (
            <Row className="g-3 mb-4">
              <Col lg={4} md={6}>
                <Card className="games-report__metric shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-uppercase text-muted">Tentativas medias</h6>
                        <h3 className="fw-bold mb-0">{Number(report.avgAttempts || 0).toFixed(1)}</h3>
                      </div>
                      <GraphUp size={28} className="text-primary" />
                    </div>
                    <small className="text-muted">Quantas tentativas por sessao.</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4} md={6}>
                <Card className="games-report__metric shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="text-uppercase text-muted">Erros medios</h6>
                        <h3 className="fw-bold mb-0">{Number(report.avgErrors || 0).toFixed(1)}</h3>
                      </div>
                      <GraphUp size={28} className="text-danger" />
                    </div>
                    <small className="text-muted">Erros por sessao.</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="games-report__metric shadow-sm border-0 h-100">
                  <Card.Body>
                    <h6 className="text-uppercase text-muted">Etapa mais dificil</h6>
                    {report.mostErrorActivity ? (
                      <>
                        <div className="fw-bold mb-1">{report.mostErrorActivity.activityLabel}</div>
                        <small className="text-muted">Erros: {report.mostErrorActivity.count}</small>
                      </>
                    ) : (
                      <small className="text-muted">Sem dados suficientes.</small>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          <Row className="g-3 mb-4">
            <Col lg={7}>
              <Card className="games-report__chart shadow-sm border-0 h-100">
                <Card.Body>
                  <h6 className="fw-bold mb-3">
                    {isGame4
                      ? 'Evolucao da eficiencia'
                      : isGame3
                        ? 'Evolucao do planejamento'
                        : isGame2
                          ? 'Evolucao da independencia'
                          : 'Evolucao do sucesso'}
                  </h6>
                  {timelineData ? <Line data={timelineData} /> : <div className="text-muted">Sem dados.</div>}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={5}>
              <Card className="games-report__chart shadow-sm border-0 h-100">
                <Card.Body>
                  <h6 className="fw-bold mb-3">
                    {isGame3
                      ? 'Radar de funcoes executivas'
                      : isGame4
                        ? 'Erros por nivel'
                        : 'Desregulacoes por nivel'}
                  </h6>
                  {isGame3
                    ? (radarData ? <Radar data={radarData} options={radarOptions} /> : <div className="text-muted">Sem dados.</div>)
                    : (levelData ? <Bar data={levelData} /> : <div className="text-muted">Sem dados.</div>)
                  }
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-3">
            {categoryData && (
              <Col lg={5}>
                <Card className="games-report__chart shadow-sm border-0 h-100">
                  <Card.Body>
                    <h6 className="fw-bold mb-3">Autonomia por categoria</h6>
                    <Doughnut data={categoryData} />
                  </Card.Body>
                </Card>
              </Col>
            )}

            <Col lg={5}>
              <Card className="games-report__chart shadow-sm border-0 h-100">
                <Card.Body>
                  <h6 className="fw-bold mb-3">
                    {isGame4 ? 'Atividades com mais erro' : 'Estrategias mais usadas'}
                  </h6>
                  {isGame4
                    ? (errorActivityData ? <Doughnut data={errorActivityData} /> : <div className="text-muted">Sem dados.</div>)
                    : (strategyData ? <Doughnut data={strategyData} /> : <div className="text-muted">Sem dados.</div>)
                  }
                </Card.Body>
              </Card>
            </Col>
            <Col lg={7}>
              <Card className="games-report__chart shadow-sm border-0 h-100">
                <Card.Body>
                  <h6 className="fw-bold mb-3">Ultimas sessoes</h6>
                  <Table responsive borderless className="mb-0">
                    <thead>
                      <tr className="text-muted">
                        <th>Data</th>
                        <th>Nivel</th>
                        <th>{successColumnLabel}</th>
                        <th>Tempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.sessionTimeline.slice(-5).map((item) => (
                        <tr key={item.id}>
                          <td>{item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'Sem data'}</td>
                          <td>{item.level || '-'}</td>
                          <td>{formatPercent(item.successRate)}</td>
                          <td>{formatSeconds(item.totalTimeSeconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default GamesReport;
