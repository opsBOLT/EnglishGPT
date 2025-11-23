import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface NotesPanelProps {
  sessionId: string;
  category: string;
}

const NotesPanel = ({ sessionId, category }: NotesPanelProps) => {
  const [content, setContent] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user, sessionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (content && user) {
        saveNotes();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [content, user, noteId]);

  const loadNotes = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('student_notes')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (data) {
        setContent(data.content);
        setNoteId(data.id);
      }
    } catch (error) {
    }
  };

  const saveNotes = async () => {
    if (!user) return;

    setSaving(true);

    try {
      if (noteId) {
        await supabase
          .from('student_notes')
          .update({
            content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', noteId);
      } else {
        const { data } = await supabase
          .from('student_notes')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            category,
            content,
          })
          .select()
          .single();

        if (data) {
          setNoteId(data.id);
        }
      }

      setLastSaved(new Date());
    } catch (error) {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Take notes here... Your notes are auto-saved every 30 seconds."
          className="w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={saveNotes}
          disabled={saving}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Notes'}</span>
        </button>
        {lastSaved && (
          <p className="text-xs text-gray-600 text-center mt-2">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;
