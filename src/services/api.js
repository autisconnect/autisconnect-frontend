// src/services/api.js

import axios from 'axios';

// 1. Pega a URL da API das variáveis de ambiente que configuramos.
//    Em desenvolvimento, ele pode usar um valor padrão.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 2. Cria uma instância "pré-configurada" do Axios.
const apiClient = axios.create({
    baseURL: `${API_URL}/api`, // Todas as requisições usarão esta base. Ex: /login, /signup
} );

// 3. Adiciona um "interceptor" que vai automaticamente incluir o token de autenticação
//    em todas as requisições, exceto no login e signup.
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
