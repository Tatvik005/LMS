import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FacultyDashboard from './pages/FacultyDashboard';
import CourseDetail from './pages/CourseDetail';
import AssignmentGrader from './pages/AssignmentGrader';
import AttendanceTracker from './pages/AttendanceTracker';
import StudentDashboard from './pages/StudentDashboard';

// Mock Auth Context (usually would be provided by Person 1)
export const AuthContext = React.createContext();

function App() {
  // Temporary mock user state
  const [user, setUser] = React.useState({ id: 'mock-faculty-1', role: 'FACULTY', name: 'Dr. Smith' });

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <nav className="bg-brand-900 text-white p-4 flex justify-between items-center shadow-md">
            <h1 className="text-xl font-bold tracking-wider">LMS | Person 2 Module</h1>
            <div className="flex gap-4 items-center">
              <span className="text-sm font-light">Logged in as {user.name} ({user.role})</span>
              <select 
                className="bg-brand-600 text-white rounded p-1 text-sm border-none outline-none"
                value={user.role}
                onChange={(e) => {
                  if (e.target.value === 'FACULTY') setUser({ id: 'mock-faculty-1', role: 'FACULTY', name: 'Dr. Smith' });
                  else setUser({ id: 'mock-student-1', role: 'STUDENT', name: 'Alice Student' });
                }}
              >
                <option value="FACULTY">Faculty View</option>
                <option value="STUDENT">Student View</option>
              </select>
            </div>
          </nav>

          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={user.role === 'FACULTY' ? <FacultyDashboard /> : <StudentDashboard />} />
              <Route path="/course/:courseId" element={<CourseDetail />} />
              <Route path="/assignment/:assignmentId/grade" element={<AssignmentGrader />} />
              <Route path="/course/:courseId/attendance" element={<AttendanceTracker />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
