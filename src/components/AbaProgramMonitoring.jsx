import React from 'react';
import { Card, Alert, Badge } from 'react-bootstrap';

/**
 * AbaProgramMonitoring
 * Monitoramento Inteligente de Programas ABA
 * - Detecta estagnação
 * - Detecta regressão
 * - Gera alertas clínicos
 */
const AbaProgramMonitoring = ({ monitoring }) => {
    if (!monitoring) {
        return (
            <Card className="shadow-sm">
                <Card.Header>Monitoramento de Programas ABA</Card.Header>
                <Card.Body>
                    <p className="text-muted mb-0">
                        Dados insuficientes para monitoramento.
                    </p>
                </Card.Body>
            </Card>
        );
    }

    /* ==============================
       Helpers
    ============================== */
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PROGRESSO':
                return <Badge bg="success">Progresso</Badge>;
            case 'ESTÁVEL':
                return <Badge bg="info">Estável</Badge>;
            case 'ESTAGNAÇÃO':
                return <Badge bg="warning">Estagnação</Badge>;
            case 'REGRESSÃO':
                return <Badge bg="danger">Regressão</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <Card className="shadow-sm">
            <Card.Header>Monitoramento Inteligente do Programa</Card.Header>
            <Card.Body>
                {/* STATUS */}
                <Alert variant="light" className="border">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Status Atual:</strong>{' '}
                            {getStatusBadge(monitoring.status)}
                        </div>
                        <div>
                            <strong>Programa:</strong>{' '}
                            {monitoring.programName}
                        </div>
                    </div>
                </Alert>

                {/* DETALHES */}
                <p className="mb-1">
                    <strong>Análise IA:</strong>{' '}
                    {monitoring.analysis}
                </p>

                <p className="mb-1">
                    <strong>Período Avaliado:</strong>{' '}
                    {monitoring.period}
                </p>

                {/* ALERTAS */}
                {monitoring.status === 'ESTAGNAÇÃO' && (
                    <Alert variant="warning" className="mt-3">
                        Atenção: o programa atual não apresenta ganhos clínicos
                        relevantes. Avaliar ajustes ou substituição.
                    </Alert>
                )}

                {monitoring.status === 'REGRESSÃO' && (
                    <Alert variant="danger" className="mt-3">
                        Atenção: evidência de regressão. Recomendada intervenção
                        imediata e revisão do programa.
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default AbaProgramMonitoring;

