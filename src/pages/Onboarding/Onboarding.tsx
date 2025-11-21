import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingData {
  readingSkill: number;
  writingSkill: number;
  analysisSkill: number;
  examStruggles: string[];
  difficultyExplanation: string;
  studyMethods: string[];
  studyTimeAvailability: string;
  planPreference: string;
  stressLevel: number;
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<OnboardingData>({
    readingSkill: 3,
    writingSkill: 3,
    analysisSkill: 3,
    examStruggles: [],
    difficultyExplanation: '',
    studyMethods: [],
    studyTimeAvailability: '',
    planPreference: '',
    stressLevel: 3,
  });

  const totalSteps = 10;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
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
        study_methods: formData.studyMethods,
        study_time_availability: formData.studyTimeAvailability,
        plan_preference: formData.planPreference,
        stress_level: formData.stressLevel,
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              How confident are you with your reading skills?
            </h2>
            <p className="text-gray-600">Rate your ability to analyze and understand complex texts</p>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, readingSkill: level })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    formData.readingSkill === level
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Level {level}</span>
                    <span className="text-sm text-gray-600">
                      {level === 1 && 'Struggling'}
                      {level === 2 && 'Below Average'}
                      {level === 3 && 'Average'}
                      {level === 4 && 'Good'}
                      {level === 5 && 'Excellent'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              How about your writing skills?
            </h2>
            <p className="text-gray-600">Rate your ability to write clear, structured responses</p>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, writingSkill: level })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    formData.writingSkill === level
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Level {level}</span>
                    <span className="text-sm text-gray-600">
                      {level === 1 && 'Struggling'}
                      {level === 2 && 'Below Average'}
                      {level === 3 && 'Average'}
                      {level === 4 && 'Good'}
                      {level === 5 && 'Excellent'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              How confident are you with literary analysis?
            </h2>
            <p className="text-gray-600">Rate your ability to analyze themes, techniques, and author choices</p>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, analysisSkill: level })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    formData.analysisSkill === level
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Level {level}</span>
                    <span className="text-sm text-gray-600">
                      {level === 1 && 'Struggling'}
                      {level === 2 && 'Below Average'}
                      {level === 3 && 'Average'}
                      {level === 4 && 'Good'}
                      {level === 5 && 'Excellent'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Which exam papers do you struggle with most?
            </h2>
            <p className="text-gray-600">Select all that apply</p>
            <div className="space-y-3">
              {[
                'Paper 1: Guided Literary Analysis',
                'Paper 2: Comparative Essay',
                'Understanding question requirements',
                'Time management during exam',
                'Structuring my responses',
                'Finding relevant evidence',
              ].map(struggle => (
                <button
                  key={struggle}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      examStruggles: toggleArrayItem(formData.examStruggles, struggle),
                    })
                  }
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    formData.examStruggles.includes(struggle)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {struggle}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Tell us more about your difficulties
            </h2>
            <p className="text-gray-600">Help us understand what you find most challenging</p>
            <textarea
              value={formData.difficultyExplanation}
              onChange={(e) => setFormData({ ...formData, difficultyExplanation: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the specific areas where you need the most help..."
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              How do you prefer to study?
            </h2>
            <p className="text-gray-600">Select your preferred study methods</p>
            <div className="space-y-3">
              {[
                'Reading notes and guides',
                'Watching video explanations',
                'Practice questions',
                'Flashcards and quick reviews',
                'Discussion with AI tutor',
                'Writing practice essays',
              ].map(method => (
                <button
                  key={method}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      studyMethods: toggleArrayItem(formData.studyMethods, method),
                    })
                  }
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    formData.studyMethods.includes(method)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              How much time can you dedicate to studying?
            </h2>
            <p className="text-gray-600">Help us create a realistic study plan</p>
            <div className="space-y-3">
              {[
                '1-2 hours per week',
                '3-5 hours per week',
                '6-10 hours per week',
                '10+ hours per week',
              ].map(time => (
                <button
                  key={time}
                  onClick={() => setFormData({ ...formData, studyTimeAvailability: time })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    formData.studyTimeAvailability === time
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              What type of study plan works best for you?
            </h2>
            <p className="text-gray-600">Choose your preferred planning style</p>
            <div className="space-y-3">
              {[
                { value: 'structured', label: 'Structured Daily Schedule', desc: 'Fixed daily tasks and routines' },
                { value: 'flexible', label: 'Flexible Weekly Goals', desc: 'Complete tasks at your own pace' },
                { value: 'intensive', label: 'Intensive Focus Sessions', desc: 'Longer, deeper study sessions' },
                { value: 'mixed', label: 'Mixed Approach', desc: 'Combination of different methods' },
              ].map(plan => (
                <button
                  key={plan.value}
                  onClick={() => setFormData({ ...formData, planPreference: plan.value })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    formData.planPreference === plan.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{plan.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{plan.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              How stressed do you feel about the exam?
            </h2>
            <p className="text-gray-600">Understanding your stress level helps us support you better</p>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, stressLevel: level })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    formData.stressLevel === level
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Level {level}</span>
                    <span className="text-sm text-gray-600">
                      {level === 1 && 'Relaxed'}
                      {level === 2 && 'Slightly Concerned'}
                      {level === 3 && 'Moderately Stressed'}
                      {level === 4 && 'Very Stressed'}
                      {level === 5 && 'Extremely Stressed'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              You're all set!
            </h2>
            <p className="text-gray-600">
              We've created a personalized study plan based on your responses. Let's start your journey to exam success!
            </p>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl space-y-4">
              <h3 className="font-semibold text-gray-900">Your Profile Summary:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Reading:</span>
                  <span className="ml-2 font-medium">Level {formData.readingSkill}</span>
                </div>
                <div>
                  <span className="text-gray-600">Writing:</span>
                  <span className="ml-2 font-medium">Level {formData.writingSkill}</span>
                </div>
                <div>
                  <span className="text-gray-600">Analysis:</span>
                  <span className="ml-2 font-medium">Level {formData.analysisSkill}</span>
                </div>
                <div>
                  <span className="text-gray-600">Study Time:</span>
                  <span className="ml-2 font-medium">{formData.studyTimeAvailability}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {renderStep()}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Creating your plan...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
