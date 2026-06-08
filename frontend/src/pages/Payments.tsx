import { useQuery } from '@tanstack/react-query';
import { getPaymentHistory } from '../api/payroll';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import { SalaryPayment } from '../types';
import { CheckCircle, XCircle, Clock, RefreshCw, IndianRupee } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Payments() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'], queryFn: getPaymentHistory,
  });

  const success = payments.filter((p: SalaryPayment) => p.status === 'SUCCESS');
  const failed = payments.filter((p: SalaryPayment) => p.status === 'FAILED');
  const pending = payments.filter((p: SalaryPayment) => p.status === 'PENDING' || p.status === 'PROCESSING');
  const retrying = payments.filter((p: SalaryPayment) => p.status === 'RETRYING');
  const totalDisbursed = success.reduce((s: number, p: SalaryPayment) => s + Number(p.netSalary), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Disbursed" value={`₹${totalDisbursed.toLocaleString('en-IN')}`} icon={IndianRupee} color="indigo" />
        <StatCard label="Successful" value={success.length} icon={CheckCircle} color="green" />
        <StatCard label="Failed" value={failed.length} icon={XCircle} color="red" />
        <StatCard label="Pending / Retrying" value={pending.length + retrying.length} icon={RefreshCw} color="amber" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Payments</h2>
          <span className="text-xs text-gray-400">{payments.length} records</span>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading payments…</div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <IndianRupee className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No payments yet. Execute a salary run first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Period', 'Gross', 'Deductions', 'Net Salary', 'Status', 'Payout ID', 'Retries', 'Processed'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p: SalaryPayment) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-semibold text-indigo-600 flex-shrink-0">
                          {p.employee?.firstName?.[0]}{p.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.employee?.firstName} {p.employee?.lastName}</p>
                          <p className="text-xs text-gray-400">{p.employee?.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {p.salaryRun ? `${MONTHS[p.salaryRun.month - 1]} ${p.salaryRun.year}` : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">₹{Number(p.grossSalary).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-red-500 whitespace-nowrap">-₹{Number(p.totalDeductions).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">₹{Number(p.netSalary).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <div>
                        <Badge label={p.status} variant={p.status.toLowerCase()} />
                        {p.failureReason && (
                          <p className="text-xs text-red-400 mt-1 max-w-[160px] truncate" title={p.failureReason}>
                            {p.failureReason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400">
                        {p.razorpayPayoutId ? p.razorpayPayoutId.slice(0, 20) + '…' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.retryCount > 0 ? (
                        <span className="text-xs font-medium text-orange-500">{p.retryCount}x</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {p.processedAt ? new Date(p.processedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
