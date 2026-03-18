import React, { useState } from 'react';
import { Card, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import abaService from '../services/abaService';

const AbaSessionForm = ({ patientId, onSaved }) => {
    const [formData, setFormData] = useState({
        sessionType: 'DTT',
        programName: '',
        targetSkill: '',
        totalTrials: '',
        correctResponses: '',
        promptLevel: 'INDEPENDENTE',
        generalization: false,
        mandType: '',
        reinforcement: '',
        durationMinutes: '',
        notes: ''
    });

    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    /* ==============================
       Handlers
    ============================== */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const resetForm = () => {
        setFormData({
            sessionType: 'DTT',
            programName: '',
            targetSkill: '',
            totalTrials: '',
            correctResponses: '',
            promptLevel: 'INDEPENDENTE',
            generalization: false,
            mandType: '',
            reinforcement: '',
            durationMinutes: '',
            notes: ''
        });
    };

    /* ==============================
       Submit
    ============================== */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!patientId) {
            setError('Paciente não identificado.');
            return;
        }

        if (!formData.programName || !formData.targetSkill) {
            setError('Programa e habilidade alvo são obrigatórios.');
            return;
        }

        try {
            setSaving(true);

            await abaService.createSession({
                patientId,
                ...formData,
                totalTrials: Number(formData.totalTrials),
                correctResponses: Number(formData.correctResponses),
                durationMinutes: Number(formData.durationMinutes)
            });

            setSuccess(true);
            resetForm();

            if (onSaved) onSaved();

        } catch (err) {
            console.error(err);
            setError('Erro ao salvar sessão ABA.');
        } finally {
            setSaving(false);
        }
    };

    /* ==============================
       Render
    ============================== */
    return (
        <Card className="shadow-sm">
            <Card.Header>Registro de Sessão ABA</Card.Header>
            <Card.Body>
                {success && (
                    <Alert variant="success">
                        Sessão registrada com sucesso.
                    </Alert>
                )}

                {error && (
                    <Alert variant="danger">
                        {error}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>

                    {/* ======================
                        Tipo de Sessão
                    ====================== */}
                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Label>Tipo de Sessão</Form.Label>
                            <Form.Select
                                name="sessionType"
                                value={formData.sessionType}
                                onChange={handleChange}
                            >
                                <option value="DTT">DTT</option>
                                <option value="NET">NET</option>
                                <option value="MANDO">Mando</option>
                            </Form.Select>
                        </Col>

                        <Col md={4}>
                            <Form.Label>Nome do Programa</Form.Label>
                            <Form.Control
                                type="text"
                                name="programName"
                                value={formData.programName}
                                onChange={handleChange}
                                placeholder="Ex: Imitação Motora"
                                required
                            />
                        </Col>

                        <Col md={4}>
                            <Form.Label>Habilidade Alvo</Form.Label>
                            <Form.Control
                                type="text"
                                name="targetSkill"
                                value={formData.targetSkill}
                                onChange={handleChange}
                                placeholder="Ex: Bater palmas"
                                required
                            />
                        </Col>
                    </Row>

                    {/* ======================
                        Dados Quantitativos
                    ====================== */}
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Label>Tentativas</Form.Label>
                            <Form.Control
                                type="number"
                                name="totalTrials"
                                value={formData.totalTrials}
                                onChange={handleChange}
                                min="0"
                            />
                        </Col>

                        <Col md={3}>
                            <Form.Label>Respostas Corretas</Form.Label>
                            <Form.Control
                                type="number"
                                name="correctResponses"
                                value={formData.correctResponses}
                                onChange={handleChange}
                                min="0"
                            />
                        </Col>

                        <Col md={3}>
                            <Form.Label>Nível de Prompt</Form.Label>
                            <Form.Select
                                name="promptLevel"
                                value={formData.promptLevel}
                                onChange={handleChange}
                            >
                                <option value="INDEPENDENTE">Independente</option>
                                <option value="GESTUAL">Gestual</option>
                                <option value="VERBAL">Verbal</option>
                                <option value="FÍSICO">Físico</option>
                            </Form.Select>
                        </Col>

                        <Col md={3} className="d-flex align-items-end">
                            <Form.Check
                                type="checkbox"
                                name="generalization"
                                checked={formData.generalization}
                                onChange={handleChange}
                                label="Generalização"
                            />
                        </Col>
                    </Row>

                    {/* ======================
                        Mandos / Reforço
                    ====================== */}
                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Label>Tipo de Mando</Form.Label>
                            <Form.Control
                                type="text"
                                name="mandType"
                                value={formData.mandType}
                                onChange={handleChange}
                                placeholder="Ex: Pedido verbal"
                            />
                        </Col>

                        <Col md={4}>
                            <Form.Label>Reforçador</Form.Label>
                            <Form.Control
                                type="text"
                                name="reinforcement"
                                value={formData.reinforcement}
                                onChange={handleChange}
                                placeholder="Ex: Brinquedo / Comida"
                            />
                        </Col>

                        <Col md={4}>
                            <Form.Label>Duração (min)</Form.Label>
                            <Form.Control
                                type="number"
                                name="durationMinutes"
                                value={formData.durationMinutes}
                                onChange={handleChange}
                                min="0"
                            />
                        </Col>
                    </Row>

                    {/* ======================
                        Observações
                    ====================== */}
                    <Row className="mb-3">
                        <Col>
                            <Form.Label>Observações Clínicas</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Comportamento, engajamento, intercorrências..."
                            />
                        </Col>
                    </Row>

                    {/* ======================
                        Ações
                    ====================== */}
                    <Row>
                        <Col className="text-end">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={saving}
                            >
                                {saving ? 'Salvando...' : 'Registrar Sessão'}
                            </Button>
                        </Col>
                    </Row>

                </Form>
            </Card.Body>
        </Card>
    );
};

export default AbaSessionForm;
