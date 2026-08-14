import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
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
    const chartData = useMemo(() => {
        if (!sessions || sessions.length === 0) {
            return [];
        }

        return sessions
            .slice()
            .sort((left, right) => new Date(left.createdAt || left.sessionDate) - new Date(right.createdAt || right.sessionDate))
            .map((session) => {
                const accuracy = session.totalTrials && session.totalTrials > 0
                    ? Math.round((session.correctResponses / session.totalTrials) * 100)
                    : 0;

                const promptScore = (() => {
                    switch (String(session.promptLevel || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()) {
                    case 'INDEPENDENTE':
                        return 4;
                    case 'GESTUAL':
                        return 3;
                    case 'VERBAL':
                        return 2;
                    case 'FISICO':
                    case 'FISICO PARCIAL':
                    case 'FISICO TOTAL':
                        return 1;
                    default:
                        return 0;
                    }
                })();

                return {
                    date: dayjs(session.createdAt || session.sessionDate).format('DD/MM'),
                    accuracy,
                    promptScore,
                    generalization: session.generalization ? 1 : 0
                };
            });
    }, [sessions]);

    if (!chartData.length) {
        return (
            <Card className="shadow-sm h-100">
                <Card.Header>Evolução ABA</Card.Header>
                <Card.Body>
                    <p className="text-muted mb-0">
                        Dados insuficientes para gerar gráficos.
                    </p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm h-100">
            <Card.Header>Evolução ABA</Card.Header>
            <Card.Body>
                <ResponsiveContainer width="100%" height={compact ? 280 : 360}>
                    <LineChart data={chartData}>
                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#64748B" />
                        <YAxis
                            yAxisId="left"
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                            stroke="#64748B"
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 4]}
                            ticks={[1, 2, 3, 4]}
                            stroke="#64748B"
                            tickFormatter={(value) => {
                                switch (value) {
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

                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#07152E',
                                border: '1px solid rgba(148, 163, 184, 0.18)',
                                borderRadius: '14px',
                                color: '#FFFFFF'
                            }}
                            labelStyle={{ color: '#E2E8F0' }}
                        />
                        <Legend />

                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="accuracy"
                            name="Taxa de Acerto (%)"
                            stroke="#2563EB"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#2563EB' }}
                        />

                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="promptScore"
                            name="Nível de Prompt"
                            stroke="#06B6D4"
                            strokeDasharray="6 6"
                            strokeWidth={2.2}
                            dot={{ r: 3, fill: '#06B6D4' }}
                        />

                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="generalization"
                            name="Generalização"
                            stroke="#16A34A"
                            strokeWidth={2.2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>

                {!compact ? (
                    <div className="mt-3 text-muted small">
                        <strong>Prompt:</strong> Físico, verbal, gestual e independente são exibidos conforme os registros existentes.
                        <br />
                        <strong>Generalização:</strong> 1 = ocorreu / 0 = não ocorreu
                    </div>
                ) : null}
            </Card.Body>
        </Card>
    );
};

export default AbaCharts;
