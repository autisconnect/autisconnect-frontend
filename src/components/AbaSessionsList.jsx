import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import dayjs from 'dayjs';

const AbaSessionsList = ({ sessions }) => {
    if (!sessions || sessions.length === 0) {
        return (
            <Card className="shadow-sm">
                <Card.Body>
                    <h5>Histórico de Sessões ABA</h5>
                    <p className="text-muted mb-0">
                        Nenhuma sessão registrada até o momento.
                    </p>
                </Card.Body>
            </Card>
        );
    }

    const getAccuracy = (session) => {
        if (!session.totalTrials || session.totalTrials === 0) return '--';
        return Math.round(
            (session.correctResponses / session.totalTrials) * 100
        );
    };

    const getPromptBadge = (prompt) => {
        switch (prompt) {
            case 'INDEPENDENTE':
                return <Badge bg="success">Independente</Badge>;
            case 'GESTUAL':
                return <Badge bg="info">Gestual</Badge>;
            case 'VERBAL':
                return <Badge bg="warning">Verbal</Badge>;
            case 'FÍSICO':
                return <Badge bg="danger">Físico</Badge>;
            default:
                return <Badge bg="secondary">{prompt}</Badge>;
        }
    };

    return (
        <Card className="shadow-sm">
            <Card.Body>
                <h5 className="mb-3">Histórico de Sessões ABA</h5>

                <Table responsive hover bordered size="sm">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Programa</th>
                            <th>Habilidade</th>
                            <th>Acerto</th>
                            <th>Prompt</th>
                            <th>Generalização</th>
                            <th>Duração</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((session) => (
                            <tr key={session.id}>
                                <td>
                                    {dayjs(session.createdAt).format('DD/MM/YYYY')}
                                </td>
                                <td>
                                    <Badge bg="secondary">
                                        {session.sessionType}
                                    </Badge>
                                </td>
                                <td>{session.programName}</td>
                                <td>{session.targetSkill}</td>
                                <td>
                                    {getAccuracy(session)}%
                                </td>
                                <td>
                                    {getPromptBadge(session.promptLevel)}
                                </td>
                                <td className="text-center">
                                    {session.generalization ? '✔️' : '—'}
                                </td>
                                <td>
                                    {session.durationMinutes
                                        ? `${session.durationMinutes} min`
                                        : '--'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default AbaSessionsList;
