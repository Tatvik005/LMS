import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileBarChart, LogOut } from 'lucide-react';
import NotificationBell from '../NotificationBell';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 text-2xl font-bold tracking-wider text-indigo-400 border-b border-slate-800 flex items-center">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg mr-3 flex items-center justify-center text-white">L</div>
          LMS Admin
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavLink 
            to="/admin" 
            end
            className={({ isActive }) => 
              `flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-slate-800 ${isActive ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' : 'text-slate-300'}`
            }
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            <span className="font-medium">Overview</span>
          </NavLink>
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => 
              `flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-slate-800 ${isActive ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' : 'text-slate-300'}`
            }
          >
            <Users className="w-5 h-5 mr-3" />
            <span className="font-medium">User Management</span>
          </NavLink>
          <NavLink 
            to="/admin/reports" 
            className={({ isActive }) => 
              `flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-slate-800 ${isActive ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md' : 'text-slate-300'}`
            }
          >
            <FileBarChart className="w-5 h-5 mr-3" />
            <span className="font-medium">Reports</span>
          </NavLink>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
          <div className="flex items-center space-x-6">
            <NotificationBell />
            <div className="flex items-center space-x-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md transform hover:scale-105 transition-transform cursor-pointer">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
