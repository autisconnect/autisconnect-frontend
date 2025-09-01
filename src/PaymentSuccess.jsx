// frontend/src/pages/PaymentSuccess.jsx

import React, { useEffect } from 'react';
import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { CheckCircleFill } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import logohori from './assets/logohoriz.jpg';
import './App.css';

const PaymentSuccess = () => {
    const navigate = useNavigate();

    // Efeito para redirecionar o usuário para a página de login após 5 segundos
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 5000); // 5000 milissegundos = 5 segundos

        // Limpa o timer se o componente for desmontado antes do tempo
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="App-header" style={{ minHeight: '100vh', paddingTop: '80px' }}>
            <Container className="d-flex flex-column align-items-center">
                <img 
                    src={logohori} 
                    alt="Logo AutisConnect" 
                    className="mb-4" 
                    style={{ maxWidth: '300px' }} 
                />

                <Card className="text-center shadow-lg" style={{ maxWidth: '500px' }}>
                    <Card.Body className="p-5">
                        <CheckCircleFill color="green" size={60} className="mb-3" />
                        <Card.Title as="h2" className="mb-3">Pagamento Aprovado!</Card.Title>
                        <Card.Text>
                            Sua assinatura foi ativada com sucesso. Seja bem-vindo(a) à comunidade AutisConnect!
                        </Card.Text>
                        <Alert variant="info" className="mt-4">
                            Você será redirecionado para a página de login em alguns segundos.
                        </Alert>
                        <Spinner animation="border" variant="primary" className="mt-3" />
                    </Card.Body>
                </Card>

                <Button 
                    variant="primary" 
                    className="mt-4" 
                    onClick={() => navigate('/login')}
                >
                    Ir para o Login Agora
                </Button>
            </Container>
        </div>
    );
};

export default PaymentSuccess;
