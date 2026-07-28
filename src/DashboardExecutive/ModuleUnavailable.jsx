import { Alert, Card } from 'react-bootstrap';
const reasons = { NOT_CONTRACTED: 'Módulo não contratado.', DISABLED: 'Licença suspensa ou módulo temporariamente desabilitado.', NOT_STARTED: 'A licença deste módulo ainda não está vigente.', EXPIRED: 'A licença deste módulo expirou.' };
const ModuleUnavailable = ({ reason }) => <Card><Card.Body><Alert className="mb-0" variant="warning"><Alert.Heading>Módulo não contratado</Alert.Heading>{reasons[reason] || 'Este módulo não está disponível para a clínica.'}</Alert></Card.Body></Card>;
export default ModuleUnavailable;
