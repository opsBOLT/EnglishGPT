import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateStudyPlan, StudyPlan, OnboardingData } from '../services/openrouter';
import { supabase } from '../lib/supabase';
import SiriOrb from '../components/ui/siri-orb';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

const StudyPlanGeneration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<'generating' | 'success' | 'error'>('generating');
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>('');

  const onboardingData = location.state?.onboardingData as OnboardingData | undefined;

  useEffect(() => {
    if (!user || !onboardingData) {
      navigate('/dashboard');
      return;
    }

    generatePlan();
  }, [user, onboardingData]);

  const generatePlan = async () => {
    if (!onboardingData) return;

    try {
      setStatus('generating');
      const generatedPlan = await generateStudyPlan(onboardingData);
      setPlan(generatedPlan);

      // Save to database
      const { error: dbError } = await supabase
        .from('study_plans')
        .insert({
          user_id: user?.id,
          plan_data: generatedPlan,
          target_grade: generatedPlan.targetGrade,
          weekly_hours: generatedPlan.weeklyHours,
          is_active: true,
        });

      if (dbError) {
        console.error('[StudyPlan] Failed to save to database:', dbError);
      }

      // Generate AI explanation
      const explanation = `I've created your personalized ${generatedPlan.weeklyHours}-hour weekly study plan targeting a ${generatedPlan.targetGrade} grade. We'll focus on ${generatedPlan.keyFocusAreas.join(', ')}, with daily tasks designed to strengthen your weakest areas first.`;

      setAiExplanation(explanation);
      setStatus('success');

      // Redirect to dashboard after 8 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 8000);
    } catch (err) {
      console.error('[StudyPlan] Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate study plan');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* AI Orb */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <SiriOrb
            size="256px"
            animationDuration={status === 'generating' ? 8 : 20}
            className="drop-shadow-2xl"
          />
        </motion.div>

        {/* Status and Explanation */}
        <div className="text-center space-y-6">
          {status === 'generating' && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-3"
              >
                <Loader className="w-6 h-6 animate-spin" style={{ color: '#aa08f3' }} />
                <h2 className="text-3xl font-bold sulphur-point-bold" style={{ color: '#aa08f3' }}>
                  Generating Your Study Plan
                </h2>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg text-slate-600 dark:text-slate-300 sulphur-point-regular"
              >
                Analyzing your skills and creating a personalized learning path...
              </motion.p>
            </>
          )}

          {status === 'success' && plan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold sulphur-point-bold text-slate-900 dark:text-slate-100">
                Your Study Plan is Ready!
              </h2>

              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
                <TextGenerateEffect
                  words={aiExplanation}
                  duration={0.3}
                  className="sulphur-point-regular"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 sulphur-point-bold">Target Grade</p>
                  <p className="text-4xl font-bold mt-2 sulphur-point-bold" style={{ color: '#aa08f3' }}>
                    {plan.targetGrade}
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 sulphur-point-bold">Weekly Hours</p>
                  <p className="text-4xl font-bold mt-2 sulphur-point-bold" style={{ color: '#aa08f3' }}>
                    {plan.weeklyHours}h
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 sulphur-point-bold">Duration</p>
                  <p className="text-4xl font-bold mt-2 sulphur-point-bold" style={{ color: '#aa08f3' }}>
                    4w
                  </p>
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                className="text-slate-600 dark:text-slate-400 sulphur-point-regular"
              >
                Redirecting to your dashboard...
              </motion.p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-3xl font-bold sulphur-point-bold text-red-600">
                Something Went Wrong
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 sulphur-point-regular">
                {error || 'Failed to generate your study plan'}
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 rounded-xl font-bold sulphur-point-bold transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: '#aa08f3', color: 'white' }}
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlanGeneration;
