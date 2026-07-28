import { Badge } from 'react-bootstrap';
const variants = { ACTIVE: 'success', TRIAL: 'info', PAST_DUE: 'warning', SUSPENDED: 'warning', CANCELLED: 'secondary', EXPIRED: 'danger' };
const SubscriptionStatusBadge = ({ status }) => <Badge bg={variants[status] || 'secondary'}>{status || 'SEM ASSINATURA'}</Badge>;
export default SubscriptionStatusBadge;
