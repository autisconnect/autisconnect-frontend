import React from 'react';
import { Alert, Badge, Card, ProgressBar } from 'react-bootstrap';

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
            <Card className="shadow-sm h-100">
                <Card.Header>Análise Inteligente ABA</Card.Header>
                <Card.Body>
                    <p className="text-muted mb-0">
                        Dados insuficientes para análise com IA.
                    </p>
                </Card.Body>
            </Card>
        );
    }

    const getStatusVariant = (status) => {
        switch (String(status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()) {
        case 'PROGRESSO':
            return 'success';
        case 'ESTAVEL':
            return 'info';
        case 'ESTAGNACAO':
            return 'warning';
        case 'REGRESSAO':
            return 'danger';
        default:
            return 'secondary';
        }
    };

    const getStatusDescription = () => {
        switch (String(analytics.overallStatus || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()) {
        case 'PROGRESSO':
            return 'O paciente apresenta evolução consistente nas habilidades avaliadas.';
        case 'ESTAVEL':
            return 'O desempenho estável indica manutenção das habilidades adquiridas.';
        case 'ESTAGNACAO':
            return 'Não foram observados ganhos clínicos significativos no período.';
        case 'REGRESSAO':
            return 'Há evidências de queda de desempenho em habilidades previamente adquiridas.';
        default:
            return 'Análise indisponível.';
        }
    };

    return (
        <Card className="shadow-sm h-100">
            <Card.Header>Análise IA - Progresso ABA</Card.Header>
            <Card.Body>
                <Alert variant={getStatusVariant(analytics.overallStatus)}>
                    <strong>Status geral:</strong>{' '}
                    <Badge bg={getStatusVariant(analytics.overallStatus)}>
                        {analytics.overallStatus}
                    </Badge>
                    <div className="mt-2">
                        {getStatusDescription()}
                    </div>
                </Alert>

                <div className="mb-3">
                    <small className="text-muted">Taxa média de acerto</small>
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

                    <small className="text-muted">Dependência de prompt</small>
                    <ProgressBar
                        now={analytics.promptDependency}
                        label={`${analytics.promptDependency}%`}
                        variant="warning"
                    />
                </div>

                <div className="mt-3">
                    <h6>Classificação clínica IA</h6>
                    <p className="mb-1">
                        <strong>Nível de desempenho:</strong>{' '}
                        {analytics.classification}
                    </p>
                    <p className="mb-1">
                        <strong>Sessões avaliadas:</strong>{' '}
                        {analytics.totalSessions}
                    </p>

                    {!compact ? (
                        <p className="text-muted mb-0">
                            A classificação considera taxa de acerto, redução de prompts e ocorrência de generalização ao longo do tempo.
                        </p>
                    ) : null}
                </div>

                {String(analytics.overallStatus || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() === 'ESTAGNACAO' ? (
                    <Alert variant="warning" className="mt-3">
                        Sugere-se revisão do programa ABA atual.
                    </Alert>
                ) : null}

                {String(analytics.overallStatus || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() === 'REGRESSAO' ? (
                    <Alert variant="danger" className="mt-3">
                        Recomenda-se reavaliar as estratégias terapêuticas com prioridade.
                    </Alert>
                ) : null}
            </Card.Body>
        </Card>
    );
};

export default AbaAiAnalysis;
