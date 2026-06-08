import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getEmployees, setAutoPayLimit, deactivateEmployee } from '../api/employees';
import { useAuthStore } from '../store/authStore';
import Badge from '../components/ui/Badge';
import { Plus, Search, IndianRupee, Trash2, Eye } from 'lucide-react';
import { Employee } from '../types';

export default function Employees() {
  const { isRole } = useAuthStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [limitModal, setLimitModal] = useState<{ emp: Employee } | null>(null);
  const [newLimit, setNewLimit] = useState('');

  const { data: employees = [], isLoading } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });

  const limitMutation = useMutation({
    mutationFn: ({ id, limit }: { id: string; limit: number }) => setAutoPayLimit(id, limit),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setLimitModal(null); },
  });
  const deactivateMutation = useMutation({
    mutationFn: deactivateEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });

  const filtered = employees.filter((e: Employee) =>
    `${e.firstName} ${e.lastName} ${e.employeeCode}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        {isRole('SUPER_ADMIN', 'HR_MANAGER') && (
          <button onClick={() => navigate('/employees/new')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or code…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading employees…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No employees found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Code', 'Name', 'Department', 'Designation', 'Net Salary', 'Auto-Pay Limit', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((emp: Employee) => {
                const s = emp.salaryStructure;
                const net = s ? (+s.basicSalary + +s.hra + +s.da + +s.ta + +s.medicalAllow + +s.otherAllow) - (+s.pfDeduction + +s.esiDeduction + +s.tdsDeduction + +s.otherDeduct) : null;
                return (
                  <tr key={emp.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/employees/${emp.id}`)}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employeeCode}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.firstName} {emp.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.designation || '—'}</td>
                    <td className="px-4 py-3 font-medium">{net !== null ? `₹${net.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3">{Number(emp.autoPayLimit) === 0 ? <span className="text-gray-400">No limit</span> : <span className="font-medium">₹{Number(emp.autoPayLimit).toLocaleString()}</span>}</td>
                    <td className="px-4 py-3"><Badge label={emp.isActive ? 'Active' : 'Inactive'} variant={emp.isActive ? 'success' : 'failed'} /></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/employees/${emp.id}`)} title="View" className="p-1.5 rounded text-gray-400 hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                        {isRole('SUPER_ADMIN', 'FINANCE_TEAM') && (
                          <button onClick={() => { setLimitModal({ emp }); setNewLimit(String(emp.autoPayLimit)); }} title="Set limit" className="p-1.5 rounded text-indigo-500 hover:bg-indigo-50"><IndianRupee className="w-4 h-4" /></button>
                        )}
                        {isRole('SUPER_ADMIN', 'HR_MANAGER') && emp.isActive && (
                          <button onClick={() => { if (confirm('Deactivate this employee?')) deactivateMutation.mutate(emp.id); }} title="Deactivate" className="p-1.5 rounded text-red-400 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {limitModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setLimitModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold text-gray-900 mb-1">Set Auto-Pay Limit</h2>
            <p className="text-sm text-gray-500 mb-4">{limitModal.emp.firstName} {limitModal.emp.lastName}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limit (₹) — enter 0 for no limit</label>
            <input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex gap-2">
              <button onClick={() => setLimitModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => limitMutation.mutate({ id: limitModal.emp.id, limit: Number(newLimit) })}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
