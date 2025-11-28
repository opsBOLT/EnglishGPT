/**
 * Study Session Page
 * AI-powered study sessions with sections, notes, and quizzes
 * Uses igcseGuides.ts as the knowledge base
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStudySession, useStudyAI } from '../hooks/useStudyPlatform';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { generateStudySession, type StudySessionPlan, type QuizQuestion } from '../services/studyContent';
import { getAINotes } from '../services/api';
import { Button } from '../components/ui/3d-button';
import { Card } from '../components/ui/card';
import { Loader2, Send, Play, Pause, X, CheckCircle, BookOpen, Brain } from 'lucide-react';
import SnowballSpinner from '../components/SnowballSpinner';
import SiriOrb from '../components/ui/siri-orb';
import { motion } from 'framer-motion';

interface StudySessionProps {
  userId?: string;
}

export function StudySession({ userId: propsUserId }: StudySessionProps) {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = propsUserId || user?.id || '';

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState<{ correct: number; incorrect: number }>({
    correct: 0,
    incorrect: 0,
  });
  const [sessionPlan, setSessionPlan] = useState<StudySessionPlan | null>(null);
  const [aiSessionLoading, setAiSessionLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const notesRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get guide key from category or search params
  const guideKey = searchParams.get('guide') || category || 'paper1';

  // Backend integration
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { startSession, updateSession, completeSession } = useStudySession(userId);
  const { messages, sendMessage, loading: aiLoading } = useStudyAI(
    userId,
    `${guideKey} Study`
  );

  // Timer
  const timer = useSessionTimer();

  // Start session and generate content on mount
  useEffect(() => {
    let currentSessionId: string | null = null;
    let canceled = false;

    const initSession = async () => {
      // Start session tracking
      const id = await startSession(guideKey, 'study');
      if (id && !canceled) {
        currentSessionId = id;
        setSessionId(id);
        timer.start();
      }

      // Generate AI study session
      setAiSessionLoading(true);
      try {
        // Fetch user's AI notes for personalization
        const { notes: aiNotes } = await getAINotes(userId);
        const userSummary = String((aiNotes as Record<string, unknown>)?.onboarding_summary || '');

        // Generate study session using igcseGuides
        const { session, error } = await generateStudySession(
          guideKey,
          JSON.stringify(aiNotes),
          userSummary
        );

        if (error || !session) {
          throw new Error(error || 'Failed to generate study session');
        }

        if (!canceled) {
          setSessionPlan(session);
        }
      } catch (error) {
        console.error('[StudySession] Generation failed', error);
        if (!canceled) {
          setPlanError(
            error instanceof Error ? error.message : 'Study session generation failed.'
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
      if (currentSessionId) {
        void handleEndSession();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideKey, userId]);

  // Auto-save notes every 10 seconds
  useEffect(() => {
    if (!sessionId) return;

    const saveInterval = setInterval(async () => {
      if (notes.trim()) {
        await updateSession(sessionId, { notes_made: notes });
      }
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [sessionId, notes, updateSession]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle AI question
  const handleAskAI = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const question = aiInput;
    setAiInput('');

    await sendMessage(question);

    // Track question in session
    if (sessionId) {
      const questionsAsked = messages
        .filter(m => m.role === 'user')
        .map(m => ({ question: m.content, timestamp: new Date().toISOString() }));

      questionsAsked.push({ question, timestamp: new Date().toISOString() });

      await updateSession(sessionId, {
        questions_asked_ai: questionsAsked,
      });
    }
  };

  // Handle section completion
  const handleCompleteSection = () => {
    if (!sessionPlan) return;

    const currentSection = sessionPlan.sections[currentSectionIndex];

    // Show section quiz if available
    if (currentSection.quiz && currentSection.quiz.length > 0) {
      setShowQuiz(true);
    } else {
      moveToNextSection();
    }
  };

  // Move to next section
  const moveToNextSection = () => {
    if (!sessionPlan) return;

    if (currentSectionIndex < sessionPlan.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setShowQuiz(false);
    } else {
      // All sections complete, show final quiz
      if (sessionPlan.quiz && sessionPlan.quiz.length > 0) {
        setShowQuiz(true);
        setCurrentSectionIndex(sessionPlan.sections.length); // Mark as final quiz
      } else {
        void handleEndSession();
      }
    }
  };

  // Handle quiz completion
  const handleQuizComplete = async (correct: number, incorrect: number) => {
    setQuizResults(prev => ({
      correct: prev.correct + correct,
      incorrect: prev.incorrect + incorrect,
    }));

    if (sessionId) {
      await updateSession(sessionId, {
        quiz_correct: quizResults.correct + correct,
        quiz_incorrect: quizResults.incorrect + incorrect,
      });
    }

    // Check if passed (70% threshold)
    const total = correct + incorrect;
    const percentage = (correct / total) * 100;

    if (percentage >= 70) {
      setShowQuiz(false);

      // Check if this was the final quiz
      if (sessionPlan && currentSectionIndex >= sessionPlan.sections.length) {
        void handleEndSession();
      } else {
        moveToNextSection();
      }
    }
  };

  // End session
  const handleEndSession = useCallback(async () => {
    if (!sessionId) {
      navigate('/study');
      return;
    }

    const durationMinutes = timer.stop();

    // Final update
    await updateSession(sessionId, {
      duration_minutes: durationMinutes,
      notes_made: notes,
      revision_methods: ['ai-session', 'notes'],
    });

    // Complete session
    const analysis = await completeSession(sessionId);

    if (analysis && (analysis as Record<string, unknown>).weak_topics) {
      const weakTopics = (analysis as Record<string, unknown>).weak_topics as string[];
      alert(`Session completed! AI identified these areas to focus on: ${weakTopics.join(', ')}`);
    }

    navigate('/study');
  }, [completeSession, navigate, notes, sessionId, timer, updateSession]);

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
              Creating your study session
            </h2>
            <p className="text-lg text-slate-600 max-w-md mx-auto sulphur-point-regular">
              AI is analyzing the IGCSE guides and personalizing content just for you...
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
            Check your API configuration and try again.
          </p>
          <Button onClick={() => navigate('/study')}>
            Back to Study
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

  const currentSection = sessionPlan.sections[currentSectionIndex];
  const isFinalQuiz = currentSectionIndex >= sessionPlan.sections.length;
  const progress = sessionPlan.sections.length
    ? ((currentSectionIndex + 1) / (sessionPlan.sections.length + (sessionPlan.quiz ? 1 : 0))) * 100
    : 0;

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
              AI-powered study session
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-slate-900">
                {String(timer.hours).padStart(2, '0')}:
                {String(timer.minutes).padStart(2, '0')}:
                {String(timer.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500">
                {timer.isPaused ? 'Paused' : 'Active'}
              </div>
            </div>
            {timer.isPaused ? (
              <Button onClick={timer.resume} variant="outline" size="sm">
                <Play className="w-4 h-4 mr-1" /> Resume
              </Button>
            ) : (
              <Button onClick={timer.pause} variant="outline" size="sm">
                <Pause className="w-4 h-4 mr-1" /> Pause
              </Button>
            )}
            <Button onClick={handleEndSession} variant="outline_destructive" size="sm">
              <X className="w-4 h-4 mr-1" /> End
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-7xl mx-auto mt-4">
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-[#aa08f3] h-3 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 mt-2 sulphur-point-regular">
            {isFinalQuiz ? 'Final Quiz' : `Section ${currentSectionIndex + 1} of ${sessionPlan.sections.length}`}
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: AI Assistant */}
        <div className="w-1/3 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg sulphur-point-bold text-slate-900">
                  AI Study Assistant
                </h3>
                <p className="text-sm text-slate-600 sulphur-point-regular">
                  Ask about the content
                </p>
              </div>
              <SiriOrb size="72px" animationDuration={20} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-8">
                <Brain className="w-12 h-12 mx-auto mb-4 text-[#aa08f3]" />
                <p className="mb-4 sulphur-point-regular">Try asking:</p>
                <div className="space-y-2 text-sm">
                  <button
                    className="block w-full p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-left transition-colors sulphur-point-regular"
                    onClick={() => setAiInput("Explain this section in simpler terms")}
                  >
                    Explain this section simpler
                  </button>
                  <button
                    className="block w-full p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-left transition-colors sulphur-point-regular"
                    onClick={() => setAiInput('Give me an example')}
                  >
                    Give me an example
                  </button>
                  <button
                    className="block w-full p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-left transition-colors sulphur-point-regular"
                    onClick={() => setAiInput('How will this help in the exam?')}
                  >
                    How will this help in the exam?
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-[#aa08f3]/10 ml-8 border-2 border-[#aa08f3]/20'
                    : 'bg-slate-100 mr-8'
                }`}
              >
                <p className="text-sm font-semibold mb-1 sulphur-point-bold text-slate-900">
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </p>
                <p className="text-sm whitespace-pre-wrap sulphur-point-regular text-slate-700">
                  {msg.content}
                </p>
              </div>
            ))}

            {aiLoading && (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm sulphur-point-regular">AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 border-t border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#aa08f3] focus:border-transparent sulphur-point-regular"
                disabled={aiLoading}
              />
              <Button
                onClick={handleAskAI}
                disabled={aiLoading || !aiInput.trim()}
                size="default"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            {!showQuiz && currentSection ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <Card className="p-8 space-y-6 bg-white shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#aa08f3]/10 rounded-xl">
                      <BookOpen className="w-8 h-8 text-[#aa08f3]" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-slate-900 mb-2 sulphur-point-bold">
                        {currentSection.title}
                      </h2>
                      <p className="text-slate-600 sulphur-point-regular">
                        Study this section carefully, then test your understanding
                      </p>
                    </div>
                  </div>

                  <div className="prose prose-slate max-w-none">
                    <div className="text-slate-700 leading-relaxed whitespace-pre-line sulphur-point-regular text-base">
                      {currentSection.notes}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleCompleteSection}
                      className="gap-2"
                      size="lg"
                    >
                      {currentSection.quiz && currentSection.quiz.length > 0
                        ? 'Take Section Quiz'
                        : 'Continue to Next Section'}
                      <CheckCircle className="w-5 h-5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : showQuiz ? (
              <StudyQuiz
                questions={
                  isFinalQuiz
                    ? sessionPlan.quiz || []
                    : currentSection?.quiz || []
                }
                onComplete={handleQuizComplete}
                isFinal={isFinalQuiz}
              />
            ) : null}
          </div>

          {/* Bottom: User notes */}
          <div className="border-t border-slate-200 bg-white p-6">
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 sulphur-point-bold">Your Notes</h4>
                <span className="text-xs text-slate-500 sulphur-point-regular">
                  {notes.length} characters
                </span>
              </div>
              <textarea
                ref={notesRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your notes here. They'll be saved automatically."
                className="w-full min-h-[120px] p-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#aa08f3] focus:border-transparent text-sm sulphur-point-regular resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quiz Component
function StudyQuiz({
  questions,
  onComplete,
  isFinal = false,
}: {
  questions: QuizQuestion[];
  onComplete: (correct: number, incorrect: number) => void;
  isFinal?: boolean;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleSubmit = () => {
    let correct = 0;
    let incorrect = 0;

    questions.forEach(q => {
      const userAnswer = answers[q.id]?.trim().toLowerCase();
      const correctAnswer = Array.isArray(q.correctAnswer)
        ? q.correctAnswer.map((a: string) => a.toLowerCase())
        : [q.correctAnswer.toLowerCase()];

      if (correctAnswer.some((ca: string) => userAnswer === ca || userAnswer?.includes(ca))) {
        correct++;
      } else {
        incorrect++;
      }
    });

    onComplete(correct, incorrect);
  };

  if (showResults) {
    const correct = questions.filter(q => {
      const userAnswer = answers[q.id]?.trim().toLowerCase();
      const correctAnswer = Array.isArray(q.correctAnswer)
        ? q.correctAnswer.map((a: string) => a.toLowerCase())
        : [q.correctAnswer.toLowerCase()];
      return correctAnswer.some((ca: string) => userAnswer === ca || userAnswer?.includes(ca));
    }).length;

    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="p-8 bg-white shadow-lg">
          <h3 className="text-3xl font-bold mb-6 sulphur-point-bold text-slate-900">
            {isFinal ? 'Final Quiz Results' : 'Quiz Results'}
          </h3>
          <div className="text-center mb-8">
            <div className="text-7xl font-bold mb-3" style={{ color: percentage >= 70 ? '#10b981' : '#f59e0b' }}>
              {percentage}%
            </div>
            <p className="text-xl text-slate-600 sulphur-point-regular">
              {correct} out of {total} correct
            </p>
          </div>

          {percentage >= 70 ? (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
              <p className="text-emerald-800 sulphur-point-regular text-lg">
                ✓ Excellent work! You've demonstrated strong understanding.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
              <p className="text-amber-800 sulphur-point-regular text-lg">
                Review the material and try again. You need 70% to continue.
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full"
            size="lg"
          >
            {percentage >= 70 ? (isFinal ? 'Complete Session' : 'Continue to Next Section') : 'Try Again'}
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="p-8 bg-white shadow-lg">
        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-3 sulphur-point-regular">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-[#aa08f3] h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <h3 className="text-2xl font-semibold mb-6 sulphur-point-bold text-slate-900">
          {currentQuestion.question}
        </h3>

        {currentQuestion.type === 'multiple-choice' && (
          <div className="space-y-3 mb-6">
            {currentQuestion.options?.map((option: string, idx: number) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                className={`w-full p-5 text-left rounded-xl border-2 transition-all sulphur-point-regular ${
                  answers[currentQuestion.id] === option
                    ? 'border-[#aa08f3] bg-[#aa08f3]/10 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'text') && (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-5 border-2 border-slate-200 rounded-xl mb-6 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#aa08f3] focus:border-transparent sulphur-point-regular"
          />
        )}

        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion.id]}
          className="w-full"
          size="lg"
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
        </Button>
      </Card>
    </motion.div>
  );
}

export default StudySession;
