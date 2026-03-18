import React, { useState, useContext } from 'react';
import { Container, Navbar, Form, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import logohori from './assets/logohoriz.jpg';
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
            console.log(`Tentando login para usuário: ${email}`);
            
            // CORRIGIDO: Enviando o objeto { email, password } corretamente
            const response = await apiClient.post('/auth/login', { email, password });
            
            console.log('Resposta do servidor:', response.data);
            const { token, user } = response.data;

            if (!token || !user) {
                throw new Error('Resposta de login inválida do servidor.');
            }

            // A função 'login' do AuthContext agora cuida de tudo
            login(token, user);

        } catch (err) {
            console.error('Erro ao fazer login:', err);
            const errorMessage = err.response?.data?.error || 'Erro de conexão. Verifique sua rede e a URL da API.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <Navbar bg="light" expand="lg" fixed="top" className="mb-4">
                <Container>
                    <Navbar.Brand>
                        <img
                            src={logohori}
                            alt="Logo Autisconnect Horizontal"
                            className="d-inline-block align-top logo"
                        />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <div className="ms-auto">
                            <ArrowLeft
                                size={30}
                                onClick={handleBackToHome}
                                style={{ cursor: 'pointer', color: '#007bff' }}
                                title="Voltar para a Home"
                            />
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <section className="login-section py-5" style={{ marginTop: '70px' }}>
                <Container>
                    <h2 className="display-3 fw-bold mb-4 text-white">Bem-vindo de volta!</h2>
                    <p className="text-center lead mb-5">
                        Faça login para acessar sua conta e conectar-se à família AutisConnect.
                    </p>

                    <Card className="mx-auto" style={{ maxWidth: '400px' }}>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">Login</Card.Title>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleLogin}>
                                <Form.Group className="mb-3" controlId="formUsername">
                                    <Form.Label>Usuário</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Digite seu email"
                                        value={email} // <<< CORRIGIDO: Usa o estado 'email'
                                        onChange={(e) => setEmail(e.target.value)} // <<< CORRIGIDO: Usa 'setEmail'
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
                                    <a href="/signup">Não tem uma conta? Cadastre-se</a>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Container>
            </section>
        </div>
    );
}

export default Login;
