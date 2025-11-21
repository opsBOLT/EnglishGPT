import { Calendar, Clock, Play } from 'lucide-react';
import { Card, Flex, Text } from '@tremor/react';
import { formatTime, formatDuration, getTimeAgo } from '../../../utils/date';
import { Link } from 'react-router-dom';

interface NextSessionCardProps {
  session: any;
}

const NextSessionCard = ({ session }: NextSessionCardProps) => {
  if (!session) {
    return (
      <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#aa80f3]" />
            <h3 className="font-semibold text-slate-900">Next Session</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">No sessions</span>
        </Flex>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <p className="text-slate-600 text-sm">You&apos;re free for now.</p>
          <Link
            to="/calendar"
            className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#aa80f3] text-white text-sm font-semibold rounded-xl shadow hover:shadow-lg transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule a session</span>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-3xl border-0 p-6 shadow-xl bg-gradient-to-br from-[#aa80f3] via-[#9b8bff] to-[#63ccff] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_40%)]" />
      <div className="relative">
        <Flex justifyContent="between" alignItems="center" className="mb-4">
          <h3 className="font-semibold">Next Session</h3>
          <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
            {session.category}
          </span>
        </Flex>

        <div className="space-y-3 mb-6">
          <div>
            <Text className="text-sm text-white/80">Session</Text>
            <p className="font-semibold text-lg">{session.title}</p>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/80" />
              <span>{formatTime(session.scheduled_start)}</span>
            </div>
            <span className="text-white/70">•</span>
            <span>{formatDuration(session.duration_minutes)}</span>
          </div>

          <div className="text-sm text-white/80">
            Starting {getTimeAgo(session.scheduled_start)}
          </div>
        </div>

        <Link
          to={`/study?category=${session.category}`}
          className="relative flex items-center justify-center gap-2 w-full bg-white text-[#6b35d9] py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Play className="w-4 h-4" />
          <span>Join Session</span>
        </Link>
      </div>
    </Card>
  );
};

export default NextSessionCard;
