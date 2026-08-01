import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner } from 'react-bootstrap';
import apiClient from '../services/api';
const labels = { CRITICAL: 'Crítico', WARNING: 'Atenção', INFO: 'Informativo' };
const variants = { CRITICAL: 'danger', WARNING: 'warning', INFO: 'info' };
export default function FiscalAlertsPanel({ competence }) {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const load = async () => { setLoading(true); try { const response = await apiClient.get('/executive/fiscal/alerts', { params: { competence } }); setData(response.data); setError(''); } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível carregar os alertas fiscais.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [competence]);
  return <Card className="mt-4"><Card.Body><div className="d-flex justify-content-between flex-wrap gap-2"><div><Card.Title className="h5">Alertas fiscais</Card.Title><p className="small text-muted mb-0">Regras determinísticas baseadas nos dados registrados para a competência.</p></div><Button size="sm" variant="outline-secondary" onClick={load} disabled={loading}>Atualizar</Button></div>{error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}{loading ? <div className="text-center py-3"><Spinner size="sm" animation="border" /></div> : <div className="mt-3">{data?.alerts?.length ? data.alerts.map((item) => <Alert key={item.key} variant={variants[item.severity] || 'secondary'} className="mb-2"><div className="d-flex justify-content-between gap-2"><strong>{item.title}</strong><Badge bg={variants[item.severity] || 'secondary'}>{labels[item.severity] || item.severity}</Badge></div><span>{item.message}</span></Alert>) : <Alert variant="success" className="mb-0">Nenhum alerta fiscal identificado para esta competência.</Alert>}</div>}</Card.Body></Card>;
}
