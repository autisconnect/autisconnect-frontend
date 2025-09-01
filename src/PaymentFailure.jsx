// frontend/src/pages/PaymentFailure.jsx

import React from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { XCircleFill } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import logohori from './assets/logohoriz.jpg';
import './App.css';

const PaymentFailure = () => {
    const navigate = useNavigate();

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
                        <XCircleFill color="red" size={60} className="mb-3" />
                        <Card.Title as="h2" className="mb-3">Ocorreu um Problema</Card.Title>
                        <Card.Text>
                            Não foi possível processar seu pagamento. Nenhum valor foi cobrado.
                        </Card.Text>
                        <Alert variant="warning" className="mt-4">
                            Por favor, verifique os dados informados ou tente um método de pagamento diferente.
                        </Alert>
                    </Card.Body>
                </Card>

                <div className="mt-4">
                    <Button 
                        variant="primary" 
                        className="me-3"
                        onClick={() => navigate('/signup')}
                    >
                        Tentar Novamente
                    </Button>
                    <Button 
                        variant="secondary" 
                        onClick={() => navigate('/')}
                    >
                        Voltar para a Página Inicial
                    </Button>
                </div>
            </Container>
        </div>
    );
};

export default PaymentFailure;
