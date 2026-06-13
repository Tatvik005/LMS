import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          You do not have the required permissions to view this page. Please contact your system administrator if you believe this is a mistake.
        </p>
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-slate-900 text-white p-3.5 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-md"
          >
            Go Back
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white text-slate-700 border border-slate-200 p-3.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
