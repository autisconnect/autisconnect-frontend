import React, { createContext, useState, useEffect } from 'react';
// Remova o 'axios' daqui, pois o apiClient já o gerencia.
import apiClient from '../services/api'; // 1. Importe o apiClient

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // 2. Use o apiClient. A URL completa ('/auth/verify') é montada por ele.
          // O token também já é adicionado pelo interceptor do apiClient.
          const response = await apiClient.get('/auth/verify');
          
          if (response.data.valid) {
            setUser({
              id: response.data.userId,
              username: response.data.username,
              tipo_usuario: response.data.tipo_usuario,
              token
            });
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData) => {
    if (!userData || !userData.id || !userData.token || !userData.tipo_usuario) {
      console.error('Dados de usuário incompletos para login');
      return false;
    }
    setUser(userData);
    // O token já foi salvo no localStorage pelo componente de Login.
    // localStorage.setItem('token', userData.token);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
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
      {children}
    </AuthContext.Provider>
  );
};