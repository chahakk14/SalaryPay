import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { login } from '../api/auth';
import { IndianRupee, Loader2, CreditCard } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'superadmin@acmecorp.com', label: 'Super Admin', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { email: 'hr@acmecorp.com', label: 'HR Manager', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { email: 'finance@acmecorp.com', label: 'Finance Team', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { email: 'emp@acmecorp.com', label: 'Employee', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await login(email, password);
      setAuth(data.user, data.access_token);
      navigate('/');
    } catch {
      setError('Invalid email or password. Try a demo account below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <IndianRupee className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SalaryPay</h1>
          <p className="text-gray-500 mt-1 text-sm">Salary Automation Platform</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Razorpay badge */}
          <div className="flex items-center justify-center gap-2 bg-indigo-50 rounded-lg px-3 py-2 mb-6">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-indigo-700 font-medium">Powered by Razorpay · Test Mode</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3 font-medium text-center">Quick login — demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(a => (
                <button
                  key={a.email}
                  onClick={() => { setEmail(a.email); setPassword('Password@123'); }}
                  className={`text-xs px-3 py-2 rounded-lg font-medium text-left transition-colors ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          New organization?{' '}
          <Link to="/onboarding" className="text-indigo-600 hover:underline font-medium">
            Onboard here
          </Link>
        </p>
      </div>
    </div>
  );
}
