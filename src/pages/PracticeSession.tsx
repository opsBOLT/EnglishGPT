/**
 * Practice Session Page
 * AI-powered practice with real past paper questions
 * Includes marking integration for student answers
 */

import { useState, useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generatePracticeSession, type PracticeSessionPlan, type PracticeGuideType, getQuestionTypeLabel } from '../services/practiceContent';
import { evaluateEssayPublic, type EvaluateResult } from '../services/markingClient';
import { getAINotes, getPracticeSession, updatePracticeSession } from '../services/api';
import { Button } from '../components/ui/3d-button';
import { Card } from '../components/ui/card';
import { Loader2, Send, X, CheckCircle, BookOpen, Award, Target, TrendingUp } from 'lucide-react';
import SnowballSpinner from '../components/SnowballSpinner';
import SiriOrb from '../components/ui/siri-orb';
import { motion, AnimatePresence } from 'framer-motion';

interface PracticeSessionProps {
  userId?: string;
}

type QuestionAnswer = {
  questionIndex: number;
  answer: string;
  wordCount: number;
  markingResult?: EvaluateResult;
  isMarking?: boolean;
};

export function PracticeSession({ userId: propsUserId }: PracticeSessionProps) {
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = propsUserId || user?.id || '';

  const practiceType = searchParams.get('type') as PracticeGuideType | null;
  const sessionId = urlSessionId || null;

  const [sessionPlan, setSessionPlan] = useState<PracticeSessionPlan | null>(null);
  const [aiSessionLoading, setAiSessionLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<'guidance' | 'practice' | 'results'>('guidance');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({});

  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  // Generate practice session on mount and fetch existing session
  useEffect(() => {
    let canceled = false;

    const initSession = async () => {
      if (!sessionId) {
        setPlanError('No session ID provided');
        return;
      }

      if (!practiceType) {
        setPlanError('Practice type not specified');
        return;
      }

      // Fetch the session from database
      const { session: dbSession, error: sessionError } = await getPracticeSession(sessionId);

      if (sessionError || !dbSession) {
        setPlanError('Failed to load practice session. Please try again.');
        return;
      }

      setAiSessionLoading(true);
      try {
        // Fetch user's AI notes for personalization
        const { notes: aiNotes } = await getAINotes(userId);
        const userSummary = String((aiNotes as Record<string, unknown>)?.onboarding_summary || '');

        // Generate practice session using practice guides
        const { session, error } = await generatePracticeSession(
          practiceType,
          JSON.stringify(aiNotes),
          userSummary
        );

        if (error || !session) {
          throw new Error(error || 'Failed to generate practice session');
        }

        if (!canceled) {
          setSessionPlan(session);
        }
      } catch (error) {
        console.error('[PracticeSession] Generation failed', error);
        if (!canceled) {
          setPlanError(
            error instanceof Error ? error.message : 'Practice session generation failed.'
          );
        }
      } finally {
        if (!canceled) {
          setAiSessionLoading(false);
        }
      }
    };

    void initSession();

    return () => {
      canceled = true;
    };
  }, [practiceType, userId, sessionId]);

  // Save session to database
  const saveSessionToDatabase = useCallback(async () => {
    if (!sessionId || !sessionPlan) return;

    try {
      // Prepare questions data
      const questionsData = sessionPlan.selected_questions.map((q, idx) => ({
        question_id: `${idx}`,
        question_text: q.question_text,
        exam_series: q.exam_series,
        marks: q.marks,
        user_answer: answers[idx]?.answer || '',
        word_count: answers[idx]?.wordCount || 0,
        marking_result: answers[idx]?.markingResult || null,
      }));

      // Calculate total grade (average of all marked questions)
      const markedAnswers = Object.values(answers).filter(a => a.markingResult);
      const totalGrade = markedAnswers.length > 0
        ? markedAnswers.reduce((sum, a) => {
            const score = typeof a.markingResult?.total_score === 'number' ? a.markingResult.total_score : 0;
            return sum + score;
          }, 0) / markedAnswers.length
        : 0;

      // Extract weak points from marking results
      const weakPoints: string[] = [];
      Object.values(answers).forEach(a => {
        if (a.markingResult?.improvement_suggestions) {
          a.markingResult.improvement_suggestions.forEach(s => {
            if (!weakPoints.includes(s)) {
              weakPoints.push(s);
            }
          });
        }
      });

      // Update session in database
      await updatePracticeSession(sessionId, {
        questions_data: questionsData,
        total_grade: totalGrade,
        weak_points: weakPoints.slice(0, 5), // Limit to top 5
      });
    } catch (error) {
      console.error('[PracticeSession] Failed to save session:', error);
    }
  }, [sessionId, sessionPlan, answers]);

  // Auto-save answers to database every 30 seconds
  useEffect(() => {
    if (!sessionId || !sessionPlan) return;

    const saveInterval = setInterval(() => {
      void saveSessionToDatabase();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [sessionId, sessionPlan, saveSessionToDatabase]);

  // Handle answer change
  const handleAnswerChange = (questionIndex: number, value: string) => {
    const wordCount = value.trim().split(/\s+/).filter(w => w.length > 0).length;
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: {
        questionIndex,
        answer: value,
        wordCount,
        markingResult: prev[questionIndex]?.markingResult,
      },
    }));
  };

  // Mark a single question
  const handleMarkQuestion = async (questionIndex: number) => {
    if (!sessionPlan || !sessionId) return;

    const answer = answers[questionIndex];
    if (!answer || !answer.answer.trim()) {
      alert('Please write an answer before submitting for marking');
      return;
    }

    // Set marking state
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        isMarking: true,
      },
    }));

    try {
      // Determine question type for marking API
      let questionType = 'igcse_narrative';
      if (practiceType === 'directed_writing') {
        questionType = 'igcse_directed';
      } else if (practiceType === 'descriptive_writing') {
        questionType = 'igcse_descriptive';
      } else if (practiceType === 'narrative_writing') {
        questionType = 'igcse_narrative';
      }

      const selectedQuestion = sessionPlan.selected_questions[questionIndex];

      // Call marking API
      const result = await evaluateEssayPublic({
        questionType,
        essay: answer.answer,
        markingScheme: `Question: ${selectedQuestion.question_text}\nWord Count: ${selectedQuestion.word_count}\nMarks: ${selectedQuestion.marks}`,
        userId,
      });

      // Update with marking result
      setAnswers(prev => ({
        ...prev,
        [questionIndex]: {
          ...prev[questionIndex],
          markingResult: result,
          isMarking: false,
        },
      }));

      // Save to database immediately after marking
      await saveSessionToDatabase();
    } catch (error) {
      console.error('[PracticeSession] Marking failed', error);
      alert(`Marking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAnswers(prev => ({
        ...prev,
        [questionIndex]: {
          ...prev[questionIndex],
          isMarking: false,
        },
      }));
    }
  };

  // Mark all questions
  const handleMarkAll = async () => {
    if (!sessionPlan || !sessionId) return;

    const unansweredQuestions = sessionPlan.selected_questions
      .map((_, idx) => idx)
      .filter(idx => !answers[idx] || !answers[idx].answer.trim());

    if (unansweredQuestions.length > 0) {
      alert(`Please answer all questions before submitting. Missing answers for question(s): ${unansweredQuestions.map(i => i + 1).join(', ')}`);
      return;
    }

    // Mark all questions in parallel
    await Promise.all(
      sessionPlan.selected_questions.map((_, idx) => {
        if (!answers[idx]?.markingResult) {
          return handleMarkQuestion(idx);
        }
        return Promise.resolve();
      })
    );

    // Save final results to database
    await saveSessionToDatabase();

    setCurrentStep('results');
  };

  // Handle end session
  const handleEndSession = useCallback(async () => {
    // Save session before exiting
    await saveSessionToDatabase();
    navigate('/practice');
  }, [navigate, saveSessionToDatabase]);

  // Loading screen
  if (aiSessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8 text-center"
        >
          <SiriOrb size="200px" animationDuration={10} />
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-slate-900 sulphur-point-bold">
              Creating your practice session
            </h2>
            <p className="text-lg text-slate-600 max-w-md mx-auto sulphur-point-regular">
              AI is analyzing {practiceType && getQuestionTypeLabel(practiceType)} questions and selecting the best ones for you...
            </p>
          </div>
          <SnowballSpinner size="sm" label="" />
        </motion.div>
      </div>
    );
  }

  // Error screen
  if (planError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="space-y-4 text-center max-w-md bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 sulphur-point-bold">
            Session generation failed
          </h2>
          <p className="text-slate-700 sulphur-point-regular">{planError}</p>
          <p className="text-sm text-slate-500">
            Check your configuration and try again.
          </p>
          <Button onClick={() => navigate('/practice')}>
            Back to Practice
          </Button>
        </div>
      </div>
    );
  }

  // No session plan
  if (!sessionPlan) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SnowballSpinner size="lg" label="Loading session..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sulphur-point-bold">
              {sessionPlan.topic}
            </h1>
            <p className="text-sm text-slate-600 sulphur-point-regular">
              {practiceType && getQuestionTypeLabel(practiceType)} Practice
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleEndSession} variant="outline_destructive" size="sm">
              <X className="w-4 h-4 mr-1" /> End
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <AnimatePresence mode="wait">
            {currentStep === 'guidance' && (
              <motion.div
                key="guidance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GuidanceSection
                  sessionPlan={sessionPlan}
                  onStartPractice={() => setCurrentStep('practice')}
                />
              </motion.div>
            )}

            {currentStep === 'practice' && (
              <motion.div
                key="practice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <PracticeSection
                  sessionPlan={sessionPlan}
                  answers={answers}
                  currentQuestionIndex={currentQuestionIndex}
                  practiceType={practiceType}
                  onAnswerChange={handleAnswerChange}
                  onMarkQuestion={handleMarkQuestion}
                  onMarkAll={handleMarkAll}
                  onQuestionChange={setCurrentQuestionIndex}
                  textareaRefs={textareaRefs}
                />
              </motion.div>
            )}

            {currentStep === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ResultsSection
                  sessionPlan={sessionPlan}
                  answers={answers}
                  onBackToPractice={() => setCurrentStep('practice')}
                  onEndSession={handleEndSession}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Guidance Section Component
function GuidanceSection({
  sessionPlan,
  onStartPractice,
}: {
  sessionPlan: PracticeSessionPlan;
  onStartPractice: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-8 bg-white shadow-lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-[#aa08f3]/10 rounded-xl">
            <Target className="w-8 h-8 text-[#aa08f3]" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 sulphur-point-bold">
              Let's Get Started!
            </h2>
            <p className="text-slate-700 sulphur-point-regular text-lg">
              {sessionPlan.introduction}
            </p>
          </div>
        </div>

        {/* Selected Questions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4 sulphur-point-bold">
            Questions Selected for You
          </h3>
          <div className="space-y-4">
            {sessionPlan.selected_questions.map((q, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#aa08f3] text-white rounded-lg flex items-center justify-center font-bold sulphur-point-bold">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-slate-500 sulphur-point-regular">
                      {q.exam_series}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#aa08f3] sulphur-point-bold">
                    {q.marks} marks
                  </span>
                </div>
                <p className="text-slate-900 font-medium mb-3 sulphur-point-regular">
                  {q.question_text}
                </p>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-sm text-slate-600 sulphur-point-regular">
                    <span className="font-semibold">Why selected:</span> {q.why_selected}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Techniques Focus */}
        {sessionPlan.techniques_focus && sessionPlan.techniques_focus.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4 sulphur-point-bold">
              Techniques to Focus On
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessionPlan.techniques_focus.map((tech, idx) => (
                <div key={idx} className="bg-gradient-to-br from-[#aa08f3]/5 to-[#aa08f3]/10 rounded-xl p-5 border-2 border-[#aa08f3]/20">
                  <h4 className="font-bold text-slate-900 mb-2 sulphur-point-bold">
                    {tech.technique}
                  </h4>
                  <p className="text-sm text-slate-700 mb-2 sulphur-point-regular">
                    {tech.explanation}
                  </p>
                  <p className="text-xs text-slate-600 italic sulphur-point-regular">
                    Tip: {tech.practice_tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Criteria */}
        {sessionPlan.success_criteria && sessionPlan.success_criteria.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4 sulphur-point-bold flex items-center gap-2">
              <Award className="w-6 h-6 text-[#aa08f3]" />
              Success Criteria
            </h3>
            <ul className="space-y-2">
              {sessionPlan.success_criteria.map((criterion, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 sulphur-point-regular">{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={onStartPractice} className="w-full" size="lg">
          Start Practice Session
        </Button>
      </Card>
    </div>
  );
}

// Practice Section Component
function PracticeSection({
  sessionPlan,
  answers,
  currentQuestionIndex,
  practiceType,
  onAnswerChange,
  onMarkQuestion,
  onMarkAll,
  onQuestionChange,
  textareaRefs,
}: {
  sessionPlan: PracticeSessionPlan;
  answers: Record<number, QuestionAnswer>;
  currentQuestionIndex: number;
  practiceType: PracticeGuideType | null;
  onAnswerChange: (questionIndex: number, value: string) => void;
  onMarkQuestion: (questionIndex: number) => Promise<void>;
  onMarkAll: () => Promise<void>;
  onQuestionChange: (index: number) => void;
  textareaRefs: MutableRefObject<Record<number, HTMLTextAreaElement | null>>;
}) {
  const currentQuestion = sessionPlan.selected_questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  // Auto-focus the textarea when switching questions
  useEffect(() => {
    const el = textareaRefs.current[currentQuestionIndex];
    if (el) {
      el.focus();
    }
  }, [currentQuestionIndex, textareaRefs]);

  const relatedSteps = sessionPlan.practice_steps?.filter(step =>
    !step.applies_to_questions || step.applies_to_questions.includes(currentQuestionIndex + 1)
  );

  return (
    <div className="space-y-6">
      {/* Question navigation */}
      <Card className="p-6 bg-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#aa08f3]/10 flex items-center justify-center text-[#aa08f3] font-bold sulphur-point-bold">
              Q{currentQuestionIndex + 1}
            </div>
            <div>
              <p className="text-sm text-slate-500 sulphur-point-regular">Question</p>
              <p className="text-lg font-bold text-slate-900 sulphur-point-bold">
                {currentQuestion.exam_series}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => onMarkQuestion(currentQuestionIndex)} disabled={currentAnswer?.isMarking}>
              {currentAnswer?.isMarking ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Marking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> Mark this question
                </span>
              )}
            </Button>
            <Button size="sm" onClick={onMarkAll}>
              Mark all &amp; view results
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {sessionPlan.selected_questions.map((_, idx) => {
            const marked = !!answers[idx]?.markingResult;
            const active = idx === currentQuestionIndex;
            return (
              <button
                key={idx}
                onClick={() => onQuestionChange(idx)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  active
                    ? 'bg-[#aa08f3] text-white border-[#aa08f3]'
                    : marked
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-[#aa08f3]/50'
                }`}
              >
                {marked ? 'Marked' : `Question ${idx + 1}`}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Question + Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-white shadow-lg lg:col-span-2 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 sulphur-point-regular">{currentQuestion.exam_series}</p>
              <h3 className="text-xl font-bold text-slate-900 sulphur-point-bold mb-2">
                {getQuestionTypeLabel((practiceType || 'narrative_writing') as PracticeGuideType)}
              </h3>
              <p className="text-slate-800 sulphur-point-regular">{currentQuestion.question_text}</p>
            </div>
            <span className="text-sm font-semibold text-[#aa08f3] sulphur-point-bold whitespace-nowrap">
              {currentQuestion.marks} marks
            </span>
          </div>

          {currentQuestion.why_selected && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-500 sulphur-point-bold uppercase tracking-wide mb-2">
                Why this question
              </p>
              <p className="text-sm text-slate-700 sulphur-point-regular">{currentQuestion.why_selected}</p>
            </div>
          )}

          {/* Answer box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 sulphur-point-regular">Your answer</p>
              <span className="text-sm font-semibold text-slate-700 sulphur-point-bold">
                {currentAnswer?.wordCount || 0} words
              </span>
            </div>
            <textarea
              ref={el => {
                textareaRefs.current[currentQuestionIndex] = el;
              }}
              value={currentAnswer?.answer || ''}
              onChange={e => onAnswerChange(currentQuestionIndex, e.target.value)}
              placeholder="Write your response here..."
              className="w-full min-h-[400px] p-5 rounded-xl border-2 border-slate-200 focus:border-[#aa08f3] focus:ring-2 focus:ring-[#aa08f3]/30 outline-none shadow-inner sulphur-point-regular text-slate-900"
            />
          </div>

          {/* Marking results */}
          {currentAnswer?.markingResult && (
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="text-xs uppercase font-semibold text-emerald-600 sulphur-point-bold">
                    Marking Feedback
                  </p>
                  <p className="text-lg font-bold text-emerald-800 sulphur-point-bold">
                    Grade: {currentAnswer.markingResult.grade || '—'}
                  </p>
                </div>
              </div>
              {currentAnswer.markingResult.total_score && (
                <p className="text-sm text-slate-700 sulphur-point-regular">
                  Score: {currentAnswer.markingResult.total_score}
                  {currentAnswer.markingResult.max_score ? ` / ${currentAnswer.markingResult.max_score}` : ''}
                </p>
              )}
              <p className="text-sm text-slate-800 sulphur-point-regular whitespace-pre-line">
                {currentAnswer.markingResult.feedback}
              </p>
              {currentAnswer.markingResult.improvement_suggestions &&
                currentAnswer.markingResult.improvement_suggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-800 sulphur-point-bold mb-1">
                      Improvements
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 sulphur-point-regular">
                      {currentAnswer.markingResult.improvement_suggestions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {currentAnswer.markingResult.strengths && currentAnswer.markingResult.strengths.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 sulphur-point-bold mb-1">
                    Strengths
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 sulphur-point-regular">
                    {currentAnswer.markingResult.strengths.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Side guidance */}
        <div className="space-y-4">
          {relatedSteps && relatedSteps.length > 0 && (
            <Card className="p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-[#aa08f3]" />
                <h4 className="text-sm font-bold text-slate-900 sulphur-point-bold uppercase tracking-wide">
                  Steps for this question
                </h4>
              </div>
              <div className="space-y-3">
                {relatedSteps.map(step => (
                  <div key={step.step_number} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-900 sulphur-point-bold">
                        Step {step.step_number}: {step.title}
                      </p>
                      <span className="text-xs text-slate-500 sulphur-point-regular">
                        {step.duration_minutes} min
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 sulphur-point-regular">{step.instruction}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {sessionPlan.model_examples && (
            <Card className="p-5 bg-white border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-[#aa08f3]" />
                <h4 className="text-sm font-bold text-slate-900 sulphur-point-bold uppercase tracking-wide">
                  Model examples
                </h4>
              </div>
              <div className="space-y-3">
                {sessionPlan.model_examples.good_opening && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-600 sulphur-point-bold mb-1">Strong opening</p>
                    <p className="text-sm text-slate-800 sulphur-point-regular whitespace-pre-line">
                      {sessionPlan.model_examples.good_opening}
                    </p>
                  </div>
                )}
                {sessionPlan.model_examples.good_paragraph && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-600 sulphur-point-bold mb-1">Model paragraph</p>
                    <p className="text-sm text-slate-800 sulphur-point-regular whitespace-pre-line">
                      {sessionPlan.model_examples.good_paragraph}
                    </p>
                  </div>
                )}
                {sessionPlan.model_examples.vocabulary_bank && sessionPlan.model_examples.vocabulary_bank.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-600 sulphur-point-bold mb-2">Vocabulary bank</p>
                    <div className="flex flex-wrap gap-2">
                      {sessionPlan.model_examples.vocabulary_bank.map((word, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-[#aa08f3]/10 text-[#aa08f3] text-xs font-semibold sulphur-point-bold">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Results Section Component
function ResultsSection({
  sessionPlan,
  answers,
  onBackToPractice,
  onEndSession,
}: {
  sessionPlan: PracticeSessionPlan;
  answers: Record<number, QuestionAnswer>;
  onBackToPractice: () => void;
  onEndSession: () => void;
}) {
  const markedCount = sessionPlan.selected_questions.filter((_, idx) => !!answers[idx]?.markingResult).length;
  const totalQuestions = sessionPlan.selected_questions.length;

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 sulphur-point-regular">Session summary</p>
            <h2 className="text-3xl font-bold text-slate-900 sulphur-point-bold">Great work!</h2>
            <p className="text-slate-700 sulphur-point-regular">
              You completed {markedCount} out of {totalQuestions} questions with marking feedback.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBackToPractice}>
              Back to practice
            </Button>
            <Button onClick={onEndSession}>
              Finish
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sessionPlan.selected_questions.map((question, idx) => {
          const answer = answers[idx];
          const result = answer?.markingResult;
          return (
            <Card key={idx} className="p-6 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase font-semibold text-slate-500 sulphur-point-bold tracking-wide">
                    Question {idx + 1} • {question.exam_series}
                  </p>
                  <p className="text-slate-900 font-semibold sulphur-point-regular">{question.question_text}</p>
                </div>
                <span className="text-sm font-semibold text-[#aa08f3] sulphur-point-bold">
                  {question.marks} marks
                </span>
              </div>

              {result ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-500" />
                    <p className="text-sm font-semibold text-emerald-700 sulphur-point-bold">
                      Grade: {result.grade || '—'}
                    </p>
                  </div>
                  {result.feedback && (
                    <p className="text-sm text-slate-800 sulphur-point-regular whitespace-pre-line">
                      {result.feedback}
                    </p>
                  )}
                  {result.improvement_suggestions && result.improvement_suggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-800 sulphur-point-bold mb-1">Improvements</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 sulphur-point-regular">
                        {result.improvement_suggestions.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.strengths && result.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-800 sulphur-point-bold mb-1">Strengths</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 sulphur-point-regular">
                        {result.strengths.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-600 sulphur-point-regular">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  Awaiting marking...
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
