import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { PlayCircle, Clock, CheckCircle, BarChart2 } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { quizzes, attempts, getCourseById } = useQuiz();
  const navigate = useNavigate();

  // For demo purposes, we assume a single student ID
  const studentId = 'student_1';
  const myAttempts = attempts.filter(a => a.studentId === studentId);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Student Dashboard</h1>
        <p className="text-muted">View available quizzes and your performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl mb-4 flex items-center gap-2">
            <PlayCircle className="text-accent-primary" /> Available Quizzes
          </h2>
          <div className="flex flex-col gap-4">
            {quizzes.length === 0 ? (
              <p className="text-muted italic">No quizzes available yet.</p>
            ) : (
              quizzes.map(quiz => {
                const course = getCourseById(quiz.courseId);
                const hasAttempted = myAttempts.some(a => a.quizId === quiz.id);

                return (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={quiz.id} 
                    className="glass-card flex justify-between items-center"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">{quiz.title}</h3>
                      <p className="text-sm text-muted mb-2">{course?.code} - {course?.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <span className="flex items-center gap-1"><Clock size={14} /> {quiz.timeLimitMinutes} mins</span>
                        <span className="flex items-center gap-1"><CheckCircle size={14} /> {quiz.questions.length} Questions</span>
                      </div>
                    </div>
                    
                    {!hasAttempted ? (
                      <button 
                        className="btn btn-primary"
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                      >
                        Start Quiz
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                        Completed
                      </span>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl mb-4 flex items-center gap-2">
            <BarChart2 className="text-accent-secondary" /> My Results
          </h2>
          <div className="flex flex-col gap-4">
            {myAttempts.length === 0 ? (
              <p className="text-muted italic">You haven't attempted any quizzes yet.</p>
            ) : (
              myAttempts.map(attempt => {
                const quiz = quizzes.find(q => q.id === attempt.quizId);
                const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                
                return (
                  <div key={attempt.id} className="glass-card">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{quiz?.title || 'Unknown Quiz'}</h3>
                      <span className={`text-xl font-bold ${percentage >= 50 ? 'text-success' : 'text-error'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted">
                      <span>Score: {attempt.score} / {attempt.totalQuestions}</span>
                      <span>{new Date(attempt.dateAttempted).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: percentage >= 50 ? 'var(--success)' : 'var(--error)' }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
