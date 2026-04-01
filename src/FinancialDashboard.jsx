import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Nav, Tab, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';
import logonovo from './assets/logonovo.png';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const FinancialDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const { id: professionalId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [financialData, setFinancialData] = useState(null);
    const [professionalName, setProfessionalName] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        paymentMethod: 'todos',
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.tipo_usuario !== 'medicos_terapeutas' || professionalId !== user.id.toString()) {
            navigate(`/professional-dashboard/${user.id}`);
            return;
        }

        const fetchFinancialData = async () => {
            setLoading(true);
            setError('');
            console.log('professionalId:', professionalId);
            // Corrigido: Remove o prefixo /api
            const url = `/financials/professional/${professionalId}`;
            console.log('Requisição enviada para:', `${apiClient.defaults.baseURL}${url}`);
            try {
                const response = await apiClient.get(url);
                console.log('Dados financeiros recebidos:', response.data);
                setFinancialData(response.data);
                setProfessionalName(response.data.professionalName || user.name || '');
            } catch (err) {
                console.error('Erro ao buscar dados financeiros:', err.message, err.response?.status, err.response?.data);
                const message = err.response?.data?.error || 'Falha ao carregar dados financeiros.';
                setError(message);
                setFinancialData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchFinancialData();
    }, [professionalId, user, navigate]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        console.log('Filtros aplicados no frontend:', filters);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" /><p>Carregando dados financeiros...</p></Container>;
    }
    if (error) {
        return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    }
    if (!financialData) {
        return <Container className="mt-5"><Alert variant="info">Nenhum dado financeiro encontrado.</Alert></Container>;
    }

    const pieChartData = {
        labels: financialData.revenueByPaymentMethod?.labels || [],
        datasets: [
            {
                data: financialData.revenueByPaymentMethod?.data || [],
                backgroundColor: ['#28a745', '#007bff', '#ffc107', '#6f42c1', '#dc3545'],
            },
        ],
    };

    const barChartData = {
        labels: financialData.monthlyPerformance?.labels || [],
        datasets: [
            {
                label: 'Faturamento Mensal (R$)',
                data: financialData.monthlyPerformance?.data || [],
                backgroundColor: 'rgba(0, 123, 255, 0.6)',
            },
        ],
    };

    const filteredReport = financialData.detailedReport?.filter((item) => {
        const itemDate = new Date(item.date);
        const startDate = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null;
        const endDate = filters.endDate ? new Date(filters.endDate + 'T23:59:59') : null;

        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        if (filters.paymentMethod !== 'todos' && item.paymentMethod !== filters.paymentMethod) return false;

        return true;
    }) || [];

    return (
        <div className="App bg-light min-vh-100">
            <nav className="top-bar fixed-top shadow-sm">
                <Container>
                    <Row className="align-items-center py-3">
                        <Col md={4} className="text-center text-md-start">
                            <img src={logonovo} alt="AutisConnect" className="top-bar-logo" />
                        </Col>
                        <Col md={4} className="text-center d-none d-md-block">
                            <span className="text-white fw-semibold">Dashboard Financeiro</span>
                        </Col>
                        <Col md={4} className="text-center text-md-end">
                            <Button variant="outline-light" size="sm" onClick={handleLogout}>Sair</Button>
                        </Col>
                    </Row>
                </Container>
            </nav>

            <div className="home-page" style={{ paddingTop: '85px' }}>
                <section className="hero-section hero-short">
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={7} className="mb-4 mb-lg-0">
                                <div className="hero-content-box p-4 rounded-4">
                                    <h2 className="display-6 fw-bold mb-2 text-white">Dashboard Financeiro</h2>
                                    <p className="text-white-90 mb-1">
                                        {professionalName || user?.nome_completo || user?.username || 'Profissional'}
                                    </p>
                                    <p className="text-white-90 mb-0">
                                        Controle receitas, pagamentos e indicadores financeiros.
                                    </p>
                                </div>
                            </Col>
                            <Col lg={5}>
                                <Card className="shadow-sm border-0">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-2">Resumo rapido</h5>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="text-muted">Saldo atual</span>
                                            <span className="fw-semibold">
                                                {financialData?.summary?.balance ? `R$ ${Number(financialData.summary.balance).toFixed(2)}` : 'R$ 0,00'}
                                            </span>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="text-muted">Receita mensal</span>
                                            <span className="fw-semibold">
                                                {financialData?.summary?.monthlyRevenue ? `R$ ${Number(financialData.summary.monthlyRevenue).toFixed(2)}` : 'R$ 0,00'}
                                            </span>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <span className="text-muted">Pagamentos pendentes</span>
                                            <span className="fw-semibold">
                                                {financialData?.summary?.pendingPayments || 0}
                                            </span>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2">
                                            <Badge bg="info">Financeiro ativo</Badge>
                                            <Badge bg="secondary">Clinica</Badge>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <main className="dashboard-section py-4">
                    <Container fluid className="financial-dashboard">
            <Row className="mb-4">
                <Col md={4}>
                    <Card body className="text-center shadow-sm">
                        <h5>Faturamento do Mês</h5>
                        <h3>R$ {financialData.summary?.monthlyRevenue || '0.00'}</h3>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card body className="text-center shadow-sm">
                        <h5>Ticket Médio</h5>
                        <h3>R$ {financialData.summary?.averageTicket || '0.00'}</h3>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card body className="text-center shadow-sm">
                        <h5>Consultas Pagas (Mês)</h5>
                        <h3>{financialData.summary?.paidAppointments || 0}</h3>
                    </Card>
                </Col>
            </Row>
            <Row className="mb-4">
                <Col md={7}>
                    <Card className="shadow-sm">
                        <Card.Header>
                            <h6>Evolução do Faturamento (Últimos 6 Meses)</h6>
                        </Card.Header>
                        <Card.Body>
                            {barChartData.labels.length > 0 ? (
                                <Bar data={barChartData} options={{ responsive: true }} />
                            ) : (
                                <p className="text-muted">Nenhum dado disponível para o gráfico.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={5}>
                    <Card className="shadow-sm">
                        <Card.Header>
                            <h6>Distribuição por Forma de Pagamento</h6>
                        </Card.Header>
                        <Card.Body>
                            {pieChartData.labels.length > 0 ? (
                                <Pie data={pieChartData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
                            ) : (
                                <p className="text-muted">Nenhum dado disponível para o gráfico.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Card className="shadow-sm">
                <Card.Header>
                    <h5>Relatório Detalhado de Consultas</h5>
                </Card.Header>
                <Card.Body>
                    <Form className="mb-3 border-bottom pb-3">
                        <Row className="align-items-end g-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Data Início</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Data Fim</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Forma de Pagamento</Form.Label>
                                    <Form.Select
                                        name="paymentMethod"
                                        value={filters.paymentMethod}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="todos">Todas</option>
                                        <option value="Pix">Pix</option>
                                        <option value="Crédito">Crédito</option>
                                        <option value="Débito">Débito</option>
                                        <option value="Plano de Saúde">Plano de Saúde</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Button onClick={handleApplyFilters} className="w-100">
                                    Aplicar Filtros
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Paciente</th>
                                <th>Valor (R$)</th>
                                <th>Forma de Pagamento</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReport.length > 0 ? (
                                filteredReport.map((item) => (
                                    <tr key={item.id}>
                                        <td>{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                                        <td>{item.patientName || 'N/A'}</td>
                                        <td>{item.value || '0.00'}</td>
                                        <td>{item.paymentMethod || 'N/A'}</td>
                                        <td>
                                            <Badge bg={item.status === 'Pago' ? 'success' : 'warning'}>
                                                {item.status || 'N/A'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">
                                        Nenhum registro encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
        </main>

        <footer className="footer-section py-4">
            <Container>
                <Row className="align-items-center">
                    <Col md={6} className="footer-left text-start">
                        <p className="mb-0">
                            {'\u00a9'} 2026 Nf Representacoes Comerciais Ltda.<br />
                            <small>Todos os direitos reservados.</small>
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
      </div>
    </div>
    );
};

export default FinancialDashboard;
