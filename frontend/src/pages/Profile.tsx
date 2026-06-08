import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { changePassword } from '../api/auth';
import { User, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const ROLE_INFO: Record<string, { label: string; color: string; permissions: string[] }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    color: 'bg-purple-100 text-purple-700',
    permissions: ['Full system access', 'Execute payroll', 'View audit logs', 'Manage all users'],
  },
  HR_MANAGER: {
    label: 'HR Manager',
    color: 'bg-blue-100 text-blue-700',
    permissions: ['Add & manage employees', 'Set salary structures', 'View payslips'],
  },
  FINANCE_TEAM: {
    label: 'Finance Team',
    color: 'bg-green-100 text-green-700',
    permissions: ['Create salary runs', 'Fund via Razorpay', 'Approve payroll', 'Payment history'],
  },
  EMPLOYEE: {
    label: 'Employee',
    color: 'bg-gray-100 text-gray-700',
    permissions: ['View own dashboard', 'Download own payslips'],
  },
};

export default function Profile() {
  const { user, logout } = useAuthStore();
  const role = user?.role || 'EMPLOYEE';
  const roleInfo = ROLE_INFO[role];

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setToast({ type: 'success', msg: 'Password changed successfully!' });
      setOldPassword(''); setNewPassword(''); setConfirm('');
      setTimeout(() => setToast(null), 4000);
    },
    onError: (e: any) => {
      setToast({ type: 'error', msg: e.response?.data?.message || 'Failed to change password' });
      setTimeout(() => setToast(null), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setToast({ type: 'error', msg: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setToast({ type: 'error', msg: 'Password must be at least 8 characters' });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.email}</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Organization</p>
            <p className="font-medium">{user?.organizationName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Organization ID</p>
            <p className="font-mono text-xs text-gray-400">{user?.organizationId?.slice(0, 8)}…</p>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Your Permissions</h2>
        </div>
        <div className="space-y-2">
          {roleInfo.permissions.map(p => (
            <div key={p} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>

        {toast && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: 'Current Password', val: oldPassword, set: setOldPassword },
            { label: 'New Password', val: newPassword, set: setNewPassword },
            { label: 'Confirm New Password', val: confirm, set: setConfirm },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input
                type="password" value={f.val}
                onChange={e => f.set(e.target.value)} required minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          ))}
          <button
            type="submit" disabled={mutation.isPending}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 mt-2"
          >
            {mutation.isPending ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
