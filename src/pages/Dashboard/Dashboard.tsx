import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/Layout/MainLayout';
import StudyTimeCard from './components/StudyTimeCard';
import NextSessionCard from './components/NextSessionCard';
import WeeklyActivityChart from './components/WeeklyActivityChart';
import TodaysTasks from './components/TodaysTasks';
import TaskStatusGauge from './components/TaskStatusGauge';
import ModuleOverview from './components/ModuleOverview';
import { DailyTask, StudentProgress } from '../../types';

const Dashboard = () => {
  const { user } = useAuth();
  const [todayStudyTime, setTodayStudyTime] = useState(0);
  const [todayBreakTime, setTodayBreakTime] = useState(0);
  const [nextSession, setNextSession] = useState<any>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [taskStats, setTaskStats] = useState({ completed: 0, ongoing: 0, upcoming: 0 });
  const [moduleProgress, setModuleProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const totalWeeklyHours = weeklyActivity.reduce((acc, d) => acc + d.hours, 0);
  const avgDailyHours = (totalWeeklyHours / 7).toFixed(1);
  const todaysTotalMinutes = todayStudyTime + todayBreakTime;

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    const mockSession = {
      title: 'Literary Devices Sprint',
      category: 'paper1',
      scheduled_start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      duration_minutes: 45,
    };

    const mockTasks: DailyTask[] = [
      {
        id: 'mock-1',
        study_plan_id: 'mock-plan',
        day_of_week: 1,
        category: 'paper1',
        title: 'Analyze past paper essay',
        description: 'Read and annotate a high-scoring response.',
        time_slot: '09:00 AM',
        duration_minutes: 40,
        status: 'ongoing',
        scheduled_date: '',
      },
      {
        id: 'mock-2',
        study_plan_id: 'mock-plan',
        day_of_week: 1,
        category: 'vocabulary',
        title: 'Vocabulary sprints',
        description: 'Learn 12 new words with usage examples.',
        time_slot: '11:30 AM',
        duration_minutes: 20,
        status: 'upcoming',
        scheduled_date: '',
      },
      {
        id: 'mock-3',
        study_plan_id: 'mock-plan',
        day_of_week: 1,
        category: 'text_types',
        title: 'Write a summary paragraph',
        description: 'Condense a 500-word article into 120 words.',
        time_slot: '02:00 PM',
        duration_minutes: 30,
        status: 'upcoming',
        scheduled_date: '',
      },
    ];

    const mockProgress: StudentProgress[] = [
      {
        id: 'mock-p1',
        user_id: user.id,
        category: 'paper1',
        sections_completed: 6,
        total_sections: 10,
        last_accessed: new Date().toISOString(),
        quiz_average: 78,
      },
      {
        id: 'mock-p2',
        user_id: user.id,
        category: 'paper2',
        sections_completed: 3,
        total_sections: 10,
        last_accessed: new Date().toISOString(),
        quiz_average: 65,
      },
      {
        id: 'mock-p3',
        user_id: user.id,
        category: 'vocabulary',
        sections_completed: 5,
        total_sections: 10,
        last_accessed: new Date().toISOString(),
        quiz_average: 82,
      },
    ];

    const mockWeekly = [
      { day: 'Mon', hours: 1.2 },
      { day: 'Tue', hours: 0.8 },
      { day: 'Wed', hours: 1.5 },
      { day: 'Thu', hours: 1.1 },
      { day: 'Fri', hours: 0.6 },
      { day: 'Sat', hours: 0.4 },
      { day: 'Sun', hours: 0.9 },
    ];

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', today)
        .eq('status', 'completed');

      const totalMinutes = sessions?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0;
      const activeMinutes = totalMinutes > 0 ? Math.round(totalMinutes * 0.8) : 60;
      const restMinutes = totalMinutes > 0 ? Math.round(totalMinutes * 0.2) : 20;
      setTodayStudyTime(activeMinutes);
      setTodayBreakTime(restMinutes);

      const { data: scheduled } = await supabase
        .from('scheduled_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextSession(scheduled || mockSession);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weeklySessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', weekAgo.toISOString())
        .eq('status', 'completed');

      const activityByDay = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayStr = date.toISOString().split('T')[0];
        const daySessions = weeklySessions?.filter(s => s.start_time.startsWith(dayStr)) || [];
        const minutes = daySessions.reduce((acc, s) => acc + s.duration_minutes, 0);

        return {
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
          minutes,
          hours: minutes / 60,
        };
      });

      const hasRealActivity = activityByDay.some(item => item.hours > 0);
      setWeeklyActivity(hasRealActivity ? activityByDay : mockWeekly);

      const { data: tasks } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .order('time_slot', { ascending: true });

      setTodayTasks(tasks && tasks.length > 0 ? tasks : mockTasks);

      const statsSource = tasks && tasks.length > 0 ? tasks : mockTasks;
      const stats = statsSource.reduce(
        (acc, task) => {
          acc[task.status]++;
          return acc;
        },
        { completed: 0, ongoing: 0, upcoming: 0 }
      );
      setTaskStats(stats);

      const { data: progress } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', user.id);

      setModuleProgress(progress && progress.length > 0 ? progress : mockProgress);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data on error
      setTodayStudyTime(60);
      setTodayBreakTime(20);
      setNextSession(mockSession);
      setWeeklyActivity(mockWeekly);
      setTodayTasks(mockTasks);
      setTaskStats({ completed: 0, ongoing: 1, upcoming: 2 });
      setModuleProgress(mockProgress);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#aa80f3] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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

            <TodaysTasks tasks={todayTasks} onRefresh={fetchDashboardData} />
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
