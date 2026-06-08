import api from './client';

export const getSalaryRuns = () => api.get('/payroll/runs').then(r => r.data);
export const getSalaryRun = (id: string) => api.get(`/payroll/runs/${id}`).then(r => r.data);
export const createSalaryRun = (month: number, year: number) =>
  api.post('/payroll/runs', { month, year }).then(r => r.data);
export const approveSalaryRun = (id: string) =>
  api.post(`/payroll/runs/${id}/approve`).then(r => r.data);
export const executeSalaryRun = (id: string) =>
  api.post(`/payroll/runs/${id}/execute`).then(r => r.data);
export const retryPendingPayments = (id: string) =>
  api.post(`/payroll/runs/${id}/retry-pending`).then(r => r.data);
export const getPaymentHistory = () => api.get('/payroll/history').then(r => r.data);
export const createPayrollOrder = (id: string) =>
  api.post(`/payroll/runs/${id}/create-order`).then(r => r.data);
export const verifyPayrollPayment = (id: string, data: any) =>
  api.post(`/payroll/runs/${id}/verify-payment`, data).then(r => r.data);
export const getTestCards = () => api.get('/payroll/test-cards').then(r => r.data);
