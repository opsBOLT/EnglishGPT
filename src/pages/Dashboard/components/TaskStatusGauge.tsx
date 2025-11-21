import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

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
    { name: 'Ongoing', value: stats.ongoing, color: '#3b82f6' },
    { name: 'Upcoming', value: stats.upcoming, color: '#d1d5db' },
  ];

  const completionPercentage = total > 0 ? Math.round((stats.completed / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Task Status</h3>

      <div className="relative">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{completionPercentage}%</div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-700">Completed</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{stats.completed}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-700">Ongoing</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{stats.ongoing}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Circle className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Upcoming</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{stats.upcoming}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskStatusGauge;
