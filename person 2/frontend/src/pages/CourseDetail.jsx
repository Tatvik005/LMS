import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { FileText, Video, Upload, FileUp, Loader2, CheckCircle } from 'lucide-react';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useContext(AuthContext);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetch course details
    setTimeout(() => {
      setCourse({
        id: courseId,
        title: 'Data Structures and Algorithms',
        description: 'Core CS course covering essential data structures.',
        modules: [
          {
            id: 'm1', title: 'Week 1: Introduction to Trees', 
            materials: [
              { id: 'mat1', title: 'Trees Lecture PDF', fileType: 'application/pdf', fileUrl: '#' },
              { id: 'mat2', title: 'Video Lecture', fileType: 'video/mp4', fileUrl: '#' }
            ]
          }
        ],
        assignments: [
          { id: 'a1', title: 'Binary Search Tree Implementation', dueDate: new Date(Date.now() + 86400000).toISOString() }
        ]
      });
      setLoading(false);
    }, 500);
  }, [courseId]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-600" /></div>;
  if (!course) return <div>Course not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
        <p className="text-gray-300 max-w-2xl">{course.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Modules</h2>
            {user.role === 'FACULTY' && (
              <button className="text-sm bg-brand-100 text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-200 font-medium">
                + Add Module
              </button>
            )}
          </div>
          
          {course.modules.map(mod => (
            <div key={mod.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">{mod.title}</h3>
                {user.role === 'FACULTY' && (
                  <button className="text-xs flex items-center gap-1 text-gray-500 hover:text-brand-600">
                    <Upload size={14} /> Upload Material
                  </button>
                )}
              </div>
              <ul className="space-y-3">
                {mod.materials.map(mat => (
                  <li key={mat.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    {mat.fileType.includes('pdf') ? <FileText className="text-red-500" /> : <Video className="text-blue-500" />}
                    <a href={mat.fileUrl} className="font-medium text-gray-700 hover:text-brand-600 flex-1">{mat.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Assignments</h2>
            {user.role === 'FACULTY' && (
              <button className="text-sm bg-brand-100 text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-200 font-medium">
                + Create
              </button>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ul className="space-y-4">
              {course.assignments.map(assign => (
                <li key={assign.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="font-bold text-gray-800">{assign.title}</div>
                  <div className="text-sm text-red-500 mb-2">Due: {new Date(assign.dueDate).toLocaleDateString()}</div>
                  {user.role === 'FACULTY' ? (
                    <Link to={`/assignment/${assign.id}/grade`} className="text-sm text-brand-600 font-medium hover:underline">
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
          </div>
        </div>
      </div>
    </div>
  );
}
