import api from './api';

export const publicService = {
  searchStudents: async (query) => {
    const response = await api.get('/public/search', { params: { q: query } });
    return response.data;
  },

  getStudentLog: async (studentId, params = {}) => {
    const response = await api.get(`/public/student/${studentId}`, { params });
    return response.data;
  },

  getLiveFeed: async () => {
    const response = await api.get('/public/live');
    return response.data;
  },
};

export default publicService;
