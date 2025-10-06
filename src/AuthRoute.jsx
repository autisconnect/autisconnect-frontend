import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

function AuthRoute() {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    if (user) {
        // Se o usuário já está logado, redireciona para a página inicial.
        // O AuthContext cuidará do redirecionamento para o dashboard específico.
        return <Navigate to="/" replace />;
    }

    // Se não há usuário, permite o acesso à rota filha (Login ou Signup).
    return <Outlet />;
}

export default AuthRoute;
