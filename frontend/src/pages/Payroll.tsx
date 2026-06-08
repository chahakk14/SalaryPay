import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSalaryRuns, createSalaryRun, approveSalaryRun,
  executeSalaryRun, retryPendingPayments, createPayrollOrder, verifyPayrollPayment,
} from '../api/payroll';
import { generatePayslips } from '../api/payslips';
import { useAuthStore } from '../store/authStore';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Toast from '../components/ui/Toast';
import {
  Plus, Play, CheckCheck, FileText, CreditCard,
  Info, Loader2, X, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import { SalaryRun } from '../types';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STATUS_FLOW = ['DRAFT', 'APPROVED', 'PROCESSING', 'COMPLETED'];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function TestCardsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Test Card Numbers</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-800 mb-1">✓ Success Card</p>
            <p className="font-mono text-green-700">5267 3181 8797 5449</p>
            <p className="text-green-600 text-xs mt-1">CVV: any 3 digits · Expiry: any future date</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="font-medium text-red-800 mb-1">✗ Failure Card</p>
            <p className="font-mono text-red-700">4012 8888 8888 1881</p>
            <p className="text-red-600 text-xs mt-1">CVV: any 3 digits · Expiry: any future date</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-medium text-blue-800 mb-1">UPI (success)</p>
            <p className="font-mono text-blue-700">success@razorpay</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="font-medium text-gray-700 mb-1">Net Banking</p>
            <p className="text-gray-600 text-xs">Select any bank · use any credentials · select success or failure in test mode</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">No real money is charged in test mode</p>
      </div>
    </div>
  );
}

function RazorpayButton({ run, onSuccess }: { run: SalaryRun; onSuccess: () => void }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFundPayroll = async () => {
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      const order = await createPayrollOrder(run.id);

      // Demo mode — Razorpay keys not configured
      if (order._demo || !scriptLoaded) {
        await verifyPayrollPayment(run.id, {
          razorpay_order_id: order.id,
          razorpay_payment_id: `demo_pay_${Date.now()}`,
          razorpay_signature: 'demo_signature',
          demo: true,
        });
        showToast('success', 'Demo payment accepted — payroll approved!');
        onSuccess();
        setLoading(false);
        return;
      }

      const keyId = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '';

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SalaryPay',
        description: `Payroll Funding — ${MONTHS[run.month - 1]} ${run.year}`,
        image: '',
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await verifyPayrollPayment(run.id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast('success', 'Payment verified — payroll approved!');
            onSuccess();
          } catch {
            showToast('error', 'Payment verification failed. Contact support.');
          }
        },
        prefill: { name: user?.organizationName || 'Admin', email: user?.email || '' },
        notes: { salary_run_id: run.id },
        theme: { color: '#4f46e5' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        showToast('error', `Payment failed: ${resp.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Could not initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      {toast && (
        <div className={`absolute bottom-full mb-2 right-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-3.5 h-3.5" />
            : <AlertCircle className="w-3.5 h-3.5" />}
          {toast.msg}
        </div>
      )}
      <button
        onClick={handleFundPayroll}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <CreditCard className="w-3 h-3" />}
        {loading ? 'Processing…' : 'Fund & Approve'}
      </button>
    </div>
  );
}

export default function Payroll() {
  const { isRole } = useAuthStore();
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [showTestCards, setShowTestCards] = useState(false);
  const [confirmExecuteRun, setConfirmExecuteRun] = useState<SalaryRun | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['salary-runs'],
    queryFn: getSalaryRuns,
  });

  const createMutation = useMutation({
    mutationFn: () => createSalaryRun(month, year),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-runs'] }); setCreateModal(false); },
  });
  const approveMutation = useMutation({
    mutationFn: approveSalaryRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary-runs'] }),
  });
  const executeMutation = useMutation({
    mutationFn: executeSalaryRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary-runs'] }),
  });
  const retryPendingMutation = useMutation({
    mutationFn: retryPendingPayments,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['salary-runs'] });
      setToast({ type: 'success', msg: `Retry queued for ${data?.retried ?? '0'} pending payment(s)` });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (err: any) => {
      setToast({ type: 'error', msg: err?.response?.data?.message || err?.message || 'Retry failed' });
      setTimeout(() => setToast(null), 4000);
    },
  });
  const genPayslipsMutation = useMutation({ mutationFn: generatePayslips });

  const refreshRuns = () => qc.invalidateQueries({ queryKey: ['salary-runs'] });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Salary Runs</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTestCards(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50"
          >
            <Info className="w-3.5 h-3.5" /> Test Cards
          </button>
          {isRole('SUPER_ADMIN', 'FINANCE_TEAM') && (
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> New Salary Run
            </button>
          )}
        </div>
      </div>

      {/* Razorpay integration info banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5 flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-indigo-900">Razorpay Integration Active</p>
          <p className="text-xs text-indigo-600 mt-0.5">
            Use <strong>Fund & Approve</strong> to simulate payroll funding via Razorpay checkout.
            Test mode — no real money charged. Click <strong>Test Cards</strong> above for card numbers.
          </p>
        </div>
      </div>

      {/* Workflow steps */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { step: '1', label: 'Create Run', desc: 'Calculate all salaries' },
          { step: '2', label: 'Fund & Approve', desc: 'Pay via Razorpay' },
          { step: '3', label: 'Execute', desc: 'Disburse to employees' },
          { step: '4', label: 'Generate Payslips', desc: 'Send to employees' },
        ].map(s => (
          <div key={s.step} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center mx-auto mb-2">
              {s.step}
            </div>
            <p className="text-xs font-medium text-gray-800">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : runs.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <p>No salary runs yet.</p>
            <p className="text-xs mt-1">Create your first salary run to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Period', 'Employees', 'Total Amount', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {runs.map((run: SalaryRun) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{MONTHS[run.month - 1]} {run.year}</td>
                  <td className="px-4 py-3 text-gray-500">{run._count?.payments ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    ₹{Number(run.totalAmount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={run.status} variant={run.status.toLowerCase()} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(run.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">

                      {/* Step 2: Fund via Razorpay (DRAFT state) */}
                      {run.status === 'DRAFT' && isRole('SUPER_ADMIN', 'FINANCE_TEAM') && (
                        <RazorpayButton run={run} onSuccess={refreshRuns} />
                      )}

                      {/* Step 2 alt: Manual approve without payment */}
                      {run.status === 'DRAFT' && isRole('SUPER_ADMIN', 'FINANCE_TEAM') && (
                        <button
                          onClick={() => approveMutation.mutate(run.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs hover:bg-green-100"
                        >
                          <CheckCheck className="w-3 h-3" /> Approve
                        </button>
                      )}

                      {/* Step 3: Execute salary disbursement */}
                      {run.status === 'APPROVED' && isRole('SUPER_ADMIN') && (
                        <button
                          onClick={() => setConfirmExecuteRun(run)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs hover:bg-indigo-100"
                        >
                          <Play className="w-3 h-3" /> Execute
                        </button>
                      )}

                      {run.status === 'PROCESSING' && isRole('SUPER_ADMIN', 'FINANCE_TEAM') && (
                        <button
                          onClick={() => retryPendingMutation.mutate(run.id)}
                          disabled={retryPendingMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs hover:bg-amber-100 disabled:opacity-60"
                        >
                          <RefreshCw className="w-3 h-3" /> Retry Pending
                        </button>
                      )}

                      {/* Step 4: Generate payslips */}
                      {(run.status === 'PROCESSING' || run.status === 'COMPLETED') &&
                        isRole('SUPER_ADMIN', 'FINANCE_TEAM') && (
                          <button
                            onClick={() => genPayslipsMutation.mutate(run.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs hover:bg-blue-100"
                          >
                            <FileText className="w-3 h-3" /> Payslips
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create run modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-900 mb-4">Create Salary Run</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                <select
                  value={month}
                  onChange={e => setMonth(+e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(+e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              This will calculate salaries for all active employees based on their salary structures.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Run
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestCards && <TestCardsModal onClose={() => setShowTestCards(false)} />}

      {toast && (
        <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />
      )}

      <ConfirmDialog
        open={!!confirmExecuteRun}
        title="Execute Payroll"
        description={
          confirmExecuteRun
            ? `Execute payroll for ${MONTHS[confirmExecuteRun.month - 1]} ${confirmExecuteRun.year}?\n\nThis will disburse ₹${Number(confirmExecuteRun.totalAmount).toLocaleString()} to all employees.`
            : ''
        }
        confirmText="Execute payroll"
        cancelText="Cancel"
        onConfirm={() => {
          if (confirmExecuteRun) {
            executeMutation.mutate(confirmExecuteRun.id);
            setConfirmExecuteRun(null);
          }
        }}
        onCancel={() => setConfirmExecuteRun(null)}
      />
    </div>
  );
}
