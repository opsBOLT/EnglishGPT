import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/Layout/MainLayout';
import CategorySelection from './components/CategorySelection';
import StudyInterface from './components/StudyInterface';

const Study = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const { user } = useAuth();

  return (
    <MainLayout>
      {!category || !activeSession ? (
        <CategorySelection
          selectedCategory={category}
          onStartSession={(sessionId) => setActiveSession(sessionId)}
        />
      ) : (
        <StudyInterface sessionId={activeSession} category={category} />
      )}
    </MainLayout>
  );
};

export default Study;
