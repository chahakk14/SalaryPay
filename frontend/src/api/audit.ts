import api from './client';
export const getAuditLogs = (params?: any) => api.get('/audit', { params }).then(r => r.data);
