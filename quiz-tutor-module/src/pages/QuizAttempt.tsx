import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuiz } from '../context/QuizContext';
import type { QuizAttempt } from '../types';
import { Clock, AlertCircle } from 'lucide-react';

export const QuizAttemptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getQuizById, saveAttempt } = useQuiz();
  
  const quiz = getQuizById(id || '');
  
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(quiz ? quiz.timeLimitMinutes * 60 : 0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (!quiz) {
      navigate('/student');
      return;
    }

    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, isSubmitted]);

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!quiz || isSubmitted) return;

    let score = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correctOptionIndex) {
        score++;
      }
    });

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      quizId: quiz.id,
      studentId: 'student_1',
      score,
      totalQuestions: quiz.questions.length,
      answers,
      dateAttempted: new Date().toISOString()
    };

    saveAttempt(attempt);
    setAttemptResult(attempt);
    setIsSubmitted(true);
  };

  if (!quiz) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 60;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container py-8 max-w-3xl mx-auto"
    >
      <div className="glass-panel p-6 mb-8 sticky top-4 z-10 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-muted text-sm">Answer all questions before time runs out.</p>
        </div>
        
        {!isSubmitted && (
          <div 
            className="flex items-center gap-2 text-xl font-bold px-4 py-2 rounded-lg"
            style={{ 
              color: isWarning ? 'var(--error)' : 'var(--accent-primary)',
              backgroundColor: isWarning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)'
            }}
          >
            <Clock size={24} />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        )}
      </div>

      {isSubmitted && attemptResult && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card mb-8 text-center p-8 border-accent-primary"
        >
          <h2 className="text-3xl mb-2">Quiz Completed!</h2>
          <p className="text-xl mb-4">
            Your Score: <span className="font-bold text-gradient">{attemptResult.score} / {attemptResult.totalQuestions}</span>
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/student')}>
            Back to Dashboard
          </button>
        </motion.div>
      )}

      <div className="flex flex-col gap-6">
        {quiz.questions.map((q, index) => {
          const selectedOption = answers[q.id];
          const isCorrect = selectedOption === q.correctOptionIndex;
          const showResult = isSubmitted;

          return (
            <div key={q.id} className="glass-card">
              <h3 className="text-lg font-medium mb-4 flex gap-2">
                <span className="text-accent-secondary">{index + 1}.</span> {q.text}
              </h3>
              
              <div className="flex flex-col gap-3">
                {q.options.map((opt, optIndex) => {
                  const isSelected = selectedOption === optIndex;
                  const isCorrectOption = q.correctOptionIndex === optIndex;
                  
                  let optionClass = "flex items-center gap-3 p-3 rounded-lg transition ";
                  optionClass += showResult ? "cursor-default" : "cursor-pointer hover:bg-slate-800/80";
                  
                  let style: React.CSSProperties = {
                    border: '1px solid transparent'
                  };
                  
                  if (!showResult) {
                    if (isSelected) {
                      style.borderColor = 'var(--accent-primary)';
                      style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
                    } else {
                      style.borderColor = 'var(--border-color)';
                      style.backgroundColor = 'rgba(30, 41, 59, 0.5)';
                    }
                  } else {
                    if (isCorrectOption) {
                      style.borderColor = 'var(--success)';
                      style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                    } else if (isSelected && !isCorrectOption) {
                      style.borderColor = 'var(--error)';
                      style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                    } else {
                      style.borderColor = 'rgba(255, 255, 255, 0.05)';
                      style.opacity = 0.5;
                    }
                  }

                  return (
                    <div 
                      key={optIndex} 
                      className={optionClass}
                      style={style}
                      onClick={() => handleOptionSelect(q.id, optIndex)}
                    >
                      <div 
                        className="rounded-full border-2 flex items-center justify-center"
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' 
                        }}
                      >
                        {isSelected && <div className="rounded-full" style={{ width: '10px', height: '10px', backgroundColor: 'var(--accent-primary)' }} />}
                      </div>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>

              {showResult && (
                <div 
                  className="mt-4 p-3 rounded-md flex items-center gap-2"
                  style={{
                    color: isCorrect ? 'var(--success)' : 'var(--error)',
                    backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                  }}
                >
                  {isCorrect ? (
                    <>Correct! Well done.</>
                  ) : (
                    <><AlertCircle size={18} /> Incorrect. The correct answer was: {q.options[q.correctOptionIndex]}</>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isSubmitted && (
        <div className="mt-8 flex justify-end">
          <button className="btn btn-primary btn-lg px-8 py-3 text-lg" onClick={handleSubmit}>
            Submit Quiz
          </button>
        </div>
      )}
    </motion.div>
  );
};
