import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EvaluateResult } from '../../services/markingClient';
import { ChevronDown } from 'lucide-react';

type LocationState = {
  result?: EvaluateResult;
  essay?: string;
  questionType?: string;
  examStruggles?: string[];
};

type SectionKey = 'feedback' | 'improvements' | 'strengths' | 'nextSteps' | 'marks';

const accent = '#aa08f3';

const OnboardingResult = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userId } = useParams();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const searchParams = new URLSearchParams(location.search);
  const isTest = searchParams.get('test') === 'true';
  const result = state?.result;
  const essay = state?.essay;
  const questionType = state?.questionType;

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    feedback: true,
    improvements: false,
    strengths: false,
    nextSteps: false,
    marks: false,
  });

  useEffect(() => {
    if (!user?.id || !userId) return;
    if (user.id !== userId) {
      navigate(`/onboarding/${user.id}`, { replace: true });
    }
  }, [user?.id, userId, navigate]);

  const mockResult: EvaluateResult | null = useMemo(() => {
    if (!isTest) return null;
    return {
      grade: 'B+',
      feedback:
        'Clear understanding with confident points. To reach the top band, tighten structure and unpack the impact of each quote.',
      improvement_suggestions: [
        'Lead each paragraph with a claim that answers the question.',
        'Explain the reader impact after every quote: mood, tone, and effect.',
        'Remove repeated points so every sentence moves the argument forward.',
      ],
      strengths: [
        'Selects evidence that mostly matches each point.',
        'Tone awareness and mood description are strong.',
      ],
      next_steps: [
        'Write 3-sentence analysis bursts: claim → evidence → effect on reader.',
        'Underline command words before writing to stay on target.',
      ],
      total_score: 14,
      max_score: 20,
      content_structure_marks: 7,
      style_accuracy_marks: 7,
      short_id: 'TEST-MOCK',
      question_type: 'Paper 1 Q2d - Writer’s Effect',
    };
  }, [isTest]);

  const resolvedResult = result || mockResult;
  const resolvedEssay =
    essay ||
    (isTest
      ? 'The writer builds tension through sound and movement: the “howled” wind and “rattling” windows make the street feel alive. Shadows “seemed to move,” showing the narrator’s fear and making us doubt what is real. Short, nervous glances over her shoulder mirror the reader’s own unease, keeping the scene on edge.'
      : undefined);
  const resolvedQuestionType = questionType || mockResult?.question_type;

  const improvementList =
    (resolvedResult?.improvement_suggestions && resolvedResult.improvement_suggestions.length && resolvedResult.improvement_suggestions) ||
    (resolvedResult?.improvements && resolvedResult.improvements.length && resolvedResult.improvements) ||
    [];

  const marks = useMemo(() => {
    if (!resolvedResult) return [];
    const entries = Object.entries(resolvedResult).filter(([key, value]) => {
      const isMarkField = key.endsWith('_marks') || key === 'total_score' || key === 'max_score';
      const isRenderable = typeof value === 'number' || typeof value === 'string';
      return isMarkField && isRenderable;
    });
    return entries.map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: String(value),
    }));
  }, [resolvedResult]);

  const scorePercent =
    resolvedResult?.total_score && resolvedResult?.max_score
      ? Math.min(100, Math.round((Number(resolvedResult.total_score) / Number(resolvedResult.max_score)) * 100))
      : null;

  const scoreSummary =
    resolvedResult?.total_score !== undefined || resolvedResult?.max_score !== undefined
      ? `${resolvedResult?.total_score ?? '—'}${resolvedResult?.max_score ? ` / ${resolvedResult.max_score}` : ''}`
      : null;

  const toggleSection = (key: SectionKey) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!resolvedResult || !resolvedEssay) {
      if (user?.id) {
        navigate(`/onboarding/${user.id}`, { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [resolvedEssay, resolvedResult, user?.id, navigate]);

  if (!resolvedResult || !resolvedEssay) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f3f4f8' }}>
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8 text-slate-900">
        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase sulphur-point-bold" style={{ color: accent }}>
                Marking snapshot
              </p>
              <div className="flex items-end gap-4 flex-wrap">
                <h1 className="text-4xl font-bold sulphur-point-bold leading-none">Grade {resolvedResult.grade}</h1>
                {scoreSummary && (
                  <span className="text-sm font-semibold px-3 py-2 rounded-full border border-slate-200 sulphur-point-bold">
                    Score {scoreSummary}
                  </span>
                )}
                {isTest && (
                  <span className="text-xs font-semibold px-3 py-2 rounded-full border border-slate-200 uppercase tracking-wide" style={{ color: accent }}>
                    Test data
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {resolvedQuestionType && (
                  <span className="px-3 py-2 text-xs font-semibold rounded-full border border-slate-200 bg-slate-50">
                    {resolvedQuestionType}
                  </span>
                )}
                {resolvedResult.short_id && (
                  <span className="px-3 py-2 text-xs font-semibold rounded-full border border-slate-200 bg-slate-50">
                    {resolvedResult.short_id}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  // Navigate to study plan generation with onboarding data
                  navigate('/study-plan/generate', {
                    state: {
                      onboardingData: {
                        readingSkill: 'B',
                        writingSkill: 'B',
                        analysisSkill: 'B',
                        examStruggles: state?.examStruggles || [],
                        markingResult: resolvedResult,
                        weaknessQuestionType: resolvedQuestionType || '',
                        weaknessEssay: resolvedEssay || '',
                      },
                    },
                  });
                }}
                className="px-5 py-3 rounded-xl font-bold sulphur-point-bold border border-slate-200 hover:border-slate-300 transition-colors"
                style={{ color: accent }}
              >
                Build my study plan
              </button>
              <button
                onClick={() => navigate('/dashboard?test=true')}
                className="px-5 py-3 rounded-xl font-bold sulphur-point-bold transition-colors"
                style={{ backgroundColor: accent, color: 'white' }}
              >
                View test study plan
              </button>
              <button
                onClick={() => navigate(`/onboarding/${userId}`)}
                className="px-4 py-3 rounded-xl font-bold sulphur-point-bold border border-slate-200 hover:border-slate-300 transition-colors"
              >
                Back to onboarding
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Overall score" value={scoreSummary || 'Not provided'} accent={accent} />
            <StatCard label="Focus area" value={resolvedQuestionType || 'English paper'} accent={accent} />
            <StatCard label="Status" value={isTest ? 'Preview mode' : 'Live marking'} accent={accent} />
          </div>

          {scorePercent !== null && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold sulphur-point-bold">Progress to full marks</p>
                <span className="text-sm font-semibold sulphur-point-bold" style={{ color: accent }}>
                  {scorePercent}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-white border border-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${scorePercent}%`, backgroundColor: accent }}
                />
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] items-start">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase sulphur-point-bold" style={{ color: accent }}>
                  Your response
                </p>
                <h2 className="text-xl sulphur-point-bold">{resolvedQuestionType || 'Essay submission'}</h2>
              </div>
              <span
                className="px-3 py-2 rounded-full text-xs font-semibold sulphur-point-bold"
                style={{ backgroundColor: accent, color: 'white' }}
              >
                Marked
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 max-h-[70vh] overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap break-words text-base leading-relaxed sulphur-point-regular">{resolvedEssay}</pre>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] sulphur-point-bold" style={{ color: accent }}>
                Priority focus
              </p>
              <p className="mt-2 text-base leading-relaxed sulphur-point-regular">
                This is the quickest win to lift your grade. Apply it to your next attempt before anything else.
              </p>
            </div>

            <CollapsibleCard
              title="Marker feedback"
              subtitle="What your marker noticed"
              badge={`Grade ${resolvedResult.grade}`}
              accent={accent}
              open={openSections.feedback}
              onToggle={() => toggleSection('feedback')}
            >
              <p className="text-base leading-relaxed sulphur-point-regular">{resolvedResult.feedback}</p>
            </CollapsibleCard>

            {improvementList.length > 0 && (
              <CollapsibleCard
                title="Improvements to try"
                accent={accent}
                open={openSections.improvements}
                onToggle={() => toggleSection('improvements')}
              >
                <ul className="space-y-2">
                  {improvementList.map((item, idx) => (
                    <li
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sulphur-point-regular"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </CollapsibleCard>
            )}

            {resolvedResult.strengths?.length ? (
              <CollapsibleCard
                title="What worked"
                accent={accent}
                open={openSections.strengths}
                onToggle={() => toggleSection('strengths')}
              >
                <ul className="space-y-1">
                  {resolvedResult.strengths.map((item, idx) => (
                    <li key={idx} className="text-base sulphur-point-regular">
                      • {item}
                    </li>
                  ))}
                </ul>
              </CollapsibleCard>
            ) : null}

            {resolvedResult.next_steps?.length ? (
              <CollapsibleCard
                title="Next steps"
                accent={accent}
                open={openSections.nextSteps}
                onToggle={() => toggleSection('nextSteps')}
              >
                <ul className="space-y-1">
                  {resolvedResult.next_steps.map((item, idx) => (
                    <li key={idx} className="text-base sulphur-point-regular">
                      • {item}
                    </li>
                  ))}
                </ul>
              </CollapsibleCard>
            ) : null}

            {marks.length > 0 && (
              <CollapsibleCard
                title="Marks breakdown"
                accent={accent}
                open={openSections.marks}
                onToggle={() => toggleSection('marks')}
              >
                <div className="grid grid-cols-2 gap-3">
                  {marks.map(mark => (
                    <div
                      key={mark.label}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <p className="text-xs uppercase sulphur-point-bold tracking-wide" style={{ color: accent }}>
                        {mark.label}
                      </p>
                      <p className="text-lg font-bold sulphur-point-bold">{mark.value}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingResult;

type StatCardProps = {
  label: string;
  value: string;
  accent: string;
};

const StatCard = ({ label, value, accent }: StatCardProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm space-y-2">
    <p className="text-xs uppercase tracking-[0.15em] font-semibold sulphur-point-bold text-slate-500">{label}</p>
    <p className="text-lg font-bold sulphur-point-bold" style={{ color: accent }}>
      {value}
    </p>
  </div>
);

type CollapsibleCardProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  accent: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const CollapsibleCard = ({ title, subtitle, badge, accent, open, onToggle, children }: CollapsibleCardProps) => {
  return (
    <div className="border border-slate-200 rounded-2xl shadow-sm bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left sulphur-point-bold"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold">{title}</span>
          {subtitle && <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{subtitle}</span>}
        </div>
        <div className="flex items-center gap-3">
          {badge && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full border border-slate-200 sulphur-point-bold" style={{ color: accent }}>
              {badge}
            </span>
          )}
          <ChevronDown
            className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`}
            style={{ color: accent }}
          />
        </div>
      </button>
      {open && <div className="px-5 pb-5 space-y-3">{children}</div>}
    </div>
  );
};
