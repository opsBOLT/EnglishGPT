import { useState } from 'react';
import { BookOpen, FileText, Star, List, Book } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface CategorySelectionProps {
  selectedCategory: string | null;
  onStartSession: (sessionId: string) => void;
}

const CategorySelection = ({ selectedCategory, onStartSession }: CategorySelectionProps) => {
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    {
      id: 'paper1',
      title: 'Paper 1 Guide',
      description: 'Guided literary analysis techniques and strategies',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'paper2',
      title: 'Paper 2 Guide',
      description: 'Comparative essay writing and analysis',
      icon: FileText,
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'examples',
      title: 'High-Level Example Responses',
      description: 'Study top-scoring student examples with AI guidance',
      icon: Star,
      color: 'from-orange-500 to-amber-500',
    },
    {
      id: 'text_types',
      title: 'Text Types Criteria',
      description: 'Master different text types and their requirements',
      icon: List,
      color: 'from-pink-500 to-rose-500',
    },
    {
      id: 'vocabulary',
      title: 'Vocabulary Improvement',
      description: 'Enhance your literary vocabulary and expression',
      icon: Book,
      color: 'from-cyan-500 to-teal-500',
    },
  ];

  const handleCategoryClick = (catId: string) => {
    setSelectedCat(catId);
    setShowDurationModal(true);
  };

  const handleStartSession = async () => {
    if (!user || !selectedCat) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          category: selectedCat,
          status: 'active',
          duration_minutes: 0,
        })
        .select()
        .single();

      if (error) throw error;

      onStartSession(data.id);
      navigate(`/study?category=${selectedCat}`);
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setLoading(false);
    }
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
