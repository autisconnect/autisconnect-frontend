import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import AbaCharts from '../components/AbaCharts';
import AbaAiAnalysis from '../components/AbaAiAnalysis';
import AbaForecast from '../components/AbaForecast';
import AbaProgramMonitoring from '../components/AbaProgramMonitoring';

import abaService from '../services/abaService';
import abaAiService from '../services/abaAiService';

const AbaDashboard = ({ patientId: propPatientId }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { patientId: routePatientId } = useParams();

    const queryPatientId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('patientId');
    }, [location.search]);

    const patientId = propPatientId || routePatientId || queryPatientId;

    const [sessions, setSessions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [monitoring, setMonitoring] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ==============================
       Carregar dados do dashboard
    ============================== */
    const loadDashboardData = async () => {
        if (!patientId) {
            setError('Paciente não identificado.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const results = await Promise.allSettled([
                abaService.getSessions(patientId),
                abaAiService.getAnalytics(patientId),
                abaAiService.getForecast(patientId),
                abaAiService.getMonitoring(patientId)
            ]);

            const [sessionsRes, analyticsRes, forecastRes, monitoringRes] = results;

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

            const hasSuccess = results.some((result) => result.status === 'fulfilled');
            if (!hasSuccess) {
                setError('Erro ao carregar dashboard ABA.');
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar dashboard ABA.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
        // eslint-disable-next-line
    }, [patientId]);

    /* ==============================
       Helpers visuais
    ============================== */
    const getStatusBadge = () => {
        if (!monitoring?.status) return null;

        switch (monitoring.status) {
            case 'ESTAGNAÇÃO':
                return <Badge bg="warning">Estagnação</Badge>;
            case 'REGRESSÃO':
                return <Badge bg="danger">Regressão</Badge>;
            case 'PROGRESSO':
                return <Badge bg="success">Progresso</Badge>;
            default:
                return <Badge bg="info">Estável</Badge>;
        }
    };

    /* ==============================
       Render
    ============================== */
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-3">Carregando Dashboard ABA...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 aba-module-page">

            {/* ==========================
                CABEÇALHO
            ========================== */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="mb-1">Dashboard ABA</h2>
                    <small className="text-muted">
                        Visão geral do progresso terapêutico
                    </small>
                </Col>
                <Col className="text-end">
                    {getStatusBadge()}
                </Col>
            </Row>

            {/* ==========================
                RESUMO CLÍNICO
            ========================== */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h6>Taxa Média de Acerto</h6>
                            <h3>{analytics?.avgAccuracy ?? '--'}%</h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h6>Dependência de Prompt</h6>
                            <h3>{analytics?.promptDependency ?? '--'}%</h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h6>Generalização</h6>
                            <h3>{analytics?.generalizationRate ?? '--'}%</h3>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h6>Sessões Avaliadas</h6>
                            <h3>{analytics?.totalSessions ?? '--'}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ==========================
                GRÁFICOS
            ========================== */}
            <Row>
                <Col lg={12}>
                    <AbaCharts sessions={sessions} compact />
                </Col>
            </Row>

            {/* ==========================
                IA – ANÁLISE E PREVISÃO
            ========================== */}
            <Row className="mt-4">
                <Col lg={6}>
                    <AbaAiAnalysis analytics={analytics} compact />
                </Col>

                <Col lg={6}>
                    <AbaForecast forecast={forecast} sessions={sessions} compact />
                </Col>
            </Row>

            {/* ==========================
                MONITORAMENTO
            ========================== */}
            <Row className="mt-4">
                <Col lg={12}>
                    <AbaProgramMonitoring monitoring={monitoring} />
                </Col>
            </Row>

            {/* ==========================
                AÇÃO RÁPIDA
            ========================== */}
            <Row className="mt-4">
                <Col className="text-end">
                    <button
                        className="btn btn-primary"
                        onClick={() =>
                            navigate(`/aba/patient/${patientId}`)
                        }
                    >
                        Abrir Módulo ABA Completo
                    </button>
                </Col>
            </Row>

        </Container>
    );
};

export default AbaDashboard;
