// src/context/AuthContext.jsx (VERSÃO FINAL CORRIGIDA)

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Começa como true para indicar que a verificação inicial está pendente
  const navigate = useNavigate();

  // Função de logout centralizada
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    apiClient.defaults.headers.common['Authorization'] = null; // Limpa o header do apiClient
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // useEffect para verificação inicial de autenticação
  // Este useEffect roda APENAS UMA VEZ, quando o AuthProvider é montado.
  useEffect(() => {
    const verifyInitialAuth = async () => {
      const token = localStorage.getItem('token');
      
      console.log("AuthContext: Verificando autenticação inicial...");

      if (token) {
        // Se um token existe, configura o apiClient para usá-lo em todas as requisições futuras
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // Tenta verificar a validade do token com o backend
          const response = await apiClient.get('/auth/verify');
          if (response.data && response.data.valid) {
            // Se o token for válido, define o estado do usuário
            console.log("AuthContext: Token válido. Usuário definido:", response.data);
            setUser(response.data);
          } else {
            // Se a resposta indicar que não é válido (caso raro)
            logout();
          }
        } catch (error) {
          // Se a verificação falhar (ex: token expirado, erro de rede), faz o logout
          console.error("AuthContext: Falha ao verificar token. Fazendo logout.", error.message);
          logout();
        }
      }
      
      // Marca a verificação inicial como concluída
      setLoading(false);
    };

    verifyInitialAuth();
  }, [logout]); // Depende de 'logout', que é estável devido ao useCallback

  // Função de login
  const login = (token, userData) => {
    if (!token || !userData) {
      console.error('Dados de token ou usuário ausentes para login');
      return;
    }
    // 1. Salva o token no localStorage
    localStorage.setItem('token', token);
    // 2. Configura o apiClient para usar o novo token
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // 3. Atualiza o estado do usuário na aplicação
    setUser(userData);
    console.log('AuthContext: Usuário logado com sucesso:', userData);
    
    // 4. Redireciona para a página inicial, que cuidará do redirecionamento para o dashboard correto
    navigate('/');
  };

  // O valor fornecido pelo contexto
  const contextValue = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user, // Converte o objeto 'user' para um booleano
  };

  // Não renderiza nada até que a verificação inicial esteja completa
  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
