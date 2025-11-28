/**
 * Practice Session Page
 * AI-powered practice with real past paper questions
 * Includes marking integration for student answers
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generatePracticeSession, type PracticeSessionPlan, type PracticeGuideType, getQuestionTypeLabel } from '../services/practiceContent';
import { evaluateEssayPublic, type EvaluateResult } from '../services/markingClient';
import { getAINotes } from '../services/api';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = propsUserId || user?.id || '';

  const practiceType = searchParams.get('type') as PracticeGuideType | null;

  const [sessionPlan, setSessionPlan] = useState<PracticeSessionPlan | null>(null);
  const [aiSessionLoading, setAiSessionLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<'guidance' | 'practice' | 'results'>('guidance');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({});
  const [allMarked, setAllMarked] = useState(false);

  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

  // Generate practice session on mount
  useEffect(() => {
    let canceled = false;

    const initSession = async () => {
      if (!practiceType) {
        setPlanError('Practice type not specified');
        return;
      }

      setAiSessionLoading(true);
      try {
        // Fetch user's AI notes for personalization
        const { notes: aiNotes } = await getAINotes(userId);
        const userSummary = (aiNotes as any)?.onboarding_summary || '';

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
  }, [practiceType, userId]);

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
    if (!sessionPlan) return;

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
    if (!sessionPlan) return;

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

    setAllMarked(true);
    setCurrentStep('results');
  };

  // Handle end session
  const handleEndSession = useCallback(() => {
    navigate('/practice');
  }, [navigate]);

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
