import { Clock, ChevronRight } from 'lucide-react';
import { DailyTask } from '../../../types';
import { Link } from 'react-router-dom';

interface TodaysTasksProps {
  tasks: DailyTask[];
  onRefresh: () => void;
}

const TodaysTasks = ({ tasks }: TodaysTasksProps) => {
  const getCategoryColor = (category: string) => {
    const colors = {
      paper1: 'bg-blue-100 text-blue-700 border-blue-200',
      paper2: 'bg-green-100 text-green-700 border-green-200',
      examples: 'bg-orange-100 text-orange-700 border-orange-200',
      text_types: 'bg-pink-100 text-pink-700 border-pink-200',
      vocabulary: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-500',
      ongoing: 'bg-blue-500',
      upcoming: 'bg-gray-300',
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Today's Study Tasks</h3>
        <Link to="/study" className="text-sm text-blue-600 font-medium hover:text-blue-700">
          View All
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No tasks scheduled for today</p>
          <Link
            to="/calendar"
            className="mt-4 inline-block text-blue-600 text-sm font-medium hover:text-blue-700"
          >
            Schedule tasks
          </Link>
        </div>
      ) : (
        <div className="space-y-3 overflow-x-auto">
          <div className="flex space-x-3 pb-2">
            {tasks.map((task) => (
              <Link
                key={task.id}
                to={`/study?category=${task.category}`}
                className="flex-shrink-0 w-72 bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                      task.category
                    )}`}
                  >
                    {getCategoryLabel(task.category)}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                </div>

                <h4 className="font-medium text-gray-900 mb-2 line-clamp-1">{task.title}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{task.time_slot}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodaysTasks;
