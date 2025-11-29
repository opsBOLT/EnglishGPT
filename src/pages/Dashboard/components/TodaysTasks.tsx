import { Clock, ChevronRight } from 'lucide-react';
import { Card, Flex, Text } from '@tremor/react';
import { DailyTask } from '../../../types';
import { Link, useNavigate } from 'react-router-dom';
import { Button as ThreeDButton } from '../../../components/ui/3d-button';
import { useStudySession } from '../../../hooks/useStudyPlatform';
import { useAuth } from '../../../contexts/AuthContext';

interface TodaysTasksProps {
  tasks: DailyTask[];
  onRefresh: () => void;
}

const TodaysTasks = ({ tasks }: TodaysTasksProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startSession } = useStudySession(user?.id || '');
  const getCategoryColor = (category: string) => {
    const colors = {
      paper1: 'bg-[#f1e7ff] text-[#6f2dd2] border-[#e7d9ff]',
      paper2: 'bg-[#e6f8f1] text-[#0f9f6e] border-[#c9f1de]',
      examples: 'bg-[#fff6e5] text-[#c47a00] border-[#ffe5b3]',
      text_types: 'bg-[#ffe8f3] text-[#c13f86] border-[#ffd1e6]',
      vocabulary: 'bg-[#e6f5ff] text-[#0e82c6] border-[#caeaff]',
    };
    return (
      colors[category as keyof typeof colors] ||
      'bg-slate-50 text-slate-700 border-slate-200'
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-emerald-500',
      ongoing: 'bg-[#aa80f3]',
      upcoming: 'bg-slate-300',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-300';
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      paper1: 'Paper 1',
      paper2: 'Paper 2',
      examples: 'Examples',
      text_types: 'Text Types',
      vocabulary: 'Vocabulary',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const handleTaskClick = async (task: DailyTask) => {
    // Create a study session in the database first
    const sessionId = await startSession(task.category, 'study');

    if (sessionId) {
      // Navigate to the study session with the session ID
      navigate(`/study/session/${sessionId}`, {
        state: { taskId: task.id },
      });
    }
  };

  return (
    <Card className="rounded-3xl border-2 border-slate-200 outline outline-4 outline-slate-100/50 shadow-[0_10px_30px_rgba(15,23,42,0.12)] bg-white/90 backdrop-blur">
      <Flex justifyContent="between" alignItems="center" className="mb-6">
        <h3 className="font-semibold text-slate-900">Today&apos;s Study Tasks</h3>
        <Link to="/calendar" className="text-sm font-semibold text-[#6f2dd2] hover:text-[#4b1fa2]">
          Open Calendar
        </Link>
      </Flex>

      {tasks.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <p className="text-slate-600 text-sm">No tasks scheduled for today</p>
          <ThreeDButton asChild className="mt-4">
            <Link to="/calendar">
              Schedule tasks
            </Link>
          </ThreeDButton>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className="group rounded-2xl border-2 border-slate-200 outline outline-4 outline-slate-100/40 bg-slate-50/70 p-4 hover:-translate-y-1 transition-all hover:shadow-[0_14px_28px_rgba(15,23,42,0.15)] shadow-sm flex flex-col gap-3 text-left"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(
                    task.category
                  )}`}
                >
                  {getCategoryLabel(task.category)}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(task.status)}`} />
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 line-clamp-1">{task.title}</h4>
                <Text className="text-sm text-slate-600 line-clamp-2">{task.description}</Text>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600 mt-auto">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{task.time_slot}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#aa80f3]" />
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};

export default TodaysTasks;
