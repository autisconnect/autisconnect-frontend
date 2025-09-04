import axios from 'axios';

// A URL base será definida pela variável de ambiente em produção
// ou apontará para o seu servidor local em desenvolvimento.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
} );

// Este interceptor está perfeito e não precisa de mudanças.
// Ele adiciona o token de autorização a cada requisição.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;