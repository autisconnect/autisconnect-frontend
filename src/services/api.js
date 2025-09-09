import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Base URL:', import.meta.env.VITE_API_URL); // Depuração
    console.log('Token enviado:', token); // Depuração
    console.log('Requisição para:', config.url); // Depuração
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('Erro de conexão com a API:', error.message);
    } else {
      console.error('Erro na requisição:', error.response.status, error.response.data);
      if (error.response.status === 401) { // Apenas 401 remove o token
        console.log('Erro 401 detectado, redirecionando para /login');
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (error.response.status === 404) {
        console.log('Erro 404 detectado:', error.response.config.url);
        // Não remove o token para permitir depuração
      }
    }
    return Promise.reject(error);
  }
);

export default api;