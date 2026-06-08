import api from './client';
export const login = (email: string, password: string) => api.post('/auth/login', { email, password }).then(r => r.data);
export const changePassword = (oldPassword: string, newPassword: string) => api.post('/auth/change-password', { oldPassword, newPassword }).then(r => r.data);
