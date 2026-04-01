import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import logohori from './assets/logonovo.png';
import { AuthContext } from './context/AuthContext.jsx';
import apiClient from './services/api.js';
import './App.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleBackToHome = () => navigate('/');

    const handleLogin = async (e) => {
        e.preventDefault();
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
        <div className="App auth-page">
            <nav className="top-bar fixed-top shadow-sm">
                <Container>
                    <Row className="align-items-center py-3">
                        <Col md={7} className="text-center text-md-start">
                            <img
                                src={logohori}
                                alt="AutisConnect"
                                className="top-bar-logo"
                            />
                        </Col>
                        <Col md={5} className="text-center text-md-end">
                            <ArrowLeft
                                size={30}
                                onClick={handleBackToHome}
                                style={{ cursor: 'pointer', color: '#ffffff' }}
                                title="Voltar para a Home"
                            />
                        </Col>
                    </Row>
                </Container>
            </nav>

            <div className="home-page" style={{ paddingTop: '85px' }}>
                <section className="hero-section hero-short">
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={5} className="mb-4 mb-lg-0">
                                <div className="hero-content-box p-4 rounded-4">
                                    <h2 className="display-5 fw-bold mb-3 text-white">Bem-vindo de volta!</h2>
                                    <p className="text-white-90 mb-0">
                                        Faça login para acessar sua conta e acompanhar o desenvolvimento do seu paciente.
                                    </p>
                                </div>
                            </Col>
                            <Col lg={7}>
                                <Card className="shadow-sm border-0">
                                    <Card.Body>
                                        <Card.Title className="text-center mb-4">Login</Card.Title>

                                        {error && <Alert variant="danger">{error}</Alert>}

                                        <Form onSubmit={handleLogin}>
                                            <Form.Group className="mb-3" controlId="formUsername">
                                                <Form.Label>Usuario</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    placeholder="Digite seu email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </Form.Group>

                                            <Form.Group className="mb-3" controlId="formPassword">
                                                <Form.Label>Senha</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    placeholder="Digite sua senha"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                            </Form.Group>

                                            <Button
                                                variant="primary"
                                                type="submit"
                                                className="w-100 mb-3"
                                                disabled={loading}
                                            >
                                                {loading ? <Spinner animation="border" size="sm" /> : 'Entrar'}
                                            </Button>

                                            <div className="text-center">
                                                <a href="/signup">Nao tem uma conta? Cadastre-se</a>
                                            </div>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <footer className="footer-section py-4">
                    <Container>
                        <Row className="align-items-center">
                            <Col md={6} className="footer-left text-start">
                                <p className="mb-0">
                                    {'\u00a9'} 2026 Nf Representações Comerciais Ltda.<br />
                                    <small>Todos os direitos reservados.</small>
                                </p>
                            </Col>
                        </Row>
                    </Container>
                </footer>
            </div>
        </div>
    );
}

export default Login;
