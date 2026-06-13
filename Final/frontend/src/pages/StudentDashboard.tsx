import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Loader2, BrainCircuit } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Student Dashboard</h2>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}. Here are your enrolled courses.</p>
        </div>
        <Link to="/tutor" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium shadow-sm">
          <BrainCircuit size={20} /> AI Tutor
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-medium text-gray-800">No enrolled courses</h3>
          <p className="text-gray-500 mt-2">You are not currently enrolled in any courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center relative overflow-hidden">
                <BookOpen size={48} className="text-white opacity-20 absolute" />
                <h3 className="text-xl font-bold text-white relative z-10">{course.title}</h3>
              </div>
              <div className="p-5">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description || 'No description provided.'}</p>
                <div className="flex justify-between items-center">
                  <Link to={`/course/${course.id}`} className="text-brand-600 hover:text-brand-800 font-medium text-sm flex items-center gap-1">
                    View Course &rarr;
                  </Link>
                  <Link to={`/course/${course.id}/attendance/my`} className="text-gray-500 hover:text-gray-800 text-sm font-medium">
                    My Attendance
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
