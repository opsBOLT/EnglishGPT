import { BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { Card, Flex, ProgressBar, Text } from '@tremor/react';
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
        <span className="flex items-center space-x-1 text-xs font-medium text-[#6f2dd2] bg-[#f1e7ff] px-2 py-1 rounded">
          <Circle className="w-3 h-3 text-[#6f2dd2]" />
          <span>In Progress</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
        <Circle className="w-3 h-3 text-slate-500" />
        <span>Not Started</span>
      </span>
    );
  };

  return (
    <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-3 rounded-2xl bg-[#aa80f3]/10 text-[#6f2dd2]">
          <BookOpen className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-slate-900">Module Overview</h3>
      </div>

      <div className="space-y-4">
        {progress.map((item) => {
          const percentage = calculateProgress(item.sections_completed, item.total_sections);
          const statusTag = getStatusTag(percentage);
          return (
            <div
              key={item.id}
              className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
            >
              <Flex justifyContent="between" alignItems="start" className="gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {getCategoryLabel(item.category)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.sections_completed} of {item.total_sections} sections
                  </p>
                </div>
                {statusTag}
              </Flex>

              <ProgressBar
                color={percentage === 100 ? 'emerald' : 'violet'}
                value={percentage}
                className="h-3 rounded-full bg-white"
              />

              <Flex justifyContent="between">
                <Text className="text-xs text-slate-500">Momentum</Text>
                <Text className="text-xs font-semibold text-slate-700">{percentage}%</Text>
              </Flex>
            </div>
          );
        })}

        {progress.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <Text className="text-sm text-slate-600">Start studying to track your progress</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ModuleOverview;
