import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { BookOpen, Plus, Loader2 } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // In a real app, you'd fetch this from the backend
  // Since we haven't seeded DB, we'll display mock data if empty
  useEffect(() => {
    // Mocking an API call
    setTimeout(() => {
      setCourses([
        { id: '1', title: 'Data Structures and Algorithms', description: 'Core CS course' },
        { id: '2', title: 'Operating Systems', description: 'Advanced CS course' }
      ]);
      setLoading(false);
    }, 500);
  }, [user]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Faculty Dashboard</h2>
          <p className="text-gray-500 mt-1">Manage your courses, assignments, and attendance.</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium shadow-sm">
          <Plus size={20} /> New Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
            <div className="h-32 bg-gradient-to-r from-brand-500 to-brand-700 flex items-center justify-center relative overflow-hidden">
              <BookOpen size={48} className="text-white opacity-20 absolute" />
              <h3 className="text-xl font-bold text-white relative z-10">{course.title}</h3>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
              <div className="flex justify-between items-center">
                <Link to={`/course/${course.id}`} className="text-brand-600 hover:text-brand-800 font-medium text-sm flex items-center gap-1">
                  Manage Course &rarr;
                </Link>
                <Link to={`/course/${course.id}/attendance`} className="text-gray-500 hover:text-gray-800 text-sm font-medium">
                  Attendance
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
