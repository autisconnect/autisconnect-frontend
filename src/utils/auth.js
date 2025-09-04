import axios from 'axios';

const login = async (username, password) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/login`, // Use a variável de ambiente
      {
        username,
        password,
      }
    );
    const token = response.data.token;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return token;
  } catch (error) {
  console.error('Erro ao fazer login:', error.message, error.response?.data);
  throw new Error(`Erro ao fazer login: ${error.response?.data?.error || error.message}`);
}
};

const getToken = () => {
  return localStorage.getItem('token');
};

const setToken = (token) => {
  localStorage.setItem('token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

{/* const initializeAuth = async () => {
  let token = getToken();
  if (!token) {
    token = await login('admin', 'admin123'); // Credenciais padrão apenas para inicialização
  } else {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}; */}

export { login, getToken, setToken, initializeAuth };