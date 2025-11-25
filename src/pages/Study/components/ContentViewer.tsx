import { BookOpen } from 'lucide-react';
import { GUIDE_SNIPPETS } from '../../../data/igcseGuides';
import { type StudyCategory } from '../../../config/studyContent';

interface ContentViewerProps {
  category: string;
}

const PRIMARY = '#2563eb';

const ALIAS: Record<string, StudyCategory | string> = {
  paper1: 'Paper 1 Guide/Revision',
  paper2: 'Paper 2 Guide/Revision',
  examples: 'High-Level Example Responses',
  text_types: 'Text Types Criteria',
  vocabulary: 'Vocabulary Improvement',
  'writers-effect': 'writers_effect',
};

const FALLBACK = {
  title: 'Study focus',
  focus: 'Open a task to load content.',
  quickNotes: ['Stay concise.', 'Quote small.', 'Answer the question asked.'],
  bullets: [] as string[],
};

const ContentViewer = ({ category }: ContentViewerProps) => {
  const resolved = ALIAS[category] || category;
  const snippet =
    (typeof resolved === 'string' && GUIDE_SNIPPETS[resolved]) ||
    GUIDE_SNIPPETS.writers_effect ||
    FALLBACK;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-semibold" style={{ color: PRIMARY }}>
          {snippet.title}
        </p>
        <h1 className="text-3xl font-bold text-gray-900">{snippet.focus}</h1>
      </div>

      {snippet.bullets.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-2">
          <ul className="space-y-1 text-sm text-gray-700">
            {snippet.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PRIMARY }} />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-2">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <BookOpen className="w-5 h-5" />
          Quick notes
        </div>
        <ul className="space-y-1 text-sm text-gray-700">
          {snippet.quickNotes.map((note) => (
            <li key={note} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PRIMARY }} />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ContentViewer;
