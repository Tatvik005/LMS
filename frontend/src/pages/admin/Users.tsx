import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { Search, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Users = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const queryClient = useQueryClient();

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (search) params.append('search', search);
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      
      const { data } = await apiClient.get(`/admin/users?${params.toString()}`);
      return data;
    }
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to soft-delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h1>
        <button
          onClick={() => { setEditingUser(null); setIsFormOpen(true); }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={handleRoleFilter}
          className="w-full sm:w-48 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-white"
        >
          <option value="ALL">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="FACULTY">Faculty</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                  </td>
                </tr>
              ) : data?.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                data?.users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-3">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900">{user.name}</span>
                        {user.deletedAt && (
                           <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">DELETED</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                        user.role === 'STUDENT' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                        user.role === 'FACULTY' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 
                        'bg-slate-800 text-white'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { setEditingUser(user); setIsFormOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === 'SUPER_ADMIN'} // Basic protection
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex ml-2 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing page <span className="font-semibold">{data.page}</span> of <span className="font-semibold">{data.totalPages}</span>
            </p>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <UserFormModal 
          user={editingUser} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => { setIsFormOpen(false); queryClient.invalidateQueries({queryKey: ['admin-users']}); }} 
        />
      )}
    </div>
  );
};

const UserFormModal = ({ user, onClose, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'STUDENT'
  });
  const [error, setError] = useState('');
  
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (user) {
        return apiClient.put(`/admin/users/${user.id}`, { name: data.name, email: data.email, role: data.role });
      } else {
        return apiClient.post('/admin/users', data);
      }
    },
    onSuccess: onSuccess,
    onError: (err: any) => {
      setError(err.response?.data?.message || 'An error occurred');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !formData.password) {
      setError('Password is required for new users');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{user ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          {!user && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              {/* Note: In standard backend, admin cannot create SUPER_ADMIN via this endpoint, but we leave the options restricted to the allowed ones. */}
            </select>
          </div>
          
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-70 flex items-center">
              {mutation.isPending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Users;
