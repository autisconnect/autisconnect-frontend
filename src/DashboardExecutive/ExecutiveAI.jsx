import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Nav, Row, Spinner } from 'react-bootstrap';
import apiClient from '../services/api';

const labels = { insight: 'Insights', prediction: 'Previsões', indicator: 'Indicadores', alert: 'Alertas' };
const ExecutiveAI = () => {
  const [active, setActive] = useState('insight'); const [data, setData] = useState({ analyses: [], sourceSummary: {} }); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); try { const response = await apiClient.get('/executive/ai/overview'); setData(response.data); setError(''); } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível carregar a arquitetura de IA.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
  const items = data.analyses.filter((item) => item.analysis_type === active);
  return <><Alert variant="info">Área preparada para receber resultados de IA futuramente. Nenhum algoritmo é executado neste módulo.</Alert>{error && <Alert variant="danger">{error}</Alert>}<Row className="g-3 mb-4">{[['Pacientes', data.sourceSummary.patients], ['Atendimentos', data.sourceSummary.appointments], ['Alertas existentes', data.sourceSummary.alerts]].map(([label, value]) => <Col md={4} key={label}><Card><Card.Body><Card.Text className="text-muted">{label}</Card.Text><Card.Title>{value || 0}</Card.Title></Card.Body></Card></Col>)}</Row><Nav variant="tabs" activeKey={active} onSelect={(key) => setActive(key)} className="mb-3">{Object.entries(labels).map(([key, label]) => <Nav.Item key={key}><Nav.Link eventKey={key}>{label}</Nav.Link></Nav.Item>)}</Nav><Card><Card.Body><Card.Title>{labels[active]}</Card.Title>{items.length ? items.map((item) => <Card key={item.id} className="mb-2"><Card.Body><div className="d-flex justify-content-between"><strong>{item.title}</strong><Badge bg="secondary">{item.status}</Badge></div><pre className="mb-0 mt-2 small">{JSON.stringify(item.content || {}, null, 2)}</pre></Card.Body></Card>) : <div className="text-muted">Nenhum resultado armazenado para esta visão. A arquitetura está pronta para uma futura integração.</div>}<Button className="mt-3" variant="outline-secondary" onClick={load}>Atualizar consultas</Button></Card.Body></Card></>;
};
export default ExecutiveAI;
