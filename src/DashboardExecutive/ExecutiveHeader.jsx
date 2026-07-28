import { BoxArrowRight } from 'react-bootstrap-icons';
import { Button } from 'react-bootstrap';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ExecutiveHeader = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="executive-header">
      <div>
        <span className="executive-eyebrow">Gestão Estratégica</span>
        <h1>Dashboard Executivo</h1>
      </div>
      <div className="executive-header-actions">
        <span className="executive-user-name">{user?.nome_completo || 'Clínica'}</span>
        <Button variant="outline-secondary" size="sm" onClick={logout}>
          <BoxArrowRight className="me-2" aria-hidden="true" />
          Sair
        </Button>
      </div>
    </header>
  );
};

export default ExecutiveHeader;
