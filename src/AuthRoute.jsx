import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { getUserLandingRoute } from './context/authRouting';
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
        return <Navigate to={getUserLandingRoute(user)} replace />;
    }

    // If there is no user, allow access to the child route (Login or Signup).
    return <Outlet />;
}

export default AuthRoute;
