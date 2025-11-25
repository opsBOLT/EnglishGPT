import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import CategorySelection from './components/CategorySelection';
import type { StudyCategory } from '../../config/studyContent';

const Study = () => {
  const navigate = useNavigate();

  const handleStart = (categoryId: StudyCategory | string) => {
    navigate(`/study/session/${encodeURIComponent(categoryId)}`);
  };

  return (
    <MainLayout>
      <CategorySelection onStartSession={handleStart} />
    </MainLayout>
  );
};

export default Study;
