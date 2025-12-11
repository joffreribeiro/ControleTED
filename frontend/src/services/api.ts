import axios from 'axios';

const API = axios.create({
  baseURL: '/api'
});

// Adicionar token ao header de todas as requisições
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
