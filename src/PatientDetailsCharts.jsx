import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Table } from 'react-bootstrap';
import { ArrowLeft, GraphUp, Calendar3, ExclamationTriangle, Heart } from 'react-bootstrap-icons';
import { Line, Bar, Pie, Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

const PatientDetailsCharts = () => {
    const [patient, setPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [periodFilter, setPeriodFilter] = useState('month');
    
    // Dados simulados para os gráficos
    const [triggerData, setTriggerData] = useState(null);
    const [strokeData, setStrokeData] = useState(null);
    const [stereotypyData, setStereotypyData] = useState(null);
    const [emotionData, setEmotionData] = useState(null);

    useEffect(() => {
        // Obter o ID do paciente da URL
        const urlParams = new URLSearchParams(window.location.search);
        const patientId = urlParams.get('id');
        
        if (patientId) {
            // Em um cenário real, buscaríamos os dados do paciente de uma API
            fetchPatientData(patientId);
            generateMockData();
        }
    }, []);

    // Função para buscar dados do paciente (simulada)
    const fetchPatientData = (patientId) => {
        // Simulação de dados do paciente
        const mockPatient = {
            id: parseInt(patientId),
            name: `Paciente ${patientId}`,
            age: Math.floor(Math.random() * 10) + 5, // Idade entre 5 e 15
            diagnosis: ['TEA Nível 1', 'TEA Nível 2', 'TEA Nível 3', 'Em avaliação'][Math.floor(Math.random() * 4)],
            parent: 'Responsável',
            progress: Math.floor(Math.random() * 100),
            // Outros dados relevantes
        };
        
        setPatient(mockPatient);
    };

    // Gerar dados simulados para os gráficos
    const generateMockData = () => {
        // Dados para o gráfico de gatilhos
        const triggerLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const triggerMockData = {
            labels: triggerLabels,
            datasets: [
                {
                    label: 'Gatilhos Sonoros',
                    data: [2, 3, 1, 4, 2, 3],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Gatilhos Visuais',
                    data: [1, 2, 2, 3, 1, 2],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };
        setTriggerData(triggerMockData);

        // Dados para o gráfico de risco de AVC
        const strokeLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const strokeMockData = {
            labels: strokeLabels,
            datasets: [
                {
                    label: 'Índice de Assimetria Facial',
                    data: [0.15, 0.12, 0.18, 0.14, 0.11, 0.13],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };
        setStrokeData(strokeMockData);

        // Dados para o gráfico de estereotipias
        const stereotypyMockData = {
            labels: ['Balançar corpo', 'Movimento de mãos', 'Bater palmas', 'Dançar'],
            datasets: [
                {
                    label: 'Frequência de Estereotipias',
                    data: [12, 8, 5, 3],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }
            ]
        };
        setStereotypyData(stereotypyMockData);

        // Dados para o gráfico de emoções
        const emotionLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const emotionMockData = {
            labels: emotionLabels,
            datasets: [
                {
                    label: 'Feliz',
                    data: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Triste',
                    data: [0.5, 0.4, 0.3, 0.2, 0.2, 0.1],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Neutro',
                    data: [0.2, 0.2, 0.2, 0.2, 0.1, 0.1],
                    borderColor: 'rgba(201, 203, 207, 1)',
                    backgroundColor: 'rgba(201, 203, 207, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };
        setEmotionData(emotionMockData);
    };

    // Opções para os gráficos
    const lineOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Evolução ao Longo do Tempo'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Valor'
                }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Distribuição'
            }
        }
    };

    // Função para voltar à página anterior
    const handleGoBack = () => {
        window.close(); // Fecha a aba atual
    };

    // Função para mudar o período de filtro
    const handlePeriodChange = (e) => {
        setPeriodFilter(e.target.value);
        // Em um cenário real, recarregaríamos os dados com base no novo período
    };

    if (!patient) {
        return (
            <Container className="mt-5 text-center">
                <h3>Carregando dados do paciente...</h3>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            {/* Cabeçalho */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <Button variant="outline-primary" onClick={handleGoBack} className="me-3">
                                <ArrowLeft /> Voltar
                            </Button>
                            <h1 className="d-inline-block mb-0">Detalhes do Paciente: {patient.name}</h1>
                        </div>
                        <div className="text-end">
                            <p className="mb-1"><strong>Idade:</strong> {patient.age} anos</p>
                            <p className="mb-1"><strong>Diagnóstico:</strong> {patient.diagnosis}</p>
                            <p className="mb-0"><strong>Responsável:</strong> {patient.parent}</p>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Filtro de período */}
            <Row className="mb-4">
                <Col md={3}>
                    <div className="d-flex align-items-center">
                        <label htmlFor="period-filter" className="me-2">Período:</label>
                        <select 
                            id="period-filter" 
                            className="form-select" 
                            value={periodFilter} 
                            onChange={handlePeriodChange}
                        >
                            <option value="week">Última Semana</option>
                            <option value="month">Último Mês</option>
                            <option value="quarter">Último Trimestre</option>
                            <option value="year">Último Ano</option>
                        </select>
                    </div>
                </Col>
            </Row>

            {/* Navegação entre abas */}
            <Row className="mb-4">
                <Col>
                    <Tab.Container id="monitoring-tabs" activeKey={activeTab} onSelect={setActiveTab}>
                        <Nav variant="tabs" className="mb-3">
                            <Nav.Item>
                                <Nav.Link eventKey="overview">Visão Geral</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="trigger">Gatilhos</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="stroke">Risco de AVC</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="stereotypy">Estereotipias</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="emotion">Emoções</Nav.Link>
                            </Nav.Item>
                        </Nav>
                        
                        <Tab.Content>
                            {/* Aba de Visão Geral */}
                            <Tab.Pane eventKey="overview">
                                <Row>
                                    {/* Cards de resumo */}
                                    <Col md={12} className="mb-4">
                                        <Row>
                                            <Col md={3}>
                                                <Card className="text-center mb-3 mb-md-0 shadow-sm">
                                                    <Card.Body>
                                                        <ExclamationTriangle className="text-warning mb-2" size={24} />
                                                        <h6>Gatilhos Identificados</h6>
                                                        <h3>4</h3>
                                                        <small className="text-muted">Último: Sirene (2 dias atrás)</small>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="text-center mb-3 mb-md-0 shadow-sm">
                                                    <Card.Body>
                                                        <Heart className="text-danger mb-2" size={24} />
                                                        <h6>Risco de AVC</h6>
                                                        <h3>Baixo</h3>
                                                        <small className="text-muted">Assimetria: 0.12</small>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="text-center mb-3 mb-md-0 shadow-sm">
                                                    <Card.Body>
                                                        <GraphUp className="text-primary mb-2" size={24} />
                                                        <h6>Estereotipias Comuns</h6>
                                                        <h3>Balançar</h3>
                                                        <small className="text-muted">Frequência: 12x/semana</small>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={3}>
                                                <Card className="text-center shadow-sm">
                                                    <Card.Body>
                                                        <Calendar3 className="text-success mb-2" size={24} />
                                                        <h6>Emoção Predominante</h6>
                                                        <h3>Feliz</h3>
                                                        <small className="text-muted">Última sessão: 85%</small>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Col>

                                    {/* Gráficos de visão geral */}
                                    <Col md={6} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Evolução de Gatilhos e Estereotipias</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {triggerData && <Line data={triggerData} options={lineOptions} />}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Evolução de Emoções</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {emotionData && <Line data={emotionData} options={lineOptions} />}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Distribuição de Estereotipias</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {stereotypyData && <Pie data={stereotypyData} options={pieOptions} />}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Índice de Assimetria Facial</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {strokeData && <Line data={strokeData} options={lineOptions} />}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>
                            
                            {/* Aba de Gatilhos */}
                            <Tab.Pane eventKey="trigger">
                                <Row>
                                    <Col md={8} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Evolução de Gatilhos ao Longo do Tempo</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {triggerData && <Line data={triggerData} options={lineOptions} />}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={4} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Distribuição de Gatilhos</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Pie 
                                                    data={{
                                                        labels: ['Sonoros', 'Visuais', 'Táteis', 'Outros'],
                                                        datasets: [{
                                                            data: [15, 10, 5, 2],
                                                            backgroundColor: [
                                                                'rgba(255, 99, 132, 0.6)',
                                                                'rgba(54, 162, 235, 0.6)',
                                                                'rgba(255, 206, 86, 0.6)',
                                                                'rgba(75, 192, 192, 0.6)'
                                                            ],
                                                            borderColor: [
                                                                'rgba(255, 99, 132, 1)',
                                                                'rgba(54, 162, 235, 1)',
                                                                'rgba(255, 206, 86, 1)',
                                                                'rgba(75, 192, 192, 1)'
                                                            ],
                                                            borderWidth: 1
                                                        }]
                                                    }} 
                                                    options={pieOptions} 
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={12}>
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                <h5 className="mb-0">Histórico de Gatilhos Registrados</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Table striped bordered hover responsive>
                                                    <thead>
                                                        <tr>
                                                            <th>Data</th>
                                                            <th>Tipo</th>
                                                            <th>Descrição</th>
                                                            <th>Intensidade</th>
                                                            <th>Duração</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>04/06/2025</td>
                                                            <td>Sonoro</td>
                                                            <td>Sirene</td>
                                                            <td>Alta</td>
                                                            <td>5 segundos</td>
                                                        </tr>
                                                        <tr>
                                                            <td>28/05/2025</td>
                                                            <td>Visual</td>
                                                            <td>Luz piscando</td>
                                                            <td>Média</td>
                                                            <td>10 segundos</td>
                                                        </tr>
                                                        <tr>
                                                            <td>15/05/2025</td>
                                                            <td>Sonoro</td>
                                                            <td>Voz alta</td>
                                                            <td>Média</td>
                                                            <td>8 segundos</td>
                                                        </tr>
                                                        <tr>
                                                            <td>02/05/2025</td>
                                                            <td>Tátil</td>
                                                            <td>Textura áspera</td>
                                                            <td>Baixa</td>
                                                            <td>15 segundos</td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>
                            
                            {/* Aba de Risco de AVC */}
                            <Tab.Pane eventKey="stroke">
                                <Row>
                                    <Col md={8} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Evolução do Índice de Assimetria Facial</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {strokeData && <Line data={strokeData} options={lineOptions} />}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={4} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Distribuição de Níveis de Risco</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Pie 
                                                    data={{
                                                        labels: ['Baixo', 'Médio', 'Alto'],
                                                        datasets: [{
                                                            data: [75, 20, 5],
                                                            backgroundColor: [
                                                                'rgba(75, 192, 192, 0.6)',
                                                                'rgba(255, 206, 86, 0.6)',
                                                                'rgba(255, 99, 132, 0.6)'
                                                            ],
                                                            borderColor: [
                                                                'rgba(75, 192, 192, 1)',
                                                                'rgba(255, 206, 86, 1)',
                                                                'rgba(255, 99, 132, 1)'
                                                            ],
                                                            borderWidth: 1
                                                        }]
                                                    }} 
                                                    options={pieOptions} 
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={12}>
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                <h5 className="mb-0">Histórico de Medições</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Table striped bordered hover responsive>
                                                    <thead>
                                                        <tr>
                                                            <th>Data</th>
                                                            <th>Índice de Assimetria</th>
                                                            <th>Nível de Risco</th>
                                                            <th>Observações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>05/06/2025</td>
                                                            <td>0.13</td>
                                                            <td>Baixo</td>
                                                            <td>Sem alterações significativas</td>
                                                        </tr>
                                                        <tr>
                                                            <td>20/05/2025</td>
                                                            <td>0.18</td>
                                                            <td>Médio</td>
                                                            <td>Leve assimetria no lado esquerdo</td>
                                                        </tr>
                                                        <tr>
                                                            <td>05/05/2025</td>
                                                            <td>0.12</td>
                                                            <td>Baixo</td>
                                                            <td>Sem alterações significativas</td>
                                                        </tr>
                                                        <tr>
                                                            <td>20/04/2025</td>
                                                            <td>0.11</td>
                                                            <td>Baixo</td>
                                                            <td>Sem alterações significativas</td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>
                            
                            {/* Aba de Estereotipias */}
                            <Tab.Pane eventKey="stereotypy">
                                <Row>
                                    <Col md={8} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Frequência de Estereotipias ao Longo do Tempo</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Line 
                                                    data={{
                                                        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                                                        datasets: [
                                                            {
                                                                label: 'Balançar corpo',
                                                                data: [10, 12, 11, 13, 12, 14],
                                                                borderColor: 'rgba(255, 99, 132, 1)',
                                                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                                                fill: false,
                                                                tension: 0.4
                                                            },
                                                            {
                                                                label: 'Movimento de mãos',
                                                                data: [8, 7, 9, 8, 7, 6],
                                                                borderColor: 'rgba(54, 162, 235, 1)',
                                                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                                                fill: false,
                                                                tension: 0.4
                                                            },
                                                            {
                                                                label: 'Bater palmas',
                                                                data: [5, 4, 6, 5, 4, 3],
                                                                borderColor: 'rgba(255, 206, 86, 1)',
                                                                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                                                                fill: false,
                                                                tension: 0.4
                                                            }
                                                        ]
                                                    }} 
                                                    options={lineOptions} 
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={4} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Distribuição de Estereotipias</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {stereotypyData && <Pie data={stereotypyData} options={pieOptions} />}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={12}>
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                <h5 className="mb-0">Histórico de Sessões</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Table striped bordered hover responsive>
                                                    <thead>
                                                        <tr>
                                                            <th>Data</th>
                                                            <th>Duração</th>
                                                            <th>Estereotipias Detectadas</th>
                                                            <th>Contexto</th>
                                                            <th>Observações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>06/06/2025</td>
                                                            <td>30 min</td>
                                                            <td>Balançar corpo (12x), Movimento de mãos (5x)</td>
                                                            <td>Terapia</td>
                                                            <td>Aumento durante atividades de concentração</td>
                                                        </tr>
                                                        <tr>
                                                            <td>30/05/2025</td>
                                                            <td>45 min</td>
                                                            <td>Balançar corpo (14x), Bater palmas (3x)</td>
                                                            <td>Casa</td>
                                                            <td>Maior frequência em momentos de excitação</td>
                                                        </tr>
                                                        <tr>
                                                            <td>15/05/2025</td>
                                                            <td>20 min</td>
                                                            <td>Movimento de mãos (8x), Dançar (2x)</td>
                                                            <td>Escola</td>
                                                            <td>Redução após intervenção comportamental</td>
                                                        </tr>
                                                        <tr>
                                                            <td>01/05/2025</td>
                                                            <td>35 min</td>
                                                            <td>Balançar corpo (11x), Movimento de mãos (6x)</td>
                                                            <td>Terapia</td>
                                                            <td>Padrão consistente com avaliações anteriores</td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>
                            
                            {/* Aba de Emoções */}
                            <Tab.Pane eventKey="emotion">
                                <Row>
                                    <Col md={8} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Evolução de Emoções ao Longo do Tempo</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                {emotionData && <Line data={emotionData} options={lineOptions} />}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={4} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Distribuição de Emoções</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Pie 
                                                    data={{
                                                        labels: ['Feliz', 'Triste', 'Neutro', 'Raiva', 'Surpresa', 'Medo', 'Nojo'],
                                                        datasets: [{
                                                            data: [45, 15, 20, 8, 7, 3, 2],
                                                            backgroundColor: [
                                                                'rgba(75, 192, 192, 0.6)',
                                                                'rgba(54, 162, 235, 0.6)',
                                                                'rgba(201, 203, 207, 0.6)',
                                                                'rgba(255, 99, 132, 0.6)',
                                                                'rgba(255, 205, 86, 0.6)',
                                                                'rgba(255, 159, 64, 0.6)',
                                                                'rgba(153, 102, 255, 0.6)'
                                                            ],
                                                            borderColor: [
                                                                'rgba(75, 192, 192, 1)',
                                                                'rgba(54, 162, 235, 1)',
                                                                'rgba(201, 203, 207, 1)',
                                                                'rgba(255, 99, 132, 1)',
                                                                'rgba(255, 205, 86, 1)',
                                                                'rgba(255, 159, 64, 1)',
                                                                'rgba(153, 102, 255, 1)'
                                                            ],
                                                            borderWidth: 1
                                                        }]
                                                    }} 
                                                    options={pieOptions} 
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Comparação entre Sessões</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Bar 
                                                    data={{
                                                        labels: ['Sessão 1', 'Sessão 2', 'Sessão 3', 'Sessão 4'],
                                                        datasets: [
                                                            {
                                                                label: 'Feliz',
                                                                data: [65, 75, 80, 85],
                                                                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                                                            },
                                                            {
                                                                label: 'Engajado',
                                                                data: [70, 72, 78, 82],
                                                                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                                            }
                                                        ]
                                                    }} 
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: {
                                                                position: 'top',
                                                            },
                                                            title: {
                                                                display: true,
                                                                text: 'Comparação entre Sessões'
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                max: 100,
                                                                title: {
                                                                    display: true,
                                                                    text: 'Porcentagem (%)'
                                                                }
                                                            }
                                                        }
                                                    }} 
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={6} className="mb-4">
                                        <Card className="shadow-sm h-100">
                                            <Card.Header>
                                                <h5 className="mb-0">Perfil Emocional</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Radar 
                                                    data={{
                                                        labels: ['Feliz', 'Triste', 'Neutro', 'Raiva', 'Surpresa', 'Medo', 'Nojo'],
                                                        datasets: [
                                                            {
                                                                label: 'Perfil Atual',
                                                                data: [0.8, 0.2, 0.3, 0.1, 0.2, 0.1, 0.05],
                                                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                                                borderColor: 'rgba(75, 192, 192, 1)',
                                                                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                                                                pointBorderColor: '#fff',
                                                                pointHoverBackgroundColor: '#fff',
                                                                pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
                                                            },
                                                            {
                                                                label: 'Perfil Inicial',
                                                                data: [0.4, 0.5, 0.4, 0.3, 0.1, 0.2, 0.1],
                                                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                                                borderColor: 'rgba(54, 162, 235, 1)',
                                                                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                                                                pointBorderColor: '#fff',
                                                                pointHoverBackgroundColor: '#fff',
                                                                pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                                                            }
                                                        ]
                                                    }} 
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: {
                                                                position: 'top',
                                                            },
                                                            title: {
                                                                display: true,
                                                                text: 'Perfil Emocional'
                                                            }
                                                        },
                                                        scales: {
                                                            r: {
                                                                angleLines: {
                                                                    display: true
                                                                },
                                                                suggestedMin: 0,
                                                                suggestedMax: 1
                                                            }
                                                        }
                                                    }} 
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={12}>
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                <h5 className="mb-0">Histórico de Sessões</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Table striped bordered hover responsive>
                                                    <thead>
                                                        <tr>
                                                            <th>Data</th>
                                                            <th>Duração</th>
                                                            <th>Emoção Predominante</th>
                                                            <th>Contexto</th>
                                                            <th>Observações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>06/06/2025</td>
                                                            <td>45 min</td>
                                                            <td>Feliz (85%)</td>
                                                            <td>Terapia</td>
                                                            <td>Excelente engajamento durante atividades lúdicas</td>
                                                        </tr>
                                                        <tr>
                                                            <td>23/05/2025</td>
                                                            <td>30 min</td>
                                                            <td>Feliz (80%)</td>
                                                            <td>Casa</td>
                                                            <td>Boa interação com familiares</td>
                                                        </tr>
                                                        <tr>
                                                            <td>09/05/2025</td>
                                                            <td>40 min</td>
                                                            <td>Neutro (45%), Feliz (40%)</td>
                                                            <td>Escola</td>
                                                            <td>Variação emocional durante diferentes atividades</td>
                                                        </tr>
                                                        <tr>
                                                            <td>25/04/2025</td>
                                                            <td>35 min</td>
                                                            <td>Triste (50%), Neutro (30%)</td>
                                                            <td>Terapia</td>
                                                            <td>Dificuldade com transições entre atividades</td>
                                                        </tr>
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Col>
            </Row>
        </Container>
    );
};

export default PatientDetailsCharts;

