import React, { useState } from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import { Eye, EyeSlash, Lock } from 'react-bootstrap-icons';
import { Link, useParams } from 'react-router-dom';
import AuthScaffold from './AuthScaffold';
import apiClient from './services/api';
import './Login.css';

function ResetPassword() {
    const { token = '' } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!token) {
            setError('O link de redefinicao esta incompleto ou invalido.');
            return;
        }

        if (password.length < 8) {
            setError('A nova senha deve ter pelo menos 8 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('A confirmacao da senha nao confere.');
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.post('/auth/reset-password', {
                token,
                password
            });

            setSuccess(response.data?.message || 'Senha redefinida com sucesso. Agora voce ja pode entrar.');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Erro ao redefinir senha:', err);
            setError(err.response?.data?.error || 'Nao foi possivel redefinir a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthScaffold
            backTo="/login"
            backLabel="Voltar para o login"
            eyebrow="Nova senha"
            title="Redefinir senha"
            subtitle="Defina uma nova senha para voltar a acessar sua conta com seguranca."
            footer={
                <>
                    <span>Ja recuperou o acesso?</span>
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
                    <Alert variant="success" className="ac-login-alert" role="status" aria-live="polite">
                        {success}
                    </Alert>
                ) : null}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="ac-login-field" controlId="resetPasswordPassword">
                        <Form.Label className="ac-login-label">Nova senha</Form.Label>
                        <div className="ac-login-input-shell">
                            <span className="ac-login-input-icon">
                                <Lock />
                            </span>
                            <Form.Control
                                className="ac-login-input"
                                type={showPasswords ? 'text' : 'password'}
                                placeholder="Digite sua nova senha"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                className="ac-login-input-action"
                                onClick={() => setShowPasswords((current) => !current)}
                                aria-label={showPasswords ? 'Ocultar senha' : 'Mostrar senha'}
                                aria-pressed={showPasswords}
                            >
                                {showPasswords ? <EyeSlash /> : <Eye />}
                            </button>
                        </div>
                    </Form.Group>

                    <Form.Group className="ac-login-field" controlId="resetPasswordConfirmPassword">
                        <Form.Label className="ac-login-label">Confirmar senha</Form.Label>
                        <div className="ac-login-input-shell">
                            <span className="ac-login-input-icon">
                                <Lock />
                            </span>
                            <Form.Control
                                className="ac-login-input"
                                type={showPasswords ? 'text' : 'password'}
                                placeholder="Repita a nova senha"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                    </Form.Group>

                    <button type="submit" className="ac-login-button" disabled={loading || !token}>
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
                                <span>Salvando...</span>
                            </>
                        ) : (
                            'Salvar nova senha'
                        )}
                    </button>
                </Form>
            </div>
        </AuthScaffold>
    );
}

export default ResetPassword;
