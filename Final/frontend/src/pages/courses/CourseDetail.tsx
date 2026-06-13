import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, Video, Upload, FileUp, Loader2, CheckCircle, UserPlus } from 'lucide-react';
import api from '../../api/client';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get(`/courses/${courseId}`);
        setCourse(response.data);
      } catch (error) {
        console.error('Failed to fetch course details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await api.post(`/courses/${courseId}/enroll`);
      alert('Successfully enrolled in the course!');
    } catch (error: any) {
      if (error.response?.data?.message === 'Already enrolled') {
        alert('You are already enrolled in this course.');
      } else {
        console.error('Failed to enroll:', error);
        alert('Failed to enroll in the course.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!course) return <div className="text-center p-12">Course not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-lg relative">
        <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
        <p className="text-gray-300 max-w-2xl">{course.description || 'No description provided.'}</p>
        
        {user?.role === 'STUDENT' && (
          <button 
            onClick={handleEnroll}
            disabled={enrolling}
            className="absolute top-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {enrolling ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            Enroll in Course
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Modules</h2>
            {user?.role === 'FACULTY' && (
              <button className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 font-medium">
                + Add Module
              </button>
            )}
          </div>
          
          {!course.modules || course.modules.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
              No modules available yet.
            </div>
          ) : (
            course.modules.map((mod: any) => (
              <div key={mod.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{mod.title}</h3>
                  {user?.role === 'FACULTY' && (
                    <button className="text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-600">
                      <Upload size={14} /> Upload Material
                    </button>
                  )}
                </div>
                <ul className="space-y-3">
                  {(!mod.materials || mod.materials.length === 0) ? (
                    <li className="text-sm text-gray-400">No materials</li>
                  ) : (
                    mod.materials.map((mat: any) => (
                      <li key={mat.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        {mat.fileType?.includes('pdf') ? <FileText className="text-red-500" /> : <Video className="text-blue-500" />}
                        <a href={mat.fileUrl} className="font-medium text-gray-700 hover:text-indigo-600 flex-1">{mat.title}</a>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Assignments</h2>
            {user?.role === 'FACULTY' && (
              <button className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 font-medium">
                + Create
              </button>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {!course.assignments || course.assignments.length === 0 ? (
              <div className="text-center text-gray-500">No assignments yet.</div>
            ) : (
              <ul className="space-y-4">
                {course.assignments.map((assign: any) => (
                  <li key={assign.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="font-bold text-gray-800">{assign.title}</div>
                    <div className="text-sm text-red-500 mb-2">Due: {new Date(assign.dueDate).toLocaleDateString()}</div>
                    {user?.role === 'FACULTY' ? (
                      <Link to={`/assignment/${assign.id}/grade`} className="text-sm text-indigo-600 font-medium hover:underline">
                        Grade Submissions
                      </Link>
                    ) : (
                      <button className="text-sm flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-gray-700 font-medium">
                        <FileUp size={14} /> Submit Work
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
