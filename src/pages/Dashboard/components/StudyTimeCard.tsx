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
    <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-white via-[#f4edff] to-[#eef3ff] shadow-xl">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#aa80f3]/20 blur-3xl" />
      <Flex alignItems="start" justifyContent="between" className="relative">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/70 ring-1 ring-[#aa80f3]/20 shadow">
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

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="rounded-2xl bg-white/70 border border-white/60 p-4 shadow-sm">
          <Text className="text-xs uppercase tracking-wide text-slate-500">Active learning</Text>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{formatDuration(activeTime)}</p>
          <p className="text-xs text-slate-500 mt-1">Deep work time</p>
        </div>
        <div className="rounded-2xl bg-white/70 border border-white/60 p-4 shadow-sm">
          <Text className="text-xs uppercase tracking-wide text-slate-500">Breaks</Text>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{formatDuration(breakTime)}</p>
          <p className="text-xs text-slate-500 mt-1">Recharge time</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
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
