import API from './api';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const response = await API.post('/auth/register', { email, password, name });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await API.post('/auth/login', { email, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getProfile: async (): Promise<User> => {
    const response = await API.get('/user/profile');
    return response.data;
  }
};
