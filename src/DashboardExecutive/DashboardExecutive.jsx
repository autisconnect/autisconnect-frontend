import { useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { Navigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import AutisConnectSolutions from './Solutions/AutisConnectSolutions';
import AuditoriaExecutiva from './AuditoriaExecutiva';
import ChartOfAccounts from './ChartOfAccounts';
import ExecutiveAdvancedIndicators from './ExecutiveAdvancedIndicators';
import ExecutiveAI from './ExecutiveAIResults';
import ExecutiveAlerts from './ExecutiveAlerts';
import ExecutiveBalanceSheet from './ExecutiveBalanceSheet';
import ExecutiveDre from './ExecutiveDre';
import ExecutiveFiscalDashboard from './ExecutiveFiscalDashboard';
import ExecutiveHome from './ExecutiveHome';
import ExecutiveLayout from './ExecutiveLayout';
import ExecutiveProfessionalFinancial from './ExecutiveProfessionalFinancial';
import ExecutiveReportCenter from './ExecutiveReportCenter';
import ExecutiveSubscription from './Subscription/ExecutiveSubscription';
import Financeiro from './Financeiro';
import FinancialAllocations from './FinancialAllocations';
import FinancialExports from './FinancialExports';
import FinancialSettings from './FinancialSettings';
import GestaoProfissionais from './GestaoProfissionaisContractManagement';
import { CLINIC_MODULES } from './clinicModules';
import ModuleUnavailable from './ModuleUnavailable';
import PlatformUsage from './PlatformUsage';
import SystemHealth from './SystemHealth';
import { useClinicModules } from './useClinicModules';
import './DashboardExecutive.css';

const DashboardExecutive = () => {
  const [state, setState] = useState({
    loading: true,
    enabled: false,
    cards: [],
    error: ''
  });
  const location = useLocation();
  const clinicModules = useClinicModules(state.enabled);

  useEffect(() => {
    let active = true;

    const loadExecutiveDashboard = async () => {
      try {
        const accessResponse = await apiClient.get('/executive/access');
        const enabled = Number(accessResponse.data?.executive_enabled) === 1;

        if (!enabled) {
          if (active) {
            setState({ loading: false, enabled: false, cards: [], error: '' });
          }
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
            error:
              error.response?.data?.error
              || 'Nao foi possivel carregar o Dashboard Executivo.'
          });
        }
      }
    };

    loadExecutiveDashboard();
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="executive-session-state">
        <div className="executive-loading-card">
          <Spinner animation="border" />
          <p className="mb-0">Carregando painel executivo...</p>
        </div>
      </div>
    );
  }

  if (!state.enabled) {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    if (clinicModules.loading) {
      return (
        <div className="executive-loading-state">
          <Spinner animation="border" />
          <p className="mb-0">Atualizando modulos habilitados...</p>
        </div>
      );
    }

    if (state.error || clinicModules.error) {
      return <Alert variant="danger">{state.error || clinicModules.error}</Alert>;
    }

    if (location.pathname.endsWith('/fiscal')) {
      return clinicModules.allowed(CLINIC_MODULES.FISCAL_MANAGEMENT)
        ? <ExecutiveFiscalDashboard />
        : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.FISCAL_MANAGEMENT)} />;
    }

    if (location.pathname.endsWith('/financeiro/exportacoes')) {
      return <FinancialExports />;
    }

    if (location.pathname.endsWith('/financeiro/balanco-patrimonial')) {
      return <ExecutiveBalanceSheet />;
    }

    if (location.pathname.endsWith('/financeiro/dre')) {
      return <ExecutiveDre />;
    }

    if (location.pathname.endsWith('/financeiro/rateios')) {
      return <FinancialAllocations />;
    }

    if (location.pathname.endsWith('/solucoes')) {
      return <AutisConnectSolutions modules={clinicModules.modules} />;
    }

    if (location.pathname.endsWith('/indicadores-executivos')) {
      return <ExecutiveAdvancedIndicators />;
    }

    if (location.pathname.includes('/profissionais/') && location.pathname.endsWith('/financeiro')) {
      return <ExecutiveProfessionalFinancial />;
    }

    if (location.pathname.endsWith('/alertas')) {
      return <ExecutiveAlerts />;
    }

    if (location.pathname.endsWith('/financeiro/configuracoes')) {
      return clinicModules.allowed(CLINIC_MODULES.FINANCIAL_MANAGEMENT)
        ? <FinancialSettings />
        : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.FINANCIAL_MANAGEMENT)} />;
    }

    if (location.pathname.endsWith('/financeiro/plano-de-contas')) {
      return clinicModules.allowed(CLINIC_MODULES.FINANCIAL_MANAGEMENT)
        ? <ChartOfAccounts />
        : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.FINANCIAL_MANAGEMENT)} />;
    }

    if (location.pathname.endsWith('/financeiro')) {
      return clinicModules.allowed(CLINIC_MODULES.FINANCIAL_MANAGEMENT)
        ? <Financeiro />
        : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.FINANCIAL_MANAGEMENT)} />;
    }

    if (location.pathname.endsWith('/profissionais')) {
      return <GestaoProfissionais />;
    }

    if (location.pathname.endsWith('/relatorios')) {
      return clinicModules.allowed(CLINIC_MODULES.EXECUTIVE_REPORTS)
        ? (
            <ExecutiveReportCenter
              auditAllowed={clinicModules.allowed(CLINIC_MODULES.EXECUTIVE_AUDIT)}
            />
          )
        : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.EXECUTIVE_REPORTS)} />;
    }

    if (location.pathname.endsWith('/ia')) {
      return clinicModules.allowed(CLINIC_MODULES.EXECUTIVE_AI)
        ? <ExecutiveAI />
        : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.EXECUTIVE_AI)} />;
    }

    if (location.pathname.endsWith('/auditoria')) {
      return clinicModules.allowed(CLINIC_MODULES.EXECUTIVE_AUDIT)
        ? <AuditoriaExecutiva />
        : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.EXECUTIVE_AUDIT)} />;
    }

    if (location.pathname.endsWith('/saude')) {
      return clinicModules.allowed(CLINIC_MODULES.SYSTEM_HEALTH)
        ? <SystemHealth />
        : <ModuleUnavailable reason={clinicModules.reason(CLINIC_MODULES.SYSTEM_HEALTH)} />;
    }

    if (location.pathname.endsWith('/assinatura')) {
      return <ExecutiveSubscription />;
    }

    if (location.pathname.endsWith('/uso')) {
      return <PlatformUsage />;
    }

    return <ExecutiveHome cards={state.cards} />;
  };

  return (
    <ExecutiveLayout executiveEnabled={state.enabled} modules={clinicModules.modules}>
      {renderContent()}
    </ExecutiveLayout>
  );
};

export default DashboardExecutive;
