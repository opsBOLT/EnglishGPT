import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface WeeklyActivityChartProps {
  data: { day: string; hours: number }[];
}

const WeeklyActivityChart = ({ data }: WeeklyActivityChartProps) => {
  const totalHours = data.reduce((acc, d) => acc + d.hours, 0);
  const avgHours = (totalHours / 7).toFixed(1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Weekly Activity</h3>
          <p className="text-sm text-gray-600">{totalHours.toFixed(1)} hours this week</p>
        </div>

        <div className="flex items-center space-x-2 text-green-600 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">+12% from last week</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value.toFixed(1)} hours`, 'Study Time']}
            />
            <Bar dataKey="hours" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-100">
        <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
          Week
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
          Month
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
          Year
        </button>
      </div>
    </div>
  );
};

export default WeeklyActivityChart;
