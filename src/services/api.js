import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const baseURL = isLocalHost
  ? 'http://localhost:5000/api'
  : (configuredApiUrl && configuredApiUrl.length > 0
      ? configuredApiUrl
      : 'https://autisconnect.onrender.com/api');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      const status = error.response.status;
      const url = error.response.config?.url || '';
      const isSilent404 = status === 404 && (url.includes('/patient-progress') || url.includes('/appointment-types'));

      if (!isSilent404) {
        console.error('Erro na requisição:', status, error.response.data);
      }

      if (status === 401) {
        console.log('Erro 401 detectado, redirecionando para /login');
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (status === 404 && !isSilent404) {
        console.log('Erro 404 detectado:', url);
      }
    }
    return Promise.reject(error);
  }
);

export default api;



