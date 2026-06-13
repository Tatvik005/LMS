
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { QuizAttemptPage } from './pages/QuizAttempt';
import { AITutor } from './pages/AITutor';
import { QuizProvider } from './context/QuizContext';
import { TutorProvider } from './context/TutorContext';

function App() {
  return (
    <QuizProvider>
      <TutorProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Navigate to="/student" replace />} />
                <Route path="/faculty" element={<FacultyDashboard />} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/quiz/:id" element={<QuizAttemptPage />} />
                <Route path="/tutor" element={<AITutor />} />
              </Routes>
            </main>
          </div>
        </Router>
      </TutorProvider>
    </QuizProvider>
  );
}

export default App;
