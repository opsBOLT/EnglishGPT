import { Clock } from 'lucide-react';
import { formatDuration } from '../../../utils/date';

interface StudyTimeCardProps {
  activeTime: number;
  breakTime: number;
}

const StudyTimeCard = ({ activeTime, breakTime }: StudyTimeCardProps) => {
  const total = activeTime + breakTime;
  const activePercentage = total > 0 ? (activeTime / total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Today's Study Time</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Active Learning</span>
            <span className="text-lg font-bold text-gray-900">{formatDuration(activeTime)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Breaks</span>
            <span className="text-lg font-bold text-gray-900">{formatDuration(breakTime)}</span>
          </div>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
            style={{ width: `${activePercentage}%` }}
          />
        </div>

        <div className="text-center pt-2 border-t border-gray-100">
          <span className="text-2xl font-bold text-gray-900">{formatDuration(total)}</span>
          <p className="text-sm text-gray-600 mt-1">Total Time</p>
        </div>
      </div>
    </div>
  );
};

export default StudyTimeCard;
