import { useEffect, useState } from 'react';
import { Alert, Container, Spinner } from 'react-bootstrap';
import { Navigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import ExecutiveHome from './ExecutiveHome';
import ExecutiveLayout from './ExecutiveLayout';
import Financeiro from './Financeiro';
import ChartOfAccounts from './ChartOfAccounts';
import FinancialAllocations from './FinancialAllocations';
import ExecutiveDre from './ExecutiveDre';
import ExecutiveBalanceSheet from './ExecutiveBalanceSheet';
import FinancialExports from './FinancialExports';
import FinancialSettings from './FinancialSettings';
import GestaoProfissionais from './GestaoProfissionaisContractManagement';
import ExecutiveReportCenter from './ExecutiveReportCenter';
import ExecutiveAI from './ExecutiveAIResults';
import AuditoriaExecutiva from './AuditoriaExecutiva';
import ExecutiveSubscription from './Subscription/ExecutiveSubscription';
import { CLINIC_MODULES } from './clinicModules';
import ModuleUnavailable from './ModuleUnavailable';
import { useClinicModules } from './useClinicModules';
import PlatformUsage from './PlatformUsage';
import SystemHealth from './SystemHealth';
import ExecutiveAlerts from './ExecutiveAlerts';
import ExecutiveProfessionalFinancial from './ExecutiveProfessionalFinancial';
import ExecutiveAdvancedIndicators from './ExecutiveAdvancedIndicators';
import AutisConnectSolutions from './Solutions/AutisConnectSolutions';
import ExecutiveFiscalDashboard from './ExecutiveFiscalDashboard';
import './DashboardExecutive.css';

const DashboardExecutive = () => {
  const [state, setState] = useState({ loading: true, enabled: false, cards: [], error: '' });
  const location = useLocation();
  const clinicModules = useClinicModules(state.enabled);

  useEffect(() => {
    let active = true;

    const loadExecutiveDashboard = async () => {
      try {
        const accessResponse = await apiClient.get('/executive/access');
        const enabled = Number(accessResponse.data?.executive_enabled) === 1;

        if (!enabled) {
          if (active) setState({ loading: false, enabled: false, cards: [], error: '' });
          return;
        }

        const overviewResponse = await apiClient.get('/executive/overview');
        if (active) {
          setState({
            loading: false,
            enabled: true,
            cards: overviewResponse.data?.cards || [],
            error: ''
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            enabled: false,
            cards: [],
            error: error.response?.data?.error || 'Não foi possível carregar o Dashboard Executivo.'
          });
        }
      }
    };

    loadExecutiveDashboard();
    return () => { active = false; };
  }, []);

  if (state.loading) {
    return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  }

  if (!state.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <ExecutiveLayout executiveEnabled={state.enabled} modules={clinicModules.modules}>
      {clinicModules.loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : state.error || clinicModules.error ? <Alert variant="danger">{state.error || clinicModules.error}</Alert> : location.pathname.endsWith('/fiscal') ? (clinicModules.allowed(CLINIC_MODULES.FISCAL_MANAGEMENT) ? <ExecutiveFiscalDashboard /> : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.FISCAL_MANAGEMENT)} />) : location.pathname.endsWith('/financeiro/exportacoes') ? <FinancialExports /> : location.pathname.endsWith('/financeiro/balanco-patrimonial') ? <ExecutiveBalanceSheet /> : location.pathname.endsWith('/financeiro/dre') ? <ExecutiveDre /> : location.pathname.endsWith('/financeiro/rateios') ? <FinancialAllocations /> : location.pathname.endsWith('/solucoes') ? <AutisConnectSolutions modules={clinicModules.modules} /> : location.pathname.endsWith('/indicadores-executivos') ? <ExecutiveAdvancedIndicators /> : location.pathname.includes('/profissionais/') && location.pathname.endsWith('/financeiro') ? <ExecutiveProfessionalFinancial /> : location.pathname.endsWith('/alertas') ? <ExecutiveAlerts /> : location.pathname.endsWith('/financeiro/configuracoes') ? (clinicModules.allowed(CLINIC_MODULES.FINANCIAL_MANAGEMENT) ? <FinancialSettings /> : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.FINANCIAL_MANAGEMENT)} />) : location.pathname.endsWith('/financeiro/plano-de-contas') ? (clinicModules.allowed(CLINIC_MODULES.FINANCIAL_MANAGEMENT) ? <ChartOfAccounts /> : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.FINANCIAL_MANAGEMENT)} />) : location.pathname.endsWith('/financeiro') ? (clinicModules.allowed(CLINIC_MODULES.FINANCIAL_MANAGEMENT) ? <Financeiro /> : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.FINANCIAL_MANAGEMENT)} />) : location.pathname.endsWith('/profissionais') ? <GestaoProfissionais /> : location.pathname.endsWith('/relatorios') ? (clinicModules.allowed(CLINIC_MODULES.EXECUTIVE_REPORTS) ? <ExecutiveReportCenter auditAllowed={clinicModules.allowed(CLINIC_MODULES.EXECUTIVE_AUDIT)} /> : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.EXECUTIVE_REPORTS)} />) : location.pathname.endsWith('/ia') ? (clinicModules.allowed(CLINIC_MODULES.EXECUTIVE_AI) ? <ExecutiveAI /> : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.EXECUTIVE_AI)} />) : location.pathname.endsWith('/auditoria') ? (clinicModules.allowed(CLINIC_MODULES.EXECUTIVE_AUDIT) ? <AuditoriaExecutiva /> : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.EXECUTIVE_AUDIT)} />) : location.pathname.endsWith('/saude') ? (clinicModules.allowed(CLINIC_MODULES.SYSTEM_HEALTH) ? <SystemHealth /> : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.SYSTEM_HEALTH)} />) : location.pathname.endsWith('/assinatura') ? <ExecutiveSubscription /> : location.pathname.endsWith('/uso') ? <PlatformUsage /> : <ExecutiveHome cards={state.cards} />}
    </ExecutiveLayout>
  );
};

export default DashboardExecutive;
