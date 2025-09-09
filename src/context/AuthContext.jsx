import React, { createContext, useState, useEffect } from 'react';
// Remova o 'axios' daqui, pois o apiClient já o gerencia.
import apiClient from '../services/api'; // 1. Importe o apiClient

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Erro na requisição: ' + response.status);
          const data = await response.json();
          setUser({ id: data.userId, tipo_usuario: data.tipo_usuario });
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          localStorage.removeItem('token');
          setUser(null);
          window.location.href = '/login';
        }
      } else {
        setUser(null);
        window.location.href = '/login';
      }
    };
    verifyToken();
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