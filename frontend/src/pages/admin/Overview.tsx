import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, BookOpen, UserPlus } from 'lucide-react';

const Overview = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/analytics');
      return data;
    }
  });

  const { data: chartData } = useQuery({
    queryKey: ['analytics-chart'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/analytics/users-over-time');
      return data;
    }
  });

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Overview</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={analytics?.totalStudents || 0} icon={<Users size={24} />} color="from-blue-500 to-cyan-400" />
        <StatCard title="Total Faculty" value={analytics?.totalFaculty || 0} icon={<GraduationCap size={24} />} color="from-indigo-500 to-purple-500" />
        <StatCard title="Total Courses" value={analytics?.totalCourses || 0} icon={<BookOpen size={24} />} color="from-fuchsia-500 to-pink-500" />
        <StatCard title="New Users (Month)" value={analytics?.newUsersThisMonth || 0} icon={<UserPlus size={24} />} color="from-emerald-500 to-teal-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6">User Registrations Over Time</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
                />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 8, fill: '#6366f1', stroke: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Registrations</h2>
          <div className="space-y-4">
            {analytics?.recentUsers?.map((user: any) => (
              <div key={user.id} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex flex-shrink-0 items-center justify-center text-slate-600 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="ml-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    user.role === 'STUDENT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
            {(!analytics?.recentUsers || analytics.recentUsers.length === 0) && (
              <p className="text-sm text-slate-500 text-center py-4">No recent users found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
    <div className={`p-4 rounded-xl text-white bg-gradient-to-tr ${color} shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <div className="ml-5">
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  </div>
);

export default Overview;
