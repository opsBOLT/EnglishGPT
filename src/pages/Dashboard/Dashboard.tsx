import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudyPlan, useSessionHistory, useAIMemory } from '../../hooks/useStudyPlatform';
import MainLayout from '../../components/Layout/MainLayout';
import StudyTimeCard from './components/StudyTimeCard';
import NextSessionCard from './components/NextSessionCard';
import WeeklyActivityChart from './components/WeeklyActivityChart';
import TodaysTasks from './components/TodaysTasks';
import TaskStatusGauge from './components/TaskStatusGauge';
import ModuleOverview from './components/ModuleOverview';
import { DailyTask, StudentProgress } from '../../types';
import SnowballSpinner from '../../components/SnowballSpinner';

const Dashboard = () => {
  const { user } = useAuth();

  // Use our backend hooks
  const { plan, loading: planLoading, error: planError } = useStudyPlan(user?.id || '');
  const { studySessions, practiceSessions, loading: sessionsLoading, error: sessionsError } = useSessionHistory(user?.id || '');
  const { groupedMemory, loading: memoryLoading, error: memoryError } = useAIMemory(user?.id || '');

  const [todayStudyTime, setTodayStudyTime] = useState(0);
  const [todayBreakTime, setTodayBreakTime] = useState(0);
  const [nextSession, setNextSession] = useState<any>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [taskStats, setTaskStats] = useState({ completed: 0, ongoing: 0, upcoming: 0 });
  const [moduleProgress, setModuleProgress] = useState<StudentProgress[]>([]);

  const loading = planLoading || sessionsLoading || memoryLoading;
  const totalWeeklyHours = weeklyActivity.reduce((acc, d) => acc + d.hours, 0);
  const avgDailyHours = (totalWeeklyHours / 7).toFixed(1);
  const todaysTotalMinutes = todayStudyTime + todayBreakTime;

  useEffect(() => {
    if (user && !loading) {
      processBackendData();
    }
  }, [user, studySessions, practiceSessions, plan, loading]);

  const processBackendData = () => {
    if (!user || !studySessions || !plan) return;

    // Calculate today's study time from real sessions
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = studySessions.filter(s =>
      s.created_at.startsWith(today) && s.duration_minutes
    );

    const totalMinutes = todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const activeMinutes = Math.round(totalMinutes * 0.8);
    const breakMinutes = Math.round(totalMinutes * 0.2);
    setTodayStudyTime(activeMinutes);
    setTodayBreakTime(breakMinutes);

    // Calculate weekly activity from real sessions
    const activityByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayStr = date.toISOString().split('T')[0];
      const daySessions = studySessions.filter(s => s.created_at.startsWith(dayStr));
      const minutes = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

      return {
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        minutes,
        hours: Number((minutes / 60).toFixed(1)),
      };
    });
    setWeeklyActivity(activityByDay);

    // Extract today's tasks from study plan
    if (plan && plan.weeks) {
      const currentWeek = plan.weeks[0]; // For simplicity, use first week
      const dayOfWeek = new Date().getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[dayOfWeek];

      const todaySchedule = currentWeek?.daily_tasks?.find((d: any) => d.day === todayName);

      if (todaySchedule && todaySchedule.tasks) {
        const tasks: DailyTask[] = todaySchedule.tasks.map((task: any, idx: number) => ({
          id: `task-${idx}`,
          study_plan_id: 'current-plan',
          day_of_week: dayOfWeek,
          category: task.category || 'paper1',
          title: task.title || task.description || 'Study Task',
          description: task.description || task.title || '',
          time_slot: '09:00 AM', // You can enhance this based on task data
          duration_minutes: parseInt(task.duration) || 30,
          status: idx === 0 ? 'ongoing' : 'upcoming',
          scheduled_date: today,
        }));
        setTodayTasks(tasks);

        const stats = tasks.reduce(
          (acc, task) => {
            acc[task.status]++;
            return acc;
          },
          { completed: 0, ongoing: 0, upcoming: 0 }
        );
        setTaskStats(stats);
      } else {
        // No tasks for today
        setTodayTasks([]);
        setTaskStats({ completed: 0, ongoing: 0, upcoming: 0 });
      }
    }

    // Calculate module progress from session history
    const categories = ['Paper 1 Guide/Revision', 'Paper 2 Guide/Revision', 'Vocabulary Improvement', 'Text Types Criteria', 'High-Level Example Responses'];
    const progress: StudentProgress[] = categories.map(category => {
      const categorySessions = studySessions.filter(s => s.category === category);
      const quizAttempts = categorySessions.filter(s =>
        (s.quiz_correct || 0) + (s.quiz_incorrect || 0) > 0
      );

      const avgQuiz = quizAttempts.length > 0
        ? Math.round(
            quizAttempts.reduce((acc, s) => {
              const total = (s.quiz_correct || 0) + (s.quiz_incorrect || 0);
              return acc + (total > 0 ? (s.quiz_correct || 0) / total : 0);
            }, 0) / quizAttempts.length * 100
          )
        : 0;

      return {
        id: category,
        user_id: user.id,
        category: category,
        sections_completed: categorySessions.length,
        total_sections: 10, // From config
        last_accessed: categorySessions[0]?.created_at || new Date().toISOString(),
        quiz_average: avgQuiz,
      };
    });
    setModuleProgress(progress);

    // Get next session from study plan
    if (plan && plan.weeks && plan.weeks[0]?.daily_tasks) {
      const nextTask = plan.weeks[0].daily_tasks
        .flatMap((d: any) => d.tasks || [])
        .find((t: any) => t);

      if (nextTask) {
        setNextSession({
          title: nextTask.title || 'Study Session',
          category: nextTask.category || 'paper1',
          scheduled_start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          duration_minutes: parseInt(nextTask.duration) || 45,
        });
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <SnowballSpinner size="md" label="Loading your dashboard..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
        {(planError || sessionsError || memoryError) && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <p className="font-semibold">Some data couldn’t load from Supabase.</p>
            <p className="text-sm">
              {planError || sessionsError || memoryError}
            </p>
          </div>
        )}
        <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#aa80f3] text-white shadow-2xl px-6 py-8 sm:px-8">
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-white/85">
                Dashboard
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold">
                Welcome back, {user?.full_name || 'learner'}
              </h1>
              <p className="text-white/90 max-w-2xl">
                Track your sessions, tasks, and progress with a refreshed, focused workspace.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 min-w-[260px]">
              <div className="rounded-2xl bg-white/15 border border-white/20 px-4 py-3">
                <p className="text-xs text-white/75">Weekly hours</p>
                <p className="text-2xl font-semibold">{totalWeeklyHours.toFixed(1)}h</p>
                <p className="text-xs text-white/75">Avg {avgDailyHours}h/day</p>
              </div>
              <div className="rounded-2xl bg-white/15 border border-white/20 px-4 py-3">
                <p className="text-xs text-white/75">Today</p>
                <p className="text-2xl font-semibold">
                  {todaysTotalMinutes > 0 ? `${todaysTotalMinutes.toFixed(0)}m` : '0m'}
                </p>
                <p className="text-xs text-white/75">Study + breaks</p>
              </div>
              <div className="rounded-2xl bg-white/15 border border-white/20 px-4 py-3">
                <p className="text-xs text-white/75">Open tasks</p>
                <p className="text-2xl font-semibold">
                  {taskStats.ongoing + taskStats.upcoming}
                </p>
                <p className="text-xs text-white/75">Waiting in queue</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <StudyTimeCard activeTime={todayStudyTime} breakTime={todayBreakTime} />
              </div>
              <div className="lg:col-span-2">
                <WeeklyActivityChart data={weeklyActivity} />
              </div>
            </div>

            <TodaysTasks tasks={todayTasks} onRefresh={() => processBackendData()} />
          </div>

          <div className="space-y-6">
            <NextSessionCard session={nextSession} />
            <TaskStatusGauge stats={taskStats} />
            <ModuleOverview progress={moduleProgress} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
