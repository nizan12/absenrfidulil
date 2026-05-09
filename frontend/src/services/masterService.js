import api from './api';

export const masterService = {
    getStatistics: async () => {
        const response = await api.get('/master/statistics');
        return response.data;
    },

    getErrors: async (params = {}) => {
        const response = await api.get('/master/errors', { params });
        return response.data;
    },

    clearErrors: async () => {
        const response = await api.post('/master/errors/clear');
        return response.data;
    },

    createBackup: async () => {
        const response = await api.post('/master/backup');
        return response.data;
    },

    getBackups: async () => {
        const response = await api.get('/master/backups');
        return response.data;
    },

    downloadBackup: async (filename) => {
        const token = localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${baseUrl}/master/backups/${filename}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    deleteBackup: async (filename) => {
        const response = await api.delete(`/master/backups/${filename}`);
        return response.data;
    },

    getBackupSettings: async () => {
        const response = await api.get('/master/backup-settings');
        return response.data;
    },

    updateBackupSettings: async (data) => {
        const response = await api.post('/master/backup-settings', data);
        return response.data;
    },
};

export default masterService;
