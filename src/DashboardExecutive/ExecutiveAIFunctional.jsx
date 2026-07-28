import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Nav, Row, Spinner } from 'react-bootstrap';
import apiClient from '../services/api';

const labels = { insight: 'Insights', prediction: 'Previsões', indicator: 'Indicadores', alert: 'Alertas' };
const severity = { INFO: 'info', WARNING: 'warning', CRITICAL: 'danger', SUCCESS: 'success' };
const formatValue = (value) => typeof value === 'number' ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value) : value;

export default function ExecutiveAIFunctional() {
  const [active, setActive] = useState('insight'); const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [running, setRunning] = useState(false); const [error, setError] = useState('');
  const load = async () => { setLoading(true); try { const { data } = await apiClient.get('/executive/ai/results'); setItems(data || []); setError(''); } catch (e) { setError(e.response?.data?.error || 'Não foi possível carregar os resultados de IA.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const recalculate = async () => { setRunning(true); try { const { data } = await apiClient.post('/executive/ai/recalculate'); setItems(data.results || []); setError(''); } catch (e) { setError(e.response?.data?.error || 'Não foi possível gerar as análises.'); } finally { setRunning(false); } };
  const visible = items.filter((item) => item.type === active);
  return <><div className="d-flex justify-content-between flex-wrap gap-2 mb-3"><div><h2 className="h4 mb-1">Inteligência Executiva</h2><p className="text-muted mb-0">Análises locais baseadas nos dados registrados pela clínica.</p></div><Button onClick={recalculate} disabled={running}>{running ? 'Gerando...' : 'Atualizar análises'}</Button></div>{error && <Alert variant="danger">{error}</Alert>}{loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : <><Nav variant="tabs" activeKey={active} onSelect={(key) => setActive(key)} className="mb-3">{Object.entries(labels).map(([key, label]) => <Nav.Item key={key}><Nav.Link eventKey={key}>{label}</Nav.Link></Nav.Item>)}</Nav>{visible.length ? <Row className="g-3">{visible.map((item) => <Col md={6} key={item.id}><Card className="h-100"><Card.Body><div className="d-flex justify-content-between gap-2"><Card.Title className="h6">{item.title}</Card.Title><Badge bg={severity[item.severity] || 'secondary'}>{item.severity}</Badge></div><Card.Text>{item.description}</Card.Text><small className="text-muted">Confiança: {formatValue(Number(item.confidence || 0))}% · Gerado em {new Date(item.generated_at).toLocaleString('pt-BR')}</small></Card.Body></Card></Col>)}</Row> : <Card><Card.Body className="text-center text-muted py-5">Ainda não existem dados suficientes para gerar análises inteligentes.<br />À medida que a clínica utilizar o sistema, os insights aparecerão automaticamente.</Card.Body></Card>}</>}</>;
}
