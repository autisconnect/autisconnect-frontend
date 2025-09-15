// src/context/AuthContext.jsx (VERSÃO FINAL E COMPATÍVEL)

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    apiClient.defaults.headers.common['Authorization'] = null;
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // useEffect para verificação inicial de autenticação.
  // Roda APENAS UMA VEZ.
  useEffect(() => {
    const verifyInitialAuth = async () => {
      const token = localStorage.getItem('token');
      console.log("AuthContext: Verificando autenticação inicial...");

      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const response = await apiClient.get('/auth/verify');
          if (response.data && response.data.valid) {
            
            // ===================================================
            // >>>>> AQUI ESTÁ A CORREÇÃO PARA O TypeError <<<<<
            // ===================================================
            // Criamos o objeto 'user' com a propriedade 'id', como o resto da sua aplicação espera.
            const userData = {
              id: response.data.userId, // Mapeando userId para id
              username: response.data.username,
              tipo_usuario: response.data.tipo_usuario,
              nome_completo: response.data.nome_completo // Adicionando outros dados úteis
            };
            console.log("AuthContext: Token válido. Usuário definido:", userData);
            setUser(userData);

          } else {
            logout();
          }
        } catch (error) {
          console.error("AuthContext: Falha ao verificar token. Fazendo logout.", error.message);
          logout();
        }
      }
      
      setLoading(false);
    };

    verifyInitialAuth();
  }, [logout]); // Dependência estável, roda apenas uma vez.

  // Função de login
  const login = (token, apiUserData) => {
    if (!token || !apiUserData) return;
    
    localStorage.setItem('token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Também garantimos que o objeto 'user' criado no login tenha a propriedade 'id'
    const appUserData = {
        id: apiUserData.userId,
        username: apiUserData.username,
        tipo_usuario: apiUserData.tipo_usuario,
        nome_completo: apiUserData.nome_completo
    };
    setUser(appUserData);

    console.log('AuthContext: Usuário logado com sucesso:', appUserData);
    navigate('/');
  };

  const contextValue = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
