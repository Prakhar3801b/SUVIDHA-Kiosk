import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

export default api;
