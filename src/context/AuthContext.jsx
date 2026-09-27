import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import { getUserLandingRoute, resolveAuthenticatedUser, shouldUseHospitalDashboard } from './authRouting';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Função de logout centralizada e estável
  const logout = useCallback((redirectTo = '/login') => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('ac_current_context');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    navigate(redirectTo);
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
      const isPublicRoute = publicRoutes.some((route) =>
        location.pathname === route || (route !== '/' && location.pathname.startsWith(`${route}/`))
      );

      if (token) {
        try {
          const response = await apiClient.get('/auth/verify');
          const apiUser = response.data;
          console.log('Resposta /auth/verify:', apiUser);

          if (apiUser && apiUser.valid) {
            const appUser = await resolveAuthenticatedUser(apiUser);
            setUser(appUser);

            // LÓGICA DE REDIRECIONAMENTO PARA USUÁRIO LOGADO
            if (location.pathname === '/login' || location.pathname === '/signup') {
              navigate(getUserLandingRoute(appUser));
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
  }, [location.pathname, logout, navigate]); // Roda a cada mudança de URL

  // Função de login que apenas atualiza o estado e o token
  const login = async (token, apiUserData) => {
      localStorage.setItem('token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Um novo login profissional começa na área individual. O hospital continua
      // acessível ao selecionar explicitamente esse contexto após a entrada.
      if (apiUserData?.tipo_usuario === 'medicos_terapeutas' && !shouldUseHospitalDashboard(apiUserData)) {
        sessionStorage.removeItem('ac_current_context');
      }

      const appUserData = await resolveAuthenticatedUser(apiUserData);
      setUser(appUserData);
      navigate(getUserLandingRoute(appUserData));
  };

  const contextValue = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
