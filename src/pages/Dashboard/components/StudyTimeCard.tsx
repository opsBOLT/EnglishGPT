import { Clock } from 'lucide-react';
import { Card, Flex, Metric, ProgressBar, Text } from '@tremor/react';
import { formatDuration } from '../../../utils/date';

interface StudyTimeCardProps {
  activeTime: number;
  breakTime: number;
}

const StudyTimeCard = ({ activeTime, breakTime }: StudyTimeCardProps) => {
  const total = activeTime + breakTime;
  const activePercentage = total > 0 ? (activeTime / total) * 100 : 0;

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-[#aa80f3]/10 bg-white shadow-lg p-6 sm:p-7">
      <Flex alignItems="start" justifyContent="between" className="relative gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#aa80f3]/10 ring-1 ring-[#aa80f3]/25 shadow-sm">
            <Clock className="w-5 h-5 text-[#aa80f3]" />
          </div>
          <div>
            <Text className="text-sm text-slate-500">Today&apos;s Study Time</Text>
            <Metric className="text-slate-900">{formatDuration(total)}</Metric>
            <Text className="text-xs text-slate-500">Total time logged</Text>
          </div>
        </div>
        <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#aa80f3] shadow">
          {activePercentage.toFixed(0)}% focused
        </div>
      </Flex>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 shadow-sm space-y-1.5">
          <Text className="text-xs uppercase tracking-wide text-slate-500">Active learning</Text>
          <p className="text-2xl font-semibold text-slate-900">{formatDuration(activeTime)}</p>
          <p className="text-xs text-slate-500">Deep work time</p>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 shadow-sm space-y-1.5">
          <Text className="text-xs uppercase tracking-wide text-slate-500">Breaks</Text>
          <p className="text-2xl font-semibold text-slate-900">{formatDuration(breakTime)}</p>
          <p className="text-xs text-slate-500">Recharge time</p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Flex justifyContent="between">
          <Text className="text-sm text-slate-600">Active vs breaks</Text>
          <Text className="text-sm font-semibold text-slate-800">
            {activePercentage.toFixed(0)}% active
          </Text>
        </Flex>
        <ProgressBar
          color="violet"
          value={Number(activePercentage.toFixed(1))}
          className="h-3 rounded-full bg-slate-100"
        />
      </div>
    </Card>
  );
};

export default StudyTimeCard;
