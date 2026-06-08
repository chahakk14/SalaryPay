import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getEmployees } from '../api/employees';
import { getSalaryRuns, getPaymentHistory } from '../api/payroll';
import { getMyPayslips } from '../api/payslips';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import {
  Users, IndianRupee, CheckCircle, XCircle,
  FileText, Clock, TrendingUp, Banknote,
} from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const { user, isRole } = useAuthStore();
  const isEmployee = isRole('EMPLOYEE');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'], queryFn: getEmployees, enabled: !isEmployee,
  });
  const { data: runs = [] } = useQuery({
    queryKey: ['salary-runs'], queryFn: getSalaryRuns, enabled: !isEmployee,
  });
  const { data: payments = [] } = useQuery({
    queryKey: ['payments'], queryFn: getPaymentHistory, enabled: !isEmployee,
  });
  const { data: myPayslips = [] } = useQuery({
    queryKey: ['my-payslips', user?.employeeId],
    queryFn: () => getMyPayslips(user!.employeeId!),
    enabled: isEmployee && !!user?.employeeId,
  });

  if (isEmployee) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">{user?.email} · {user?.organizationName}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <StatCard label="Total Payslips" value={myPayslips.length} icon={FileText} color="indigo" />
          <StatCard
            label="Latest Salary Month"
            value={myPayslips[0] ? `${MONTHS[myPayslips[0].month - 1]} ${myPayslips[0].year}` : '—'}
            icon={Clock} color="green"
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Payslips</h2>
          {myPayslips.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No payslips generated yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myPayslips.slice(0, 8).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-sm font-medium">{MONTHS[p.month - 1]} {p.year}</span>
                  </div>
                  <Badge label="Generated" variant="success" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const successPayments = payments.filter((p: any) => p.status === 'SUCCESS');
  const failedPayments = payments.filter((p: any) => p.status === 'FAILED');
  const totalDisbursed = successPayments.reduce((s: number, p: any) => s + Number(p.netSalary), 0);
  const activeRuns = runs.filter((r: any) => r.status === 'PROCESSING' || r.status === 'APPROVED');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{user?.organizationName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total Disbursed</p>
          <p className="text-xl font-bold text-indigo-600">₹{totalDisbursed.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Employees" value={employees.length} icon={Users} color="indigo" />
        <StatCard label="Salary Runs" value={runs.length} icon={IndianRupee} color="amber" />
        <StatCard label="Successful Payments" value={successPayments.length} icon={CheckCircle} color="green" />
        <StatCard label="Failed Payments" value={failedPayments.length} icon={XCircle} color="red" />
      </div>

      {activeRuns.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {activeRuns.length} salary run{activeRuns.length > 1 ? 's' : ''} in progress
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {activeRuns.map((r: any) => `${MONTHS[r.month - 1]} ${r.year}`).join(', ')} — check Payroll for details
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Salary Runs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Salary Runs</h2>
          {runs.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <IndianRupee className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No salary runs yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {runs.slice(0, 5).map((run: any) => (
                <div key={run.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{MONTHS[run.month - 1]} {run.year}</p>
                    <p className="text-xs text-gray-400">{run._count?.payments ?? 0} employees</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      ₹{Number(run.totalAmount).toLocaleString('en-IN')}
                    </span>
                    <Badge label={run.status} variant={run.status.toLowerCase()} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Payments</h2>
          {payments.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Banknote className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No payments processed yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                      {p.employee?.firstName?.[0]}{p.employee?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.employee?.firstName} {p.employee?.lastName}</p>
                      <p className="text-xs text-gray-400">
                        {MONTHS[(p.salaryRun?.month || 1) - 1]} {p.salaryRun?.year}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹{Number(p.netSalary).toLocaleString('en-IN')}</p>
                    <Badge label={p.status} variant={p.status.toLowerCase()} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
