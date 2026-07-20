import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api', // ← Cambia según tu backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// INTERCEPTOR PARA ENVIAR TOKEN AUTOMÁTICAMENTE
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

// INTERCEPTOR PARA MANEJAR ERRORES 401/403
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.error("Token inválido o expirado");
            // localStorage.removeItem('token');   // ← Comenta esta línea temporalmente
            // alert("Sesión expirada...");
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
export default api;