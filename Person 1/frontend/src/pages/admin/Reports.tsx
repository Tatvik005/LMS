import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { Download, FileText, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

const Reports = () => {
  const [role, setRole] = useState('ALL');
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: reportData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-reports', role, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams({ role, from: fromDate, to: toDate, format: 'json' });
      const { data } = await apiClient.get(`/admin/reports/users?${params.toString()}`);
      return data;
    }
  });

  const handleDownloadCSV = () => {
    const params = new URLSearchParams({ role, from: fromDate, to: toDate, format: 'csv' });
    const url = `http://localhost:5005/api/admin/reports/users?${params.toString()}`;
    
    // Using apiClient to fetch withCredentials
    apiClient.get(url, { responseType: 'blob' })
      .then((response) => {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `users-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((error) => console.error("CSV download failed", error));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Generate and export user registration reports.</p>
        </div>
        <button
          onClick={handleDownloadCSV}
          disabled={isLoading || isFetching || !reportData?.length}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:hover:shadow-md"
        >
          <Download className="w-5 h-5 mr-2" /> Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
            <UsersIcon className="w-4 h-4 mr-2 text-slate-400" /> Role Filter
          </label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-slate-50"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" /> From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50 text-slate-700"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" /> To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50 text-slate-700"
          />
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-semibold text-slate-700 flex items-center">
            <FileText className="w-4 h-4 mr-2" /> Data Preview
          </h3>
          <span className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-500">
            {reportData?.length || 0} Records
          </span>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                  </td>
                </tr>
              ) : reportData?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No users match the given criteria.
                  </td>
                </tr>
              ) : (
                reportData?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-xs font-mono text-slate-400">{user.id.substring(0,8)}...</td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default Reports;
