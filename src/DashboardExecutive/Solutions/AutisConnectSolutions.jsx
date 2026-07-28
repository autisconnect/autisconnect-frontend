import { Col, Row } from 'react-bootstrap';
import { CLINIC_MODULES } from '../clinicModules';
import SolutionCard from './SolutionCard';
const solutions = [
  { name: 'Gestão Clínica', key: CLINIC_MODULES.CLINICAL_MANAGEMENT, description: 'Organiza a operação clínica em uma visão integrada.', features: ['Agenda', 'Pacientes', 'Profissionais', 'Atendimento e operação'], permission: 'Licença de Gestão Clínica', route: '/clinic-dashboard' },
  { name: 'Gestão Terapêutica', key: CLINIC_MODULES.THERAPEUTIC_MANAGEMENT, description: 'Acompanha o cuidado terapêutico e sua evolução.', features: ['ABA', 'Evolução', 'Monitoramentos', 'Prescrições e acompanhamento'], permission: 'Licença de Gestão Terapêutica', route: '/therapeutic-dashboard' },
  { name: 'Gestão Financeira', key: CLINIC_MODULES.FINANCIAL_MANAGEMENT, description: 'Consolida o controle financeiro executivo da clínica.', features: ['Contas', 'Fluxo de caixa', 'Custos', 'Contratos e repasses'], permission: 'Licença de Gestão Financeira', route: '/dashboard-executivo/financeiro' },
  { name: 'Gestão Executiva', key: CLINIC_MODULES.EXECUTIVE_MANAGEMENT, description: 'Apoia decisões estratégicas baseadas em dados operacionais.', features: ['Indicadores', 'Relatórios', 'DRE e balanço', 'Auditoria e visão estratégica'], permission: 'Acesso executivo ativo', route: '/dashboard-executivo' },
  { name: 'Inteligência Artificial', key: CLINIC_MODULES.EXECUTIVE_AI, description: 'Estrutura preparada para insights, previsões e análises futuras.', features: ['Insights', 'Previsões', 'Análises futuras', 'Evolução gradual do módulo'], permission: 'Licença de IA Executiva', route: '/dashboard-executivo/ia', preparing: true }
];
const AutisConnectSolutions = ({ modules }) => <section><div className="mb-4"><h2 className="h4 mb-1">Soluções AutisConnect</h2><p className="text-muted mb-0">Uma plataforma modular para apoiar a gestão, o cuidado e a decisão clínica.</p></div><Row className="g-4">{solutions.map((solution) => <Col key={solution.name} md={6} xl={4}><SolutionCard solution={solution} module={modules[solution.key]} /></Col>)}</Row></section>;
export default AutisConnectSolutions;
