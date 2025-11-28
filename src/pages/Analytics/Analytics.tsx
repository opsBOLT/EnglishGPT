import { useMemo } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp, Target, Clock, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudyPlan, useTaskCompletion } from '../../hooks/useStudyPlatform';
import type { NormalizedStudyPlan, TaskCompletionRecord } from '../../services/studyPlan';
import SnowballSpinner from '../../components/SnowballSpinner';

const CATEGORY_LABELS: Record<string, string> = {
  paper1: 'Paper 1',
  paper2: 'Paper 2',
  examples: 'Examples',
  text_types: 'Text Types',
  vocabulary: 'Vocabulary',
  general: 'General Skills',
};

const Analytics = () => {
  const { user } = useAuth();
  const { plan, loading: planLoading, error: planError } = useStudyPlan(user?.id || '');
  const planId = plan?.plan_id || '';
  const { completions, loading: completionLoading } = useTaskCompletion(user?.id || '', planId);

  const loading = planLoading || completionLoading;

  const totalTasks = useMemo(() => computeTotalTasks(plan), [plan]);
  const completedTasks = completions?.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalWeeks = plan?.weeks?.length || plan?.targets?.time_frame_weeks || 0;
  const startDate = plan?.weeks?.[0]?.start_date || plan?.generated_at;
  const currentWeek = useMemo(() => {
    if (!totalWeeks || !startDate) return 1;
    const start = new Date(startDate);
    const diffDays = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(totalWeeks, Math.max(1, Math.floor(diffDays / 7) + 1));
  }, [startDate, totalWeeks]);

  const expectedRate = totalWeeks ? Math.min(100, Math.round((currentWeek / totalWeeks) * 100)) : 0;
  const paceDelta = completionRate - expectedRate;

  const avgTimeSpent = useMemo(() => calculateAverageTime(completions || []), [completions]);

  const weeklyData = useMemo(() => buildWeeklyData(plan, completions || []), [plan, completions]);
  const categoryData = useMemo(() => buildCategoryData(plan, completions || []), [plan, completions]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <SnowballSpinner size="md" label="Crunching your analytics..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Progress Insights</h1>
          <p className="text-gray-600">
            Track how you&apos;re pacing against your plan and where to focus next.
          </p>
        </div>

        {planError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <p className="font-semibold">Couldn&apos;t load the latest plan.</p>
            <p className="text-sm">{planError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Completion rate"
            value={`${completionRate}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            caption={`${completedTasks}/${totalTasks || '—'} tasks`}
            color="#2563eb"
          />
          <MetricCard
            label="Pace vs schedule"
            value={`${paceDelta >= 0 ? '+' : ''}${paceDelta.toFixed(0)}%`}
            icon={<Target className="w-5 h-5" />}
            caption={paceDelta >= 0 ? 'Ahead of plan' : 'Falling behind'}
            color={paceDelta >= 0 ? '#10b981' : '#ef4444'}
          />
          <MetricCard
            label="Avg time per task"
            value={avgTimeSpent ? `${avgTimeSpent}m` : '—'}
            icon={<Clock className="w-5 h-5" />}
            caption="Based on completed tasks"
            color="#a855f7"
          />
          <MetricCard
            label="Plan weeks"
            value={totalWeeks || '—'}
            icon={<Award className="w-5 h-5" />}
            caption={`Week ${currentWeek} of ${totalWeeks || '—'}`}
            color="#f59e0b"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Weekly progress</h3>
                <p className="text-sm text-gray-500">Completed vs remaining tasks</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Expected pace: {expectedRate}%
              </span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" radius={[6, 6, 0, 0]} name="Completed" />
                  <Bar dataKey="remaining" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Remaining" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Category focus</h3>
                <p className="text-sm text-gray-500">Completion rate by study strand</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completionRate" fill="#6366f1" radius={[6, 6, 0, 0]} name="% Complete" />
                  <Bar dataKey="remaining" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Tasks remaining" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const MetricCard = ({
  label,
  value,
  caption,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  caption: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 font-semibold">{label}</p>
      <div style={{ color }}>{icon}</div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{caption}</p>
  </div>
);

function computeTotalTasks(plan?: NormalizedStudyPlan | null): number {
  if (!plan?.weeks) return 0;
  return plan.weeks.reduce((weekSum, week) => {
    const dailyTotal = week.daily_tasks?.reduce((daySum, day) => daySum + (day.tasks?.length || 0), 0) || 0;
    return weekSum + dailyTotal;
  }, 0);
}

function calculateAverageTime(completions: TaskCompletionRecord[]): number {
  const withTime = completions.filter(c => typeof c.time_spent_minutes === 'number');
  if (withTime.length === 0) return 0;
  const total = withTime.reduce((sum, c) => sum + (c.time_spent_minutes || 0), 0);
  return Math.round(total / withTime.length);
}

function buildWeeklyData(plan?: NormalizedStudyPlan | null, completions: TaskCompletionRecord[] = []) {
  if (!plan?.weeks) return [];
  return plan.weeks.map(week => {
    const totalTasks =
      week.daily_tasks?.reduce((sum, day) => sum + (day.tasks?.length || 0), 0) || 0;
    const completed = completions.filter(c => c.week_number === week.week_number).length;
    const remaining = Math.max(totalTasks - completed, 0);
    return {
      name: `Week ${week.week_number}`,
      completed,
      remaining,
    };
  });
}

function buildCategoryData(plan?: NormalizedStudyPlan | null, completions: TaskCompletionRecord[] = []) {
  const totals: Record<string, { total: number; completed: number }> = {};

  plan?.weeks?.forEach(week => {
    week.daily_tasks?.forEach(day => {
      day.tasks?.forEach(task => {
        if (!totals[task.category]) {
          totals[task.category] = { total: 0, completed: 0 };
        }
        totals[task.category].total += 1;
      });
    });
  });

  const completionLookup = new Map<string, string>(); // taskId -> category
  plan?.weeks?.forEach(week => {
    week.daily_tasks?.forEach(day => {
      day.tasks?.forEach(task => {
        completionLookup.set(task.id, task.category);
      });
    });
  });

  completions.forEach(completion => {
    const category = completionLookup.get(completion.task_id);
    if (category && totals[category]) {
      totals[category].completed += 1;
    }
  });

  return Object.entries(totals).map(([key, stats]) => ({
    category: CATEGORY_LABELS[key] || key,
    completionRate: stats.total ? Math.round((stats.completed / stats.total) * 100) : 0,
    remaining: Math.max(stats.total - stats.completed, 0),
    completed: stats.completed,
  }));
}

export default Analytics;
