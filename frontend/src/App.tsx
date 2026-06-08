import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import AddEmployee from './pages/AddEmployee';
import Payroll from './pages/Payroll';
import Payments from './pages/Payments';
import Payslips from './pages/Payslips';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuthStore();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/onboarding" element={user ? <Navigate to="/" /> : <Onboarding />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/employees" element={
          <ProtectedRoute roles={['SUPER_ADMIN','HR_MANAGER','FINANCE_TEAM']}><Employees /></ProtectedRoute>
        } />
        <Route path="/employees/new" element={
          <ProtectedRoute roles={['SUPER_ADMIN','HR_MANAGER']}><AddEmployee /></ProtectedRoute>
        } />
        <Route path="/employees/:id" element={
          <ProtectedRoute roles={['SUPER_ADMIN','HR_MANAGER','FINANCE_TEAM']}><EmployeeDetail /></ProtectedRoute>
        } />

        <Route path="/payroll" element={
          <ProtectedRoute roles={['SUPER_ADMIN','FINANCE_TEAM']}><Payroll /></ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute roles={['SUPER_ADMIN','FINANCE_TEAM']}><Payments /></ProtectedRoute>
        } />
        <Route path="/payslips" element={
          <ProtectedRoute roles={['SUPER_ADMIN','HR_MANAGER','FINANCE_TEAM']}><Payslips /></ProtectedRoute>
        } />
        <Route path="/my-payslips" element={
          <ProtectedRoute roles={['EMPLOYEE']}><Payslips /></ProtectedRoute>
        } />
        <Route path="/audit" element={
          <ProtectedRoute roles={['SUPER_ADMIN']}><AuditLogs /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
