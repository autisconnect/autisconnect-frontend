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
    const verifyInitialAuth = async () => {
      const token = localStorage.getItem('token');
      console.log("AuthContext: Verificando autenticação inicial...");

      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const response = await apiClient.get('/auth/verify');
          if (response.data && response.data.valid) {
            // Mapeia 'userId' para 'id' para compatibilidade
            const userData = {
              id: response.data.userId,
              username: response.data.username,
              tipo_usuario: response.data.tipo_usuario,
              nome_completo: response.data.nome_completo
            };
            setUser(userData);
          } else {
            logout();
          }
        } catch (error) {
          console.error("AuthContext: Falha ao verificar token.", error.message);
          logout();
        }
      }
      
      setLoading(false);
    };

    verifyInitialAuth();
  }, [logout]); 

  const login = (token, apiUserData) => {
    if (!token || !apiUserData) return;
    
    localStorage.setItem('token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    const appUserData = {
        id: apiUserData.userId,
        username: apiUserData.username,
        tipo_usuario: apiUserData.tipo_usuario,
        nome_completo: apiUserData.nome_completo
    };
    setUser(appUserData);
    navigate('/');
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    apiClient.defaults.headers.common['Authorization'] = null;
    setUser(null);
    navigate('/login');
  }, [navigate]);

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