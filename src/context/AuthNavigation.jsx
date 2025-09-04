// Linha 1: Importa as ferramentas necessárias do React e do React Router.
import { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Linha 2: Importa o seu Contexto de Autenticação para saber se o usuário está logado.
import { AuthContext } from './AuthContext';

// Linha 5: Define o componente. Ele não vai renderizar nada na tela, apenas gerenciar a navegação.
const AuthNavigation = () => {
  // Linha 7: Pega as informações 'user' e 'loading' do nosso AuthContext.
  const { user, loading } = useContext(AuthContext);
  // Linha 9: Pega a função 'navigate' para podermos redirecionar o usuário.
  const navigate = useNavigate();
  // Linha 11: Pega o objeto 'location' para sabermos em qual URL (caminho) o usuário está agora.
  const location = useLocation();

  // Linha 14: Criamos uma lista (array) com todos os caminhos que um usuário NÃO LOGADO pode visitar.
  const publicRoutes = [
    '/', // A página Home
    '/login', // A página de Login
    '/signup', // A página de Cadastro
    '/presentation', // E todas as outras páginas de apresentação
    '/PresentationProfessionalDashboard',
    '/PresentationParentDashboard',
    '/presentation-dashboard/PresentationEmotionDetector',
    '/presentation-dashboard/PresentationStrokeRiskMonitor',
    '/presentation-dashboard/PresentationIntegratedScheduling',
    '/presentation-dashboard/PresentationServiceCertification',
    '/presentation-dashboard/PresentationVirtualConsultations',
    '/presentation-dashboard/PresentationCommunitySupport',
    '/presentation-dashboard/PresentationTriggerRecorder',
    '/presentation-dashboard/PresentationStereotypyMonitor',
    '/presentation-dashboard/PresentationSecretaryDashboard',
  ];

  useEffect(() => {
    // Linha 36: Se 'loading' for 'true', significa que ainda estamos verificando se o usuário tem um token válido.
    // Então, saímos da função e não fazemos nada para evitar redirecionamentos prematuros.
    if (loading) {
      return;
    }

    // Linha 42: Se o 'user' EXISTE (não é nulo), significa que o usuário está LOGADO.
    if (user) {
      // Linha 44: Verificamos se o usuário logado está tentando visitar a página de login ou de cadastro.
      if (location.pathname === '/login' || location.pathname === '/signup') {
        // Linha 46-54: Se ele estiver, nós o redirecionamos para o dashboard correto, pois ele não precisa fazer login de novo.
        if (user.tipo_usuario === 'medicos_terapeutas') {
          navigate(`/professional-dashboard/${user.id}`);
        } else if (user.tipo_usuario === 'pais_responsavel') {
          navigate(`/parent-dashboard/${user.id}`);
        } else if (user.tipo_usuario === 'secretaria') {
          navigate(`/secretary-dashboard/${user.id}`);
        } else if (user.tipo_usuario === 'servicos_locais') {
          navigate(`/service-dashboard/${user.id}`);
        }
      }
    } 
    // Linha 57: Se o 'user' NÃO EXISTE, significa que o usuário NÃO está logado.
    else {
      // Linha 59: Verificamos se a página atual que o usuário está visitando (location.pathname) é uma das rotas da nossa lista 'publicRoutes'.
      // Usamos 'some' e 'startsWith' para que caminhos como '/presentation-dashboard/...' também sejam considerados públicos.
      const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

      // Linha 63: Se a rota atual NÃO for pública...
      if (!isPublicRoute) {
        // Linha 65: ...então redirecionamos o usuário para a página de login, protegendo a rota.
        navigate('/login');
      }
      // Se a rota FOR pública, não fazemos nada e deixamos o usuário visitá-la.
    }
  // Linha 70: Este é o array de dependências. A lógica dentro do useEffect será executada novamente se 'user', 'loading', 'navigate' ou 'location.pathname' mudarem.
  }, [user, loading, navigate, location.pathname]);

  // Linha 73: Este componente não deve renderizar nada na tela, sua única função é gerenciar a navegação.
  return null;
};

// Linha 77: Exporta o componente para que ele possa ser usado no App.jsx.
export default AuthNavigation;