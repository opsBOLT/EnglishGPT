/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useSearchParams, Link } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import SiriOrb from '../../components/ui/siri-orb';
import { TextGenerateEffect } from '../../components/ui/text-generate-effect';
import XScroll from '../../components/ui/x-scroll';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Target, TrendingUp, Calendar, CheckCircle2, Play } from 'lucide-react';
import SnowballSpinner from '../../components/SnowballSpinner';
import { AIInputWithLoading } from '../../components/ui/ai-input-with-loading';
import { Button as ThreeDButton } from '../../components/ui/3d-button';
import { useStudyPlan, useTaskCompletion } from '../../hooks/useStudyPlatform';
import type { NormalizedStudyPlan } from '../../services/studyPlan';
import WeeklyPlanView from '../../components/StudyPlan/WeeklyPlanView';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  day: string;
  completed: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isTestMode = searchParams.get('test') === 'true';
  const [visitLoading, setVisitLoading] = useState(false);
  const [mockPlan, setMockPlan] = useState<NormalizedStudyPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiMessage, setAiMessage] = useState('');
  const [hasVisitedBefore, setHasVisitedBefore] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const {
    plan,
    loading: planLoading,
    error: planError,
    regeneratePlan,
    refetch: refetchPlan,
  } = useStudyPlan(isTestMode ? '' : user?.id || '');

  const activePlan: NormalizedStudyPlan | null = useMemo(
    () => (isTestMode ? mockPlan : plan),
    [isTestMode, mockPlan, plan]
  );

  const planId = activePlan?.plan_id || '';

  const {
    completions,
    loading: completionLoading,
    markComplete,
    isTaskComplete,
    refetch: refetchCompletions,
  } = useTaskCompletion(isTestMode ? '' : user?.id || '', planId);

  const loading =
    (isTestMode && !mockPlan) ||
    (!isTestMode && (planLoading || visitLoading)) ||
    completionLoading;

  useEffect(() => {
    if (!user || isTestMode) return;

    let canceled = false;
    const trackVisits = async () => {
      setVisitLoading(true);
      const { data: visitData } = await supabase
        .from('user_metadata')
        .select('dashboard_visits')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!canceled && visitData && visitData.dashboard_visits > 0) {
        setHasVisitedBefore(true);
      }

      await supabase
        .from('user_metadata')
        .upsert({
          user_id: user.id,
          dashboard_visits: (visitData?.dashboard_visits || 0) + 1,
          last_visit: new Date().toISOString()
        });

      if (!canceled) {
        setVisitLoading(false);
      }
    };

    void trackVisits();
    return () => {
      canceled = true;
    };
  }, [user, isTestMode]);

  const deriveTodayTasks = useCallback((planSource?: NormalizedStudyPlan | null) => {
    if (!planSource?.weeks || planSource.weeks.length === 0) {
      setTasks([]);
      return;
    }

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const activeWeek = planSource.weeks.find(week => {
      if (!week.start_date) return false;
      const start = new Date(week.start_date);
      const diffDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays < 7;
    }) || planSource.weeks[0];

    const todaySchedule = activeWeek?.daily_tasks?.find(d => d.day.toLowerCase() === dayName);
    if (!todaySchedule) {
      setTasks([]);
      return;
    }

    const mapped: Task[] = (todaySchedule.tasks || []).map(task => ({
      id: task.id,
      title: task.title || 'Study Task',
      description: task.description || '',
      category: task.category || 'paper1',
      duration: `${task.duration_minutes || 30} min`,
      day: dayName,
      completed: isTaskComplete(task.id),
    }));

    setTasks(mapped);
  }, [isTaskComplete]);

  const loadMockData = useCallback(() => {
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const mock: NormalizedStudyPlan = {
      plan_id: 'mock-plan',
      generated_at: new Date().toISOString(),
      version: 1,
      overview: 'A comprehensive 4-week study plan focused on strengthening analytical writing and comprehension skills with daily vocabulary and example analysis.',
      targets: {
        target_grade: 'A*',
        time_frame_weeks: 4,
        weekly_hours: 8,
      },
      diagnosis: ['Writer\'s effect analysis needs more depth', 'Timed responses fall short on concision'],
      strengths: ['Good descriptive detail when given time'],
      weaknesses: ['Timing under pressure', 'Concise paraphrasing'],
      priorities: ['Writer\'s Effect', 'Descriptive Writing', 'Vocabulary Range'],
      weeks: [{
        week_number: 1,
        theme: 'Writer\'s Effect Fundamentals',
        goals: ['Identify strong images', 'Explain effect on reader'],
        focus_papers: ['Paper 1 Q2d'],
        checkpoints: ['Score 6/10 under 12 minutes', 'Use QME structure consistently', 'Complete one timed drill'],
        daily_tasks: [{
          day: dayName,
          tasks: [
            {
              id: 'mock-1',
              title: 'Analyze Writer\'s Effect Techniques',
              description: 'Identify 3 images and explain their effect on mood and reader.',
              category: 'paper1',
              duration_minutes: 45,
              status: 'pending',
            } as any,
            {
              id: 'mock-2',
              title: 'Practice Descriptive Writing',
              description: '300-word piece with 5 sensory details and 3 ambitious verbs.',
              category: 'paper2',
              duration_minutes: 40,
              status: 'pending',
            } as any,
            {
              id: 'mock-3',
              title: 'Vocabulary Building Session',
              description: 'Learn 10 new precision verbs and use them in sentences.',
              category: 'vocabulary',
              duration_minutes: 30,
              status: 'pending',
            } as any,
          ],
        }],
      }],
      weekly_plan: [],
      daily_micro_tasks: {},
      exam_drills: [],
      feedback_loops: [],
      resources: [],
      reflection_prompts: [],
    };

    setMockPlan(mock);
    const todayTasks =
      mock.weeks?.[0]?.daily_tasks?.find(d => d.day === dayName)?.tasks ||
      mock.weeks?.[0]?.daily_tasks?.[0]?.tasks ||
      [];

    setTasks(todayTasks.map(task => ({
      id: task.id,
      title: task.title || 'Task',
      description: task.description || '',
      category: task.category || 'paper1',
      duration: `${task.duration_minutes || 30} min`,
      day: dayName,
      completed: false,
    })));

    const greeting = getGreeting();
    setAiMessage(`${greeting}, ${user?.full_name || 'learner'}! This is a test study plan designed to help you reach an A* grade. Today we're focusing on Writer's Effect Analysis and Descriptive Writing. Let's strengthen your analytical skills and creative writing together!`);
  }, [user?.full_name]);

  useEffect(() => {
    if (isTestMode) {
      loadMockData();
    }
  }, [isTestMode, loadMockData]);

  useEffect(() => {
    deriveTodayTasks(activePlan);
  }, [activePlan, completions, deriveTodayTasks]);

  useEffect(() => {
    if (!activePlan || chatMessages.length > 0) return;
    const greeting = getGreeting();
    const focusArea = activePlan.priorities?.[0] || activePlan.diagnosis?.[0] || 'your studies';
    setAiMessage(`${greeting}, ${user?.full_name || 'learner'}. Today we're focusing on ${focusArea}.`);
  }, [activePlan, user?.full_name, chatMessages.length]);

  const handleCompleteTask = async (taskId: string, weekNumber: number, day: string) => {
    if (isTestMode) return;
    const success = await markComplete(taskId, weekNumber, day);
    if (success) {
      await Promise.all([refetchCompletions(), refetchPlan()]);
      deriveTodayTasks(activePlan);
    }
  };

  const handleRegenerate = async () => {
    if (isTestMode) return;
    setRegenerating(true);
    const success = await regeneratePlan();
    if (success) {
      await Promise.all([refetchCompletions(), refetchPlan()]);
    }
    setRegenerating(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      paper1: '#3b82f6',
      paper2: '#10b981',
      vocabulary: '#f59e0b',
      examples: '#ec4899',
      text_types: '#8b5cf6',
    };
    return colors[category] || '#aa08f3';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      paper1: BookOpen,
      paper2: Target,
      vocabulary: TrendingUp,
      examples: CheckCircle2,
      text_types: Calendar,
    };
    const Icon = icons[category] || BookOpen;
    return <Icon className="w-5 h-5" />;
  };

  const handleAIChatSubmit = async (message: string) => {
    if (!activePlan) return;

    setChatMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      // TODO: Implement AI chat with proper backend
      const response = {
        content: 'I\'m here to help with your IGCSE English studies! This feature is currently being updated.'
      };
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
    } catch (error) {
      console.error('[Dashboard] AI chat error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <SnowballSpinner size="lg" label="Loading your dashboard..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        {planError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <p className="font-semibold">Study plan unavailable</p>
            <p className="text-sm">{planError}</p>
          </div>
        )}

        {/* Header with AI Orb and Info/Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-4 sm:gap-6 lg:gap-8 items-start">
          {/* AI Orb */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="flex justify-center lg:justify-start"
          >
            <SiriOrb
              size="120px"
              animationDuration={15}
              className="drop-shadow-2xl sm:w-[140px] lg:w-[160px]"
            />
          </motion.div>

          {/* AI Explanation or Chat */}
          {!hasVisitedBefore ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-xl"
            >
              <TextGenerateEffect
                words={aiMessage}
                duration={0.3}
                className="sulphur-point-regular text-lg sm:text-xl lg:text-2xl"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-xl"
            >
              <h2 className="text-xl sm:text-2xl font-bold sulphur-point-bold text-slate-900 dark:text-slate-100 mb-3 sm:mb-4">
                Chat with your AI Study Assistant
              </h2>
              <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 sulphur-point-regular">
                    Ask me anything about your study plan, tasks, or IGCSE English topics!
                  </p>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-slate-100 dark:bg-slate-700 ml-4 sm:ml-8'
                          : 'bg-slate-50 dark:bg-slate-800 mr-4 sm:mr-8'
                      }`}
                    >
                      <p className="text-sm font-semibold sulphur-point-bold text-slate-900 dark:text-slate-100 mb-1">
                        {msg.role === 'user' ? 'You' : 'AI Assistant'}
                      </p>
                      <p className="text-sm sulphur-point-regular text-slate-700 dark:text-slate-300">
                        {msg.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <AIInputWithLoading
                placeholder="Ask about your study plan..."
                onSubmit={handleAIChatSubmit}
                loadingDuration={3000}
                className="py-0"
              />
            </motion.div>
          )}
        </div>

        {/* Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-3 sm:space-y-4"
        >
          <h2 className="text-xl sm:text-2xl font-bold sulphur-point-bold text-slate-900 dark:text-slate-100">
            Today's Tasks
          </h2>

          {tasks.length > 0 ? (
            <XScroll>
              <div className="flex gap-4 p-2 pb-6">
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                  >
                    <TaskCard task={task} color={getCategoryColor(task.category)} icon={getCategoryIcon(task.category)} />
                  </motion.div>
                ))}
              </div>
            </XScroll>
          ) : (
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 sulphur-point-regular">
                No tasks scheduled for today. Enjoy your break or start studying ahead!
              </p>
            </div>
          )}
        </motion.div>

        {/* More Info toggle */}
        {activePlan && (
          <div className="flex justify-center">
            <ThreeDButton
              onClick={() => setShowMore(prev => !prev)}
              variant="outline"
              className="mt-2"
            >
              {showMore ? 'Hide info' : 'More info'}
            </ThreeDButton>
          </div>
        )}

        {/* Study Plan Overview */}
        {activePlan && showMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <h2 className="text-xl sm:text-2xl font-bold sulphur-point-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-6">
              Your Study Plan
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-base sm:text-lg sulphur-point-regular text-slate-700 dark:text-slate-300">
                {activePlan.overview}
              </p>
              {activePlan.priorities && activePlan.priorities.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-bold sulphur-point-bold text-slate-900 dark:text-slate-100 mb-2">
                    Current Priorities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {activePlan.priorities.map((area: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold sulphur-point-bold"
                        style={{ backgroundColor: '#aa08f3', color: 'white' }}
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        {activePlan && showMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <StatCard
              label="Target Grade"
              value={activePlan.targets?.target_grade || 'A'}
              icon={<Target className="w-5 h-5" />}
              color="#aa08f3"
            />
            <StatCard
              label="Weekly Hours"
              value={`${activePlan.targets?.weekly_hours || 0}h`}
              icon={<Clock className="w-5 h-5" />}
              color="#3b82f6"
            />
            <StatCard
              label="Today's Tasks"
              value={tasks.length.toString()}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="#10b981"
            />
            <StatCard
              label="Focus Areas"
              value={activePlan.priorities?.length || 0}
              icon={<TrendingUp className="w-5 h-5" />}
              color="#f59e0b"
            />
          </motion.div>
        )}

        {activePlan && showMore && (
          <WeeklyPlanView
            plan={activePlan}
            completions={completions || []}
            onCompleteTask={handleCompleteTask}
            onRegenerate={isTestMode ? undefined : handleRegenerate}
            regenerating={regenerating}
          />
        )}
      </div>
    </MainLayout>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ label, value, icon, color }: StatCardProps) => (
  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-700 outline outline-4 outline-slate-100/50 dark:outline-slate-600/30 shadow-[0_10px_30px_rgba(15,23,42,0.12)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.18)] transition-all duration-300">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-semibold sulphur-point-bold text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <div style={{ color }}>{icon}</div>
    </div>
    <p className="text-2xl sm:text-3xl font-bold sulphur-point-bold" style={{ color }}>
      {value}
    </p>
  </div>
);

interface TaskCardProps {
  task: Task;
  color: string;
  icon: React.ReactNode;
}

const TaskCard = ({ task, color, icon }: TaskCardProps) => (
  <div
    className="min-w-[260px] sm:min-w-[300px] aspect-square bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl p-5 border-2 outline outline-4 outline-slate-100/60 dark:outline-slate-600/40 shadow-[0_14px_36px_rgba(17,24,39,0.14)] hover:shadow-[0_22px_48px_rgba(17,24,39,0.2)] transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4"
    style={{ borderColor: color }}
  >
    <div className="flex items-start justify-between">
      <div className="p-2.5 rounded-xl" style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm font-semibold sulphur-point-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {task.duration}
        </span>
        {task.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
      </div>
    </div>
    <div className="flex-1 flex items-center">
      <h3 className="text-base sm:text-lg font-bold sulphur-point-bold text-slate-900 dark:text-slate-100 leading-tight">
        {task.title}
      </h3>
    </div>
    <ThreeDButton asChild stretch className="justify-center">
      <Link to={`/study?category=${task.category}`} className="inline-flex items-center gap-2">
        <Play className="w-4 h-4" />
        Study now
      </Link>
    </ThreeDButton>
  </div>
);

export default Dashboard;
