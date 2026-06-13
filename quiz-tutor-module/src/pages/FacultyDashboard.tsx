import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuiz } from '../context/QuizContext';
import type { Question, Quiz } from '../types';
import { Plus, Trash2, Save, CheckCircle, BookOpen } from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { courses, addQuiz } = useQuiz();
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [timeLimit, setTimeLimit] = useState(10);
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([
    { text: '', options: ['', '', '', ''], correctOptionIndex: 0 }
  ]);
  const [success, setSuccess] = useState(false);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    if (field === 'text') newQuestions[index].text = value;
    if (field === 'correctOptionIndex') newQuestions[index].correctOptionIndex = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!title || questions.some(q => !q.text || q.options.some(o => !o))) {
      alert("Please fill out all fields and options.");
      return;
    }

    const newQuiz: Quiz = {
      id: `quiz_${Date.now()}`,
      title,
      courseId,
      timeLimitMinutes: timeLimit,
      questions: questions.map((q, i) => ({ ...q, id: `q_${Date.now()}_${i}` }))
    };

    addQuiz(newQuiz);
    setSuccess(true);
    
    // Reset form
    setTitle('');
    setQuestions([{ text: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
    
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2">Faculty Dashboard</h1>
          <p className="text-muted">Create and manage quizzes for your courses.</p>
        </div>
      </div>

      <div className="glass-panel p-8">
        <h2 className="text-2xl mb-6 flex items-center gap-2">
          <BookOpen className="text-accent-primary" /> Create New Quiz
        </h2>
        
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-md flex items-center gap-2"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
          >
            <CheckCircle size={20} />
            Quiz created successfully!
          </motion.div>
        )}

        <form onSubmit={handleSaveQuiz}>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="form-group">
              <label className="form-label">Quiz Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Midterm Assessment" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Course</label>
              <select 
                className="form-select"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Time Limit (Minutes)</label>
              <input 
                type="number" 
                min="1"
                className="form-input" 
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl">Questions</h3>
              <button type="button" className="btn btn-outline" onClick={handleAddQuestion}>
                <Plus size={18} /> Add Question
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {questions.map((q, qIndex) => (
                <motion.div 
                  key={qIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card relative"
                >
                  {questions.length > 1 && (
                    <button 
                      type="button"
                      className="absolute top-4 right-4 text-muted hover:text-error transition"
                      onClick={() => handleRemoveQuestion(qIndex)}
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  
                  <div className="form-group mr-12">
                    <label className="form-label">Question {qIndex + 1}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Enter question text..."
                      value={q.text}
                      onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name={`correct-${qIndex}`}
                          checked={q.correctOptionIndex === optIndex}
                          onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', optIndex)}
                          className="cursor-pointer"
                          style={{ accentColor: 'var(--accent-primary)', width: '1.2rem', height: '1.2rem' }}
                        />
                        <input 
                          type="text"
                          className="form-input flex-1"
                          placeholder={`Option ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary">
              <Save size={20} /> Save Quiz
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};


