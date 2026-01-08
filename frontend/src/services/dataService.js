import api from './api';

const createCrudService = (endpoint) => ({
  getAll: async (params = {}) => {
    const response = await api.get(`/${endpoint}`, { params });
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/${endpoint}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(`/${endpoint}`, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/${endpoint}/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/${endpoint}/${id}`);
    return response.data;
  },
});

export const studentService = {
  ...createCrudService('students'),
  create: async (data, config = {}) => {
    const isFormData = data instanceof FormData;
    const response = await api.post('/students', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : config);
    return response.data;
  },
  update: async (id, data, config = {}) => {
    const isFormData = data instanceof FormData;
    const response = isFormData 
      ? await api.post(`/students/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      : await api.put(`/students/${id}`, data, config);
    return response.data;
  },
  import: async (formData) => {
    const response = await api.post('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
export const classService = createCrudService('classes');
export const categoryService = createCrudService('categories');
export const userService = {
  ...createCrudService('users'),
  create: async (data, config = {}) => {
    const isFormData = data instanceof FormData;
    const response = await api.post('/users', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : config);
    return response.data;
  },
  update: async (id, data, config = {}) => {
    const isFormData = data instanceof FormData;
    // For FormData, use POST with _method=PUT (Laravel method spoofing)
    const response = isFormData 
      ? await api.post(`/users/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      : await api.put(`/users/${id}`, data, config);
    return response.data;
  },
};
export const teacherService = {
  ...createCrudService('teachers'),
  create: async (data, config = {}) => {
    const isFormData = data instanceof FormData;
    const response = await api.post('/teachers', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : config);
    return response.data;
  },
  update: async (id, data, config = {}) => {
    const isFormData = data instanceof FormData;
    const response = isFormData 
      ? await api.post(`/teachers/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      : await api.put(`/teachers/${id}`, data, config);
    return response.data;
  },
};
export const parentService = {
  ...createCrudService('parents'),
  create: async (data, config = {}) => {
    const isFormData = data instanceof FormData;
    const response = await api.post('/parents', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : config);
    return response.data;
  },
  update: async (id, data, config = {}) => {
    const isFormData = data instanceof FormData;
    const response = isFormData 
      ? await api.post(`/parents/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      : await api.put(`/parents/${id}`, data, config);
    return response.data;
  },
};
export const deviceService = createCrudService('devices');
export const locationService = createCrudService('locations');

export const attendanceService = {
  getStudentLogs: async (params = {}) => {
    const response = await api.get('/attendance/students', { params });
    return response.data;
  },

  getTeacherLogs: async (params = {}) => {
    const response = await api.get('/attendance/teachers', { params });
    return response.data;
  },

  getLiveMonitor: async () => {
    const response = await api.get('/attendance/live');
    return response.data;
  },

  manualTap: async (rfid_uid, device_id) => {
    const response = await api.post('/tap/manual', { rfid_uid, device_id });
    return response.data;
  },
};

export const settingService = {
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  update: async (settings) => {
    const response = await api.post('/settings', { settings });
    return response.data;
  },

  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const notificationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/notifications/statistics');
    return response.data;
  },
};
