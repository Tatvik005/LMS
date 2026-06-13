import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, GraduationCap, BrainCircuit } from 'lucide-react';

export const Navigation: React.FC = () => {
  return (
    <nav className="glass-panel" style={{ margin: '1.5rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="flex items-center gap-2">
        <BrainCircuit className="text-accent-primary" size={28} style={{ color: 'var(--accent-primary)' }} />
        <span className="text-xl font-bold text-gradient">EduQuest AI</span>
      </div>
      
      <div className="flex gap-6">
        <NavLink 
          to="/faculty" 
          className={({ isActive }) => `flex items-center gap-2 ${isActive ? 'text-accent-primary font-semibold' : 'text-muted'}`}
        >
          <BookOpen size={20} />
          Faculty Dashboard
        </NavLink>
        <NavLink 
          to="/student" 
          className={({ isActive }) => `flex items-center gap-2 ${isActive ? 'text-accent-primary font-semibold' : 'text-muted'}`}
        >
          <GraduationCap size={20} />
          Student Dashboard
        </NavLink>
        <NavLink 
          to="/tutor" 
          className={({ isActive }) => `flex items-center gap-2 ${isActive ? 'text-accent-primary font-semibold' : 'text-muted'}`}
        >
          <BrainCircuit size={20} />
          AI Tutor
        </NavLink>
      </div>
    </nav>
  );
};
