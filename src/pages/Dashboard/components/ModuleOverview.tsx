import { BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { StudentProgress } from '../../../types';
import { calculateProgress } from '../../../utils/progress';

interface ModuleOverviewProps {
  progress: StudentProgress[];
}

const ModuleOverview = ({ progress }: ModuleOverviewProps) => {
  const getCategoryLabel = (category: string) => {
    const labels = {
      paper1: 'Paper 1 Guide',
      paper2: 'Paper 2 Guide',
      examples: 'High-Level Examples',
      text_types: 'Text Types Criteria',
      vocabulary: 'Vocabulary Improvement',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStatusTag = (percentage: number) => {
    if (percentage === 100) {
      return (
        <span className="flex items-center space-x-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
          <CheckCircle2 className="w-3 h-3" />
          <span>Complete</span>
        </span>
      );
    }
    if (percentage > 0) {
      return (
        <span className="flex items-center space-x-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
          <Circle className="w-3 h-3" />
          <span>In Progress</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
        <Circle className="w-3 h-3" />
        <span>Not Started</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Module Overview</h3>
      </div>

      <div className="space-y-4">
        {progress.map((item) => {
          const percentage = calculateProgress(item.sections_completed, item.total_sections);
          return (
            <div key={item.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {getCategoryLabel(item.category)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {item.sections_completed} of {item.total_sections} sections
                  </p>
                </div>
                {getStatusTag(percentage)}
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        {progress.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Start studying to track your progress</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleOverview;
