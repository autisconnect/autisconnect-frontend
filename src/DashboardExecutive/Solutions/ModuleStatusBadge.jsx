import { Badge } from 'react-bootstrap';
const ModuleStatusBadge = ({ module }) => { const active = module?.allowed; const reason = module?.reason; return <Badge bg={active ? 'success' : 'secondary'}>{active ? 'Contratado' : reason === 'EXPIRED' ? 'Vencido' : reason === 'DISABLED' ? 'Suspenso' : 'Não contratado'}</Badge>; };
export default ModuleStatusBadge;
