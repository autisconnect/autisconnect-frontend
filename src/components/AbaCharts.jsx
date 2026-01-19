import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';

/**
 * AbaCharts
 * Exibe gráficos de evolução ABA:
 * - Taxa de acerto (%)
 * - Nível de prompt (escala clínica)
 * - Generalização
 */
const AbaCharts = ({ sessions = [], compact = false }) => {

    /* ==============================
       Processamento dos dados
    ============================== */
    const chartData = useMemo(() => {
        if (!sessions || sessions.length === 0) return [];

        return sessions
            .slice()
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((s) => {
                const accuracy =
                    s.totalTrials && s.totalTrials > 0
                        ? Math.round((s.correctResponses / s.totalTrials) * 100)
                        : 0;

                const promptScore = (() => {
                    switch (s.promptLevel) {
                        case 'INDEPENDENTE':
                            return 4;
                        case 'GESTUAL':
                            return 3;
                        case 'VERBAL':
                            return 2;
                        case 'FÍSICO':
                            return 1;
                        default:
                            return 0;
                    }
                })();

                return {
                    date: dayjs(s.createdAt).format('DD/MM'),
                    accuracy,
                    promptScore,
                    generalization: s.generalization ? 1 : 0
                };
            });
    }, [sessions]);

    if (!chartData.length) {
        return (
            <Card className="shadow-sm">
                <Card.Body>
                    <h5>Evolução ABA</h5>
                    <p className="text-muted mb-0">
                        Dados insuficientes para gerar gráficos.
                    </p>
                </Card.Body>
            </Card>
        );
    }

    /* ==============================
       Render
    ============================== */
    return (
        <Card className="shadow-sm">
            <Card.Body>
                <h5 className="mb-3">Evolução ABA</h5>

                <ResponsiveContainer width="100%" height={compact ? 260 : 360}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis
                            yAxisId="left"
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 4]}
                            ticks={[1, 2, 3, 4]}
                            tickFormatter={(v) => {
                                switch (v) {
                                    case 4:
                                        return 'Indep.';
                                    case 3:
                                        return 'Gestual';
                                    case 2:
                                        return 'Verbal';
                                    case 1:
                                        return 'Físico';
                                    default:
                                        return '';
                                }
                            }}
                        />

                        <Tooltip />
                        <Legend />

                        {/* Taxa de Acerto */}
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="accuracy"
                            name="Taxa de Acerto (%)"
                            strokeWidth={2}
                            dot
                        />

                        {/* Nível de Prompt */}
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="promptScore"
                            name="Nível de Prompt"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            dot
                        />

                        {/* Generalização */}
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="generalization"
                            name="Generalização"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>

                {!compact && (
                    <div className="mt-3 text-muted small">
                        <strong>Prompt:</strong> Físico → Verbal → Gestual → Independente<br />
                        <strong>Generalização:</strong> 1 = ocorreu / 0 = não ocorreu
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default AbaCharts;
