import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

import AbaCharts from '../components/AbaCharts';
import AbaAiAnalysis from '../components/AbaAiAnalysis';
import AbaForecast from '../components/AbaForecast';
import AbaProgramMonitoring from '../components/AbaProgramMonitoring';

import abaService from '../services/abaService';
import abaAiService from '../services/abaAiService';

const AbaDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [patientId, setPatientId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [monitoring, setMonitoring] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ==============================
       Extrair patientId
    ============================== */
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setPatientId(params.get('patientId'));
    }, [location]);

    /* ==============================
       Carregar dados do dashboard
    ============================== */
    const loadDashboardData = async () => {
        if (!patientId) return;

        try {
            setLoading(true);

            const sessionsRes = await abaService.getSessions(patientId);
            setSessions(sessionsRes.data);

            const analyticsRes = await abaAiService.getAnalytics(patientId);
            setAnalytics(analyticsRes.data);

            const forecastRes = await abaAiService.getForecast(patientId);
            setForecast(forecastRes.data);

            const monitoringRes = await abaAiService.getMonitoring(patientId);
            setMonitoring(monitoringRes.data);

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
        if (!monitoring?.stagnation?.condition) return null;

        switch (monitoring.stagnation.condition) {
            case 'ESTAGNAÇÃO':
                return <Badge bg="warning">Estagnação</Badge>;
            case 'REGRESSÃO':
                return <Badge bg="danger">Regressão</Badge>;
            default:
                return <Badge bg="success">Estável</Badge>;
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
        <Container fluid className="py-4">

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
                            navigate(`/aba/patient?patientId=${patientId}`)
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
