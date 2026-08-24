import React, { useContext, useState } from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import { Envelope, Eye, EyeSlash, Lock } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import AuthScaffold from './AuthScaffold';
import { AuthContext } from './context/AuthContext.jsx';
import apiClient from './services/api.js';
import './App.css';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useContext(AuthContext);

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log(`Tentando login para usuario: ${email}`);
            const response = await apiClient.post('/auth/login', { email, password });
            console.log('Resposta do servidor:', response.data);
            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error('Resposta de login invalida do servidor.');
            }

            login(token, user);
        } catch (err) {
            console.error('Erro ao fazer login:', err);
            const errorMessage = err.response?.data?.error || 'Erro de conexao. Verifique sua rede e a URL da API.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthScaffold
            backTo="/"
            backLabel="Voltar para o inicio"
            eyebrow="Acesso seguro"
            title="Bem-vindo de volta"
            subtitle="Acesse sua conta AutisConnect"
            pageClassName="ac-login-page--entry"
            showPremiumPanel={false}
            showcaseMode="compact"
            footer={
                <>
                    <span>Nao possui uma conta?</span>
                    <Link to="/signup" className="ac-login-inline-link ac-login-inline-link--strong">
                        Criar conta
                    </Link>
                </>
            }
        >
            {error ? (
                <Alert variant="danger" className="ac-login-alert" role="alert" aria-live="polite">
                    {error}
                </Alert>
            ) : null}

            <Form className="ac-login-form" onSubmit={handleLogin}>
                <Form.Group className="ac-login-field" controlId="formUsername">
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
                            autoComplete="username"
                            required
                        />
                    </div>
                </Form.Group>

                <Form.Group className="ac-login-field" controlId="formPassword">
                    <div className="ac-login-field-row">
                        <Form.Label className="ac-login-label">Senha</Form.Label>
                        <Link to="/forgot-password" className="ac-login-inline-link">
                            Esqueci minha senha
                        </Link>
                    </div>

                    <div className="ac-login-input-shell">
                        <span className="ac-login-input-icon">
                            <Lock />
                        </span>
                        <Form.Control
                            className="ac-login-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            className="ac-login-input-action"
                            onClick={() => setShowPassword((current) => !current)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? <EyeSlash /> : <Eye />}
                        </button>
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
                            <span>Entrando...</span>
                        </>
                    ) : (
                        'Entrar'
                    )}
                </button>
            </Form>
        </AuthScaffold>
    );
}

export default Login;
