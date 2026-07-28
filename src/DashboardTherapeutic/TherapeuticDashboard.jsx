import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { ArrowLeft, PeopleFill, PersonCheckFill, PersonXFill } from 'react-bootstrap-icons';
import apiClient from '../services/api';
import '../DashboardExecutive/DashboardExecutive.css';
import './TherapeuticDashboard.css';

const TherapeuticDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiClient.get('/therapeutic-management/professionals', { params: { page: 1, limit: 100 } })
      .then((response) => { if (active) setData({ items: Array.isArray(response.data?.items) ? response.data.items : [], summary: response.data?.summary || {} }); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.error || 'Não foi possível carregar a gestão terapêutica.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
  const cards = [['Profissionais vinculados', data.summary.total, 'Total de profissionais cadastrados.', PeopleFill], ['Profissionais ativos', data.summary.active, 'Contas ativas no AutisConnect.', PersonCheckFill], ['Utilizam Gestão Terapêutica', data.summary.therapeuticActive, 'Recursos terapêuticos em uso.', PersonCheckFill], ['Não utilizam', data.summary.therapeuticInactive, 'Profissionais sem uso identificado.', PersonXFill]];
  return <section><Button variant="outline-secondary" className="mb-4" onClick={() => navigate('/dashboard-executivo')}><ArrowLeft className="me-2" />Dashboard Executivo</Button><div className="mb-4"><h2 className="h4 mb-1">Gestão Terapêutica</h2><p className="text-muted mb-0">Acompanhe os profissionais vinculados à sua clínica e identifique quem utiliza os recursos terapêuticos do AutisConnect.</p></div>{error && <Alert variant="danger">{error}</Alert>}<Row className="g-3 mb-4">{cards.map(([label, value, description, Icon]) => <Col key={label} md={6} xl={3}><Card className="h-100"><Card.Body><Icon className="text-primary mb-2" size={22} /><Card.Text className="text-muted mb-1">{label}</Card.Text><Card.Title>{Number(value || 0)}</Card.Title><small className="text-muted">{description}</small></Card.Body></Card></Col>)}</Row><Card><Card.Body><Card.Title>Profissionais vinculados</Card.Title><Row className="g-2 mb-3"><Col md={6}><Form.Control placeholder="Pesquisar profissional" disabled /></Col><Col md={3}><Form.Select disabled><option>Especialidade</option></Form.Select></Col><Col md={3}><Form.Select disabled><option>Status terapêutico</option></Form.Select></Col></Row><Table responsive hover><thead><tr><th>Profissional</th><th>Especialidade</th><th>Vínculo</th><th>Conta</th><th>Gestão Terapêutica</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.id}><td>{item.nome_completo}</td><td>{item.especialidade || 'Não informada'}</td><td>{item.link_status}</td><td>{item.account_status}</td><td>{item.therapeutic_access ? 'Ativo' : 'Não utiliza'}</td></tr>)}{!data.items.length && <tr><td colSpan="5" className="text-center">Nenhum profissional vinculado à clínica utiliza a Gestão Terapêutica no momento.</td></tr>}</tbody></Table></Card.Body></Card></section>;
};

const TherapeuticDashboardStyled = () => <div className="therapeutic-dashboard"><TherapeuticDashboard /></div>;

export default TherapeuticDashboardStyled;
