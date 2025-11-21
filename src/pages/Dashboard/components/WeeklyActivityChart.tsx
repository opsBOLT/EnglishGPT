import { TrendingUp } from 'lucide-react';
import { AreaChart, Card, Flex, Metric, Text } from '@tremor/react';

interface WeeklyActivityChartProps {
  data: { day: string; hours: number }[];
}

const WeeklyActivityChart = ({ data }: WeeklyActivityChartProps) => {
  const totalHours = data.reduce((acc, d) => acc + d.hours, 0);
  const avgHours = (totalHours / 7).toFixed(1);
  const chartData = data.map((d) => ({ day: d.day, Hours: Number(d.hours.toFixed(2)) }));
  const peak = data.reduce(
    (current, entry) => (entry.hours > current.hours ? entry : current),
    data[0] || { day: 'Mon', hours: 0 }
  );

  return (
    <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
      <Flex justifyContent="between" alignItems="start" className="mb-6">
        <div>
          <h3 className="font-semibold text-slate-900 mb-1">Weekly Activity</h3>
          <Text className="text-sm text-slate-600">{totalHours.toFixed(1)} hours this week</Text>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold">
          <TrendingUp className="w-4 h-4" />
          <span>+12% vs last week</span>
        </div>
      </Flex>

      <div className="h-64">
        <AreaChart
          data={chartData}
          index="day"
          categories={['Hours']}
          colors={['violet']}
          valueFormatter={(value: number) => `${value.toFixed(1)}h`}
          showLegend={false}
          showGridLines={false}
          yAxisWidth={50}
          className="h-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <Text className="text-xs uppercase tracking-wide text-slate-500">Average per day</Text>
          <Metric className="text-slate-900">{avgHours}h</Metric>
          <Text className="text-xs text-slate-500 mt-1">Keep a steady pace</Text>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <Text className="text-xs uppercase tracking-wide text-slate-500">Peak day</Text>
          <Metric className="text-slate-900">{peak?.day}</Metric>
          <Text className="text-xs text-slate-500 mt-1">{peak?.hours.toFixed(1)}h logged</Text>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <Text className="text-xs uppercase tracking-wide text-slate-500">Total this week</Text>
          <Metric className="text-slate-900">{totalHours.toFixed(1)}h</Metric>
          <Text className="text-xs text-slate-500 mt-1">Stay above your goal</Text>
        </div>
      </div>
    </Card>
  );
};

export default WeeklyActivityChart;
