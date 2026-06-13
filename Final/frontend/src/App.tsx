import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { QuizProvider } from './context/QuizContext';
import { TutorProvider } from './context/TutorContext';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/auth/Unauthorized';

import AdminLayout from './layouts/AdminLayout';
import Overview from './pages/admin/Overview';
import Users from './pages/admin/Users';
import Reports from './pages/admin/Reports';

import FacultyDashboard from './pages/FacultyDashboard'; // assuming we moved or combined these
import StudentDashboard from './pages/StudentDashboard'; // assuming we moved or combined these
import CourseDetail from './pages/courses/CourseDetail';
import AssignmentGrader from './pages/assignments/AssignmentGrader';
import AttendanceTracker from './pages/attendance/AttendanceTracker';
import { QuizAttemptPage } from './pages/quiz/QuizAttempt';
import { AITutor } from './pages/tutor/AITutor';

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
    <QuizProvider>
      <TutorProvider>
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

          <Route path="/faculty/dashboard" element={<ProtectedRoute roles={['FACULTY']} />}>
            <Route index element={<FacultyDashboard />} />
          </Route>

          <Route path="/student/dashboard" element={<ProtectedRoute roles={['STUDENT']} />}>
            <Route index element={<StudentDashboard />} />
          </Route>
          
          <Route path="/course/:courseId" element={<ProtectedRoute roles={['FACULTY', 'STUDENT']} />}>
            <Route index element={<CourseDetail />} />
          </Route>
          
          <Route path="/assignment/:assignmentId/grade" element={<ProtectedRoute roles={['FACULTY']} />}>
            <Route index element={<AssignmentGrader />} />
          </Route>
          
          <Route path="/course/:courseId/attendance" element={<ProtectedRoute roles={['FACULTY']} />}>
            <Route index element={<AttendanceTracker />} />
          </Route>

          <Route path="/quiz/:id" element={<ProtectedRoute roles={['STUDENT']} />}>
            <Route index element={<QuizAttemptPage />} />
          </Route>
          
          <Route path="/tutor" element={<ProtectedRoute roles={['STUDENT']} />}>
            <Route index element={<AITutor />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TutorProvider>
    </QuizProvider>
  );
};

export default App;
