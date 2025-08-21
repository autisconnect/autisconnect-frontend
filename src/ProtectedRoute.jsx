// Ficheiro: src/ProtectedRoute.jsx (VERSÃO FINAL APRIMORADA)

import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

// Agora a prop se chama 'allowedUserTypes' (no plural) e espera um array de strings
function ProtectedRoute({ children, allowedUserTypes }) {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    // Se a rota especifica tipos de usuário permitidos, verifica se o tipo do usuário está na lista
    if (allowedUserTypes && allowedUserTypes.length > 0) {
        if (!allowedUserTypes.includes(user.tipo_usuario)) {
            // Se o tipo de usuário não for permitido, redireciona para uma página de "não autorizado" ou login
            console.warn(`Acesso negado para o tipo de usuário: ${user.tipo_usuario}. Permitido: ${allowedUserTypes.join(', ')}`);
            return <Navigate to="/login" replace />; // Ou para uma página '/unauthorized'
        }
    }
    
    // Se passou em todas as verificações, renderiza o componente filho ou o <Outlet>
    return children ? children : <Outlet />;
}

export default ProtectedRoute;
