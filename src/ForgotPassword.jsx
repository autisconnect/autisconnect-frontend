import React, { useState } from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import { Envelope } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import AuthScaffold from './AuthScaffold';
import apiClient from './services/api';
import './Login.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resetUrl, setResetUrl] = useState('');
    const [delivery, setDelivery] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setResetUrl('');
        setDelivery('');

        if (!email.trim()) {
            setError('Informe o e-mail da sua conta.');
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.post('/auth/forgot-password', {
                email: email.trim().toLowerCase()
            });

            setSuccess(
                response.data?.message ||
                    'Se o e-mail existir em nossa base, voce recebera as instrucoes para redefinir a senha.'
            );
            setResetUrl(response.data?.resetUrl || '');
            setDelivery(response.data?.delivery || '');
        } catch (err) {
            console.error('Erro ao solicitar redefinicao de senha:', err);
            setError(err.response?.data?.error || 'Nao foi possivel iniciar a recuperacao de senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthScaffold
            backTo="/login"
            backLabel="Voltar para o login"
            eyebrow="Recuperacao de acesso"
            title="Esqueceu sua senha?"
            subtitle="Informe o e-mail da sua conta para receber o link de redefinicao."
            footer={
                <>
                    <span>Lembrou a senha?</span>
                    <Link to="/login" className="ac-login-inline-link ac-login-inline-link--strong">
                        Entrar
                    </Link>
                </>
            }
        >
            <div className="ac-login-form">
                {error ? (
                    <Alert variant="danger" className="ac-login-alert" role="alert" aria-live="polite">
                        {error}
                    </Alert>
                ) : null}

                {success ? (
                    <div className="ac-login-message-group">
                        <Alert
                            variant={resetUrl ? 'warning' : 'success'}
                            className="ac-login-alert"
                            role="status"
                            aria-live="polite"
                        >
                            {success}
                        </Alert>

                        {delivery === 'unavailable' ? (
                            <p className="ac-login-support-note">
                                O envio automatico de e-mail ainda nao esta configurado neste ambiente.
                                Se necessario, solicite suporte ao administrador da plataforma.
                            </p>
                        ) : null}
                    </div>
                ) : null}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="ac-login-field" controlId="forgotPasswordEmail">
                        <Form.Label className="ac-login-label">E-mail</Form.Label>
                        <div className="ac-login-input-shell">
                            <span className="ac-login-input-icon">
                                <Envelope />
                            </span>
                            <Form.Control
                                className="ac-login-input"
                                type="email"
                                placeholder="voce@autisconnect.com.br"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>
                    </Form.Group>

                    <button type="submit" className="ac-login-button" disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="ac-login-button__spinner"
                                />
                                <span>Enviando...</span>
                            </>
                        ) : (
                            'Enviar link de redefinicao'
                        )}
                    </button>
                </Form>

                {resetUrl ? (
                    <div className="ac-login-link-stack">
                        <a href={resetUrl} className="ac-login-button ac-login-button--secondary">
                            Abrir link de redefinicao
                        </a>
                        <p className="ac-login-support-note">
                            Este atalho foi disponibilizado porque o ambiente atual nao possui envio automatico de e-mail configurado.
                        </p>
                    </div>
                ) : null}
            </div>
        </AuthScaffold>
    );
}

export default ForgotPassword;
