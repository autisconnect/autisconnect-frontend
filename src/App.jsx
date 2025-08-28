// src/App.jsx
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import ParentDashboard from './ParentDashboard';
import ProfessionalDashboard from './ProfessionalDashboard';
import FinancialDashboard from './FinancialDashboard'; // <-- IMPORTAÇÃO ADICIONADA
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
import PatientDetails from './PatientDetails'; // Novo componente para detalhes do paciente
import { AuthProvider } from './context/AuthContext.jsx';
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


import './App.css';

// Componente para renderizar o dashboard público correto com base no ID
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

// Componente para renderizar o dashboard de sessões com userId dinâmico
const DynamicSessionsGraph = () => {
  const { userId } = useParams();
  return <SessionsGraph userId={userId ? parseInt(userId) : 2} />;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Rotas de apresentação */}
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
        
          {/* Rotas protegidas para dashboards */}
          <Route
            path="/parent-dashboard/:id"
            element={<ProtectedRoute allowedUserType="pais_responsavel"><ParentDashboard /></ProtectedRoute>}
          />
          <Route
            path="/professional-dashboard/:id"
            element={<ProtectedRoute allowedUserType="medicos_terapeutas"><ProfessionalDashboard /></ProtectedRoute>}
          />

          <Route
            path="/financial-dashboard/:id"
            element={
              <ProtectedRoute allowedUserType="medicos_terapeutas">
                <FinancialDashboard />
              </ProtectedRoute>
            }
          />

          <Route
              path="/secretary-dashboard/:id"
              element={<ProtectedRoute allowedUserType="secretaria"><SecretaryDashboard /></ProtectedRoute>}
          />

          <Route
            path="/service-dashboard"
            element={<ProtectedRoute allowedUserType="servicos_locais"><ServiceDashboard /></ProtectedRoute>}
          />
          <Route
            path="/service-dashboard/:id"
            element={<ProtectedRoute allowedUserType="servicos_locais"><ServiceDashboard /></ProtectedRoute>}
          />

          {/* Rota para detalhes do paciente */}
          <Route
            path="/patient-details/:patientId"
            element={<ProtectedRoute allowedUserType="medicos_terapeutas"><PatientDetails /></ProtectedRoute>}
          />

          {/* Rotas protegidas para ferramentas específicas */}
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
          
          {/* Rotas para ferramentas de monitoramento e análise */}
          <Route path="/emotion-detector" element={<EmotionDetector />} />
          <Route path="/emotion-graph" element={<EmotionChart />} />
          <Route path="/sessions-graph" element={<SessionsGraph userId={2} />} />
          <Route path="/sessions-graph/:userId" element={<DynamicSessionsGraph />} />
          <Route path="/emotion-dashboard" element={<EmotionTrackingDashboard />} />
          <Route path="/stroke-risk-monitor" element={<StrokeRiskMonitor />} />

          {/* Rotas públicas para páginas de serviços específicos */}
          <Route path="/service_dashboard/ServiceDashboard:id" element={<PublicServiceDashboard />} />
          <Route path="/service_dashboard/ServiceDashboard01" element={<ServiceDashboard01 />} />
          <Route path="/service_dashboard/ServiceDashboard17" element={<ServiceDashboard17 />} />
          <Route path="/service_dashboard/ServiceDashboard18" element={<ServiceDashboard18 />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;