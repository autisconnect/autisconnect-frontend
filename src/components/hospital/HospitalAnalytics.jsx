import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { BarChartLine, Download, FileEarmarkPdf, FiletypeCsv, People, PersonBadge } from 'react-bootstrap-icons';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import apiClient from '../../services/api';
import './HospitalAnalytics.css';

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip);
const number = (value) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(value || 0));
const variation = (value) => value === null || value === undefined ? 'Sem base anterior' : `${value > 0 ? '+' : ''}${number(value)}%`;

export default function HospitalAnalytics({ hospitalId, filters, initialView = 'indicators', canExport = false }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');
  const endpoint = initialView === 'reports' ? 'reports/institutional' : 'analytics';
  const params = useMemo(() => Object.fromEntries(Object.entries({ from: filters.from, to: filters.to, teamId: filters.teamId }).filter(([, value]) => value !== '')), [filters.from, filters.teamId, filters.to]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setReport((await apiClient.get(`/hospitals/${hospitalId}/${endpoint}`, { params })).data); }
    catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível carregar analytics hospitalares.'); }
    finally { setLoading(false); }
  }, [endpoint, hospitalId, params]);
  useEffect(() => { load(); }, [load]);

  const exportReport = async (format) => {
    setExporting(format); setError('');
    try {
      const response = await apiClient.get(`/hospitals/${hospitalId}/reports/export`, { params: { ...params, format }, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url;
      link.download = `autisconnect-hospital-${hospitalId}-${filters.from}-${filters.to}.${format}`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível exportar o relatório.'); }
    finally { setExporting(''); }
  };

  const chart = useMemo(() => ({
    labels: report?.teams.map((team) => team.teamName) || [],
    datasets: [
      { label: 'Atendimentos', data: report?.teams.map((team) => team.appointments) || [], backgroundColor: '#1672e8', borderRadius: 7 },
      { label: 'Evoluções', data: report?.teams.map((team) => team.progressRecords) || [], backgroundColor: '#15b69b', borderRadius: 7 },
      { label: 'Sessões ABA', data: report?.teams.map((team) => team.abaSessions) || [], backgroundColor: '#7549e8', borderRadius: 7 }
    ]
  }), [report]);
  if (loading && !report) return <div className="ach-analytics-state" role="status" aria-live="polite"><Spinner animation="border" aria-hidden="true" /><span>Calculando indicadores comparativos…</span></div>;
  if (!report) return <Alert variant="danger">{error || 'Analytics indisponíveis.'}<Button size="sm" variant="outline-danger" onClick={load}>Tentar novamente</Button></Alert>;
  const cards = [
    ['Atendimentos', report.indicators.appointments, report.variations.appointments, BarChartLine],
    ['Pacientes atendidos', report.indicators.servedPatients, report.variations.servedPatients, People],
    ['Cobertura assistencial', `${number(report.indicators.careCoverageRate)}%`, report.variations.careCoverageRate, People],
    ['Atendimentos/profissional', report.indicators.appointmentsPerProfessional, null, PersonBadge],
    ['Registros de evolução', report.indicators.progressRecords, report.variations.progressRecords, BarChartLine],
    ['Sessões ABA', report.indicators.abaSessions, report.variations.abaSessions, BarChartLine],
    ['Monitoramentos', report.indicators.monitoringRecords, report.variations.monitoringRecords, BarChartLine],
    ['Conclusão de atendimentos', `${number(report.indicators.completionRate)}%`, null, BarChartLine]
  ];
  return <section className="ach-analytics"><header><div><span>{initialView === 'reports' ? 'Relatório institucional' : 'Analytics assistencial'}</span><h2>{report.hospital.name}</h2><p>{report.period.from} a {report.period.to} · comparado com {report.comparisonPeriod.from} a {report.comparisonPeriod.to}</p></div>{initialView === 'reports' && canExport ? <div className="ach-export-actions"><Button variant="outline-primary" disabled={Boolean(exporting)} onClick={() => exportReport('csv')}><FiletypeCsv /> {exporting === 'csv' ? 'Gerando…' : 'CSV'}</Button><Button disabled={Boolean(exporting)} onClick={() => exportReport('pdf')}><FileEarmarkPdf /> {exporting === 'pdf' ? 'Gerando…' : 'PDF'}</Button></div> : null}</header>{error ? <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert> : null}<div className="ach-analytics-cards">{cards.map(([label, value, change, Icon]) => <article key={label}>{React.createElement(Icon)}<span><small>{label}</small><strong>{typeof value === 'number' ? number(value) : value}</strong><em className={change > 0 ? 'is-up' : change < 0 ? 'is-down' : ''}>{variation(change)}</em></span></article>)}</div><div className="ach-analytics-grid"><article><h3>Comparação entre equipes</h3><div className="ach-analytics-chart" role="img" aria-label="Gráfico comparativo de atendimentos, evoluções e sessões ABA por equipe"><Bar data={chart} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} /></div></article><article className="ach-analytics-table"><h3>Desempenho operacional</h3><div><table><caption className="visually-hidden">Desempenho operacional das equipes</caption><thead><tr><th scope="col">Equipe</th><th scope="col">Pac.</th><th scope="col">Prof.</th><th scope="col">Atend.</th><th scope="col">Variação</th></tr></thead><tbody>{report.teams.map((team) => <tr key={team.teamId}><td>{team.teamName}</td><td>{team.patients}</td><td>{team.professionals}</td><td>{team.appointments}</td><td>{variation(team.appointmentVariation)}</td></tr>)}</tbody></table></div></article></div><footer><Download aria-hidden="true" /><span>{report.disclaimer}</span></footer></section>;
}
