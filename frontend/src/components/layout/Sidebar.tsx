import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, Users, IndianRupee, FileText,
  Shield, LogOut, ChevronRight, Banknote, UserCircle,
} from 'lucide-react';

const ROLE_NAV: Record<string, { label: string; icon: any; to: string }[]> = {
  SUPER_ADMIN: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    { label: 'Employees', icon: Users, to: '/employees' },
    { label: 'Salary Runs', icon: IndianRupee, to: '/payroll' },
    { label: 'Payment History', icon: Banknote, to: '/payments' },
    { label: 'Payslips', icon: FileText, to: '/payslips' },
    { label: 'Audit Logs', icon: Shield, to: '/audit' },
  ],
  HR_MANAGER: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    { label: 'Employees', icon: Users, to: '/employees' },
    { label: 'Payslips', icon: FileText, to: '/payslips' },
  ],
  FINANCE_TEAM: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    { label: 'Employees', icon: Users, to: '/employees' },
    { label: 'Salary Runs', icon: IndianRupee, to: '/payroll' },
    { label: 'Payment History', icon: Banknote, to: '/payments' },
    { label: 'Payslips', icon: FileText, to: '/payslips' },
  ],
  EMPLOYEE: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    { label: 'My Payslips', icon: FileText, to: '/my-payslips' },
  ],
};

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  HR_MANAGER: 'bg-blue-100 text-blue-700',
  FINANCE_TEAM: 'bg-green-100 text-green-700',
  EMPLOYEE: 'bg-gray-100 text-gray-600',
};

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  HR_MANAGER: 'HR Manager',
  FINANCE_TEAM: 'Finance Team',
  EMPLOYEE: 'Employee',
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const nav = ROLE_NAV[user?.role || 'EMPLOYEE'] || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">SalaryPay</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 truncate">{user?.organizationName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, icon: Icon, to }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-0.5">
        <Link to="/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            pathname === '/profile' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
          }`}>
          <UserCircle className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium">{user?.email}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[user?.role || 'EMPLOYEE']}`}>
              {ROLE_LABEL[user?.role || 'EMPLOYEE']}
            </span>
          </div>
        </Link>
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
