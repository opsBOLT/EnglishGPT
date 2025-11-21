import { Calendar, Clock, Play } from 'lucide-react';
import { formatTime, formatDuration, getTimeAgo } from '../../../utils/date';
import { Link } from 'react-router-dom';

interface NextSessionCardProps {
  session: any;
}

const NextSessionCard = ({ session }: NextSessionCardProps) => {
  if (!session) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Next Session</h3>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No upcoming sessions</p>
          <Link
            to="/calendar"
            className="mt-4 inline-block text-blue-600 text-sm font-medium hover:text-blue-700"
          >
            Schedule a session
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-sm p-6 text-white">
      <h3 className="font-semibold mb-4">Next Session</h3>

      <div className="space-y-3 mb-6">
        <div>
          <p className="text-sm text-blue-100 mb-1">Session</p>
          <p className="font-semibold">{session.title}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-100" />
          <span className="text-sm">{formatTime(session.scheduled_start)}</span>
          <span className="text-blue-100">•</span>
          <span className="text-sm">{formatDuration(session.duration_minutes)}</span>
        </div>

        <div className="text-sm text-blue-100">
          Starting {getTimeAgo(session.scheduled_start)}
        </div>
      </div>

      <Link
        to={`/study?category=${session.category}`}
        className="flex items-center justify-center space-x-2 w-full bg-white text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
      >
        <Play className="w-4 h-4" />
        <span>Join Session</span>
      </Link>
    </div>
  );
};

export default NextSessionCard;
