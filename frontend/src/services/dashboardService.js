import api from './api';

export const dashboardService = {
  getStatistics: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  getTodayAttendance: async () => {
    const response = await api.get('/dashboard/today');
    return response.data;
  },

  getWeeklyAttendance: async () => {
    const response = await api.get('/dashboard/weekly');
    return response.data;
  },

  getRecentLogs: async (limit = 10) => {
    const response = await api.get('/dashboard/recent', { params: { limit } });
    return response.data;
  },
};

export default dashboardService;
