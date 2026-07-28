import { Card } from 'react-bootstrap';
import ModuleAccessButton from './ModuleAccessButton';
import ModuleFeatureList from './ModuleFeatureList';
import ModuleStatusBadge from './ModuleStatusBadge';
const SolutionCard = ({ solution, module }) => <Card className="executive-metric-card h-100"><Card.Body className="d-flex flex-column"><div className="d-flex justify-content-between gap-2"><Card.Title className="h5">{solution.name}</Card.Title><ModuleStatusBadge module={module} /></div><Card.Text className="text-muted">{solution.description}</Card.Text><ModuleFeatureList features={solution.features} /><p className="small text-muted mt-3 mb-3">Permissão: {solution.permission}{module?.module?.expires_at ? ` · Válido até ${new Date(module.module.expires_at).toLocaleDateString('pt-BR')}` : ''}</p><div className="mt-auto"><ModuleAccessButton module={module} route={solution.route} preparing={solution.preparing} /></div></Card.Body></Card>;
export default SolutionCard;
