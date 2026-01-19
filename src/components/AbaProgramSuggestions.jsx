import React from 'react';
import { Card, Badge, Alert, ListGroup } from 'react-bootstrap';

/**
 * AbaProgramSuggestions
 * IA – Sugestão automática de programas ABA
 * Baseada em:
 * - Progresso
 * - Estagnação
 * - Regressão
 * - Perfil de resposta do paciente
 */
const AbaProgramSuggestions = ({ suggestions }) => {
    if (!suggestions || suggestions.length === 0) {
        return (
            <Card className="shadow-sm">
                <Card.Body>
                    <h5>Sugestões de Programas ABA</h5>
                    <p className="text-muted mb-0">
                        Nenhuma sugestão automática disponível no momento.
                    </p>
                </Card.Body>
            </Card>
        );
    }

    /* ==============================
       Helpers
    ============================== */
    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'ALTA':
                return <Badge bg="danger">Alta</Badge>;
            case 'MÉDIA':
                return <Badge bg="warning">Média</Badge>;
            case 'BAIXA':
                return <Badge bg="info">Baixa</Badge>;
            default:
                return <Badge bg="secondary">{priority}</Badge>;
        }
    };

    return (
        <Card className="shadow-sm">
            <Card.Body>
                <h5 className="mb-3">Sugestões Inteligentes de Programas ABA</h5>

                <Alert variant="info">
                    As sugestões abaixo são geradas por IA e devem ser
                    avaliadas pelo profissional responsável antes da aplicação.
                </Alert>

                <ListGroup variant="flush">
                    {suggestions.map((suggestion, index) => (
                        <ListGroup.Item key={index}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1">
                                        {suggestion.programName}
                                    </h6>
                                    <p className="mb-1">
                                        <strong>Objetivo:</strong>{' '}
                                        {suggestion.objective}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Justificativa Clínica:</strong>{' '}
                                        {suggestion.reason}
                                    </p>
                                </div>
                                <div className="text-end">
                                    {getPriorityBadge(suggestion.priority)}
                                </div>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );
};

export default AbaProgramSuggestions;
