import React, { useState } from 'react';
import { Card, Alert, Button, Modal, Badge } from 'react-bootstrap';
import abaProgramService from '../services/abaProgramService';

/**
 * AbaProgramClosure
 * IA sugere encerramento de programa ABA
 * - Baseado em domínio da habilidade ou regressão persistente
 * - Exige confirmação humana
 * - Registra decisão clínica
 */
const AbaProgramClosure = ({ monitoring, onActionCompleted }) => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    if (!monitoring || !monitoring.closureRecommendation) {
        return null;
    }

    /* ==============================
       Handlers
    ============================== */
    const handleCloseProgram = async () => {
        try {
            setLoading(true);
            setError(null);

            await abaProgramService.closeProgram({
                programId: monitoring.programId,
                reason: monitoring.closureRecommendation.reason
            });

            setSuccess(true);
            setShowModal(false);

            if (onActionCompleted) onActionCompleted();

        } catch (err) {
            console.error(err);
            setError('Erro ao encerrar o programa.');
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
                <h5 className="mb-3">Encerramento de Programa ABA</h5>

                <Alert variant="info">
                    ℹ️ A IA recomenda o encerramento do programa abaixo.
                </Alert>

                <p className="mb-2">
                    <strong>Programa:</strong>{' '}
                    <Badge bg="secondary">{monitoring.programName}</Badge>
                </p>

                <p className="mb-3">
                    <strong>Motivo Clínico:</strong>{' '}
                    {monitoring.closureRecommendation.reason}
                </p>

                <Button
                    variant="danger"
                    onClick={() => setShowModal(true)}
                >
                    Confirmar Encerramento
                </Button>

                {/* ======================
                    MODAL DE CONFIRMAÇÃO
                ====================== */}
                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirmar Encerramento</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            O encerramento do programa será registrado
                            clinicamente e não poderá ser desfeito.
                        </p>
                        <p>
                            Deseja encerrar o programa{' '}
                            <strong>{monitoring.programName}</strong>?
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
                            onClick={handleCloseProgram}
                            disabled={loading}
                        >
                            {loading ? 'Processando...' : 'Encerrar Programa'}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {success && (
                    <Alert variant="success" className="mt-3">
                        ✅ Programa encerrado com sucesso.
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default AbaProgramClosure;
