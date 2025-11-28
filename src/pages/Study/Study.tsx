import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useStudyPlan, useTaskCompletion } from '../../hooks/useStudyPlatform';
import type { NormalizedStudyPlan, Task } from '../../services/studyPlan';
import { Loader2, Play } from 'lucide-react';
import { Button as ThreeDButton } from '../../components/ui/3d-button';

type StudyTaskCard = {
  id: string;
  title: string;
  description: string;
  category: Task['category'];
  duration: string;
  timeSlot: string;
  day: string;
  week: number;
  status: 'upcoming' | 'ongoing' | 'completed';
};

const categoryColors: Record<string, string> = {
  paper1: 'bg-[#f1e7ff] text-[#6f2dd2] border-[#e7d9ff]',
  paper2: 'bg-[#e6f8f1] text-[#0f9f6e] border-[#c9f1de]',
  examples: 'bg-[#fff6e5] text-[#c47a00] border-[#ffe5b3]',
  text_types: 'bg-[#ffe8f3] text-[#c13f86] border-[#ffd1e6]',
  vocabulary: 'bg-[#e6f5ff] text-[#0e82c6] border-[#caeaff]',
  general: 'bg-slate-100 text-slate-700 border-slate-200',
};

const categoryLabels: Record<string, string> = {
  paper1: 'Paper 1',
  paper2: 'Paper 2',
  examples: 'Examples',
  text_types: 'Text Types',
  vocabulary: 'Vocabulary',
  general: 'General',
};

const planCategoryToStudyCategory: Record<string, string> = {
  paper1: 'Paper 1 Guide/Revision',
  paper2: 'Paper 2 Guide/Revision',
  examples: 'High-Level Example Responses',
  text_types: 'Text Types Criteria',
  vocabulary: 'Vocabulary Improvement',
  general: 'Paper 1 Guide/Revision',
};

const Study = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTestMode = searchParams.get('test') === 'true';
  const { plan, loading: planLoading, error: planError } = useStudyPlan(isTestMode ? '' : user?.id || '');
  const {
    isTaskComplete,
    loading: completionLoading,
  } = useTaskCompletion(isTestMode ? '' : user?.id || '', plan?.plan_id || '');

  const [tasks, setTasks] = useState<StudyTaskCard[]>([]);

  const loading = planLoading || completionLoading;

  const activePlan: NormalizedStudyPlan | null = useMemo(() => plan || null, [plan]);

  useEffect(() => {
    if (isTestMode) {
      const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      setTasks([
        {
          id: 'mock-1',
          title: 'Analyze Writer’s Effect Techniques',
          description: 'Identify 3 images and explain their effect on mood and reader.',
          category: 'paper1',
          duration: '45 min',
          timeSlot: 'Morning',
          day: dayName,
          week: 1,
          status: 'upcoming',
        },
        {
          id: 'mock-2',
          title: 'Practice Descriptive Writing',
          description: '300-word piece with 5 sensory details and 3 ambitious verbs.',
          category: 'paper2',
          duration: '40 min',
          timeSlot: 'Afternoon',
          day: dayName,
          week: 1,
          status: 'upcoming',
        },
        {
          id: 'mock-3',
          title: 'Vocabulary Sprint',
          description: 'Learn 10 precision verbs and use them in sentences.',
          category: 'vocabulary',
          duration: '25 min',
          timeSlot: 'Evening',
          day: dayName,
          week: 1,
          status: 'upcoming',
        },
      ]);
      return;
    }

    if (!activePlan?.weeks || activePlan.weeks.length === 0) {
      setTasks([]);
      return;
    }

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const activeWeek =
      activePlan.weeks.find((week) => {
        if (!week.start_date) return false;
        const start = new Date(week.start_date);
        const diffDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays < 7;
      }) || activePlan.weeks[0];

    const todaySchedule = activeWeek?.daily_tasks?.find(
      (d) => d.day.toLowerCase() === dayName
    );

    const mapped: StudyTaskCard[] = (todaySchedule?.tasks || []).map((task) => {
      const category = task.category || 'general';
      return {
        id: task.id,
        title: task.title || 'Study Task',
        description: task.description || '',
        category,
        duration: `${task.duration_minutes || 30} min`,
        timeSlot: task.time_slot || `${task.duration_minutes || 30} min`,
        day: dayName,
        week: activeWeek?.week_number || 1,
        status: isTaskComplete(task.id)
          ? 'completed'
          : task.status === 'in_progress'
            ? 'ongoing'
            : 'upcoming',
      };
    });

    setTasks(mapped);
  }, [activePlan, isTaskComplete, isTestMode]);

  const handleStart = (task: StudyTaskCard) => {
    const categoryId =
      planCategoryToStudyCategory[task.category] || planCategoryToStudyCategory.general;
    navigate(`/study/session/${encodeURIComponent(categoryId)}`, {
      state: { taskId: task.id },
    });
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Stay on track</p>
            <h1 className="text-3xl font-bold text-slate-900">Study workspace</h1>
            <p className="text-slate-600 mt-1">
              Today&apos;s plan, ready to launch with one click.
            </p>
          </div>
          <ThreeDButton
            variant="outline"
            onClick={() => navigate('/calendar')}
            className="border-slate-200 text-slate-700 hover:text-slate-900"
          >
            View calendar
          </ThreeDButton>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Today&apos;s tasks</h2>
              <p className="text-sm text-slate-500">
                Same tasks you see on the dashboard, with quick start buttons.
              </p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading
              </div>
            )}
          </div>

          {planError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
              {planError}
            </div>
          )}

          {tasks.length === 0 && !loading ? (
            <div className="text-center py-10 text-slate-600">
              <p className="font-semibold text-slate-800 mb-2">No tasks scheduled for today</p>
              <p className="text-sm mb-4">Check your calendar or generate a study plan.</p>
              <ThreeDButton onClick={() => navigate('/study-plan/generate')}>
                Generate study plan
              </ThreeDButton>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="group rounded-2xl border-2 border-slate-200 outline outline-1 outline-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(17,24,39,0.12)] hover:-translate-y-1.5 transition-all hover:shadow-[0_18px_44px_rgba(17,24,39,0.2)] flex flex-col gap-4 aspect-square"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColors[task.category] || categoryColors.general
                        }`}
                    >
                      {categoryLabels[task.category] || task.category}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center">
                    <h3 className="font-semibold text-slate-900 text-lg leading-tight">{task.title}</h3>
                  </div>

                  <ThreeDButton stretch onClick={() => handleStart(task)} className="justify-center">
                    <Play className="w-4 h-4 mr-2" />
                    Start studying
                  </ThreeDButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Study;
