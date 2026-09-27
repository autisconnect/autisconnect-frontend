import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AuthRoute from './AuthRoute';
import HospitalAccessGuard from './components/hospital/HospitalAccessGuard';
import { Alert, Button } from 'react-bootstrap';
import './App.css';

const Home = lazy(() => import('./Home')); const Login = lazy(() => import('./Login')); const Signup = lazy(() => import('./Signup'));
const ForgotPassword = lazy(() => import('./ForgotPassword')); const ResetPassword = lazy(() => import('./ResetPassword'));
const ParentDashboard = lazy(() => import('./ParentDashboard')); const ProfessionalDashboard = lazy(() => import('./ProfessionalDashboard'));
const HospitalDashboard = lazy(() => import('./HospitalDashboard')); const HospitalPatient360Page = lazy(() => import('./HospitalPatient360Page'));
const ClinicDashboard = lazy(() => import('./ClinicDashboard')); const FinancialDashboard = lazy(() => import('./FinancialDashboard'));
const SecretaryDashboard = lazy(() => import('./SecretaryDashboard')); const DashboardABA = lazy(() => import('./DashboardABA'));
const ServiceDashboard = lazy(() => import('./ServiceDashboard')); const PublicServiceProfile = lazy(() => import('./PublicServiceProfile'));
const ServiceDashboard01 = lazy(() => import('./service_dashboard/ServiceDashboard01')); const ServiceDashboard17 = lazy(() => import('./service_dashboard/ServiceDashboard17')); const ServiceDashboard18 = lazy(() => import('./service_dashboard/ServiceDashboard18'));
const EmotionDetector = lazy(() => import('./emotion-tracking/EmotionDetectorVerified')); const EmotionChart = lazy(() => import('./emotion-tracking/EmotionChart')); const SessionsGraph = lazy(() => import('./emotion-tracking/SessionsGraph')); const EmotionTrackingDashboard = lazy(() => import('./emotion-tracking/EmotionTrackingDashboard'));
const TriggerRecorder = lazy(() => import('./TriggerRecorder')); const StereotypyMonitor = lazy(() => import('./StereotypyMonitor'));
const PatientDetails = lazy(() => import('./PatientDetails')); const PatientDetailsParent = lazy(() => import('./PatientDetailsParent'));
const PaymentSuccess = lazy(() => import('./PaymentSuccess')); const PaymentFailure = lazy(() => import('./PaymentFailure'));
const Game1Page = lazy(() => import('./games/game1/Game1Page')); const Game2Page = lazy(() => import('./games/game2/Game2Page')); const Game3Page = lazy(() => import('./games/game3/Game3Page')); const Game4Page = lazy(() => import('./games/game4/Game4Page'));
const DashboardExecutive = lazy(() => import('./DashboardExecutive/DashboardExecutive')); const TherapeuticDashboard = lazy(() => import('./DashboardTherapeutic/TherapeuticDashboard'));
const SchoolDashboard = lazy(() => import('./school/SchoolDashboard')); const SchoolStudents = lazy(() => import('./school/SchoolStudents')); const SchoolClassrooms = lazy(() => import('./school/SchoolClassrooms')); const SchoolLocations = lazy(() => import('./school/SchoolLocations')); const SchoolCameras = lazy(() => import('./school/SchoolCameras')); const SchoolCameraDetails = lazy(() => import('./school/SchoolCameraDetails')); const SchoolCameraMonitor = lazy(() => import('./school/SchoolCameraMonitor')); const SchoolMonitoring = lazy(() => import('./school/SchoolMonitoring')); const SchoolMonitoringKiosk = lazy(() => import('./school/SchoolMonitoringKiosk')); const SchoolStudentDetails = lazy(() => import('./school/SchoolStudentDetails')); const SchoolReports = lazy(() => import('./school/SchoolReports')); const SchoolSettings = lazy(() => import('./school/SchoolSettings')); const SchoolEvents = lazy(() => import('./school/SchoolEvents')); const SchoolTeam = lazy(() => import('./school/SchoolTeam'));
const AbaPatient = lazy(() => import('./pages/AbaPatient')); const AbaDashboard = lazy(() => import('./pages/AbaDashboard')); const AbaReport = lazy(() => import('./pages/AbaReport'));
const PresentationServiceDashboard = lazy(() => import('./presentation-dashboard/PresentationServiceDashboard')); const PresentationProfessionalDashboard = lazy(() => import('./presentation-dashboard/PresentationProfessionalDashboard')); const PresentationParentDashboard = lazy(() => import('./presentation-dashboard/PresentationParentDashboard')); const PresentationEmotionDetector = lazy(() => import('./presentation-dashboard/PresentationEmotionDetector')); const PresentationIntegratedScheduling = lazy(() => import('./presentation-dashboard/PresentationIntegratedScheduling')); const PresentationServiceCertification = lazy(() => import('./presentation-dashboard/PresentationServiceCertification')); const PresentationVirtualConsultations = lazy(() => import('./presentation-dashboard/PresentationVirtualConsultations')); const PresentationCommunitySupport = lazy(() => import('./presentation-dashboard/PresentationCommunitySupport')); const PresentationTriggerRecorder = lazy(() => import('./presentation-dashboard/PresentationTriggerRecorder')); const PresentationSecretaryDashboard = lazy(() => import('./presentation-dashboard/PresentationSecretaryDashboard')); const PresentationPatientDetails = lazy(() => import('./presentation-dashboard/PresentationPatientDetails'));

const RouteLoading = () => <div className="app-route-loading" role="status" aria-live="polite"><span className="spinner-border text-primary" aria-hidden="true" /><strong>Carregando módulo…</strong></div>;

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
          <Alert variant="danger" role="alert">
            <h4>Erro na aplicação</h4>
            <p>Não foi possível exibir esta área. Recarregue a página para tentar novamente.</p>
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
      <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* Rota Home Pública */}
        <Route index element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

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
          path="/hospital/:hospitalId/dashboard"
          element={
            <ProtectedRoute>
              <HospitalAccessGuard>
                <HospitalDashboard />
              </HospitalAccessGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hospital/:hospitalId/patient/:patientId"
          element={
            <ProtectedRoute>
              <HospitalAccessGuard>
                <HospitalPatient360Page />
              </HospitalAccessGuard>
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
        <Route path="/dashboard-executivo/fiscal" element={<ProtectedRoute allowedUserTypes={['clinica']}><DashboardExecutive /></ProtectedRoute>} />

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

        <Route
          path="/school"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <Navigate to="/school/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/dashboard"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/students"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/students/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolStudentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/classrooms"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolClassrooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/locations"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolLocations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/cameras"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolCameras />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/cameras/:cameraId"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolCameraDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/cameras/:cameraId/monitor"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolCameraMonitor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/monitoring"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolMonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/monitoring/kiosk"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolMonitoringKiosk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/events"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/reports"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/team"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/school/settings"
          element={
            <ProtectedRoute allowedUserTypes={['school']}>
              <SchoolSettings />
            </ProtectedRoute>
          }
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
          path="/trigger-recorder"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}>
              <TriggerRecorder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stereotypy-monitor"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}>
              <StereotypyMonitor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stereotypy-monitor/:patientId"
          element={
            <ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}>
              <StereotypyMonitor />
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
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
