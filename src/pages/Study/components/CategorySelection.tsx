import { Play } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSessionHistory } from '../../../hooks/useStudyPlatform';
import {
  STUDY_CATEGORIES,
  type StudyCategory,
} from '../../../config/studyContent';
import { PRIORITY_TASKS } from '../../../data/igcseGuides';

const PRIMARY = '#2563eb';

const TAGLINES: Record<StudyCategory, string> = {
  'Paper 1 Guide/Revision': 'Summaries + effect.',
  'Paper 2 Guide/Revision': 'Directed + narrative.',
  'High-Level Example Responses': 'Read Band 1 samples.',
  'Text Types Criteria': 'Format + tone cues.',
  'Vocabulary Improvement': 'Sharper word choices.',
};

interface CategorySelectionProps {
  onStartSession: (categoryId: StudyCategory | string) => void;
}

const CategorySelection = ({ onStartSession }: CategorySelectionProps) => {
  const { user } = useAuth();
  const { loading } = useSessionHistory(user?.id || '');

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold" style={{ color: PRIMARY }}>
          Study
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Start a task</h1>
        <p className="text-gray-600 max-w-xl">Top tasks first. Categories below.</p>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Priority</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRIORITY_TASKS.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center justify-between shadow-sm"
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{task.subtitle}</p>
                <h3 className="text-xl font-semibold text-gray-900 leading-tight">{task.label}</h3>
                <p className="text-sm text-gray-600">Built to launch instantly.</p>
              </div>
              <button
                onClick={() => onStartSession(task.categorySlug)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
                style={{
                  backgroundColor: PRIMARY,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">Categories</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {STUDY_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: '#eef2ff', color: PRIMARY }}
                >
                  {cat.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-snug">
                    {TAGLINES[cat.id]}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onStartSession(cat.id)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white"
                style={{
                  backgroundColor: PRIMARY,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategorySelection;
