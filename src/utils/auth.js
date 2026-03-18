import apiClient from '../services/api';

const login = async (username, password) => {
  try {
    const response = await apiClient.post('/login', {
      username,
      password,
    });
    const token = response.data.token;
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    console.error('Erro ao fazer login:', error.response?.data, error.message);
    throw error;
  }
};

const getToken = () => {
  return localStorage.getItem('token');
};

const setToken = (token) => {
  localStorage.setItem('token', token);
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
};

const initializeAuth = async () => {
  const token = getToken();
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
  return token;
};

export { login, getToken, setToken, initializeAuth };
