import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmployee, getSalaryStructure, upsertSalaryStructure, setAutoPayLimit } from '../api/employees';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';
import Badge from '../components/ui/Badge';
import { ArrowLeft, Save, IndianRupee } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
  </div>
);

const NumInput = ({ label, value, onChange, readOnly = false }: any) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} readOnly={readOnly}
        className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${readOnly ? 'bg-gray-50 text-gray-500' : 'border-gray-300'}`} />
    </div>
  </div>
);

const defaultSalary = { basicSalary: 0, hra: 0, da: 0, ta: 0, medicalAllow: 0, otherAllow: 0, pfDeduction: 0, esiDeduction: 0, tdsDeduction: 0, otherDeduct: 0 };

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isRole } = useAuthStore();
  const qc = useQueryClient();

  const { data: employee, isLoading } = useQuery({ queryKey: ['employee', id], queryFn: () => getEmployee(id!) });
  const { data: salaryStruct } = useQuery({ queryKey: ['salary', id], queryFn: () => getSalaryStructure(id!) });

  const [form, setForm] = useState(defaultSalary);
  const [autoPayLimit, setAutoPayLimitVal] = useState('0');

  useEffect(() => { if (salaryStruct) setForm(salaryStruct); }, [salaryStruct]);
  useEffect(() => { if (employee) setAutoPayLimitVal(String(employee.autoPayLimit)); }, [employee]);

  const gross = Object.entries(form)
    .filter(([k]) => !k.includes('Deduct') && !k.includes('Deduction'))
    .reduce((s, [, v]) => s + Number(v), 0);
  const deductions = Object.entries(form)
    .filter(([k]) => k.includes('Deduct') || k.includes('Deduction'))
    .reduce((s, [, v]) => s + Number(v), 0);
  const net = gross - deductions;

  const salaryMutation = useMutation({
    mutationFn: () => upsertSalaryStructure(id!, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary', id] }),
  });

  const limitMutation = useMutation({
    mutationFn: () => setAutoPayLimit(id!, Number(autoPayLimit)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee', id] }),
  });

  const setField = (key: string) => (val: any) => setForm(f => ({ ...f, [key]: val }));

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  if (!employee) return <div className="p-8 text-center text-red-400">Employee not found.</div>;

  const canEdit = isRole('SUPER_ADMIN', 'HR_MANAGER');
  const canFinance = isRole('SUPER_ADMIN', 'FINANCE_TEAM');

  return (
    <div>
      <button onClick={() => navigate('/employees')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h1>
          <p className="text-gray-500 text-sm">{employee.employeeCode} · {employee.designation}</p>
        </div>
        <Badge label={employee.isActive ? 'Active' : 'Inactive'} variant={employee.isActive ? 'success' : 'failed'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Personal Info</h2>
            <div className="space-y-3">
              <Field label="Email" value={employee.user?.email} />
              <Field label="Phone" value={employee.phone} />
              <Field label="Department" value={employee.department?.name} />
              <Field label="Date of Joining" value={employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : ''} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Bank Details</h2>
            <div className="space-y-3">
              <Field label="Bank Name" value={employee.bankName} />
              <Field label="Account No." value={`****${employee.bankAccountNo?.slice(-4)}`} />
              <Field label="IFSC" value={employee.bankIfsc} />
              <Field label="UPI ID" value={employee.upiId} />
            </div>
          </div>

          {canFinance && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">Auto-Pay Limit</h2>
              <p className="text-xs text-gray-500 mb-3">Payments above this limit require manual approval. Set 0 for no limit.</p>
              <div className="relative mb-3">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
                <input type="number" value={autoPayLimit} onChange={e => setAutoPayLimitVal(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <button onClick={() => limitMutation.mutate()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                <IndianRupee className="w-4 h-4" /> Save Limit
              </button>
            </div>
          )}
        </div>

        {/* Salary Structure */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Salary Structure</h2>
              {canEdit && (
                <button onClick={() => salaryMutation.mutate()}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700">
                  <Save className="w-3.5 h-3.5" /> Save Structure
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Earnings</p>
              </div>
              <NumInput label="Basic Salary" value={form.basicSalary} onChange={setField('basicSalary')} readOnly={!canEdit} />
              <NumInput label="HRA" value={form.hra} onChange={setField('hra')} readOnly={!canEdit} />
              <NumInput label="Dearness Allowance (DA)" value={form.da} onChange={setField('da')} readOnly={!canEdit} />
              <NumInput label="Travel Allowance (TA)" value={form.ta} onChange={setField('ta')} readOnly={!canEdit} />
              <NumInput label="Medical Allowance" value={form.medicalAllow} onChange={setField('medicalAllow')} readOnly={!canEdit} />
              <NumInput label="Other Allowances" value={form.otherAllow} onChange={setField('otherAllow')} readOnly={!canEdit} />

              <div className="col-span-2 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Deductions</p>
              </div>
              <NumInput label="PF Deduction" value={form.pfDeduction} onChange={setField('pfDeduction')} readOnly={!canEdit} />
              <NumInput label="ESI Deduction" value={form.esiDeduction} onChange={setField('esiDeduction')} readOnly={!canEdit} />
              <NumInput label="TDS" value={form.tdsDeduction} onChange={setField('tdsDeduction')} readOnly={!canEdit} />
              <NumInput label="Other Deductions" value={form.otherDeduct} onChange={setField('otherDeduct')} readOnly={!canEdit} />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Gross Salary</p>
                <p className="text-lg font-bold text-gray-800">₹{gross.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Deductions</p>
                <p className="text-lg font-bold text-red-500">-₹{deductions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Net Salary</p>
                <p className="text-xl font-bold text-indigo-600">₹{net.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
