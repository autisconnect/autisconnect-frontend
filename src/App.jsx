import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import ParentDashboard from './ParentDashboard';
import ProfessionalDashboard from './ProfessionalDashboard';
import FinancialDashboard from './FinancialDashboard';
import SecretaryDashboard from './SecretaryDashboard';
import ServiceDashboard from './ServiceDashboard';
import ServiceDashboard01 from './service_dashboard/ServiceDashboard01';
import ServiceDashboard17 from './service_dashboard/ServiceDashboard17';
import ServiceDashboard18 from './service_dashboard/ServiceDashboard18';
import EmotionDetector from './emotion-tracking/EmotionDetector';
import EmotionChart from './emotion-tracking/EmotionChart';
import SessionsGraph from './emotion-tracking/SessionsGraph';
import EmotionTrackingDashboard from './emotion-tracking/EmotionTrackingDashboard';
import StrokeRiskMonitor from './StrokeRiskMonitor';
import StereotypyMonitor from './StereotypyMonitor';
import TriggerRecorder from './TriggerRecorder';
import PatientDetails from './PatientDetails';
import { AuthProvider } from './context/AuthContext';
import AuthNavigation from './context/AuthNavigation';
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
import PresentationStereotypyMonitor from './presentation-dashboard/PresentationStereotypyMonitor';
import PresentationSecretaryDashboard from './presentation-dashboard/PresentationSecretaryDashboard';
import PaymentSuccess from './PaymentSuccess';
import PaymentFailure from './PaymentFailure';
import { Alert, Button } from 'react-bootstrap';
import './App.css';

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

const PublicServiceDashboard = () => {
  const { id } = useParams();
  switch (id) {
    case '18':
      return <ServiceDashboard18 />;
    case '1':
      return <ServiceDashboard01 />;
    default:
      return <ServiceDashboard />;
  }
};

const DynamicSessionsGraph = () => {
  const { userId } = useParams();
  return <SessionsGraph userId={userId ? parseInt(userId) : 2} />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthNavigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
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
            <Route path="/presentation-dashboard/PresentationStereotypyMonitor" element={<PresentationStereotypyMonitor />} />
            <Route path="/presentation-dashboard/PresentationSecretaryDashboard" element={<PresentationSecretaryDashboard />} />
            <Route
              path="/parent-dashboard/:id"
              element={<ProtectedRoute allowedUserTypes={['pais_responsavel']}><ParentDashboard /></ProtectedRoute>}
            />
            <Route
              path="/professional-dashboard/:id"
              element={<ProtectedRoute allowedUserTypes={['medicos_terapeutas']}><ProfessionalDashboard /></ProtectedRoute>}
            />
            <Route
              path="/financial-dashboard/:id"
              element={<ProtectedRoute allowedUserTypes={['medicos_terapeutas']}><FinancialDashboard /></ProtectedRoute>}
            />
            <Route
              path="/secretary-dashboard/:id"
              element={<ProtectedRoute allowedUserTypes={['secretaria']}><SecretaryDashboard /></ProtectedRoute>}
            />
            <Route
              path="/service-dashboard"
              element={<ProtectedRoute allowedUserTypes={['servicos_locais']}><ServiceDashboard /></ProtectedRoute>}
            />
            <Route
              path="/service-dashboard/:id"
              element={<ProtectedRoute allowedUserTypes={['servicos_locais']}><PublicServiceDashboard /></ProtectedRoute>}
            />
            <Route
              path="/patient-details/:patientId"
              element={<ProtectedRoute allowedUserTypes={['medicos_terapeutas']}><PatientDetails /></ProtectedRoute>}
            />
            <Route
              path="/emotion-detector"
              element={<ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}><EmotionDetector /></ProtectedRoute>}
            />
            <Route
              path="/stroke-risk-monitor"
              element={<ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}><StrokeRiskMonitor /></ProtectedRoute>}
            />
            <Route
              path="/stereotypy-monitor"
              element={<ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}><StereotypyMonitor /></ProtectedRoute>}
            />
            <Route
              path="/trigger-recorder"
              element={<ProtectedRoute allowedUserTypes={['medicos_terapeutas', 'pais_responsavel']}><TriggerRecorder /></ProtectedRoute>}
            />
            <Route path="/emotion-graph" element={<EmotionChart />} />
            <Route path="/sessions-graph" element={<SessionsGraph userId={2} />} />
            <Route path="/sessions-graph/:userId" element={<DynamicSessionsGraph />} />
            <Route path="/emotion-dashboard" element={<EmotionTrackingDashboard />} />
            <Route path="/service_dashboard/ServiceDashboard:id" element={<PublicServiceDashboard />} />
            <Route path="/service_dashboard/ServiceDashboard01" element={<ServiceDashboard01 />} />
            <Route path="/service_dashboard/ServiceDashboard17" element={<ServiceDashboard17 />} />
            <Route path="/service_dashboard/ServiceDashboard18" element={<ServiceDashboard18 />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failure" element={<PaymentFailure />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;