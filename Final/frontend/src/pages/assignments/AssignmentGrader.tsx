import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileText, Download } from 'lucide-react';

export default function AssignmentGrader() {
  const { assignmentId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    // Mock fetching
    setAssignment({ title: 'Binary Search Tree Implementation', dueDate: new Date().toISOString() });
    setSubmissions([
      { id: 'sub1', studentName: 'Alice Student', submittedAt: new Date().toISOString(), fileUrl: '#', grade: null, feedback: '' },
      { id: 'sub2', studentName: 'Bob Student', submittedAt: new Date(Date.now() - 86400000).toISOString(), fileUrl: '#', grade: 95, feedback: 'Excellent work.' }
    ]);
  }, [assignmentId]);

  const handleGrade = (id, newGrade, newFeedback) => {
    setSubmissions(subs => subs.map(s => s.id === id ? { ...s, grade: newGrade, feedback: newFeedback } : s));
  };

  if (!assignment) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link to={`/course/1`} className="text-gray-500 hover:text-brand-600 flex items-center gap-2 mb-4 font-medium text-sm">
        <ArrowLeft size={16} /> Back to Course
      </Link>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800">{assignment.title} - Grading</h1>
        <p className="text-gray-500 mt-1">Review student submissions and assign grades.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600 text-sm">Student</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Submitted At</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Submission</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Grade</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-800">{sub.studentName}</td>
                <td className="p-4 text-sm text-gray-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <a href={sub.fileUrl} className="text-brand-600 hover:text-brand-800 flex items-center gap-1 text-sm font-medium">
                    <FileText size={16} /> View File
                  </a>
                </td>
                <td className="p-4">
                  {sub.grade !== null ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {sub.grade}/100
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <button onClick={() => {
                    const g = prompt('Enter grade (0-100):', sub.grade || '');
                    if (g) handleGrade(sub.id, parseInt(g), sub.feedback);
                  }} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium transition-colors">
                    Edit Grade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
