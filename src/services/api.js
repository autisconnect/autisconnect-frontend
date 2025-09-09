import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Desativa withCredentials, já que usamos JWT
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Base URL:', import.meta.env.VITE_API_URL); // Depuração
    console.log('Token enviado:', token); // Depuração
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
      if (error.response.status === 401 || error.response.status === 404) {
        console.log('Erro 401/404 detectado, redirecionando para /login');
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;