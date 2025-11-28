/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import SiriOrb from '../components/ui/siri-orb';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

interface OnboardingData {
  examStruggles?: string[];
  markingResult?: any;
  weaknessQuestionType?: string;
  weaknessEssay?: string;
}

interface StudyPlan {
  overview: string;
  targets: {
    target_grade: string;
    time_frame_weeks: number;
    weekly_hours: number;
  };
  diagnosis: string[];
  strengths: string[];
  weaknesses: string[];
  priorities: string[];
  weekly_plan: any[];
  daily_micro_tasks: Record<string, string[]>;
  exam_drills: string[];
  feedback_loops: string[];
  resources: string[];
  reflection_prompts: string[];
}

const StudyPlanGeneration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<'generating' | 'success' | 'error'>('generating');
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>('');

  const onboardingData = location.state?.onboardingData as OnboardingData | undefined;

  const generatePlan = useCallback(async () => {
    if (!onboardingData) return;

    try {
      setStatus('generating');

      const { data, error } = await supabase
        .from('study_plan')
        .select('plan_data')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data?.plan_data) throw new Error('No study plan found. Please redo onboarding.');

      const generatedPlan = data.plan_data as StudyPlan;
      setPlan(generatedPlan);

      const explanation = `Your personalized ${generatedPlan.targets.weekly_hours}-hour weekly plan (target: ${generatedPlan.targets.target_grade}, timeline: ${generatedPlan.targets.time_frame_weeks} weeks) is ready. It contains week-by-week drills, daily micro tasks, and checkpoints focused on your priority weaknesses.`;
      setAiExplanation(explanation);
      setStatus('success');

      setTimeout(() => {
        navigate('/dashboard');
      }, 8000);
    } catch (err) {
      console.error('[StudyPlan] Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate study plan');
      setStatus('error');
    }
  }, [navigate, onboardingData, user?.id]);

  useEffect(() => {
    if (!user || !onboardingData) {
      navigate('/dashboard');
      return;
    }

    generatePlan();
  }, [user, onboardingData, generatePlan, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #7c3aed 100%)" }}>
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
                <InfoCard label="Target Grade" value={plan.targets.target_grade} />
                <InfoCard label="Weekly Hours" value={`${plan.targets.weekly_hours}h`} />
                <InfoCard label="Timeline" value={`${plan.targets.time_frame_weeks} weeks`} />
              </div>

              <Section title="Overview" items={[plan.overview]} />
              <Section title="Diagnosis" items={plan.diagnosis} />
              <Section title="Strengths" items={plan.strengths} />
              <Section title="Weaknesses" items={plan.weaknesses} />
              <Section title="Priorities" items={plan.priorities} />

              <div className="space-y-4">
                <h3 className="text-xl font-bold sulphur-point-bold">Weekly Plan</h3>
                <div className="space-y-3">
                  {plan.weekly_plan.map((week, idx) => (
                    <div key={idx} className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-sm sulphur-point-bold text-slate-500">
                        Week {week.week_number}: {week.theme}
                      </p>
                      <GridList label="Goals" items={week.goals} />
                      <GridList label="Focus Papers" items={week.focus_papers} />
                      <GridList label="Writing Tasks" items={week.writing_tasks} />
                      <GridList label="Reading Tasks" items={week.reading_tasks} />
                      <GridList label="Drills" items={week.drills} />
                      <GridList label="Checkpoints" items={week.checkpoints} />
                    </div>
                  ))}
                </div>
              </div>

              <Section
                title="Daily Micro Tasks"
                items={Object.entries(plan.daily_micro_tasks).map(
                  ([day, tasks]) => `${day}: ${tasks.join('; ')}`
                )}
              />
              <Section title="Exam Drills" items={plan.exam_drills} />
              <Section title="Feedback Loops" items={plan.feedback_loops} />
              <Section title="Resources" items={plan.resources} />
              <Section title="Reflection Prompts" items={plan.reflection_prompts} />
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

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
    <p className="text-sm text-slate-600 dark:text-slate-400 sulphur-point-bold">{label}</p>
    <p className="text-3xl font-bold mt-2 sulphur-point-bold" style={{ color: '#aa08f3' }}>
      {value}
    </p>
  </div>
);

const Section = ({ title, items }: { title: string; items: string[] }) => {
  if (!items || !items.length) return null;
  return (
    <div className="space-y-2 text-left">
      <h3 className="text-xl font-bold sulphur-point-bold">{title}</h3>
      <ul className="grid gap-2">
        {items.map((item, idx) => (
          <li key={idx} className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const GridList = ({ label, items }: { label: string; items: string[] }) => {
  if (!items || !items.length) return null;
  return (
    <div className="mt-2">
      <p className="text-xs uppercase tracking-wide sulphur-point-bold text-slate-500">{label}</p>
      <ul className="grid gap-1 mt-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-slate-700 dark:text-slate-200">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
};
