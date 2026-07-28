import { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Title, Tooltip } from 'chart.js';
import { Alert, Button, Card, Col, Form, Pagination, Row, Spinner, Table } from 'react-bootstrap';
import apiClient from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const resources = [
  { key: 'receivables', label: 'Contas a Receber', fields: ['description', 'counterparty', 'amount', 'due_date', 'received_date', 'status', 'notes'], statuses: ['pending', 'received', 'overdue', 'cancelled'] },
  { key: 'payables', label: 'Contas a Pagar', fields: ['description', 'counterparty', 'amount', 'due_date', 'paid_date', 'status', 'notes'], statuses: ['pending', 'paid', 'overdue', 'cancelled'] },
  { key: 'cash-flow', label: 'Fluxo de Caixa', fields: ['description', 'amount', 'flow_date', 'flow_type', 'notes'], statuses: [] },
  { key: 'cost-centers', label: 'Centro de Custos', fields: ['name', 'code', 'status', 'description'], statuses: ['active', 'inactive'] }
];

const blank = (resource) => Object.fromEntries(resource.fields.map((field) => [field, '']));
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
const fieldLabel = (field) => ({ description: 'Descrição', counterparty: 'Cliente/Fornecedor', amount: 'Valor', due_date: 'Vencimento', received_date: 'Recebimento', paid_date: 'Pagamento', status: 'Status', notes: 'Observações', flow_date: 'Data', flow_type: 'Tipo', name: 'Nome', code: 'Código' }[field] || field);

const Financeiro = () => {
  const [activeKey, setActiveKey] = useState('dashboard');
  const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 1 }, summary: null, flow: [] });
  const [filters, setFilters] = useState({ search: '', status: '', orderBy: '', order: 'DESC' });
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resource = useMemo(() => resources.find((item) => item.key === activeKey), [activeKey]);

  const load = async (page = 1) => {
    setLoading(true); setError('');
    try {
      if (activeKey === 'dashboard') {
        const response = await apiClient.get('/executive/finance/dashboard');
        setData((current) => ({ ...current, ...response.data }));
      } else {
        const response = await apiClient.get(`/executive/finance/${activeKey}`, { params: { page, limit: 10, ...filters } });
        setData((current) => ({ ...current, ...response.data }));
      }
    } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível carregar os dados financeiros.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { setForm(resource ? blank(resource) : {}); setEditingId(null); setFilters({ search: '', status: '', orderBy: '', order: 'DESC' }); }, [activeKey, resource]);
  useEffect(() => { load(); }, [activeKey]);

  const save = async (event) => {
    event.preventDefault();
    try {
      if (editingId) await apiClient.put(`/executive/finance/${activeKey}/${editingId}`, form);
      else await apiClient.post(`/executive/finance/${activeKey}`, form);
      setForm(blank(resource)); setEditingId(null); load(data.pagination?.page || 1);
    } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível salvar o registro.'); }
  };
  const edit = (item) => { setEditingId(item.id); setForm(Object.fromEntries(resource.fields.map((field) => [field, item[field] || '']))); };
  const remove = async (id) => { if (!window.confirm('Excluir este registro?')) return; try { await apiClient.delete(`/executive/finance/${activeKey}/${id}`); load(data.pagination?.page || 1); } catch (requestError) { setError(requestError.response?.data?.error || 'Não foi possível excluir o registro.'); } };

  if (loading && activeKey === 'dashboard') return <div className="text-center py-5"><Spinner animation="border" /></div>;
  if (activeKey === 'dashboard') {
    const summary = data.summary || { revenue: 0, expense: 0, balance: 0, profit: 0 };
    const labels = (data.flow || []).map((item) => item.label);
    return <><div className="d-flex flex-wrap gap-2 mb-4">{['Dashboard Financeiro', ...resources.map((item) => item.label)].map((label, index) => <Button key={label} variant={index === 0 ? 'primary' : 'outline-secondary'} onClick={() => index && setActiveKey(resources[index - 1].key)}>{label}</Button>)}</div><Row className="g-3 mb-4">{[['Receita', summary.revenue], ['Despesa', summary.expense], ['Saldo', summary.balance], ['Lucro', summary.profit]].map(([label, value]) => <Col key={label} md={6} xl={3}><Card className="h-100"><Card.Body><Card.Text className="text-muted">{label}</Card.Text><Card.Title>{money(value)}</Card.Title></Card.Body></Card></Col>)}</Row><Row className="g-4"><Col lg={7}><Card><Card.Body><Card.Title>Receita e Despesa</Card.Title><Bar data={{ labels, datasets: [{ label: 'Receita', data: (data.flow || []).map((item) => item.revenue), backgroundColor: '#0f766e' }, { label: 'Despesa', data: (data.flow || []).map((item) => item.expense), backgroundColor: '#dc3545' }] }} /></Card.Body></Card></Col><Col lg={5}><Card><Card.Body><Card.Title>Fluxo de Caixa</Card.Title><Line data={{ labels, datasets: [{ label: 'Saldo', data: (data.flow || []).map((item) => Number(item.revenue) - Number(item.expense)), borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,.12)', fill: true }] }} /></Card.Body></Card></Col></Row></>;
  }

  return <><div className="d-flex flex-wrap gap-2 mb-4"><Button variant="outline-secondary" onClick={() => setActiveKey('dashboard')}>Dashboard Financeiro</Button>{resources.map((item) => <Button key={item.key} variant={item.key === activeKey ? 'primary' : 'outline-secondary'} onClick={() => setActiveKey(item.key)}>{item.label}</Button>)}</div>{error && <Alert variant="danger">{error}</Alert>}<Card className="mb-4"><Card.Body><Form onSubmit={save}><Row className="g-3">{resource.fields.map((field) => <Col key={field} md={field === 'notes' || field === 'description' ? 12 : 4}><Form.Label>{fieldLabel(field)}</Form.Label>{field === 'status' ? <Form.Select value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })}><option value="">Selecione</option>{resource.statuses.map((status) => <option key={status}>{status}</option>)}</Form.Select> : field === 'flow_type' ? <Form.Select value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })}><option value="">Selecione</option><option value="inflow">Entrada</option><option value="outflow">Saída</option></Form.Select> : <Form.Control required={['description', 'amount', 'due_date', 'flow_date', 'name'].includes(field)} type={field.includes('date') ? 'date' : field === 'amount' ? 'number' : 'text'} step={field === 'amount' ? '0.01' : undefined} value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />}</Col>)}</Row><div className="d-flex gap-2 mt-3"><Button type="submit">{editingId ? 'Atualizar' : 'Cadastrar'}</Button>{editingId && <Button variant="outline-secondary" onClick={() => { setEditingId(null); setForm(blank(resource)); }}>Cancelar</Button>}</div></Form></Card.Body></Card><Card><Card.Body><Row className="g-2 mb-3"><Col md={5}><Form.Control placeholder="Pesquisar" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></Col>{resource.statuses.length > 0 && <Col md={3}><Form.Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos os status</option>{resource.statuses.map((status) => <option key={status}>{status}</option>)}</Form.Select></Col>}<Col md={2}><Form.Select value={filters.order} onChange={(event) => setFilters({ ...filters, order: event.target.value })}><option value="DESC">Mais recentes</option><option value="ASC">Mais antigos</option></Form.Select></Col><Col md={2}><Button className="w-100" onClick={() => load(1)}>Filtrar</Button></Col></Row>{loading ? <div className="text-center py-4"><Spinner animation="border" /></div> : <Table responsive hover><thead><tr>{['Descrição', 'Valor', 'Data', 'Status', 'Ações'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{data.items.map((item) => <tr key={item.id}><td>{item.description || item.name}</td><td>{item.amount ? money(item.amount) : item.code || '—'}</td><td>{item.due_date || item.flow_date || '—'}</td><td>{item.status || item.flow_type || '—'}</td><td><Button size="sm" variant="outline-primary" className="me-2" onClick={() => edit(item)}>Editar</Button><Button size="sm" variant="outline-danger" onClick={() => remove(item.id)}>Excluir</Button></td></tr>)}{!data.items.length && <tr><td colSpan="5" className="text-center">Nenhum registro encontrado.</td></tr>}</tbody></Table>}<Pagination>{Array.from({ length: data.pagination?.totalPages || 1 }, (_, index) => <Pagination.Item key={index + 1} active={data.pagination?.page === index + 1} onClick={() => load(index + 1)}>{index + 1}</Pagination.Item>)}</Pagination></Card.Body></Card></>;
};

export default Financeiro;
