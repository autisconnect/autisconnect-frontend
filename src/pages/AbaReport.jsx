import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Button, Badge } from 'react-bootstrap';
import { useLocation, useParams } from 'react-router-dom';

import AbaCharts from '../components/AbaCharts';
import AbaAiAnalysis from '../components/AbaAiAnalysis';
import AbaForecast from '../components/AbaForecast';

import abaService from '../services/abaService';
import abaAiService from '../services/abaAiService';
import abaReportService from '../services/abaReportService';

const AbaReport = ({ patientId: propPatientId, embedded = false, showPdf = true }) => {
    const location = useLocation();
    const { patientId: routePatientId } = useParams();

    const queryPatientId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('patientId');
    }, [location.search]);

    const patientId = propPatientId || routePatientId || queryPatientId;

    const [sessions, setSessions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [forecast, setForecast] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);

    /* ==============================
       Carregar dados do relatório
    ============================== */
    const loadReportData = async () => {
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
                abaAiService.getForecast(patientId)
            ]);

            const [sessionsRes, analyticsRes, forecastRes] = results;

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

            const hasSuccess = results.some((result) => result.status === 'fulfilled');
            if (!hasSuccess) {
                setError('Erro ao carregar dados do relatório ABA.');
            }
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
        const loadingContent = (
            <div className="py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-3">Gerando visão clínica ABA...</p>
            </div>
        );

        if (embedded) return loadingContent;
        return <Container className="py-5 text-center">{loadingContent}</Container>;
    }

    if (error) {
        const errorContent = (
            <Alert variant="danger">{error}</Alert>
        );

        if (embedded) return errorContent;
        return (
            <Container className="py-5">
                {errorContent}
            </Container>
        );
    }

    const content = (
        <>
            {!embedded && (
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
            )}

            {/* ==========================
                RESUMO EXECUTIVO
            ========================== */}
            <Row className="mb-4">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header>Resumo Clínico</Card.Header>
                        <Card.Body>
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
            {showPdf && (
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
            )}
        </>
    );

    if (embedded) {
        return content;
    }

    return (
        <Container fluid className="py-4 aba-module-page">
            {content}
        </Container>
    );
};

export default AbaReport;

