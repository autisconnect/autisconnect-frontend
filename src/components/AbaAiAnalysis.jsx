import React from 'react';
import { Card, Alert, Badge, ProgressBar } from 'react-bootstrap';

/**
 * AbaAiAnalysis
 * IA Nível 2 e 3
 * - Classificação de progresso
 * - Detecção de estagnação / regressão
 * - Narrativa clínica explicável
 */
const AbaAiAnalysis = ({ analytics, compact = false }) => {
    if (!analytics) {
        return (
            <Card className="shadow-sm">
                <Card.Body>
                    <h5>Análise Inteligente ABA</h5>
                    <p className="text-muted mb-0">
                        Dados insuficientes para análise IA.
                    </p>
                </Card.Body>
            </Card>
        );
    }

    /* ==============================
       Helpers
    ============================== */
    const getStatusVariant = (status) => {
        switch (status) {
            case 'PROGRESSO':
                return 'success';
            case 'ESTÁVEL':
                return 'info';
            case 'ESTAGNAÇÃO':
                return 'warning';
            case 'REGRESSÃO':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const getStatusDescription = () => {
        switch (analytics.overallStatus) {
            case 'PROGRESSO':
                return 'O paciente apresenta evolução consistente nas habilidades avaliadas.';
            case 'ESTÁVEL':
                return 'O desempenho estável indica manutenção das habilidades adquiridas.';
            case 'ESTAGNAÇÃO':
                return 'Não foram observados ganhos clínicos significativos no período.';
            case 'REGRESSÃO':
                return 'Há evidências de perda de desempenho em habilidades previamente adquiridas.';
            default:
                return 'Análise indisponível.';
        }
    };

    /* ==============================
       Render
    ============================== */
    return (
        <Card className="shadow-sm h-100">
            <Card.Body>
                <h5 className="mb-3">Análise IA – Progresso ABA</h5>

                {/* STATUS GERAL */}
                <Alert variant={getStatusVariant(analytics.overallStatus)}>
                    <strong>Status Geral:</strong>{' '}
                    <Badge bg={getStatusVariant(analytics.overallStatus)}>
                        {analytics.overallStatus}
                    </Badge>
                    <div className="mt-2">
                        {getStatusDescription()}
                    </div>
                </Alert>

                {/* MÉTRICAS */}
                <div className="mb-3">
                    <small className="text-muted">Taxa Média de Acerto</small>
                    <ProgressBar
                        now={analytics.avgAccuracy}
                        label={`${analytics.avgAccuracy}%`}
                        variant="success"
                        className="mb-2"
                    />

                    <small className="text-muted">Generalização</small>
                    <ProgressBar
                        now={analytics.generalizationRate}
                        label={`${analytics.generalizationRate}%`}
                        variant="info"
                        className="mb-2"
                    />

                    <small className="text-muted">Dependência de Prompt</small>
                    <ProgressBar
                        now={analytics.promptDependency}
                        label={`${analytics.promptDependency}%`}
                        variant="warning"
                    />
                </div>

                {/* CLASSIFICAÇÃO IA */}
                <div className="mt-3">
                    <h6>Classificação Clínica IA</h6>
                    <p className="mb-1">
                        <strong>Nível de Desempenho:</strong>{' '}
                        {analytics.classification}
                    </p>
                    <p className="mb-1">
                        <strong>Sessões Avaliadas:</strong>{' '}
                        {analytics.totalSessions}
                    </p>

                    {!compact && (
                        <p className="text-muted mb-0">
                            A classificação considera taxa de acerto, redução
                            de prompts e ocorrência de generalização ao longo
                            do tempo.
                        </p>
                    )}
                </div>

                {/* ALERTAS */}
                {analytics.overallStatus === 'ESTAGNAÇÃO' && (
                    <Alert variant="warning" className="mt-3">
                        ⚠️ Sugere-se revisão do programa ABA atual.
                    </Alert>
                )}

                {analytics.overallStatus === 'REGRESSÃO' && (
                    <Alert variant="danger" className="mt-3">
                        🚨 Recomendado ajuste imediato de estratégias terapêuticas.
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default AbaAiAnalysis;
