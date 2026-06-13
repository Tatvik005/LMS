import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Course, Quiz, QuizAttempt } from '../types';

interface QuizContextType {
  courses: Course[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  addQuiz: (quiz: Quiz) => void;
  saveAttempt: (attempt: QuizAttempt) => void;
  getQuizById: (id: string) => Quiz | undefined;
  getAttemptsByStudent: (studentId: string) => QuizAttempt[];
  getCourseById: (id: string) => Course | undefined;
}

const defaultCourses: Course[] = [
  { id: 'c1', name: 'Database Management Systems', code: 'CS301' },
  { id: 'c2', name: 'Data Structures and Algorithms', code: 'CS201' },
  { id: 'c3', name: 'Operating Systems', code: 'CS302' },
];

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses] = useState<Course[]>(defaultCourses);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  // Load from local storage
  useEffect(() => {
    const storedQuizzes = localStorage.getItem('tutor_quizzes');
    const storedAttempts = localStorage.getItem('tutor_attempts');
    
    if (storedQuizzes) setQuizzes(JSON.parse(storedQuizzes));
    if (storedAttempts) setAttempts(JSON.parse(storedAttempts));
  }, []);

  // Save to local storage when updated
  useEffect(() => {
    localStorage.setItem('tutor_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('tutor_attempts', JSON.stringify(attempts));
  }, [attempts]);

  const addQuiz = (quiz: Quiz) => {
    setQuizzes(prev => [...prev, quiz]);
  };

  const saveAttempt = (attempt: QuizAttempt) => {
    setAttempts(prev => [...prev, attempt]);
  };

  const getQuizById = (id: string) => quizzes.find(q => q.id === id);
  const getAttemptsByStudent = (studentId: string) => attempts.filter(a => a.studentId === studentId);
  const getCourseById = (id: string) => courses.find(c => c.id === id);

  return (
    <QuizContext.Provider value={{
      courses, quizzes, attempts, addQuiz, saveAttempt, getQuizById, getAttemptsByStudent, getCourseById
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) throw new Error('useQuiz must be used within a QuizProvider');
  return context;
};
