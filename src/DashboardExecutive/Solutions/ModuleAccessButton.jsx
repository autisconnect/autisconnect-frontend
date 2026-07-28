import { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
const ModuleAccessButton = ({ module, route, preparing }) => module?.allowed && route && !preparing ? <Button as={Link} to={route}>Acessar solução</Button> : <Button variant="outline-secondary" disabled>{preparing ? 'Em preparação' : 'Indisponível'}</Button>;
const ModuleAccessButtonWithClinicRoute = ({ module, route, preparing }) => {
  const { user } = useContext(AuthContext) || {};
  const destination = route === '/clinic-dashboard' && user?.id ? `/clinic-dashboard/${user.id}` : route;
  return <ModuleAccessButton module={module} route={destination} preparing={preparing && !module?.allowed} />;
};

export default ModuleAccessButtonWithClinicRoute;
