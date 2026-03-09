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
    console.log('API Base URL:', baseURL);
    console.log('Token enviado:', token);
    console.log('Requisição para:', config.url);
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
      if (error.response.status === 401) {
        console.log('Erro 401 detectado, redirecionando para /login');
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (error.response.status === 404) {
        console.log('Erro 404 detectado:', error.response.config.url);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

