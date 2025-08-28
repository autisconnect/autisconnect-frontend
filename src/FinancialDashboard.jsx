import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Nav, Tab, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import apiClient from './services/api.js';
import logohori from './assets/logo.png';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

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
            const url = `/api/financials/professional/${professionalId}`;
            console.log('Requisição enviada para:', `${apiClient.defaults.baseURL}${url}`);
            try {
                const response = await apiClient.get(url);
                console.log('Dados financeiros recebidos:', response.data);
                setFinancialData(response.data);
                setProfessionalName(response.data.professionalName || user.name || '');
            } catch (err) {
                console.error('Erro ao buscar dados financeiros:', err);
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
        <Container fluid className="py-4 financial-dashboard">
            <Row className="professional-header-row mb-4 align-items-center">
                {/* Coluna da Logo */}
                <Col xs="auto">
                    <img src={logohori} alt="AutisConnect Logo" className="details-logo" />
                </Col>
                <Col>
                    <h1 className="professional-name mb-0 mt-2">Dashboard Financeiro</h1>
                    <p className="professional-specialty text-muted mb-0">{professionalName}</p>
                </Col>
                <Col xs="auto">
                    <Button variant="danger" onClick={handleLogout}>Sair</Button>
                </Col>
            </Row>
            
                <Row className="mb-4">
                    <Col md={4}>
                        <Card body className="text-center shadow-sm">
                            <h5>Faturamento do Mês</h5>
                            {/* CORREÇÃO AQUI: Apenas exiba o valor */}
                            <h3>R$ {financialData.summary?.monthlyRevenue || '0.00'}</h3>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card body className="text-center shadow-sm">
                            <h5>Ticket Médio</h5>
                            {/* CORREÇÃO AQUI: Apenas exiba o valor */}
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
                                            {/* CORREÇÃO AQUI: Apenas exiba o valor */}
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
    );
};

export default FinancialDashboard;
