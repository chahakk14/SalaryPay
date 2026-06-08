import api from './client';
export const login = (email: string, password: string) => api.post('/auth/login', { email, password }).then(r => r.data);
export const changePassword = (oldPassword: string, newPassword: string) => api.post('/auth/change-password', { oldPassword, newPassword }).then(r => r.data);
export const requestPasswordReset = (email: string) => api.post('/auth/request-password-reset', { email }).then(r => r.data);
export const resetPassword = (email: string, otp: string, newPassword: string) =>
	api.post('/auth/reset-password', { email, otp, newPassword }).then(r => r.data);
