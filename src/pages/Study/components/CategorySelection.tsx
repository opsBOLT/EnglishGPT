import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSessionHistory } from '../../../hooks/useStudyPlatform';
import { STUDY_CATEGORIES, calculateCategoryProgress } from '../../../config/studyContent';
import { Clock, TrendingUp, CheckCircle } from 'lucide-react';

const CategorySelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { studySessions, loading } = useSessionHistory(user?.id || '');

  // Calculate progress for each category
  const getCompletedSections = (categoryId: string) => {
    return studySessions
      .filter(s => s.category === categoryId)
      .map(s => s.category)
      .filter((v, i, a) => a.indexOf(v) === i); // unique
  };

  const handleStartSession = (categoryId: string) => {
    navigate(`/study/session/${encodeURIComponent(categoryId)}`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Materials</h1>
        <p className="text-gray-600">Choose a category to begin your study session</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${cat.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{cat.title}</h3>
              <p className="text-sm text-gray-600">{cat.description}</p>
            </button>
          );
        })}
      </div>

      {showDurationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Start Study Session</h2>
            <p className="text-gray-600 mb-6">How long do you plan to study?</p>

            <div className="space-y-3 mb-6">
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    duration === mins
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{mins} minutes</span>
                </button>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDurationModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStartSession}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelection;
