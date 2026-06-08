import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getPayslips, getMyPayslips, downloadPayslip } from '../api/payslips';
import { FileDown, FileText, Calendar } from 'lucide-react';
import { Payslip } from '../types';

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

export default function Payslips() {
  const { user, isRole } = useAuthStore();
  const isEmployee = isRole('EMPLOYEE');

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: isEmployee ? ['my-payslips', user?.employeeId] : ['payslips'],
    queryFn: isEmployee ? () => getMyPayslips(user!.employeeId!) : getPayslips,
  });

  const handleDownload = async (payslipId: string, month: number, year: number) => {
    try {
      const blob = await downloadPayslip(payslipId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip-${MONTHS[month - 1]}-${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Payslip download failed', error);
      alert('Unable to download payslip. Please try again.');
    }
  };

  // Group payslips by year for employees
  const byYear = isEmployee
    ? (payslips as Payslip[]).reduce((acc: Record<number, Payslip[]>, p) => {
        acc[p.year] = acc[p.year] || [];
        acc[p.year].push(p);
        return acc;
      }, {})
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEmployee ? 'My Payslips' : 'All Payslips'}
        </h1>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
          {payslips.length} total
        </span>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-gray-400">Loading payslips…</div>
      ) : payslips.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No payslips yet</p>
          <p className="text-xs mt-1">
            {isEmployee ? 'Your payslips will appear here once salary is processed.' : 'Generate payslips from the Payroll section after executing a salary run.'}
          </p>
        </div>
      ) : isEmployee && byYear ? (
        // Employee view — grouped by year
        <div className="space-y-6">
          {Object.keys(byYear).sort((a, b) => Number(b) - Number(a)).map(year => (
            <div key={year} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">{year}</h2>
                <span className="text-xs text-gray-400">({byYear[Number(year)].length} payslips)</span>
              </div>
              <div className="divide-y divide-gray-50">
                {byYear[Number(year)].map((p: Payslip) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{MONTHS[p.month - 1]} {p.year}</p>
                        <p className="text-xs text-gray-400">
                          Generated {new Date(p.generatedAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(p.id, p.month, p.year)}
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <FileDown className="w-3.5 h-3.5" /> Download PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Admin / HR / Finance view — full table
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Code', 'Period', 'Generated On', 'Download'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(payslips as Payslip[]).map((p: Payslip) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-semibold text-indigo-600">
                          {p.employee?.firstName?.[0]}{p.employee?.lastName?.[0]}
                        </div>
                        <span className="font-medium">{p.employee?.firstName} {p.employee?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.employee?.employeeCode}</td>
                    <td className="px-4 py-3 font-medium">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(p.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDownload(p.id, p.month, p.year)}
                        className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
