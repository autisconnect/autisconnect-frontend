import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });
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
    localStorage.setItem('token', userData.token);
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