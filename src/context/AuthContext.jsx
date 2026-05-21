import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Função de logout centralizada e estável
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // Efeito principal que gerencia autenticação E roteamento
  useEffect(() => {
    const handleAuthAndRouting = async () => {
      const token = localStorage.getItem('token');
      
      // Lista de rotas que qualquer um pode ver
      const publicRoutes = [
        '/', '/login', '/signup', '/presentation',
        '/PresentationProfessionalDashboard', '/PresentationParentDashboard',
        // Adicione outras rotas de apresentação aqui
      ];
      
      // Verifica se a rota atual é pública (incluindo sub-rotas)
      const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

      if (token) {
        try {
          const response = await apiClient.get('/auth/verify');
          const apiUser = response.data;
          console.log('Resposta /auth/verify:', apiUser);

          if (apiUser && apiUser.valid) {
            const appUser = {
              id: apiUser.userId,
              username: apiUser.username,
              tipo_usuario: apiUser.tipo_usuario,
              nome_completo: apiUser.nome_completo
            };
            setUser(appUser);

            // LÓGICA DE REDIRECIONAMENTO PARA USUÁRIO LOGADO
            if (location.pathname === '/login' || location.pathname === '/signup') {
              switch (appUser.tipo_usuario) {
                case 'medicos_terapeutas': navigate(`/professional-dashboard/${appUser.id}`); break;
                case 'pais_responsavel': navigate(`/parent-dashboard/${appUser.id}`); break;
                case 'secretaria': navigate(`/secretary-dashboard/${appUser.id}`); break;
                case 'clinica': navigate(`/clinic-dashboard/${appUser.id}`); break;
                case 'servicos_locais': navigate(`/service-dashboard/${appUser.id}`); break;
                default: navigate('/');
              }
            }
          } else {
            logout();
          }
        } catch (error) {
          console.error("Auth: Falha ao verificar token.", error.message);
          logout();
        }
      } else {
        // LÓGICA PARA USUÁRIO NÃO LOGADO
        setUser(null);
        if (!isPublicRoute) {
          navigate('/login');
        }
      }
      
      setLoading(false);
    };

    handleAuthAndRouting();
  }, [location.pathname, logout]); // Roda a cada mudança de URL

  // Função de login que apenas atualiza o estado e o token
  const login = (token, apiUserData) => {
      localStorage.setItem('token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const appUserData = {
          id: apiUserData.userId,
          username: apiUserData.username,
          tipo_usuario: apiUserData.tipo_usuario,
          nome_completo: apiUserData.nome_completo
      };
      setUser(appUserData);

      // >>>>> MUDANÇA PRINCIPAL AQUI <<<<<
      // Em vez de navegar para a Home, redirecionamos DIRETAMENTE para o dashboard correto.
      switch (appUserData.tipo_usuario) {
          case 'medicos_terapeutas':
              navigate(`/professional-dashboard/${appUserData.id}`);
              break;
          case 'pais_responsavel':
              navigate(`/parent-dashboard/${appUserData.id}`);
              break;
          case 'secretaria':
              navigate(`/secretary-dashboard/${appUserData.id}`);
              break;
          case 'clinica':
              navigate(`/clinic-dashboard/${appUserData.id}`);
              break;
          case 'servicos_locais':
              navigate(`/service-dashboard/${appUserData.id}`);
              break;
          default:
              // Se o tipo for desconhecido, vai para a Home como um fallback seguro.
              navigate('/');
      }
  };

  const contextValue = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
