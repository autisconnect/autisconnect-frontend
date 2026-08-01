import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import apiClient from '../services/api';
import FiscalConfigurationPanel from './FiscalConfigurationPanel';
import FiscalDataValidationPanel from './FiscalDataValidationPanel';
import FiscalScenariosPanel from './FiscalScenariosPanel';
import FiscalAlertsPanel from './FiscalAlertsPanel';
import FiscalInsightsPanel from './FiscalInsightsPanel';
import FiscalExportsPanel from './FiscalExportsPanel';
const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export default function ExecutiveFiscalDashboard() {
  const [competence, setCompetence] = useState(new Date().toISOString().slice(0, 7)); const [summary, setSummary] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const load = async () => { setLoading(true); try { const { data } = await apiClient.get('/executive/fiscal/summary', { params: { competence } }); setSummary(data); setError(''); } catch (e) { setError(e.response?.data?.error || 'Configure um perfil fiscal antes de calcular estimativas.'); setSummary(null); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const calculate = async () => { setLoading(true); try { const { data } = await apiClient.post('/executive/fiscal/calculate', { competence }); setSummary(data); setError(''); } catch (e) { setError(e.response?.data?.error || 'Não foi possível calcular a estimativa.'); } finally { setLoading(false); } };
  const cards = [['Receita bruta', summary?.grossRevenue], ['Tributos estimados', summary?.estimatedTaxes?.total], ['Carga tributária', summary ? `${Number(summary.effectiveTaxRate || 0).toLocaleString('pt-BR')}%` : null], ['Receita líquida', summary?.netRevenueAfterTaxes], ['Reserva recomendada', summary?.taxReserveRecommended]];
  return <><div className="d-flex justify-content-between flex-wrap gap-2 mb-3"><div><h2 className="h4 mb-1">Gestão Fiscal Inteligente</h2><p className="text-muted mb-0">Estimativas tributárias e projeções para apoio à gestão da clínica.</p></div><Badge bg="warning" text="dark" className="align-self-start">Estimativa gerencial</Badge></div><Alert variant="warning">Este módulo não substitui a apuração realizada pelo contador.</Alert>{error && <Alert variant="danger">{error}</Alert>}<Card className="mb-4"><Card.Body className="d-flex gap-2 flex-wrap"><Form.Control type="month" value={competence} onChange={(e) => setCompetence(e.target.value)} style={{ maxWidth: 180 }} /><Button onClick={calculate} disabled={loading}>{loading ? 'Calculando...' : 'Calcular estimativa'}</Button><Button variant="outline-secondary" onClick={load} disabled={loading}>Atualizar</Button></Card.Body></Card>{loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : <><Row className="g-3">{cards.map(([title,value]) => <Col md={4} xl key={title}><Card className="h-100"><Card.Body><Card.Text className="text-muted">{title}</Card.Text><Card.Title className="h5">{value === null || value === undefined ? '—' : typeof value === 'string' ? value : money(value)}</Card.Title></Card.Body></Card></Col>)}</Row>{summary && <Card className="mt-4"><Card.Body><Card.Title className="h6">Composição dos tributos estimados</Card.Title><Row>{Object.entries(summary.estimatedTaxes || {}).filter(([key]) => !['total','credits'].includes(key)).map(([key,value]) => <Col md={3} key={key}><div className="border-bottom py-2 text-uppercase"><small>{key}</small><strong className="d-block">{money(value)}</strong></div></Col>)}</Row><p className="small text-muted mt-3 mb-0">{summary.disclaimer}</p></Card.Body></Card>}</>}<FiscalDataValidationPanel competence={competence} /><FiscalAlertsPanel competence={competence} /><FiscalInsightsPanel competence={competence} /><FiscalExportsPanel competence={competence} /><FiscalConfigurationPanel /><FiscalScenariosPanel /></>;
}








