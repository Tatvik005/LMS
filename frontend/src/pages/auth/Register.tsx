import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      // Similar to login, redirection to root determines correct role-based route
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transform transition-all">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h1>
          <p className="text-slate-500 mt-2 text-sm">Join the LMS platform</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center text-sm font-medium border border-red-100">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50 focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <input
                required
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`border rounded-xl p-3 flex items-center justify-center cursor-pointer transition-all ${formData.role === 'STUDENT' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <input type="radio" name="role" value="STUDENT" checked={formData.role === 'STUDENT'} onChange={() => setFormData({...formData, role: 'STUDENT'})} className="hidden" />
                Student
              </label>
              <label className={`border rounded-xl p-3 flex items-center justify-center cursor-pointer transition-all ${formData.role === 'FACULTY' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <input type="radio" name="role" value="FACULTY" checked={formData.role === 'FACULTY'} onChange={() => setFormData({...formData, role: 'FACULTY'})} className="hidden" />
                Faculty
              </label>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex justify-center items-center mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
