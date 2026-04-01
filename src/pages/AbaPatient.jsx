import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Container, Row, Col, Button, Nav, Alert, Spinner, Card } from 'react-bootstrap';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { X } from 'react-bootstrap-icons';

import AbaSessionsList from '../components/AbaSessionsList';
import AbaSessionForm from '../components/AbaSessionForm';
import AbaCharts from '../components/AbaCharts';
import AbaAiAnalysis from '../components/AbaAiAnalysis';
import AbaForecast from '../components/AbaForecast';
import AbaProgramMonitoring from '../components/AbaProgramMonitoring';
import AbaProgramReplacement from '../components/AbaProgramReplacement';
import AbaProgramClosure from '../components/AbaProgramClosure';
import AbaProgramSuggestions from '../components/AbaProgramSuggestions';
import AbaReport from './AbaReport';

import abaService from '../services/abaService';
import abaAiService from '../services/abaAiService';

import logonovo from '../assets/logonovo.png';
import '../App.css';

const AbaPatient = () => {
    const { patientId: routePatientId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const queryPatientId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('patientId');
    }, [location.search]);

    const patientId = routePatientId || queryPatientId;

    const [activeTab, setActiveTab] = useState('dashboard');

    const [sessions, setSessions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [monitoring, setMonitoring] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsError, setSuggestionsError] = useState(null);

    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);

    const loadAbaData = useCallback(async () => {
        if (!patientId) {
            setLoadError('Paciente não identificado.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError(null);
        setSuggestionsError(null);

        const results = await Promise.allSettled([
            abaService.getSessions(patientId),
            abaAiService.getAnalytics(patientId),
            abaAiService.getForecast(patientId),
            abaAiService.getMonitoring(patientId),
            abaAiService.getProgramSuggestions(patientId)
        ]);

        const [sessionsRes, analyticsRes, forecastRes, monitoringRes, suggestionsRes] = results;

        if (sessionsRes.status === 'fulfilled') {
            setSessions(sessionsRes.value.data || []);
        } else {
            setSessions([]);
        }

        if (analyticsRes.status === 'fulfilled') {
            setAnalytics(analyticsRes.value.data);
        } else {
            setAnalytics(null);
        }
        if (forecastRes.status === 'fulfilled') {
            setForecast(forecastRes.value.data);
        } else {
            setForecast(null);
        }

        if (monitoringRes.status === 'fulfilled') {
            setMonitoring(monitoringRes.value.data);
        } else {
            setMonitoring(null);
        }

        if (suggestionsRes.status === 'fulfilled') {
            const rawSuggestions = suggestionsRes.value.data || [];
            const mappedSuggestions = rawSuggestions.map((suggestion) => {
                const reasonText = suggestion.reason || 'Sugestão gerada automaticamente';
                const priority = reasonText.toLowerCase().includes('regress')
                    ? 'ALTA'
                    : reasonText.toLowerCase().includes('estagna')
                        ? 'MÉDIA'
                        : 'BAIXA';

                return {
                    programName: suggestion.suggestion?.programName || suggestion.basedOnProgram || 'Programa sugerido',
                    objective: suggestion.basedOnProgram
                        ? `Ajustar o programa ${suggestion.basedOnProgram}`
                        : 'Aprimorar o plano terapêutico',
                    reason: reasonText,
                    priority
                };
            });
            setSuggestions(mappedSuggestions);
            setSuggestionsError(null);
        } else {
            setSuggestions([]);
            setSuggestionsError('Sugestões automáticas indisponíveis no momento.');
        }

        const hasSuccess = results.some((result) => result.status === 'fulfilled');
        if (!hasSuccess) {
            setLoadError('Erro ao carregar dados ABA.');
        }

        setLoading(false);
    }, [patientId]);

    useEffect(() => {
        loadAbaData();
    }, [loadAbaData]);

    const handleExit = () => {
        if (patientId) {
            navigate(`/patient-details/${patientId}`);
            return;
        }
        navigate(-1);
    };

    const formatPercent = (value) => {
        if (value === null || value === undefined) return '--';
        return `${value}%`;
    };

    const formatValue = (value) => {
        if (value === null || value === undefined) return '--';
        return value;
    };

    const renderDashboard = () => (
        <>
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <h6>Taxa Média de Acerto</h6>
                            <h3>{formatPercent(analytics?.avgAccuracy)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <h6>Dependência de Prompt</h6>
                            <h3>{formatPercent(analytics?.promptDependency)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <h6>Generalização</h6>
                            <h3>{formatPercent(analytics?.generalizationRate)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm h-100">
                        <Card.Body>
                            <h6>Sessões Avaliadas</h6>
                            <h3>{formatValue(analytics?.totalSessions)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col lg={12}>
                    <AbaCharts sessions={sessions} />
                </Col>
            </Row>

            <Row className="mt-4">
                <Col lg={6}>
                    <AbaAiAnalysis analytics={analytics} />
                </Col>
                <Col lg={6}>
                    <AbaForecast forecast={forecast} sessions={sessions} />
                </Col>
            </Row>

            <Row className="mt-4">
                <Col lg={12}>
                    <AbaProgramMonitoring monitoring={monitoring} />
                </Col>
            </Row>
        </>
    );

    const renderTab = () => {
        if (loading && activeTab !== 'new-session') {
            return (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="mt-3 text-muted">Carregando dados ABA...</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'dashboard':
                return renderDashboard();

            case 'sessions':
                return <AbaSessionsList sessions={sessions} />;

            case 'new-session':
                return <AbaSessionForm patientId={patientId} onSaved={loadAbaData} />;

            case 'charts':
                return <AbaCharts sessions={sessions} />;

            case 'analysis':
                return (
                    <>
                        <Row>
                            <Col lg={6}>
                                <AbaAiAnalysis analytics={analytics} />
                            </Col>
                            <Col lg={6}>
                                <AbaForecast forecast={forecast} sessions={sessions} />
                            </Col>
                        </Row>
                        <Row className="mt-4">
                            <Col lg={12}>
                                <AbaProgramMonitoring monitoring={monitoring} />
                            </Col>
                        </Row>
                    </>
                );

            case 'report':
                return <AbaReport patientId={patientId} embedded />;

            case 'forecast':
                return (
                    <Row>
                        <Col lg={8} className="mx-auto">
                            <AbaForecast forecast={forecast} />
                        </Col>
                    </Row>
                );

            case 'suggestions':
                return (
                    <Row>
                        <Col lg={10} className="mx-auto">
                            <AbaProgramSuggestions suggestions={suggestions} error={suggestionsError} />
                        </Col>
                    </Row>
                );

            case 'monitoring':
                return (
                    <Row>
                        <Col lg={8} className="mx-auto">
                            <AbaProgramMonitoring monitoring={monitoring} />
                            <div className="mt-3">
                                <AbaProgramReplacement monitoring={monitoring} onActionCompleted={loadAbaData} />
                            </div>
                            <div className="mt-3">
                                <AbaProgramClosure monitoring={monitoring} onActionCompleted={loadAbaData} />
                            </div>
                        </Col>
                    </Row>
                );
default:
                return renderDashboard();
        }
    };

    return (
        <div className="App bg-light min-vh-100">
            <nav className="top-bar fixed-top shadow-sm">
                <Container>
                    <Row className="align-items-center py-3">
                        <Col md={4} className="text-center text-md-start">
                            <img src={logonovo} alt="AutisConnect" className="top-bar-logo" />
                        </Col>
                        <Col md={4} className="text-center d-none d-md-block">
                            <span className="text-white fw-semibold">Modulo ABA</span>
                        </Col>
                        <Col md={4} className="text-center text-md-end">
                            <Button variant="outline-light" size="sm" onClick={handleExit}>
                                <X className="me-2" /> Fechar
                            </Button>
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
                                    <h2 className="display-6 fw-bold mb-2 text-white">Modulo ABA</h2>
                                    <p className="text-white-90 mb-1">Monitoramento clinico do paciente {patientId || ''}</p>
                                    <p className="text-white-90 mb-0">Planejamento, sessoes e evolucao em um so lugar.</p>
                                </div>
                            </Col>
                            <Col lg={5}>
                                <Card className="shadow-sm border-0">
                                    <Card.Body>
                                        <h5 className="fw-bold mb-2">Resumo rapido</h5>
                                        <div className="text-muted">Acompanhe habilidades, sessoes e analises IA.</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <main className="dashboard-section py-4">
                    <Container fluid className="aba-module-page">
{loadError && (
                <Alert variant="warning" className="mb-4">
                    {loadError}
                </Alert>
            )}

            <Nav
                variant="tabs"
                activeKey={activeTab}
                onSelect={(key) => key && setActiveTab(key)}
                className="mb-4"
            >
                <Nav.Item>
                    <Nav.Link eventKey="dashboard">Dashboard</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="sessions">Sessões</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="new-session">Nova Sessão</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="charts">Gráficos</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="analysis">Análise IA</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="report">Relatório</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="forecast">Previsão</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="suggestions">Sugestões</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="monitoring">Monitoramento</Nav.Link>
                </Nav.Item>
            </Nav>

            {renderTab()}
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

export default AbaPatient;







