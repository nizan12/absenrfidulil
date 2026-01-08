import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },

  me: async () => {
    const response = await api.get('/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const isFormData = data instanceof FormData;
    const response = await api.post('/profile', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
    return response.data;
  },

  updateTheme: async (theme) => {
    const response = await api.post('/theme', { theme });
    return response.data;
  },
};

export default authService;
