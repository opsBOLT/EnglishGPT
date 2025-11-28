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
          <h1 className="text-4xl font-bold text-slate-900 mb-2 sulphur-point-bold">
            Practice Zone
          </h1>
          <p className="text-slate-600 sulphur-point-regular text-lg">
            Master Paper 2 writing with AI-powered practice sessions
          </p>
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

                <p className="text-sm text-slate-500 mb-3 sulphur-point-regular">
                  {guide.label}
                </p>

                <p className="text-slate-700 mb-4 flex-1 sulphur-point-regular">
                  {guide.description}
                </p>

                <div className="bg-slate-50 rounded-lg p-3 mb-6">
                  <p className="text-sm text-slate-600 sulphur-point-regular">
                    <span className="font-semibold text-slate-900">
                      {guide.questionCount} questions
                    </span>{' '}
                    available from past papers
                  </p>
                </div>

                <ThreeDButton
                  onClick={() => handleStartPractice(guide.key)}
                  stretch
                  variant="ai"
                  size="lg"
                >
                  Start Practice
                </ThreeDButton>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 bg-gradient-to-br from-[#aa08f3]/10 to-[#aa08f3]/5 rounded-2xl border-2 border-[#aa08f3]/20 p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-4 sulphur-point-bold">
            How AI Practice Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-[#aa08f3] text-white rounded-lg flex items-center justify-center font-bold sulphur-point-bold">
                1
              </div>
              <h4 className="font-semibold text-slate-900 sulphur-point-bold">
                AI Analyzes Your Profile
              </h4>
              <p className="text-sm text-slate-600 sulphur-point-regular">
                Based on your AI notes and progress, the system identifies your strengths and areas to improve
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-[#aa08f3] text-white rounded-lg flex items-center justify-center font-bold sulphur-point-bold">
                2
              </div>
              <h4 className="font-semibold text-slate-900 sulphur-point-bold">
                Selects Perfect Questions
              </h4>
              <p className="text-sm text-slate-600 sulphur-point-regular">
                From 60+ past paper questions, AI picks 2-3 that best match your learning needs
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-[#aa08f3] text-white rounded-lg flex items-center justify-center font-bold sulphur-point-bold">
                3
              </div>
              <h4 className="font-semibold text-slate-900 sulphur-point-bold">
                Guides Your Practice
              </h4>
              <p className="text-sm text-slate-600 sulphur-point-regular">
                Step-by-step guidance, model examples, and personalized tips help you improve
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Practice;
