import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/audit';
import { AuditLog } from '../types';
import { Shield, Search, Filter } from 'lucide-react';

const ROLE_STYLE: Record<string, string> = {
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

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'text-green-600 bg-green-50',
  UPDATE: 'text-blue-600 bg-blue-50',
  DELETE: 'text-red-600 bg-red-50',
  LOGIN: 'text-indigo-600 bg-indigo-50',
  APPROVE: 'text-amber-600 bg-amber-50',
  EXECUTE: 'text-purple-600 bg-purple-50',
  WEBHOOK: 'text-gray-600 bg-gray-100',
};

function getActionColor(action: string) {
  const key = Object.keys(ACTION_COLOR).find(k => action.includes(k));
  return key ? ACTION_COLOR[key] : 'text-gray-600 bg-gray-100';
}

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit'], queryFn: getAuditLogs,
  });

  const filtered = logs.filter((log: AuditLog) => {
    const matchSearch = search === '' ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user.email.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === '' || log.entity === entityFilter;
    return matchSearch && matchEntity;
  });

  const entities = [...new Set(logs.map((l: AuditLog) => l.entity))];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-xs text-gray-500">Complete trail of all system actions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by action, user, or entity…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <select
            value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white appearance-none"
          >
            <option value="">All entities</option>
            {entities.map(e => <option key={e as string} value={e as string}>{e as string}</option>)}
          </select>
        </div>
        <div className="flex items-center text-xs text-gray-400 whitespace-nowrap">
          {filtered.length} of {logs.length} records
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading audit logs…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No audit logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Entity ID'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{log.user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[log.user.role]}`}>
                        {ROLE_LABEL[log.user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded font-mono font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium text-xs">{log.entity}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {log.entityId ? log.entityId.slice(0, 8) + '…' : '—'}
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
