import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import SiriOrb from '../../components/ui/siri-orb';
import { TextGenerateEffect } from '../../components/ui/text-generate-effect';
import XScroll from '../../components/ui/x-scroll';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Target, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import SnowballSpinner from '../../components/SnowballSpinner';
import { AIInputWithLoading } from '../../components/ui/ai-input-with-loading';
import { callOpenRouter, Message } from '../../services/openrouter';

interface StudyPlan {
  id: string;
  plan_data: any;
  target_grade: string;
  weekly_hours: number;
  is_active: boolean;
}

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

const DashboardNew = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isTestMode = searchParams.get('test') === 'true';
  const [loading, setLoading] = useState(true);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiMessage, setAiMessage] = useState('');
  const [hasVisitedBefore, setHasVisitedBefore] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (user) {
      if (isTestMode) {
        loadMockData();
      } else {
        loadDashboardData();
      }
    }
  }, [user, isTestMode]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: visitData } = await supabase
        .from('user_metadata')
        .select('dashboard_visits')
        .eq('user_id', user.id)
        .maybeSingle();

      if (visitData && visitData.dashboard_visits > 0) {
        setHasVisitedBefore(true);
      }

      await supabase
        .from('user_metadata')
        .upsert({
          user_id: user.id,
          dashboard_visits: (visitData?.dashboard_visits || 0) + 1,
          last_visit: new Date().toISOString()
        });

      const { data: planData, error: planError } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planError) throw planError;

      setStudyPlan(planData);

      // Extract today's tasks
      if (planData && planData.plan_data) {
        const dayOfWeek = new Date().getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = dayNames[dayOfWeek];

        const currentWeek = planData.plan_data.weeks?.[0];
        const todaySchedule = currentWeek?.daily_tasks?.find((d: any) => d.day === todayName);

        if (todaySchedule && todaySchedule.tasks) {
          const taskList: Task[] = todaySchedule.tasks.map((task: any, idx: number) => ({
            id: `task-${idx}`,
            title: task.title || 'Study Task',
            description: task.description || '',
            category: task.category || 'paper1',
            duration: task.duration || '30 min',
            day: todayName,
            completed: false,
          }));
          setTasks(taskList);
        }

        // Generate AI message
        const greeting = getGreeting();
        const focusArea = planData.plan_data.keyFocusAreas?.[0] || 'your studies';
        setAiMessage(`${greeting}, ${user.full_name || 'learner'}. Today we're focusing on ${focusArea}. Let's make progress together!`);
      } else {
        setAiMessage(`Welcome back, ${user.full_name || 'learner'}! Ready to start your learning journey?`);
      }
    } catch (error) {
      console.error('[Dashboard] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setLoading(true);

    // Mock study plan
    const mockPlan: StudyPlan = {
      id: 'test-plan-123',
      target_grade: 'A*',
      weekly_hours: 8,
      is_active: true,
      plan_data: {
        overview: 'A comprehensive 4-week study plan focused on strengthening your analytical writing and comprehension skills. This plan prioritizes Paper 1 Q2d (Writer\'s Effect) and Paper 2 Descriptive Writing, with daily practice in vocabulary enhancement and example response analysis.',
        keyFocusAreas: [
          'Writer\'s Effect Analysis',
          'Descriptive Writing Techniques',
          'Vocabulary Enhancement',
          'Quote Integration'
        ],
        weeks: [{
          week: 1,
          focus: 'Writer\'s Effect Fundamentals',
          daily_tasks: [{
            day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            tasks: [
              {
                title: 'Analyze Writer\'s Effect Techniques',
                description: 'Study how writers create mood and atmosphere through language choices. Focus on identifying techniques like metaphor, personification, and sensory details in sample passages.',
                category: 'paper1',
                duration: '45 min'
              },
              {
                title: 'Practice Descriptive Writing',
                description: 'Write a 300-word descriptive piece focusing on creating vivid imagery. Use at least 5 sensory details and 3 advanced vocabulary words.',
                category: 'paper2',
                duration: '40 min'
              },
              {
                title: 'Vocabulary Building Session',
                description: 'Learn 10 new advanced vocabulary words with example sentences. Practice using them in context to describe emotions and settings.',
                category: 'vocabulary',
                duration: '30 min'
              },
              {
                title: 'Study High-Level Examples',
                description: 'Review 2 A-grade example responses for Paper 1 Q2d. Annotate effective techniques and quote integration methods used by top students.',
                category: 'examples',
                duration: '35 min'
              },
              {
                title: 'Text Type Analysis',
                description: 'Study the criteria for descriptive writing. Create a checklist of essential elements: vocabulary, imagery, sentence variety, and structural coherence.',
                category: 'text_types',
                duration: '25 min'
              }
            ]
          }]
        }]
      }
    };

    setStudyPlan(mockPlan);

    // Mock tasks
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const mockTasks: Task[] = [
      {
        id: 'task-1',
        title: 'Analyze Writer\'s Effect Techniques',
        description: 'Study how writers create mood and atmosphere through language choices. Focus on identifying techniques like metaphor, personification, and sensory details in sample passages.',
        category: 'paper1',
        duration: '45 min',
        day: dayOfWeek,
        completed: false
      },
      {
        id: 'task-2',
        title: 'Practice Descriptive Writing',
        description: 'Write a 300-word descriptive piece focusing on creating vivid imagery. Use at least 5 sensory details and 3 advanced vocabulary words.',
        category: 'paper2',
        duration: '40 min',
        day: dayOfWeek,
        completed: false
      },
      {
        id: 'task-3',
        title: 'Vocabulary Building Session',
        description: 'Learn 10 new advanced vocabulary words with example sentences. Practice using them in context to describe emotions and settings.',
        category: 'vocabulary',
        duration: '30 min',
        day: dayOfWeek,
        completed: false
      },
      {
        id: 'task-4',
        title: 'Study High-Level Examples',
        description: 'Review 2 A-grade example responses for Paper 1 Q2d. Annotate effective techniques and quote integration methods used by top students.',
        category: 'examples',
        duration: '35 min',
        day: dayOfWeek,
        completed: false
      },
      {
        id: 'task-5',
        title: 'Text Type Analysis',
        description: 'Study the criteria for descriptive writing. Create a checklist of essential elements: vocabulary, imagery, sentence variety, and structural coherence.',
        category: 'text_types',
        duration: '25 min',
        day: dayOfWeek,
        completed: false
      }
    ];

    setTasks(mockTasks);

    // Mock AI message
    const greeting = getGreeting();
    setAiMessage(`${greeting}, ${user?.full_name || 'learner'}! This is a test study plan designed to help you reach an A* grade. Today we're focusing on Writer's Effect Analysis and Descriptive Writing. Your personalized plan includes 5 carefully curated tasks totaling 2 hours and 55 minutes of focused study. Let's strengthen your analytical skills and creative writing together!`);

    setLoading(false);
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
    if (!studyPlan) return;

    setChatMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const taskContext = tasks.map(t => `${t.title} (${t.category}, ${t.duration})`).join(', ');
      const focusAreas = studyPlan.plan_data?.keyFocusAreas?.join(', ') || 'general studies';

      const messages: Message[] = [
        {
          role: 'system',
          content: `You are a helpful IGCSE English study assistant. The student has a study plan targeting grade ${studyPlan.target_grade} with ${studyPlan.weekly_hours} hours per week. Today's tasks include: ${taskContext}. Key focus areas: ${focusAreas}. Provide concise, actionable advice to help them succeed.`
        },
        ...chatMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ];

      const response = await callOpenRouter(messages, false);
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

        {/* Study Plan Overview */}
        {studyPlan && studyPlan.plan_data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <h2 className="text-xl sm:text-2xl font-bold sulphur-point-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-6">
              Your Study Plan
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-base sm:text-lg sulphur-point-regular text-slate-700 dark:text-slate-300">
                {studyPlan.plan_data.overview}
              </p>
              {studyPlan.plan_data.keyFocusAreas && (
                <div>
                  <h3 className="text-base sm:text-lg font-bold sulphur-point-bold text-slate-900 dark:text-slate-100 mb-2">
                    Key Focus Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {studyPlan.plan_data.keyFocusAreas.map((area: string, idx: number) => (
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
        {studyPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <StatCard
              label="Target Grade"
              value={studyPlan.target_grade}
              icon={<Target className="w-5 h-5" />}
              color="#aa08f3"
            />
            <StatCard
              label="Weekly Hours"
              value={`${studyPlan.weekly_hours}h`}
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
              value={studyPlan.plan_data?.keyFocusAreas?.length || 0}
              icon={<TrendingUp className="w-5 h-5" />}
              color="#f59e0b"
            />
          </motion.div>
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
  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
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
    className="min-w-[280px] sm:min-w-[320px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    style={{ borderColor: color }}
  >
    <div className="flex items-start justify-between mb-3 sm:mb-4">
      <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-semibold sulphur-point-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
        {task.duration}
      </span>
    </div>
    <h3 className="text-base sm:text-lg font-bold sulphur-point-bold text-slate-900 dark:text-slate-100">
      {task.title}
    </h3>
  </div>
);

export default DashboardNew;
