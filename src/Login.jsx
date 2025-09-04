import React, { useState, useContext } from 'react';
import { Container, Navbar, Form, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import logohori from './assets/logohoriz.jpg';
import { AuthContext } from './context/AuthContext.jsx';
import apiClient from './services/api.js';
import './App.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleBackToHome = () => navigate('/');

    // Função para redirecionar com base no tipo de usuário e ID
    const redirectToDashboard = (tipoUsuario, userId) => {
        console.log(`Redirecionando para dashboard: tipo=${tipoUsuario}, id=${userId}`);
        
        // Garantir que userId seja um número
        const id = parseInt(userId, 10);
        if (isNaN(id) || id <= 0) {
            setError('Erro ao determinar o ID do usuário.');
            return;
        }
        switch (tipoUsuario) {
            case 'pais_responsavel': navigate(`/parent-dashboard/${id}`); break;
            case 'medicos_terapeutas': navigate(`/professional-dashboard/${id}`); break;
            case 'servicos_locais': navigate(`/service-dashboard/${id}`); break;
            case 'secretaria': navigate(`/secretary-dashboard/${id}`); break;
            default: setError('Tipo de usuário desconhecido.'); navigate('/');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log(`Tentando login para usuário: ${username}`);
            
            // --- LINHA CORRIGIDA ---
            // A baseURL do apiClient já é 'https://autisconnect.onrender.com/api'.
            // O roteador de autenticação espera apenas '/login'.
            const response = await apiClient.post('/login', { username, password } );
            
            console.log('Resposta do servidor:', response.data);
            const { token, userId, tipo_usuario } = response.data;

            if (!token || !userId || !tipo_usuario) {
                throw new Error('Resposta de login inválida do servidor.');
            }

            const id = parseInt(userId, 10);
            if (isNaN(id) || id <= 0) {
                throw new Error('ID de usuário inválido retornado pelo servidor.');
            }

            localStorage.setItem('token', token);
            const loginSuccess = login({ id, token, username, tipo_usuario });

            if (loginSuccess) {
                redirectToDashboard(tipo_usuario, id);
            } else {
                setError('Erro ao processar login. Tente novamente.');
            }
        } catch (err) {
            console.error('Erro ao fazer login:', err.response?.data, err.message);
            if (err.response && err.response.status === 401) {
                setError('Credenciais inválidas. Tente novamente.');
            } else if (err.response && err.response.status === 404) {
                setError('Rota de login não encontrada. Verifique a configuração da API.');
            } else {
                setError(`Erro ao conectar com o servidor: ${err.response?.data?.error || err.message}`);
            }
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
                    <h2 className="display-3 fw-bold mb-4 text-white" >Bem-vindo de volta!</h2>
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
                                        type="text"
                                        placeholder="Digite seu usuário"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
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

