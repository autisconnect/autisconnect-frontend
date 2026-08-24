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
        // If the user is already logged in, redirect straight to the correct dashboard.
        let target = '/';
        switch (user.tipo_usuario) {
            case 'medicos_terapeutas':
                target = `/professional-dashboard/${user.id}`;
                break;
            case 'pais_responsavel':
                target = `/parent-dashboard/${user.id}`;
                break;
            case 'secretaria':
                target = `/secretary-dashboard/${user.id}`;
                break;
            case 'clinica':
                target = `/clinic-dashboard/${user.id}`;
                break;
            case 'servicos_locais':
                target = `/service-dashboard/${user.id}`;
                break;
            case 'school':
                target = '/school/dashboard';
                break;
            default:
                target = '/';
        }
        return <Navigate to={target} replace />;
    }

    // If there is no user, allow access to the child route (Login or Signup).
    return <Outlet />;
}

export default AuthRoute;
