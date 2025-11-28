import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import { FileText, Palette, BookOpen } from 'lucide-react';
import { Button as ThreeDButton } from '../../components/ui/3d-button';
import { getAllPracticeGuides, getQuestionTypeColor } from '../../services/practiceContent';
import { motion } from 'framer-motion';

const Practice = () => {
  const navigate = useNavigate();
  const guides = getAllPracticeGuides();

  const handleStartPractice = (guideKey: string) => {
    navigate(`/practice/session?type=${guideKey}`);
  };

  const icons = {
    directed_writing: FileText,
    descriptive_writing: Palette,
    narrative_writing: BookOpen,
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 sulphur-point-bold">
            Practice
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide, idx) => {
            const Icon = icons[guide.key as keyof typeof icons];
            const color = getQuestionTypeColor(guide.key);

            return (
              <motion.div
                key={guide.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all p-8 flex flex-col"
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="w-8 h-8" style={{ color }} />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2 sulphur-point-bold">
                  {guide.title}
                </h2>

                <p className="text-sm text-slate-500 mb-6 sulphur-point-regular">
                  {guide.questionCount} questions
                </p>

                <ThreeDButton
                  onClick={() => handleStartPractice(guide.key)}
                  stretch
                  variant="ai"
                  size="lg"
                >
                  Start
                </ThreeDButton>
              </motion.div>
            );
          })}
        </div>

      </div>
    </MainLayout>
  );
};

export default Practice;
