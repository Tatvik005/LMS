import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, Loader2 } from 'lucide-react';
import api from '../../api/client';

export default function AttendanceTracker() {
  const { courseId } = useParams();
  const [students, setStudents] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // Fetch students enrolled in this course
        const response = await api.get(`/courses/${courseId}/students`);
        // Initialize their status
        const initialStudents = response.data.map((student: any) => ({
          ...student,
          status: null
        }));
        setStudents(initialStudents);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchStudents();
    }
  }, [courseId, date]); // We might want to fetch past attendance for this date in the future

  const setStatus = (id: string, status: string) => {
    setStudents(sts => sts.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const records = students
        .filter(s => s.status) // Only send ones that have a status set
        .map(s => ({
          studentId: s.id,
          status: s.status
        }));
      
      if (records.length === 0) {
        alert('Please mark attendance for at least one student.');
        return;
      }

      await api.post('/attendance', {
        courseId,
        date,
        records
      });
      alert('Attendance saved successfully for ' + date);
    } catch (error) {
      console.error('Failed to save attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link to="/faculty/dashboard" className="text-gray-500 hover:text-indigo-600 flex items-center gap-2 mb-4 font-medium text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Attendance Tracker</h1>
          <p className="text-gray-500 mt-1">Mark attendance for today's session.</p>
        </div>
        <div>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <span className="font-semibold text-gray-600">Student List</span>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
        
        {students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No students are currently enrolled in this course.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {students.map(student => (
              <li key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-800">{student.name}</div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setStatus(student.id, 'PRESENT')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      student.status === 'PRESENT' 
                        ? 'bg-green-100 border-green-200 text-green-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Check size={16} /> Present
                  </button>
                  <button 
                    onClick={() => setStatus(student.id, 'LATE')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      student.status === 'LATE' 
                        ? 'bg-yellow-100 border-yellow-200 text-yellow-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Clock size={16} /> Late
                  </button>
                  <button 
                    onClick={() => setStatus(student.id, 'ABSENT')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      student.status === 'ABSENT' 
                        ? 'bg-red-100 border-red-200 text-red-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <X size={16} /> Absent
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

