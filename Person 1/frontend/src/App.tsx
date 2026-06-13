import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/auth/Unauthorized';

import AdminLayout from './layouts/AdminLayout';
import Overview from './pages/admin/Overview';
import Users from './pages/admin/Users';
import Reports from './pages/admin/Reports';

const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'SUPER_ADMIN':
      return <Navigate to="/admin" replace />;
    case 'FACULTY':
      return <Navigate to="/faculty/dashboard" replace />;
    case 'STUDENT':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route path="/admin" element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Route>

      {/* Placeholders for future modules */}
      <Route path="/faculty/dashboard" element={<ProtectedRoute roles={['FACULTY']} />}>
        <Route index element={<div className="p-8">Faculty Dashboard coming soon...</div>} />
      </Route>

      <Route path="/student/dashboard" element={<ProtectedRoute roles={['STUDENT']} />}>
        <Route index element={<div className="p-8">Student Dashboard coming soon...</div>} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
