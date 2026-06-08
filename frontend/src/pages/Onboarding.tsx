import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Building2, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../api/client';

const Field = ({ label, name, type = 'text', value, onChange, required = false, placeholder = '' }: any) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input
      name={name} type={type} value={value} onChange={onChange}
      required={required} placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />
  </div>
);

const INITIAL = {
  name: '', email: '', phone: '', address: '', gstin: '',
  adminEmail: '', adminPassword: '',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/organizations/onboard', form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to onboard organization');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Organization Created!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your organization has been onboarded. Log in with your admin credentials.
        </p>
        <button onClick={() => navigate('/login')}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
          Go to Login <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <IndianRupee className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Onboard Your Organization</h1>
          <p className="text-gray-500 mt-1 text-sm">Set up SalaryPay for your company</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <h2 className="font-semibold text-gray-900">Organization Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Company Name" name="name" value={form.name} onChange={handleChange} required placeholder="Acme Corp Pvt. Ltd." />
              </div>
              <Field label="Company Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="admin@company.com" />
              <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91-9876543210" />
              <div className="col-span-2">
                <Field label="Address" name="address" value={form.address} onChange={handleChange} placeholder="123 Business Park, Jaipur" />
              </div>
              <Field label="GSTIN" name="gstin" value={form.gstin} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Super Admin Account</h2>
            <p className="text-xs text-gray-500 mb-4">This will be the primary admin login for your organization.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Admin Email" name="adminEmail" type="email" value={form.adminEmail} onChange={handleChange} required placeholder="you@company.com" />
              </div>
              <div className="col-span-2">
                <Field label="Admin Password" name="adminPassword" type="password" value={form.adminPassword} onChange={handleChange} required placeholder="Min 8 characters" />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? 'Creating organization…' : <>Create Organization <ArrowRight className="w-4 h-4" /></>}
          </button>

          <p className="text-center text-xs text-gray-400">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-indigo-600 hover:underline">
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
