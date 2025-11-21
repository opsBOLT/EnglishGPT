import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { Card, DonutChart, Flex, Metric, ProgressBar, Text } from '@tremor/react';

interface TaskStatusGaugeProps {
  stats: {
    completed: number;
    ongoing: number;
    upcoming: number;
  };
}

const TaskStatusGauge = ({ stats }: TaskStatusGaugeProps) => {
  const total = stats.completed + stats.ongoing + stats.upcoming;

  const data = [
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'Ongoing', value: stats.ongoing, color: '#aa80f3' },
    { name: 'Upcoming', value: stats.upcoming, color: '#cbd5e1' },
  ];

  const completionPercentage = total > 0 ? Math.round((stats.completed / total) * 100) : 0;

  return (
    <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <h3 className="font-semibold text-slate-900">Task Status</h3>
        <span className="px-3 py-1 rounded-full bg-[#aa80f3]/10 text-[#6f2dd2] text-xs font-semibold">
          {total} tasks
        </span>
      </Flex>

      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="h-48">
          <DonutChart
            className="h-full"
            data={data}
            category="value"
            index="name"
            colors={['emerald', 'violet', 'slate']}
            valueFormatter={(value) => `${value} tasks`}
          />
        </div>
        <div className="space-y-3">
          <div className="text-center">
            <Metric className="text-slate-900">{completionPercentage}%</Metric>
            <Text className="text-sm text-slate-500">Overall completion</Text>
          </div>
          <ProgressBar
            color="emerald"
            value={completionPercentage}
            className="h-3 rounded-full bg-slate-100"
          />

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{stats.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-[#aa80f3]" />
                <span className="text-sm">Ongoing</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{stats.ongoing}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Circle className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Upcoming</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{stats.upcoming}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaskStatusGauge;
