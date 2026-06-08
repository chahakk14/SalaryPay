import api from './client';
export const getPayslips = () => api.get('/payslips').then(r => r.data);
export const getMyPayslips = (employeeId: string) => api.get(`/payslips/employee/${employeeId}`).then(r => r.data);
export const generatePayslips = (runId: string) => api.post(`/payslips/generate/${runId}`).then(r => r.data);
export const downloadPayslip = (payslipId: string) => api.get(`/payslips/download/${payslipId}`, { responseType: 'blob' }).then(r => r.data);
