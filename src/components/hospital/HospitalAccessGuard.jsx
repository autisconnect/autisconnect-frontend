import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { useInstitutionContext } from '../../context/InstitutionContext';

export default function HospitalAccessGuard({ children }) {
  const { hospitalId } = useParams();
  const { contexts, currentContext, loading, selectContext } = useInstitutionContext();
  const [resolving, setResolving] = useState(false);
  const [denied, setDenied] = useState(false);
  const key = `hospital:${hospitalId}`;

  useEffect(() => {
    if (loading || currentContext?.key === key) return;
    const available = contexts.find((context) => context.key === key);
    if (!available) {
      setDenied(true);
      return;
    }
    setResolving(true);
    setDenied(false);
    selectContext(available)
      .catch(() => setDenied(true))
      .finally(() => setResolving(false));
  }, [contexts, currentContext?.key, key, loading, selectContext]);

  if (loading || resolving || (!denied && currentContext?.key !== key)) {
    return (
      <div className="ac-hospital-route-state">
        <Spinner animation="border" role="status" />
        <span>Validando contexto hospitalar…</span>
      </div>
    );
  }
  if (denied) {
    return (
      <div className="ac-hospital-route-state">
        <Alert variant="danger">
          <Alert.Heading>Acesso hospitalar indisponível</Alert.Heading>
          <p>Seu usuário não possui vínculo ativo com este hospital.</p>
          <Button as="a" href="/" variant="outline-danger">Voltar ao início</Button>
        </Alert>
      </div>
    );
  }
  if (!currentContext?.permissions?.includes('hospital.dashboard.read')) return <Navigate to="/" replace />;
  return children;
}
