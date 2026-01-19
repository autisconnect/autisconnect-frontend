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
                <Card.Body>
                    <h5>Monitoramento de Programas ABA</h5>
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
            <Card.Body>
                <h5 className="mb-3">Monitoramento Inteligente do Programa</h5>

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
                        ⚠️ O programa atual não apresenta ganhos clínicos
                        relevantes. Avaliar ajustes ou substituição.
                    </Alert>
                )}

                {monitoring.status === 'REGRESSÃO' && (
                    <Alert variant="danger" className="mt-3">
                        🚨 Evidência de regressão. Recomendada intervenção
                        imediata e revisão do programa.
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default AbaProgramMonitoring;
