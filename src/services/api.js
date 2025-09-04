import axios from "axios";

// Cria a instância da API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // necessário se sua API usa cookies
});

// Interceptor de requisição: adiciona o token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta: tratamento global de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Erro de conexão com a API:", error);
    } else {
      console.error("Erro na requisição:", error.response.status, error.response.data);
      // Exemplo: se 401, desloga o usuário
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
