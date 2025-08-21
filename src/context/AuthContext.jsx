import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Verificar token ao iniciar
    useEffect(() => {
        const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
            // Verificar validade do token no backend
            const response = await axios.get('http://localhost:5000/api/auth/verify', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Se o token for válido, definir o usuário
            if (response.data.valid) {
                setUser({
                id: response.data.userId,
                username: response.data.username,
                tipo_usuario: response.data.tipo_usuario,
                token
                });
            } else {
                // Se o token for inválido, limpar localStorage
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

    // Função de login
    const login = (userData) => {
        // Garantir que temos todos os dados necessários
        if (!userData || !userData.id || !userData.token || !userData.tipo_usuario) {
        console.error('Dados de usuário incompletos para login');
        return false;
        }
        
        // Definir usuário no contexto
        setUser(userData);
        return true;
    };

    // Função de logout
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Verificar se o usuário está autenticado
    const isAuthenticated = () => {
        return !!user;
    };

    // Verificar se o usuário tem permissão para acessar um recurso específico
    const hasPermission = (requiredType, resourceId = null) => {
        if (!user) return false;
        
        // Verificar tipo de usuário
        const hasType = user.tipo_usuario === requiredType;
        
        // Se não precisar verificar ID do recurso, apenas verificar tipo
        if (!resourceId) return hasType;
        
        // Verificar se o ID do recurso corresponde ao ID do usuário
        return hasType && user.id === resourceId;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasPermission, loading }}>
        {children}
        </AuthContext.Provider>
    );
};
