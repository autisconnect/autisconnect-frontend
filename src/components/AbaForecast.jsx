import React from 'react';
import { Card, Alert, ProgressBar, Badge } from 'react-bootstrap';

/**
 * AbaForecast
 * IA Nível 4
 * - Previsão de desempenho futuro
 * - Tendência clínica
 * - Apoio à decisão terapêutica
 */
const AbaForecast = ({ forecast, sessions = [], compact = false }) => {
    if (!forecast) {
        return (
            <Card className="shadow-sm">
                <Card.Body>
                    <h5>Previsão de Desempenho ABA</h5>
                    <p className="text-muted mb-0">
                        Dados insuficientes para gerar previsão.
                    </p>
                </Card.Body>
            </Card>
        );
    }

    /* ==============================
       Helpers
    ============================== */
    const getTrendVariant = (trend) => {
        switch (trend) {
            case 'POSITIVA':
                return 'success';
            case 'ESTÁVEL':
                return 'info';
            case 'NEGATIVA':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const getTrendDescription = () => {
        switch (forecast.trend) {
            case 'POSITIVA':
                return 'A tendência indica evolução contínua das habilidades.';
            case 'ESTÁVEL':
                return 'O desempenho tende à manutenção do nível atual.';
            case 'NEGATIVA':
                return 'Existe risco de queda no desempenho futuro.';
            default:
                return 'Tendência não definida.';
        }
    };

    /* ==============================
       Render
    ============================== */
    return (
        <Card className="shadow-sm h-100">
            <Card.Body>
                <h5 className="mb-3">Previsão IA – Desempenho Futuro</h5>

                {/* TENDÊNCIA */}
                <Alert variant={getTrendVariant(forecast.trend)}>
                    <strong>Tendência Prevista:</strong>{' '}
                    <Badge bg={getTrendVariant(forecast.trend)}>
                        {forecast.trend}
                    </Badge>
                    <div className="mt-2">
                        {getTrendDescription()}
                    </div>
                </Alert>

                {/* PREVISÕES NUMÉRICAS */}
                <div className="mb-3">
                    <small className="text-muted">Taxa de Acerto Prevista</small>
                    <ProgressBar
                        now={forecast.predictedAccuracy}
                        label={`${forecast.predictedAccuracy}%`}
                        variant="success"
                        className="mb-2"
                    />

                    <small className="text-muted">Redução Esperada de Prompt</small>
                    <ProgressBar
                        now={forecast.promptReduction}
                        label={`${forecast.promptReduction}%`}
                        variant="info"
                        className="mb-2"
                    />

                    <small className="text-muted">Probabilidade de Generalização</small>
                    <ProgressBar
                        now={forecast.generalizationProbability}
                        label={`${forecast.generalizationProbability}%`}
                        variant="warning"
                    />
                </div>

                {/* NARRATIVA */}
                <div className="mt-3">
                    <h6>Interpretação Clínica</h6>
                    <p className="mb-1">
                        {forecast.clinicalNarrative}
                    </p>

                    {!compact && (
                        <p className="text-muted mb-0">
                            A previsão considera histórico de sessões, padrão
                            de respostas, dependência de prompts e estabilidade
                            do desempenho ao longo do tempo.
                        </p>
                    )}
                </div>

                {/* ALERTAS */}
                {forecast.trend === 'NEGATIVA' && (
                    <Alert variant="danger" className="mt-3">
                        🚨 Atenção: possível necessidade de intervenção preventiva.
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default AbaForecast;
