import axios from 'axios';

export const initializeAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
        } catch (error) {
        localStorage  .removeItem('token');
        throw error;
        }
    }
    return null;
};