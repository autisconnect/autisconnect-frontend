import React, { useState } from 'react';
import { Card, Alert, Button, Modal, Badge } from 'react-bootstrap';
import abaProgramService from '../services/abaProgramService';

/**
 * AbaProgramReplacement
 * IA sugere substituição de programa ABA
 * - Exige confirmação humana
 * - Registra decisão clínica
 */
const AbaProgramReplacement = ({ monitoring, onActionCompleted }) => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    if (!monitoring || monitoring.status !== 'ESTAGNAÇÃO') {
        return null;
    }

    /* ==============================
       Handlers
    ============================== */
    const handleReplaceProgram = async () => {
        try {
            setLoading(true);
            setError(null);

            await abaProgramService.replaceProgram({
                programId: monitoring.programId,
                suggestedProgram: monitoring.suggestedReplacement
            });

            setSuccess(true);
            setShowModal(false);

            if (onActionCompleted) onActionCompleted();

        } catch (err) {
            console.error(err);
            setError('Erro ao substituir o programa.');
        } finally {
            setLoading(false);
        }
    };

    /* ==============================
       Render
    ============================== */
    return (
        <Card className="shadow-sm">
            <Card.Body>
                <h5 className="mb-3">Substituição de Programa ABA</h5>

                <Alert variant="warning">
                    ⚠️ A IA identificou estagnação no programa atual e
                    sugere a substituição.
                </Alert>

                <p className="mb-2">
                    <strong>Programa Atual:</strong>{' '}
                    {monitoring.programName}
                </p>

                <p className="mb-3">
                    <strong>Programa Sugerido:</strong>{' '}
                    <Badge bg="info">
                        {monitoring.suggestedReplacement?.programName}
                    </Badge>
                </p>

                <Button
                    variant="primary"
                    onClick={() => setShowModal(true)}
                >
                    Confirmar Substituição
                </Button>

                {/* ======================
                    MODAL DE CONFIRMAÇÃO
                ====================== */}
                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirmar Substituição</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            A substituição do programa será registrada
                            clinicamente e impactará as análises futuras.
                        </p>
                        <p>
                            Deseja substituir o programa{' '}
                            <strong>{monitoring.programName}</strong>{' '}
                            por{' '}
                            <strong>
                                {monitoring.suggestedReplacement?.programName}
                            </strong>
                            ?
                        </p>

                        {error && (
                            <Alert variant="danger">{error}</Alert>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleReplaceProgram}
                            disabled={loading}
                        >
                            {loading ? 'Processando...' : 'Confirmar'}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {success && (
                    <Alert variant="success" className="mt-3">
                        ✅ Programa substituído com sucesso.
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default AbaProgramReplacement;
