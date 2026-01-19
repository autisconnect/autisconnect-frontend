import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Button, Badge } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

import AbaCharts from '../components/AbaCharts';
import AbaAiAnalysis from '../components/AbaAiAnalysis';
import AbaForecast from '../components/AbaForecast';

import abaService from '../services/abaService';
import abaAiService from '../services/abaAiService';
import abaReportService from '../services/abaReportService';

const AbaReport = () => {
    const location = useLocation();
    const [patientId, setPatientId] = useState(null);

    const [sessions, setSessions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [forecast, setForecast] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);

    /* ==============================
       Extrair patientId
    ============================== */
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setPatientId(params.get('patientId'));
    }, [location]);

    /* ==============================
       Carregar dados do relatório
    ============================== */
    const loadReportData = async () => {
        if (!patientId) return;

        try {
            setLoading(true);

            const sessionsRes = await abaService.getSessions(patientId);
            setSessions(sessionsRes.data);

            const analyticsRes = await abaAiService.getAnalytics(patientId);
            setAnalytics(analyticsRes.data);

            const forecastRes = await abaAiService.getForecast(patientId);
            setForecast(forecastRes.data);

        } catch (err) {
            console.error(err);
            setError('Erro ao carregar dados do relatório ABA.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReportData();
        // eslint-disable-next-line
    }, [patientId]);

    /* ==============================
       Gerar PDF
    ============================== */
    const handleGeneratePdf = async () => {
        try {
            setGenerating(true);
            await abaReportService.generatePdf(patientId);
        } catch (err) {
            console.error(err);
            alert('Erro ao gerar relatório PDF.');
        } finally {
            setGenerating(false);
        }
    };

    /* ==============================
       Render
    ============================== */
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-3">Gerando visão clínica ABA...</p>
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
                    <h2 className="mb-1">Relatório ABA + IA</h2>
                    <small className="text-muted">
                        Documento clínico consolidado
                    </small>
                </Col>
                <Col className="text-end">
                    <Badge bg="secondary">Assinável</Badge>{' '}
                    <Badge bg="info">IA Validada</Badge>
                </Col>
            </Row>

            {/* ==========================
                RESUMO EXECUTIVO
            ========================== */}
            <Row className="mb-4">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h5>Resumo Clínico</h5>
                            <p className="mb-1">
                                <strong>Total de Sessões:</strong> {analytics?.totalSessions}
                            </p>
                            <p className="mb-1">
                                <strong>Média de Acerto:</strong> {analytics?.avgAccuracy}%
                            </p>
                            <p className="mb-1">
                                <strong>Classificação IA:</strong>{' '}
                                {analytics?.classification}
                            </p>
                            <p className="mb-0">
                                <strong>Status Geral:</strong>{' '}
                                {analytics?.overallStatus}
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ==========================
                GRÁFICOS
            ========================== */}
            <Row>
                <Col lg={12}>
                    <AbaCharts sessions={sessions} />
                </Col>
            </Row>

            {/* ==========================
                ANÁLISE IA
            ========================== */}
            <Row className="mt-4">
                <Col lg={6}>
                    <AbaAiAnalysis analytics={analytics} />
                </Col>

                <Col lg={6}>
                    <AbaForecast forecast={forecast} sessions={sessions} />
                </Col>
            </Row>

            {/* ==========================
                RODAPÉ – AÇÕES
            ========================== */}
            <Row className="mt-5">
                <Col className="text-end">
                    <Button
                        variant="success"
                        onClick={handleGeneratePdf}
                        disabled={generating}
                    >
                        {generating ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
                    </Button>
                </Col>
            </Row>

        </Container>
    );
};

export default AbaReport;
