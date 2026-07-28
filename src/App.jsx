import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AuthRoute from './AuthRoute';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import ParentDashboard from './ParentDashboard';
import ProfessionalDashboard from './ProfessionalDashboard';
import ClinicDashboard from './ClinicDashboard';
import FinancialDashboard from './FinancialDashboard';
import SecretaryDashboard from './SecretaryDashboard';
import DashboardABA from './DashboardABA';
import ServiceDashboard from './ServiceDashboard';
import PublicServiceProfile from './PublicServiceProfile';
import ServiceDashboard01 from './service_dashboard/ServiceDashboard01';
import ServiceDashboard17 from './service_dashboard/ServiceDashboard17';
import ServiceDashboard18 from './service_dashboard/ServiceDashboard18';
import EmotionDetector from './emotion-tracking/EmotionDetector';
import EmotionChart from './emotion-tracking/EmotionChart';
import SessionsGraph from './emotion-tracking/SessionsGraph';
import EmotionTrackingDashboard from './emotion-tracking/EmotionTrackingDashboard';
import StrokeRiskMonitor from './StrokeRiskMonitor';
import TriggerRecorder from './TriggerRecorder';
import PatientDetails from './PatientDetails';           // visão do profissional
import PatientDetailsParent from './PatientDetailsParent'; // visão dos pais (NOVO)
import PaymentSuccess from './PaymentSuccess';
import PaymentFailure from './PaymentFailure';
import Game1Page from './games/game1/Game1Page';
import Game2Page from './games/game2/Game2Page';
import Game3Page from './games/game3/Game3Page';
import Game4Page from './games/game4/Game4Page';
import DashboardExecutive from './DashboardExecutive/DashboardExecutive';
import TherapeuticDashboard from './DashboardTherapeutic/TherapeuticDashboard';

// ABA Module Imports
import AbaPatient from './pages/AbaPatient';
import AbaDashboard from './pages/AbaDashboard';
import AbaReport from './pages/AbaReport';

// Componentes de apresentação (mantidos)
import PresentationServiceDashboard from './presentation-dashboard/PresentationServiceDashboard';
import PresentationProfessionalDashboard from './presentation-dashboard/PresentationProfessionalDashboard';
import PresentationParentDashboard from './presentation-dashboard/PresentationParentDashboard';
import PresentationEmotionDetector from './presentation-dashboard/PresentationEmotionDetector';
import PresentationStrokeRiskMonitor from './presentation-dashboard/PresentationStrokeRiskMonitor';
import PresentationIntegratedScheduling from './presentation-dashboard/PresentationIntegratedScheduling';
import PresentationServiceCertification from './presentation-dashboard/PresentationServiceCertification';
import PresentationVirtualConsultations from './presentation-dashboard/PresentationVirtualConsultations';
import PresentationCommunitySupport from './presentation-dashboard/PresentationCommunitySupport';
import PresentationTriggerRecorder from './presentation-dashboard/PresentationTriggerRecorder';
import PresentationSecretaryDashboard from './presentation-dashboard/PresentationSecretaryDashboard';
import PresentationPatientDetails from './presentation-dashboard/PresentationPatientDetails';

import { Alert, Button } from 'react-bootstrap';
import './App.css';

// ErrorBoundary
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container mt-5">
          <Alert variant="danger">
            <h4>Erro na aplicação</h4>
            <p>{this.state.error}</p>
            <Button onClick={() => window.location.reload()}>
              Recarregar Página
            </Button>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}

// Componente dinâmico para ServiceDashboard por ID
const PublicServiceDashboard = () => {
  const { id } = useParams();
  switch (id) {
    case '18':
      return <ServiceDashboard18 />;
    case '17':
      return <ServiceDashboard17 />;
    case '1':
      return <ServiceDashboard01 />;
    default:
      return <PublicServiceProfile />;
  }
};

// SessionsGraph dinâmico
const DynamicSessionsGraph = () => {
  const { userId } = useParams();
  return <SessionsGraph userId={userId ? parseInt(userId) : 2} />;
};

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Rota Home Pública */}
        <Route index element={<Home />} />

        {/* Rotas de Autenticação (somente se NÃO logado) */}
        <Route element={<AuthRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Rotas de Apresentação (públicas) */}
        <Route path="/presentation" element={<PresentationServiceDashboard />} />
        <Route path="/PresentationProfessionalDashboard" element={<PresentationProfessionalDashboard />} />
        <Route path="/PresentationParentDashboard" element={<PresentationParentDashboard />} />
        <Route path="/presentation-dashboard/PresentationEmotionDetector" element={<PresentationEmotionDetector />} />
        <Route path="/presentation-dashboard/PresentationStrokeRiskMonitor" element={<PresentationStrokeRiskMonitor />} />
        <Route path="/presentation-dashboard/PresentationIntegratedScheduling" element={<PresentationIntegratedScheduling />} />
        <Route path="/presentation-dashboard/PresentationServiceCertification" element={<PresentationServiceCertification />} />
        <Route path="/presentation-dashboard/PresentationVirtualConsultations" element={<PresentationVirtualConsultations />} />
        <Route path="/presentation-dashboard/PresentationCommunitySupport" element={<PresentationCommunitySupport />} />
        <Route path="/presentation-dashboard/PresentationTriggerRecorder" element={<PresentationTriggerRecorder />} />
        <Route path="/presentation-dashboard/PresentationSecretaryDashboard" element={<PresentationSecretaryDashboard />} />
        <Route path="/presentation-dashboard/PresentationPatientDetails" element={<PresentationPatientDetails />} />

        {/* Rotas Protegidas - Pais / Responsáveis */}
        <Route
          path="/parent-dashboard/:id"
          element={
            <ProtectedRoute allowedUserTypes={['pais_responsavel']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rotas Protegidas - Profissional */}
        <Route
          path="/professional-dashboard/:id"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas']}>
              <ProfessionalDashboard />
            </ProtectedRoute>
          }
        />

        {/* Visão do paciente - Profissional */}
        <Route
          path="/clinic-dashboard/:id"
          element={
            <ProtectedRoute allowedUserTypes={['clinica', 'medicos_terapeutas', 'servicos_locais', 'administrador_clinica']}>
              <ClinicDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapeutic-dashboard"
          element={
            <ProtectedRoute allowedUserTypes={['clinica']}>
              <TherapeuticDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard-executivo"
          element={
            <ProtectedRoute allowedUserTypes={['clinica']}>
              <DashboardExecutive />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-executivo/financeiro"
          element={
            <ProtectedRoute allowedUserTypes={['clinica']}>
              <DashboardExecutive />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-executivo/financeiro/configuracoes"
          element={
            <ProtectedRoute allowedUserTypes={['clinica']}>
              <DashboardExecutive />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard-executivo/financeiro/plano-de-contas" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/financeiro/rateios" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/financeiro/dre" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/financeiro/balanco-patrimonial" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/financeiro/exportacoes" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route
          path="/dashboard-executivo/profissionais"
          element={
            <ProtectedRoute allowedUserTypes={['clinica']}>
              <DashboardExecutive />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard-executivo/profissionais/:id/financeiro" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/relatorios" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/ia" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/auditoria" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/assinatura" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/uso" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/alertas" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/indicadores-executivos" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/solucoes" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />
        <Route path="/dashboard-executivo/saude" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />

        <Route
          path="/patient-details/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas']}>
              <PatientDetails />
            </ProtectedRoute>
          }
        />

        {/* Visão do paciente - Pais / Responsáveis (NOVO) */}
        <Route
          path="/patient-details-parent/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['pais_responsavel']}>
              <PatientDetailsParent />
            </ProtectedRoute>
          }
        />

        {/* Jogos Terapêuticos */}
        <Route
          path="/games/game1/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}>
              <Game1Page />
            </ProtectedRoute>
          }
        />

        <Route
          path="/games/game2/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}>
              <Game2Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/game3/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}>
              <Game3Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/game4/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}>
              <Game4Page />
            </ProtectedRoute>
          }
        />

        {/* Outras rotas protegidas */}
        <Route
          path="/financial-dashboard/:id"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas']}>
              <FinancialDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/secretary-dashboard/:id"
          element={
            <ProtectedRoute allowedUserTypes={['secretaria']}>
              <SecretaryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aba-dashboard/:id"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas']}>
              <DashboardABA />
            </ProtectedRoute>
          }
        />
        <Route
          path="/service-dashboard"
          element={
            <ProtectedRoute allowedUserTypes={['servicos_locais']}>
              <ServiceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/service-dashboard/:id"
          element={<PublicServiceDashboard />}
        />

        {/* Ferramentas de monitoramento (permitidas para pais e profissionais) */}
        <Route
          path="/emotion-detector"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}>
              <EmotionDetector />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stroke-risk-monitor"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}>
              <StrokeRiskMonitor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trigger-recorder"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}>
              <TriggerRecorder />
            </ProtectedRoute>
          }
        />

        {/* Rotas ABA */}
        <Route
          path="/aba/patient/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas']}>
              <AbaPatient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aba/dashboard/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas']}>
              <AbaDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aba/report/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas']}>
              <AbaReport />
            </ProtectedRoute>
          }
        />

        {/* Rotas públicas / utilitárias */}
        <Route path="/emotion-graph" element={<EmotionChart />} />
        <Route path="/sessions-graph" element={<SessionsGraph userId={2} />} />
        <Route path="/sessions-graph/:userId" element={<DynamicSessionsGraph />} />
        <Route path="/emotion-dashboard" element={<EmotionTrackingDashboard />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failure" element={<PaymentFailure />} />

        {/* Rota 404 */}
        <Route path="*" element={<div>Página não encontrada (404)</div>} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
