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

import logohori from '../assets/logo.png';
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
        <Container fluid className="py-4 aba-module-page">
            <Row className="professional-header-row mb-4 align-items-center">
                <Col className="text-center">
                    <img src={logohori} alt="AutisConnect Logo" className="details-logo" />
                    <h1 className="professional-name mb-0 mt-2">Módulo ABA</h1>
                    <p className="small text-muted mb-0">
                        Monitoramento clínico do paciente {patientId || ''}
                    </p>
                </Col>
                <Col xs="auto">
                    <Button
                        variant="outline-primary"
                        onClick={handleExit}
                        className="back-button-standalone"
                    >
                        <X /> Sair
                    </Button>
                </Col>
            </Row>

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
    );
};

export default AbaPatient;







