import axios from 'axios';

const login = async () => {
    try {
        const response = await axios.post('http://localhost:5000/login', {
            username: 'admin',
            password: 'admin123',
        });
        const token = response.data.token;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return token;
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
    }
};

const getToken = () => {
    return localStorage.getItem('token');
};

const setToken = (token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const initializeAuth = async () => {
    let token = getToken();
    if (!token) {
        token = await login();
    } else {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
};

export { login, getToken, setToken, initializeAuth };