import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PixelAnimation } from '../../components/PixelAnimation';
import { EvaluateResult } from '../../services/markingClient';

type LocationState = {
  result?: EvaluateResult;
  essay?: string;
  questionType?: string;
};

const OnboardingResult = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userId } = useParams();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const result = state?.result;
  const essay = state?.essay;
  const questionType = state?.questionType;

  useEffect(() => {
    if (user?.id && userId && user.id !== userId) {
      navigate(`/onboarding/${user.id}`, { replace: true });
    }
  }, [user?.id, userId, navigate]);

  useEffect(() => {
    if (!result || !essay) {
      if (user?.id) {
        navigate(`/onboarding/${user.id}`, { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [essay, result, user?.id, navigate]);

  const marks = useMemo(() => {
    if (!result) return [];

    const entries = Object.entries(result).filter(([key, value]) => {
      const isMarkField = key.endsWith('_marks') || key === 'total_score' || key === 'max_score';
      const isRenderable = typeof value === 'number' || typeof value === 'string';
      return isMarkField && isRenderable;
    });

    return entries.map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: String(value),
    }));
  }, [result]);

  const improvementList =
    (result?.improvement_suggestions && result.improvement_suggestions.length && result.improvement_suggestions) ||
    (result?.improvements && result.improvements.length && result.improvements) ||
    [];

  if (!result || !essay) {
    return null;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <PixelAnimation colorHueStart={280} colorHueRange={40} pixelGap={8} animationSpeed={0.2} animationDuration={400} />
      </div>

      <div className="w-full h-screen flex items-center justify-center relative z-10 px-8">
        <div className="w-full max-w-6xl grid grid-cols-2 gap-10 items-start">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-6 border border-white/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase sulphur-point-bold" style={{ color: '#aa08f3' }}>
                  Your response
                </p>
                <h2 className="text-3xl sulphur-point-bold" style={{ color: '#2b0c44' }}>
                  {questionType || 'Essay submission'}
                </h2>
              </div>
              <div className="px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: '#aa08f3', color: 'white' }}>
                Marked
              </div>
            </div>
            <div
              className="rounded-2xl p-6 shadow-inner max-h-[65vh] overflow-auto text-lg sulphur-point-regular leading-relaxed"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                color: '#2b0c44',
                border: '1px solid rgba(170, 8, 243, 0.2)',
              }}
            >
              <pre className="whitespace-pre-wrap break-words">{essay}</pre>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] uppercase sulphur-point-bold" style={{ color: '#aa08f3' }}>
                    Feedback
                  </p>
                  <h2 className="text-3xl sulphur-point-bold" style={{ color: '#2b0c44' }}>
                    Grade {result.grade}
                  </h2>
                </div>
                <div className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: '#2b0c44', color: 'white' }}>
                  {result.short_id || 'Result'}
                </div>
              </div>
              <p className="text-lg sulphur-point-regular leading-relaxed" style={{ color: '#2b0c44' }}>
                {result.feedback}
              </p>

              {improvementList.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold sulphur-point-bold uppercase tracking-wide" style={{ color: '#6a0bbd' }}>
                    Improvement ideas
                  </h3>
                  <ul className="space-y-2">
                    {improvementList.map((item, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl px-4 py-3 sulphur-point-regular"
                        style={{ backgroundColor: 'rgba(170, 8, 243, 0.08)', color: '#2b0c44' }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.strengths?.length ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold sulphur-point-bold uppercase tracking-wide" style={{ color: '#6a0bbd' }}>
                    Strengths
                  </h3>
                  <ul className="space-y-1">
                    {result.strengths.map((item, idx) => (
                      <li key={idx} className="text-base sulphur-point-regular" style={{ color: '#2b0c44' }}>
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.next_steps?.length ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold sulphur-point-bold uppercase tracking-wide" style={{ color: '#6a0bbd' }}>
                    Next steps
                  </h3>
                  <ul className="space-y-1">
                    {result.next_steps.map((item, idx) => (
                      <li key={idx} className="text-base sulphur-point-regular" style={{ color: '#2b0c44' }}>
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {marks.length > 0 && (
              <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/40 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold tracking-wide uppercase sulphur-point-bold" style={{ color: '#aa08f3' }}>
                    Marks breakdown
                  </p>
                  <div className="h-1 w-12 rounded-full" style={{ backgroundColor: '#aa08f3' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {marks.map(mark => (
                    <div
                      key={mark.label}
                      className="rounded-xl p-4"
                      style={{ backgroundColor: 'rgba(170, 8, 243, 0.08)', color: '#2b0c44' }}
                    >
                      <p className="text-xs uppercase sulphur-point-bold tracking-wide" style={{ color: '#6a0bbd' }}>
                        {mark.label}
                      </p>
                      <p className="text-xl sulphur-point-bold">{mark.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => navigate('/study')}
                className="px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 sulphur-point-bold shadow-lg"
                style={{ backgroundColor: '#aa08f3', color: 'white' }}
              >
                Now generate my study plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingResult;
