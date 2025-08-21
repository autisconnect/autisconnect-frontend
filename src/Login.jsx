import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    Container,
    Navbar,
    Form,
    Card,
    Button,
    Alert,
    Spinner,
} from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import logohori from './assets/logohoriz.jpg';
import { AuthContext } from './context/AuthContext.jsx';
import './App.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, user } = useContext(AuthContext);

  
    const handleBackToHome = () => navigate('/');

    // Função para redirecionar com base no tipo de usuário e ID
    const redirectToDashboard = (tipoUsuario, userId) => {
        console.log(`Redirecionando para dashboard: tipo=${tipoUsuario}, id=${userId}`);
        
        // Garantir que userId seja um número
        const id = parseInt(userId, 10);
        
        if (isNaN(id) || id <= 0) {
            console.error('ID de usuário inválido:', userId);
            setError('Erro ao determinar o ID do usuário. Contate o suporte.');
            return;
        }
        
        switch (tipoUsuario) {
            case 'pais_responsavel':
                navigate(`/parent-dashboard/${id}`);
                break;
            case 'medicos_terapeutas':
                navigate(`/professional-dashboard/${id}`);
                break;
            case 'servicos_locais':
                navigate(`/service-dashboard/${id}`);
                break;
            case 'secretaria':
                navigate(`/secretary-dashboard/${id}`); // Redireciona para o dashboard da secretária
                break;
            default:
                console.error('Tipo de usuário desconhecido:', tipoUsuario);
                setError('Erro ao determinar o tipo de usuário. Contate o suporte.');
                navigate('/');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log(`Tentando login para usuário: ${username}`);
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await axios.post(`${API_URL}/api/login`, { username, password });  
            console.log('Resposta do servidor:', response.data);
            
            const { token, userId, tipo_usuario } = response.data;

            if (!token || !userId || !tipo_usuario) {
                console.error('Resposta de login inválida do servidor. Dados recebidos:', response.data);
                throw new Error('Resposta de login inválida do servidor. Faltam dados essenciais.');
            }

            // Garantir que userId seja um número
            const id = parseInt(userId, 10);
            
            if (isNaN(id) || id <= 0) {
                console.error('ID de usuário inválido retornado pelo servidor:', userId);
                throw new Error('ID de usuário inválido retornado pelo servidor.');
            }

            localStorage.setItem('token', token);

            // Atualizar o contexto de autenticação
            const loginSuccess = login({ 
                id: id, 
                token: token, 
                username: username, 
                tipo_usuario: tipo_usuario 
            });

            if (loginSuccess) {
                console.log('Login bem-sucedido, redirecionando para dashboard específico');
                redirectToDashboard(tipo_usuario, id);
            } else {
                setError('Erro ao processar login. Tente novamente.');
            }
        } catch (err) {
            console.error('Erro ao fazer login:', err);
            if (err.response && err.response.status === 401) {
                setError('Credenciais inválidas. Tente novamente.');
            } else {
                setError('Erro ao conectar com o servidor. Tente mais tarde.');
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

