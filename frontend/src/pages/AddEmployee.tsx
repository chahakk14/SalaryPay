import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEmployee } from '../api/employees';
import { ArrowLeft, UserPlus } from 'lucide-react';

const Field = ({ label, name, type = 'text', value, onChange, required = false, placeholder = '' }: any) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
    <input name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
  </div>
);

const INITIAL = {
  email: '', password: '', firstName: '', lastName: '', employeeCode: '',
  phone: '', designation: '', dateOfJoining: '', panNumber: '',
  bankAccountNo: '', bankIfsc: '', bankName: '', upiId: '', autoPayLimit: '0',
};

export default function AddEmployee() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => createEmployee(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); navigate('/employees'); },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to create employee'),
  });

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/employees')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Employee</h1>

      <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@company.com" />
            <Field label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Default: Welcome@123" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Personal Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
            <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
            <Field label="Employee Code" name="employeeCode" value={form.employeeCode} onChange={handleChange} required placeholder="EMP001" />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91-9876543210" />
            <Field label="Designation" name="designation" value={form.designation} onChange={handleChange} placeholder="Software Engineer" />
            <Field label="Date of Joining" name="dateOfJoining" type="date" value={form.dateOfJoining} onChange={handleChange} required />
            <Field label="PAN Number" name="panNumber" value={form.panNumber} onChange={handleChange} placeholder="ABCDE1234F" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Bank Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} required placeholder="HDFC Bank" />
            <Field label="Account Number" name="bankAccountNo" value={form.bankAccountNo} onChange={handleChange} required placeholder="1234567890" />
            <Field label="IFSC Code" name="bankIfsc" value={form.bankIfsc} onChange={handleChange} required placeholder="HDFC0001234" />
            <Field label="UPI ID" name="upiId" value={form.upiId} onChange={handleChange} placeholder="john@upi" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Auto-Pay Limit</h2>
          <p className="text-xs text-gray-500 mb-3">Set 0 for no limit. Payments above this require manual approval.</p>
          <Field label="Limit (₹)" name="autoPayLimit" type="number" value={form.autoPayLimit} onChange={handleChange} placeholder="0" />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/employees')}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
            <UserPlus className="w-4 h-4" />
            {mutation.isPending ? 'Creating…' : 'Create Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}
