import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { BookOpen, Loader2 } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking an API call
    setTimeout(() => {
      setCourses([
        { id: '1', title: 'Data Structures and Algorithms', description: 'Core CS course' },
      ]);
      setLoading(false);
    }, 500);
  }, [user]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800">Welcome back, {user.name}!</h2>
        <p className="text-gray-500 mt-1">Here are your enrolled courses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <Link key={course.id} to={`/course/${course.id}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group block transform hover:-translate-y-1">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center relative overflow-hidden">
              <BookOpen size={48} className="text-white opacity-20 absolute" />
              <h3 className="text-xl font-bold text-white relative z-10">{course.title}</h3>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
              <div className="text-indigo-600 font-medium text-sm flex items-center gap-1">
                Go to Course &rarr;
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
