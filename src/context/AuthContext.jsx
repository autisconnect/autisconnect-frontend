import React, { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      console.log('VITE_API_URL:', import.meta.env.VITE_API_URL); // Depuração
      console.log('Token:', token); // Depuração
      console.log('Current path:', location.pathname); // Depuração
      // Lista de rotas públicas que não requerem autenticação
      const publicRoutes = ['/', '/login', '/register'];
      if (token && !publicRoutes.includes(location.pathname)) {
        try {
          const response = await apiClient.get('/auth/verify');
          console.log('Verify response:', response.data); // Depuração
          setUser({ id: response.data.userId, tipo_usuario: response.data.tipo_usuario });
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error.message, error.response?.status);
          localStorage.removeItem('token');
          setUser(null);
          navigate('/login');
        }
      } else {
        setUser(null);
        // Não redireciona se estiver em uma rota pública
        if (!publicRoutes.includes(location.pathname)) {
          navigate('/login');
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [navigate, location.pathname]);

  const login = (userData) => {
    if (!userData || !userData.id || !userData.token || !userData.tipo_usuario) {
      console.error('Dados de usuário incompletos para login');
      return false;
    }
    setUser(userData);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const isAuthenticated = () => !!user;

  const hasPermission = (requiredType, resourceId = null) => {
    if (!user) return false;
    const hasType = user.tipo_usuario === requiredType;
    if (!resourceId) return hasType;
    return hasType && user.id === resourceId;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasPermission, loading }}>
      {loading ? <div>Carregando...</div> : children}
    </AuthContext.Provider>
  );
};