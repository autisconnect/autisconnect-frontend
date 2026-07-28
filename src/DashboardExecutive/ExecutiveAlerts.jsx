import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Pagination, Row, Spinner, Table } from 'react-bootstrap';
import apiClient from '../services/api';
const variants = { INFO: 'info', SUCCESS: 'success', WARNING: 'warning', CRITICAL: 'danger' };
const severityLabels = { INFO: 'Informativo', SUCCESS: 'Sucesso', WARNING: 'Atenção', CRITICAL: 'Crítico' };
const statusLabels = { OPEN: 'Em aberto', READ: 'Lido', RESOLVED: 'Resolvido', DISMISSED: 'Descartado' };
const ExecutiveAlerts = () => { const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 1 } }); const [filters, setFilters] = useState({ severity: '', status: '', category: '', startDate: '', endDate: '' }); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async (page = 1) => { setLoading(true); setError(''); try { const response = await apiClient.get('/executive/alerts', { params: { page, limit: 20, ...filters } }); setData(response.data); } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível carregar os alertas.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const action = async (item, name) => { try { await apiClient.put(`/executive/alerts/${item.id}/${name}`); load(data.pagination.page); } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível atualizar o alerta.'); } };
  return <><div className="d-flex justify-content-between flex-wrap gap-2 mb-4"><div><h2 className="h4 mb-1">Alertas Executivos</h2><p className="text-muted mb-0">Regras determinísticas baseadas em dados da clínica.</p></div><Button variant="outline-secondary" onClick={() => load(data.pagination.page)}>Atualizar</Button></div>{error && <Alert variant="danger">{error}</Alert>}<Card className="mb-4"><Card.Body><Row className="g-2"><Col md={2}><Form.Select value={filters.severity} onChange={(event) => setFilters({ ...filters, severity: event.target.value })}><option value="">Severidade</option>{['INFO', 'SUCCESS', 'WARNING', 'CRITICAL'].map((item) => <option key={item}>{item}</option>)}</Form.Select></Col><Col md={2}><Form.Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Situação</option>{['OPEN', 'READ', 'RESOLVED', 'DISMISSED'].map((item) => <option key={item}>{item}</option>)}</Form.Select></Col><Col md={2}><Form.Control placeholder="Categoria" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} /></Col><Col md={2}><Form.Control type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} /></Col><Col md={2}><Form.Control type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} /></Col><Col md={2}><Button className="w-100" onClick={() => load(1)}>Filtrar</Button></Col></Row></Card.Body></Card><Card><Card.Body>{loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : <><Table responsive hover><thead><tr><th>Severidade</th><th>Alerta</th><th>Situação</th><th>Detectado</th><th>Ações</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.id}><td><Badge bg={variants[item.severity] || 'secondary'}>{item.severity}</Badge><span className="visually-hidden"> Severidade {item.severity}</span></td><td><strong>{item.title}</strong><div className="small text-muted">{item.message}</div></td><td>{item.status}</td><td>{new Date(item.detected_at).toLocaleString('pt-BR')}</td><td className="text-nowrap">{item.status === 'OPEN' && <Button size="sm" className="me-1" variant="outline-primary" onClick={() => action(item, 'read')}>Marcar lido</Button>}{['OPEN', 'READ'].includes(item.status) && <><Button size="sm" className="me-1" variant="outline-success" onClick={() => action(item, 'resolve')}>Resolver</Button><Button size="sm" variant="outline-secondary" onClick={() => action(item, 'dismiss')}>Descartar</Button></>}</td></tr>)}{!data.items.length && <tr><td colSpan="5" className="text-center">Nenhum alerta encontrado.</td></tr>}</tbody></Table><Pagination>{Array.from({ length: data.pagination.totalPages || 1 }, (_, index) => <Pagination.Item key={index + 1} active={data.pagination.page === index + 1} onClick={() => load(index + 1)}>{index + 1}</Pagination.Item>)}</Pagination></>}</Card.Body></Card></>;
};
const ExecutiveAlertsLocalized = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const selects = containerRef.current?.querySelectorAll('select');
    selects?.[0]?.querySelectorAll('option').forEach((option) => {
      option.textContent = severityLabels[option.value] || option.textContent;
    });
    selects?.[1]?.querySelectorAll('option').forEach((option) => {
      option.textContent = statusLabels[option.value] || option.textContent;
    });
  });

  return <div ref={containerRef}><ExecutiveAlerts /></div>;
};

export default ExecutiveAlertsLocalized;
