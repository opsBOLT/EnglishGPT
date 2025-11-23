import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { PixelAnimation } from '../../components/PixelAnimation';

interface OnboardingData {
  readingSkill: 'A' | 'B' | 'C' | 'D' | '';
  writingSkill: 'A' | 'B' | 'C' | 'D' | '';
  analysisSkill: 'A' | 'B' | 'C' | 'D' | '';
  examStruggles: string[];
  difficultyExplanation: string;
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<OnboardingData>({
    readingSkill: '',
    writingSkill: '',
    analysisSkill: '',
    examStruggles: [],
    difficultyExplanation: '',
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setDirection('forward');
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection('backward');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('onboarding_responses').insert({
        user_id: user.id,
        reading_skill: formData.readingSkill,
        writing_skill: formData.writingSkill,
        analysis_skill: formData.analysisSkill,
        exam_struggles: formData.examStruggles,
        difficulty_explanation: formData.difficultyExplanation,
      });

      if (error) throw error;

      await updateProfile({ onboarding_completed: true });

      const progressCategories = ['paper1', 'paper2', 'examples', 'text_types', 'vocabulary'];
      const progressInserts = progressCategories.map(category => ({
        user_id: user.id,
        category,
        sections_completed: 0,
        total_sections: 10,
        quiz_average: 0,
      }));

      await supabase.from('student_progress').insert(progressInserts);

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const getQuestionContent = (): {
    section: string;
    question: string;
    subtitle?: string;
    type: 'single' | 'multiple' | 'text';
    field: string;
    options?: { value: string; label: string }[] | string[];
    placeholder?: string;
  } | null => {
    switch (currentStep) {
      case 1:
        return {
          section: 'Section 1: Reading, Writing & Analysis Skills',
          question: 'When you read an exam text, what usually happens first?',
          type: 'single' as const,
          field: 'readingSkill',
          options: [
            { value: 'A', label: 'I get confused by long paragraphs or unfamiliar vocabulary' },
            { value: 'B', label: 'I understand the basic story/info but miss deeper meaning' },
            { value: 'C', label: 'I understand most things but struggle to find the best evidence' },
            { value: 'D', label: 'I understand the text well and can spot deeper meanings' },
          ],
        };
      case 2:
        return {
          section: 'Section 1: Reading, Writing & Analysis Skills',
          question: 'When you write exam answers, what feels hardest?',
          type: 'single',
          field: 'writingSkill',
          options: [
            { value: 'A', label: 'Starting the answer / organising my ideas' },
            { value: 'B', label: 'Writing clearly with correct grammar' },
            { value: 'C', label: 'Adding deeper analysis / explaining effects' },
            { value: 'D', label: 'Writing fast enough under time pressure' },
          ],
        };
      case 3:
        return {
          section: 'Section 1: Reading, Writing & Analysis Skills',
          question: 'When analyzing language, what do you normally write?',
          type: 'single',
          field: 'analysisSkill',
          options: [
            { value: 'A', label: 'I mostly label techniques (simile, metaphor, etc.)' },
            { value: 'B', label: 'I describe what the quote shows' },
            { value: 'C', label: 'I try to explain the effect but it feels shallow' },
            { value: 'D', label: 'I can explain deeper effects confidently' },
          ],
        };
      case 4:
        return {
          section: 'Section 2: Specific Paper Weaknesses',
          question: 'Which paper questions do you struggle with most?',
          subtitle: 'Select as many as apply',
          type: 'multiple',
          field: 'examStruggles',
          options: [
            'Paper 1 Q1 (a-e) - Simple Comprehension',
            'Paper 1 Q1f - Summary',
            'Paper 1 Q2(a-c) - Comprehension and Vocabulary',
            'Paper 1 Q2d - Writer\'s Effect',
            'Paper 1 Q3 - Extended Response',
            'Paper 2 Q1 - Directed Writing',
            'Paper 2 Q2 - Narrative',
            'Paper 2 Q2 - Descriptive',
            'I\'m not sure — I need help identifying them',
          ],
        };
      case 5:
        return {
          section: 'Section 2: Specific Paper Weaknesses',
          question: 'If you know why you struggle with any of those questions, what\'s the reason?',
          subtitle: 'Explain in one or two sentences why these questions feel difficult',
          type: 'text',
          field: 'difficultyExplanation',
          placeholder: 'For example: "I never know how to start my answer for Q2d" or "I run out of time on Q3 because I write too slowly"',
        };
      default:
        return null;
    }
  };

  const content = getQuestionContent();

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Pixel Animation Background */}
      <div className="absolute inset-0 z-0">
        <PixelAnimation
          colorHueStart={280}
          colorHueRange={40}
          pixelGap={8}
          animationSpeed={0.2}
          animationDuration={400}
        />
      </div>

      {/* Content */}
      <div className="w-full h-screen flex items-center justify-center relative z-10 px-8">
        <div className="w-full max-w-7xl grid grid-cols-2 gap-16 items-center">
          {/* Left Side - Question */}
          <div
            key={`question-${currentStep}`}
            className="space-y-6 animate-slide-in-left"
            style={{
              animation: direction === 'forward' ? 'slideInLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium sulphur-point-regular" style={{ color: '#6a0bbd' }}>
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm font-medium sulphur-point-regular" style={{ color: '#6a0bbd' }}>
                  {Math.round((currentStep / totalSteps) * 100)}%
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${(currentStep / totalSteps) * 100}%`,
                    backgroundColor: '#aa08f3',
                  }}
                />
              </div>
            </div>

            {/* Section Label */}
            <div className="opacity-60">
              <p className="text-sm font-bold tracking-wider sulphur-point-bold uppercase" style={{ color: '#aa08f3' }}>
                {content?.section}
              </p>
            </div>

            {/* Question */}
            <div className="space-y-4">
              <h1
                className="text-5xl font-bold sulphur-point-bold leading-tight"
                style={{ color: '#2b0c44' }}
              >
                {content?.question}
              </h1>
              {content?.subtitle && (
                <p className="text-xl sulphur-point-regular" style={{ color: '#6a0bbd' }}>
                  {content.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Side - Options */}
          <div
            key={`options-${currentStep}`}
            className="space-y-4"
            style={{
              animation: direction === 'forward' ? 'slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'slideInLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {content?.type === 'single' && content.options && (
              <div className="space-y-3">
                {(content.options as { value: string; label: string }[]).map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, [content.field]: option.value })}
                    className="w-full p-6 rounded-2xl text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 group"
                    style={{
                      backgroundColor: formData[content.field as keyof OnboardingData] === option.value
                        ? 'rgba(170, 8, 243, 0.3)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: formData[content.field as keyof OnboardingData] === option.value
                        ? '2px solid #aa08f3'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      animationDelay: `${index * 0.1}s`,
                      animation: 'fadeInUp 0.5s ease-out backwards',
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <span
                        className="font-bold text-2xl sulphur-point-bold transition-colors duration-300"
                        style={{
                          color: formData[content.field as keyof OnboardingData] === option.value ? '#aa08f3' : 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {option.value}.
                      </span>
                      <span
                        className="text-lg sulphur-point-regular group-hover:text-white/90 transition-colors duration-300"
                        style={{
                          color: formData[content.field as keyof OnboardingData] === option.value ? '#ffffff' : '#2b0c44',
                        }}
                      >
                        {option.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {content?.type === 'multiple' && content.options && (
              <div className="space-y-3">
                {(content.options as string[]).map((option, index) => (
                  <button
                    key={option}
                    onClick={() => setFormData({
                      ...formData,
                      examStruggles: toggleArrayItem(formData.examStruggles, option),
                    })}
                    className="w-full p-6 rounded-2xl text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                    style={{
                      backgroundColor: formData.examStruggles.includes(option)
                        ? 'rgba(170, 8, 243, 0.3)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: formData.examStruggles.includes(option)
                        ? '2px solid #aa08f3'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      animationDelay: `${index * 0.1}s`,
                      animation: 'fadeInUp 0.5s ease-out backwards',
                    }}
                  >
                    <span
                      className="text-lg sulphur-point-regular transition-colors duration-300"
                      style={{
                        color: formData.examStruggles.includes(option) ? '#ffffff' : '#2b0c44',
                      }}
                    >
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {content?.type === 'text' && (
              <div style={{ animation: 'fadeInUp 0.5s ease-out backwards' }}>
                <textarea
                  value={formData.difficultyExplanation}
                  onChange={(e) => setFormData({ ...formData, difficultyExplanation: e.target.value })}
                  rows={8}
                  className="w-full px-6 py-4 rounded-2xl text-white text-lg sulphur-point-regular transition-all duration-300 focus:scale-105"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                  }}
                  placeholder={content.placeholder}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#aa08f3';
                    e.target.style.backgroundColor = 'rgba(170, 8, 243, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: '#aa08f3' }} />
                <span className="text-white sulphur-point-bold">Back</span>
              </button>

              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-110 sulphur-point-bold"
                  style={{
                    backgroundColor: '#aa08f3',
                    color: 'white',
                  }}
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-110 disabled:opacity-50 sulphur-point-bold"
                  style={{
                    backgroundColor: '#aa08f3',
                    color: 'white',
                  }}
                >
                  {loading ? 'Creating your plan...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        ::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
