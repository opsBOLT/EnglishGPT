import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import AIChat from './AIChat';
import ContentViewer from './ContentViewer';
import NotesPanel from './NotesPanel';
import { MessageSquare, FileText, StickyNote, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudyInterfaceProps {
  sessionId: string;
  category: string;
}

const StudyInterface = ({ sessionId, category }: StudyInterfaceProps) => {
  const [startTime] = useState(new Date());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 60000);
      setElapsedMinutes(diff);
    }, 60000);

    return () => clearInterval(interval);
  }, [startTime]);

  const handleEndSession = async () => {
    if (!user) return;

    try {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

      await supabase
        .from('study_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: duration,
          status: 'completed',
        })
        .eq('id', sessionId);

      navigate('/dashboard');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 pt-16">
      <div className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {category === 'paper1' && 'Paper 1 Guide'}
                {category === 'paper2' && 'Paper 2 Guide'}
                {category === 'examples' && 'High-Level Examples'}
                {category === 'text_types' && 'Text Types Criteria'}
                {category === 'vocabulary' && 'Vocabulary Improvement'}
              </h1>
              <p className="text-sm text-gray-600">Session time: {elapsedMinutes} minutes</p>
            </div>
            <button
              onClick={handleEndSession}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>End Session</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">AI Study Buddy</h2>
            </div>
            <AIChat sessionId={sessionId} category={category} />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center space-x-2 bg-white">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Study Content</h2>
            </div>
            <ContentViewer category={category} />
          </div>

          <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center space-x-2">
              <StickyNote className="w-5 h-5 text-yellow-600" />
              <h2 className="font-semibold text-gray-900">My Notes</h2>
            </div>
            <NotesPanel sessionId={sessionId} category={category} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyInterface;
