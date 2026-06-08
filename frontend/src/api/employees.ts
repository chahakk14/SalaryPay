import api from './client';
export const getEmployees = () => api.get('/employees').then(r => r.data);
export const getEmployee = (id: string) => api.get(`/employees/${id}`).then(r => r.data);
export const createEmployee = (data: any) => api.post('/employees', data).then(r => r.data);
export const updateEmployee = (id: string, data: any) => api.put(`/employees/${id}`, data).then(r => r.data);
export const setAutoPayLimit = (id: string, limit: number) => api.put(`/employees/${id}/auto-pay-limit`, { limit }).then(r => r.data);
export const deactivateEmployee = (id: string) => api.delete(`/employees/${id}`).then(r => r.data);
export const getSalaryStructure = (empId: string) => api.get(`/salary-structure/${empId}`).then(r => r.data);
export const upsertSalaryStructure = (empId: string, data: any) => api.post(`/salary-structure/${empId}`, data).then(r => r.data);
