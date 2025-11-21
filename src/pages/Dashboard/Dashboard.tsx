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
import { DailyTask, StudySession, StudentProgress } from '../../types';

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
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <StudyTimeCard activeTime={todayStudyTime} breakTime={todayBreakTime} />
          <NextSessionCard session={nextSession} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <WeeklyActivityChart data={weeklyActivity} />
          <TodaysTasks tasks={todayTasks} onRefresh={fetchDashboardData} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <TaskStatusGauge stats={taskStats} />
          <ModuleOverview progress={moduleProgress} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
