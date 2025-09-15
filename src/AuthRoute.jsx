// src/AuthRoute.jsx

import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext'; // Ajuste o caminho se necessário
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
        // Se o usuário JÁ ESTÁ LOGADO, redireciona para o dashboard apropriado
        if (user.tipo_usuario === 'medicos_terapeutas') {
            return <Navigate to={`/professional-dashboard/${user.userId}`} replace />;
        }
        if (user.tipo_usuario === 'pais_responsavel') {
            return <Navigate to={`/parent-dashboard/${user.userId}`} replace />;
        }
        if (user.tipo_usuario === 'secretaria') {
            return <Navigate to={`/secretary-dashboard/${user.userId}`} replace />;
        }
        if (user.tipo_usuario === 'servicos_locais') {
            return <Navigate to={`/service-dashboard/${user.userId}`} replace />;
        }
        // Um fallback caso o tipo de usuário não seja reconhecido
        return <Navigate to="/" replace />;
    }

    // Se não há usuário, permite o acesso à rota filha (Login ou Signup)
    return <Outlet />;
}

export default AuthRoute;
