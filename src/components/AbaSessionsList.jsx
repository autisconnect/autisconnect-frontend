import React, { useEffect, useState } from 'react';
import { Card, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import dayjs from 'dayjs';
import abaService from '../services/abaService';

const AbaSessionsList = ({ sessions: sessionsProp, patientId }) => {
    const isControlled = sessionsProp !== undefined;
    const [sessions, setSessions] = useState(Array.isArray(sessionsProp) ? sessionsProp : []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isControlled) {
            setSessions(Array.isArray(sessionsProp) ? sessionsProp : []);
        }
    }, [isControlled, sessionsProp]);

    useEffect(() => {
        const loadSessions = async () => {
            if (isControlled || !patientId) return;

            try {
                setLoading(true);
                setError(null);
                const response = await abaService.getSessions(patientId);
                setSessions(response.data || []);
            } catch (err) {
                console.error(err);
                setError('Erro ao carregar sessões ABA.');
            } finally {
                setLoading(false);
            }
        };

        loadSessions();
    }, [isControlled, patientId]);

    if (loading) {
        return (
            <Card className="shadow-sm">
                <Card.Header>Histórico de Sessões ABA</Card.Header>
                <Card.Body className="text-center">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Carregando sessões...</span>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="shadow-sm">
                <Card.Header>Histórico de Sessões ABA</Card.Header>
                <Card.Body>
                    <Alert variant="warning" className="mb-0">
                        {error}
                    </Alert>
                </Card.Body>
            </Card>
        );
    }

    if (!sessions || sessions.length === 0) {
        return (
            <Card className="shadow-sm">
                <Card.Header>Histórico de Sessões ABA</Card.Header>
                <Card.Body>
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
            <Card.Header>Histórico de Sessões ABA</Card.Header>
            <Card.Body>
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
                                    {session.createdAt || session.sessionDate ? dayjs(session.createdAt || session.sessionDate).format('DD/MM/YYYY') : '--'}
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
                                    {session.generalization ? '??' : '—'}
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

