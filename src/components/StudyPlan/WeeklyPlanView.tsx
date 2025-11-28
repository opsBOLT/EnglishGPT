import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, ListChecks, RefreshCcw } from 'lucide-react';
import type { NormalizedStudyPlan, Task, TaskCompletionRecord } from '../../services/studyPlan';

type Props = {
  plan: NormalizedStudyPlan;
  completions?: TaskCompletionRecord[];
  onCompleteTask?: (taskId: string, weekNumber: number, day: string) => Promise<void> | void;
  onRegenerate?: () => Promise<void> | void;
  regenerating?: boolean;
};

const categoryBadge: Record<Task['category'], { label: string; color: string }> = {
  paper1: { label: 'Paper 1', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  paper2: { label: 'Paper 2', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  examples: { label: 'Examples', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  text_types: { label: 'Text Types', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  vocabulary: { label: 'Vocabulary', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  general: { label: 'General', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const dayLabel = (day?: string) => {
  if (!day) return 'Day';
  const lower = day.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export function WeeklyPlanView({
  plan,
  completions = [],
  onCompleteTask,
  onRegenerate,
  regenerating,
}: Props) {
  const weeks = useMemo(() => plan.weeks || [], [plan.weeks]);
  const [activeWeek, setActiveWeek] = useState<number>(weeks[0]?.week_number || 1);

  useEffect(() => {
    if (weeks.length > 0) {
      setActiveWeek(weeks[0].week_number);
    }
  }, [plan.plan_id, weeks]);

  const completionSet = useMemo(
    () => new Set((completions || []).map(c => c.task_id)),
    [completions]
  );

  const activeWeekData = weeks.find(week => week.week_number === activeWeek) || weeks[0];

  const weekTasks = useMemo(() => {
    if (!activeWeekData) return [];
    return activeWeekData.daily_tasks?.flatMap(day =>
      (day.tasks || []).map(task => ({
        ...task,
        day: day.day,
      }))
    ) || [];
  }, [activeWeekData]);

  const weekTotals = useMemo(() => {
    const total = weekTasks.length;
    const completed = weekTasks.filter(task => completionSet.has(task.id)).length;
    const inProgress = weekTasks.filter(task => !completionSet.has(task.id) && task.status === 'in_progress').length;
    return { total, completed, inProgress };
  }, [weekTasks, completionSet]);

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Weekly Plan</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 sulphur-point-bold mt-1">
            Browse your full breakdown
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
            {plan.targets?.time_frame_weeks || weeks.length} weeks · {plan.targets?.weekly_hours || 0} hrs/week · Target {plan.targets?.target_grade}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onRegenerate && (
            <button
              onClick={() => onRegenerate?.()}
              disabled={regenerating}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:-translate-y-0.5 transition-all"
            >
              <RefreshCcw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerating...' : 'Regenerate plan'}
            </button>
          )}
        </div>
      </div>

      {weeks.length === 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">No weekly structure found. Regenerate your plan to view the full breakdown.</p>
        </div>
      )}

      {weeks.length > 0 && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {weeks.map(week => (
              <button
                key={week.week_number}
                onClick={() => setActiveWeek(week.week_number)}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  activeWeek === week.week_number
                    ? 'bg-[#aa08f3] text-white border-[#aa08f3]'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#aa08f3]/40'
                }`}
              >
                Week {week.week_number}
              </button>
            ))}
          </div>

          {activeWeekData && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-6">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2">
                    <CalendarClock className="w-4 h-4" />
                    <span>Theme</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50">{activeWeekData.theme}</h4>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    <InfoPill icon={<ListChecks className="w-4 h-4" />} label="Goals" items={activeWeekData.goals} />
                    <InfoPill icon={<Clock3 className="w-4 h-4" />} label="Checkpoints" items={activeWeekData.checkpoints} />
                  </div>
                  {activeWeekData.focus_papers?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold mb-2">Focus Papers</p>
                      <div className="flex flex-wrap gap-2">
                        {activeWeekData.focus_papers.map(focus => (
                          <span key={focus} className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600">
                            {focus}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <ListChecks className="w-4 h-4" />
                      <span>Daily breakdown</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {weekTotals.completed}/{weekTotals.total} done · {weekTotals.inProgress} in progress
                    </div>
                  </div>

                  <div className="space-y-3">
                    {activeWeekData.daily_tasks?.map(day => (
                      <div key={day.day} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 sm:p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[#aa08f3]" />
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{dayLabel(day.day)}</p>
                          </div>
                          <span className="text-xs text-slate-500">{day.tasks?.length || 0} tasks</span>
                        </div>

                        <div className="space-y-3">
                          {(day.tasks || []).map(task => {
                            const isComplete = completionSet.has(task.id);
                            return (
                              <div
                                key={task.id}
                                className={`rounded-xl border p-3 sm:p-4 transition-all ${
                                  isComplete
                                    ? 'border-emerald-200 bg-emerald-50/60'
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${categoryBadge[task.category]?.color}`}>
                                        {categoryBadge[task.category]?.label || task.category}
                                      </span>
                                      <span className="text-[11px] font-semibold text-slate-500 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                        {task.duration_minutes} min
                                      </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{task.title}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{task.description}</p>
                                  </div>
                                  {onCompleteTask && (
                                    <button
                                      onClick={() => onCompleteTask(task.id, activeWeekData.week_number, day.day)}
                                      disabled={isComplete || regenerating}
                                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                                        isComplete
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : 'border-slate-200 bg-white hover:border-[#aa08f3]/60 hover:-translate-y-0.5 text-slate-700'
                                      }`}
                                    >
                                      <CheckCircle2 className={`w-4 h-4 ${isComplete ? 'text-emerald-600' : ''}`} />
                                      {isComplete ? 'Completed' : 'Mark done'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold mb-3">Week status</p>
                  <div className="space-y-2">
                    <StatRow label="Tasks done" value={`${weekTotals.completed} / ${weekTotals.total}`} />
                    <StatRow label="In progress" value={weekTotals.inProgress} />
                    <StatRow label="Pending" value={Math.max(weekTotals.total - weekTotals.completed - weekTotals.inProgress, 0)} />
                  </div>
                </div>

                {activeWeekData.checkpoints?.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm space-y-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold mb-2">Checkpoints</p>
                    <ul className="space-y-2">
                      {activeWeekData.checkpoints.map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const StatRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 px-3 py-2">
    <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 sulphur-point-bold">{value}</p>
  </div>
);

const InfoPill = ({ icon, label, items }: { icon: React.ReactNode; label: string; items?: string[] }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <span key={item} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WeeklyPlanView;
