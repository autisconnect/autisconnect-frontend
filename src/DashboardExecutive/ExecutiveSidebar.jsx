import { Activity, BarChartLine, Bell, CashStack, ClipboardCheck, Cpu, CreditCard2Front, FileEarmarkBarGraph, HouseDoor, People } from 'react-bootstrap-icons';
import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { CLINIC_MODULES } from './clinicModules';
import { AuthContext } from '../context/AuthContext';

const ExecutiveSidebar = ({ executiveEnabled, modules = {} }) => {
  const { user } = useContext(AuthContext);
  if (!executiveEnabled) return null;

  return (
    <aside className="executive-sidebar" aria-label="Navegação do Dashboard Executivo">
      <div className="executive-sidebar-brand">
        <BarChartLine aria-hidden="true" />
        <span>AutisConnect</span>
      </div>
      <nav>
        <NavLink to="/dashboard-executivo" className="executive-sidebar-link">
          <HouseDoor aria-hidden="true" />
          Dashboard Executivo
        </NavLink>
        {user?.tipo_usuario === 'clinica' && <NavLink to={`/clinic-dashboard/${user.id}`} className="executive-sidebar-link"><HouseDoor aria-hidden="true" />Voltar ao Dashboard Clínica</NavLink>}
        <NavLink to="/dashboard-executivo/solucoes" className="executive-sidebar-link"><BarChartLine aria-hidden="true" />Soluções AutisConnect</NavLink>
        {modules[CLINIC_MODULES.FINANCIAL_MANAGEMENT]?.allowed && <NavLink to="/dashboard-executivo/financeiro" className="executive-sidebar-link">
          <CashStack aria-hidden="true" />
          Financeiro
        </NavLink>}
        {modules[CLINIC_MODULES.FINANCIAL_MANAGEMENT]?.allowed && <NavLink to="/dashboard-executivo/financeiro/configuracoes" className="executive-sidebar-link">
          <CashStack aria-hidden="true" />
          Configurações Financeiras
        </NavLink>}
        {modules[CLINIC_MODULES.FINANCIAL_MANAGEMENT]?.allowed && <NavLink to="/dashboard-executivo/financeiro/plano-de-contas" className="executive-sidebar-link"><CashStack aria-hidden="true" />Plano de Contas</NavLink>}
        {modules[CLINIC_MODULES.FINANCIAL_MANAGEMENT]?.allowed && <NavLink to="/dashboard-executivo/financeiro/rateios" className="executive-sidebar-link"><CashStack aria-hidden="true" />Rateios</NavLink>}
        {modules[CLINIC_MODULES.FINANCIAL_MANAGEMENT]?.allowed && <NavLink to="/dashboard-executivo/financeiro/dre" className="executive-sidebar-link"><CashStack aria-hidden="true" />DRE Gerencial</NavLink>}
        {modules[CLINIC_MODULES.FINANCIAL_MANAGEMENT]?.allowed && <NavLink to="/dashboard-executivo/financeiro/balanco-patrimonial" className="executive-sidebar-link"><CashStack aria-hidden="true" />Balanço Patrimonial</NavLink>}
        {modules[CLINIC_MODULES.FINANCIAL_MANAGEMENT]?.allowed && <NavLink to="/dashboard-executivo/financeiro/exportacoes" className="executive-sidebar-link"><CashStack aria-hidden="true" />Exportações Financeiras</NavLink>}
        <NavLink to="/dashboard-executivo/profissionais" className="executive-sidebar-link">
          <People aria-hidden="true" />
          Gestão dos Profissionais
        </NavLink>
        {modules[CLINIC_MODULES.EXECUTIVE_REPORTS]?.allowed && <NavLink to="/dashboard-executivo/relatorios" className="executive-sidebar-link"><FileEarmarkBarGraph aria-hidden="true" />Relatórios</NavLink>}
        {modules[CLINIC_MODULES.EXECUTIVE_AI]?.allowed && <NavLink to="/dashboard-executivo/ia" className="executive-sidebar-link"><Cpu aria-hidden="true" />IA</NavLink>}
        {modules[CLINIC_MODULES.EXECUTIVE_AUDIT]?.allowed && <NavLink to="/dashboard-executivo/auditoria" className="executive-sidebar-link"><ClipboardCheck aria-hidden="true" />Auditoria</NavLink>}
        <NavLink to="/dashboard-executivo/assinatura" className="executive-sidebar-link"><CreditCard2Front aria-hidden="true" />Assinatura</NavLink>
        <NavLink to="/dashboard-executivo/uso" className="executive-sidebar-link"><BarChartLine aria-hidden="true" />Uso da Plataforma</NavLink>
        <NavLink to="/dashboard-executivo/alertas" className="executive-sidebar-link"><Bell aria-hidden="true" />Alertas Executivos</NavLink>
        <NavLink to="/dashboard-executivo/indicadores-executivos" className="executive-sidebar-link"><BarChartLine aria-hidden="true" />Indicadores Executivos</NavLink>
        {modules[CLINIC_MODULES.SYSTEM_HEALTH]?.allowed && <NavLink to="/dashboard-executivo/saude" className="executive-sidebar-link"><Activity aria-hidden="true" />Saúde Operacional</NavLink>}
      </nav>
    </aside>
  );
};

export default ExecutiveSidebar;
