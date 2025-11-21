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

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', today)
        .eq('status', 'completed');

      const totalMinutes = sessions?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0;
      setTodayStudyTime(Math.round(totalMinutes * 0.8));
      setTodayBreakTime(Math.round(totalMinutes * 0.2));

      const { data: scheduled } = await supabase
        .from('scheduled_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextSession(scheduled);

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

      setWeeklyActivity(activityByDay);

      const { data: tasks } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .order('time_slot', { ascending: true });

      setTodayTasks(tasks || []);

      const stats = (tasks || []).reduce(
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

      setModuleProgress(progress || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#aa80f3] via-[#b48bff] to-[#6bcafa] text-white shadow-2xl px-6 py-8 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.14),transparent_35%)]" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-white/80">
                Dashboard
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold">
                Welcome back, {user?.full_name || 'learner'}
              </h1>
              <p className="text-white/80 max-w-2xl">
                Track your sessions, tasks, and progress with a refreshed, focused workspace.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 min-w-[260px]">
              <div className="rounded-2xl bg-white/15 border border-white/20 px-4 py-3">
                <p className="text-xs text-white/70">Weekly hours</p>
                <p className="text-2xl font-semibold">{totalWeeklyHours.toFixed(1)}h</p>
                <p className="text-xs text-white/70">Avg {avgDailyHours}h/day</p>
              </div>
              <div className="rounded-2xl bg-white/15 border border-white/20 px-4 py-3">
                <p className="text-xs text-white/70">Today</p>
                <p className="text-2xl font-semibold">
                  {todaysTotalMinutes > 0 ? `${todaysTotalMinutes.toFixed(0)}m` : '0m'}
                </p>
                <p className="text-xs text-white/70">Study + breaks</p>
              </div>
              <div className="rounded-2xl bg-white/15 border border-white/20 px-4 py-3">
                <p className="text-xs text-white/70">Open tasks</p>
                <p className="text-2xl font-semibold">
                  {taskStats.ongoing + taskStats.upcoming}
                </p>
                <p className="text-xs text-white/70">Waiting in queue</p>
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
