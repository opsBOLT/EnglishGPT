/**
 * Study Session Page
 * 3-column layout: AI Assistant (left) | Content Viewer (center) | Notes (right)
 * Integrates with backend services for session tracking and AI chat
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStudySession, useStudyAI } from '../hooks/useStudyPlatform';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { getCategoryById, type StudyCategory } from '../config/studyContent';
import { GUIDE_SNIPPETS, IGCSE_MAIN_GUIDES } from '../data/igcseGuides';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Loader2, Send, Play, Pause, X, CheckCircle } from 'lucide-react';
import SnowballSpinner from '../components/SnowballSpinner';
import SiriOrb from '../components/ui/siri-orb';

interface StudySessionProps {
  userId: string; // Pass from auth context
}

interface WriterEffectSessionPlan {
  sections: any[];
  introduction: string;
  goals: string[];
}

export function StudySession({ userId }: StudySessionProps) {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState<{ correct: number; incorrect: number }>({
    correct: 0,
    incorrect: 0,
  });
  const [sessionPlan, setSessionPlan] = useState<WriterEffectSessionPlan | null>(null);
  const [aiSessionLoading, setAiSessionLoading] = useState(false);
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  const notesRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isWriterEffect = category === 'writers-effect';


  // Backend integration
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { startSession, updateSession, completeSession } = useStudySession(userId);
  const aiCategory = isWriterEffect
    ? ('Paper 1 Guide/Revision' as StudyCategory)
    : (category as StudyCategory) || 'Paper 1 Guide/Revision';
  const { messages, sendMessage, loading: aiLoading } = useStudyAI(
    userId,
    aiCategory
  );

  // Timer
  const timer = useSessionTimer();

  // Get category configuration
  const categoryConfig = getCategoryById(category as StudyCategory);
  const derivedSections = isWriterEffect && sessionPlan
    ? sessionPlan.sections.map((section, idx) => ({
        id: `we-${idx}`,
        title: section.title,
        description: section.notes,
        duration: '10 mins',
        type: 'interactive' as const,
      }))
    : categoryConfig?.sections || [];

  const writerQuiz = isWriterEffect && sessionPlan
    ? [
        ...(sessionPlan.quiz || []).map((q, idx) => ({
          id: `weq-top-${idx}`,
          question: q.question,
          type: 'text',
          correctAnswer: q.answer,
          explanation: q.answer,
          points: 1,
        })),
        ...sessionPlan.sections.flatMap((section, sIdx) =>
          (section.quiz || []).map((q, qIdx) => ({
            id: `weq-${sIdx}-${qIdx}`,
            question: q.question,
            type: 'text',
            correctAnswer: q.answer,
            explanation: q.answer,
            points: 1,
          }))
        ),
      ]
    : [];

  // Start session on mount
  useEffect(() => {
    if (!category && !isWriterEffect) {
      navigate('/study');
      return;
    }

    let currentSessionId: string | null = null;

    const initSession = async () => {
      const id = await startSession(category as string, 'study');
      if (id) {
        currentSessionId = id;
        setSessionId(id);
        timer.start();
      }

      if (isWriterEffect) {
        setAiSessionLoading(true);
        try {
          // TODO: Implement writer effect session generation
          const plan: WriterEffectSessionPlan = {
            sections: [],
            introduction: 'Writer\'s Effect session coming soon!',
            goals: ['Analyze language techniques', 'Understand writer\'s purpose']
          };
          setSessionPlan(plan);
        } catch (error) {
          console.error('[writer-effect] session build failed', error);
          setPlanError(
            error instanceof Error ? error.message : "Writer's Effect generation failed."
          );
        } finally {
          setAiSessionLoading(false);
        }
      }
    };

    initSession();

    // Cleanup on unmount
    return () => {
      if (currentSessionId) {
        handleEndSession();
      }
    };
  }, [category, handleEndSession, isWriterEffect, navigate, startSession, timer]);

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
    if (!derivedSections.length) return;

    // Show quiz if available
    if ((isWriterEffect && writerQuiz.length > 0) || (categoryConfig?.quizQuestions && categoryConfig.quizQuestions.length > 0)) {
      setShowQuiz(true);
    } else {
      moveToNextSection();
    }
  };

  // Move to next section
  const moveToNextSection = () => {
    if (!derivedSections.length) return;

    if (currentSectionIndex < derivedSections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setShowQuiz(false);
    } else {
      // All sections complete
      handleEndSession();
    }
  };

  // Handle quiz completion
  const handleQuizComplete = async (correct: number, incorrect: number) => {
    setQuizResults({ correct, incorrect });

    if (sessionId) {
      await updateSession(sessionId, {
        quiz_correct: quizResults.correct + correct,
        quiz_incorrect: quizResults.incorrect + incorrect,
      });
    }

    // Check if passed (70% threshold)
    const total = correct + incorrect || writerQuiz.length;
    const percentage = (correct / total) * 100;

    if (percentage >= 70) {
      setShowQuiz(false);
      moveToNextSection();
    } else {
      alert('Please review the material and try again. You need 70% to continue.');
    }
  };

  // End session
  const handleEndSession = async () => {
    if (!sessionId) return;

    const durationMinutes = timer.stop();

    // Final update
    await updateSession(sessionId, {
      duration_minutes: durationMinutes,
      notes_made: notes,
      revision_methods: ['video', 'notes'], // Track which methods were used
    });

    // Complete session (triggers AI analysis if >30min)
    const analysis = await completeSession(sessionId);

    if (analysis) {
      alert(`Session completed! AI identified these areas to focus on: ${analysis.weak_topics.join(', ')}`);
    }

    navigate('/study');
  };

  if (!categoryConfig && !isWriterEffect) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <SnowballSpinner size="md" label="Loading your study session..." />
      </div>
    );
  }

  if (isWriterEffect && aiSessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="space-y-6 text-center">
          <SiriOrb size="180px" />
          <h2 className="text-2xl font-bold text-gray-900">Let&apos;s start this Writer&apos;s Effect session</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Building a short drill with your notes and examples. Hang tight.
          </p>
        </div>
      </div>
    );
  }
  if (isWriterEffect && planError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="space-y-3 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900">Writer&apos;s Effect session failed</h2>
          <p className="text-gray-700">{planError}</p>
          <p className="text-sm text-gray-500">Check your OpenRouter API key and try again.</p>
        </div>
      </div>
    );
  }

  const currentSection = derivedSections[currentSectionIndex];
  if (!currentSection) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-bold text-gray-900">No section loaded</h2>
          <p className="text-gray-600">This session has no content. Try restarting the task.</p>
        </div>
      </div>
    );
  }

  const progress = derivedSections.length
    ? ((currentSectionIndex + 1) / derivedSections.length) * 100
    : 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex flex-1">
        {/* Left: Orb + Chat */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">AI Study Assistant</h3>
              <SiriOrb size="64px" />
            </div>
            <p className="text-sm text-gray-600">Ask about Writer&apos;s Effect notes.</p>
            {planNotice && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                {planNotice}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="mb-4">Try asking:</p>
                <div className="space-y-2 text-sm">
                  <button
                    className="block w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-left"
                    onClick={() => setAiInput("How do I identify writer's effect?")}
                  >
                    How do I identify writer's effect?
                  </button>
                  <button
                    className="block w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-left"
                    onClick={() => setAiInput('How do I pick 3 images quickly?')}
                  >
                    Picking images fast
                  </button>
                  <button
                    className="block w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-left"
                    onClick={() => setAiInput('Can you test me on connotation vs effect?')}
                  >
                    Test me on connotation vs effect
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === 'user' ? 'bg-blue-50 ml-4' : 'bg-gray-100 mr-4'
                }`}
              >
                <p className="text-sm font-medium mb-1">
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}

            {aiLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={aiLoading}
              />
              <Button
                onClick={handleAskAI}
                disabled={aiLoading || !aiInput.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Notes / Guides / Sections */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{currentSection.title}</h2>
              <p className="text-gray-600">Rich notes pulled from Writer&apos;s Effect exemplars.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-mono">
                  {String(timer.hours).padStart(2, '0')}:
                  {String(timer.minutes).padStart(2, '0')}:
                  {String(timer.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500">
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
              <Button onClick={handleEndSession} variant="outline" size="sm">
                <X className="w-4 h-4 mr-1" /> End Session
              </Button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Section {currentSectionIndex + 1} of {derivedSections.length}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!showQuiz ? (
              <Card className="max-w-4xl mx-auto p-6 space-y-6">
                {isWriterEffect ? (
                  <div className="space-y-4">
                    {(sessionPlan?.sections || []).map((section, idx) => (
                      <div key={section.title} className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500">Section {idx + 1}</p>
                        <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                        <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                          {section.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-700">{currentSection.description}</p>
                    <p className="text-sm text-gray-500">
                      Work through this section, then mark as complete.
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">Duration: {currentSection.duration}</div>
                  <Button
                    onClick={handleCompleteSection}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Complete Section <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ) : (
              <StudyQuiz
                questions={isWriterEffect ? writerQuiz : categoryConfig?.quizQuestions || []}
                onComplete={handleQuizComplete}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom: User notes */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Your notes</h4>
            <span className="text-xs text-gray-500">{notes.length} characters</span>
          </div>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Capture the key phrases and effects you’ll reuse. This stays in this session."
            className="w-full min-h-[140px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// Quiz Component (inline for now, can be extracted)
function StudyQuiz({
  questions,
  onComplete,
}: {
  questions: Array<{
    id: string;
    question: string;
    type: string;
    options?: string[];
    correctAnswer: string | string[];
    explanation?: string;
    points?: number;
  }>;
  onComplete: (correct: number, incorrect: number) => void;
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
      <Card className="max-w-2xl mx-auto p-8">
        <h3 className="text-2xl font-bold mb-4">Quiz Results</h3>
        <div className="text-center mb-6">
          <div className="text-5xl font-bold mb-2">{percentage}%</div>
          <p className="text-gray-600">
            {correct} out of {total} correct
          </p>
        </div>

        {percentage >= 70 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800">
              ✓ Great job! You've passed this section and can continue.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800">
              Please review the material and try again. You need 70% to continue.
            </p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {percentage >= 70 ? 'Continue to Next Section' : 'Try Again'}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4">{currentQuestion.question}</h3>

      {currentQuestion.type === 'multiple-choice' && (
        <div className="space-y-3 mb-6">
          {currentQuestion.options?.map((option: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                answers[currentQuestion.id] === option
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
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
          className="w-full p-4 border-2 border-gray-200 rounded-lg mb-6 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      )}

      <Button
        onClick={handleNext}
        disabled={!answers[currentQuestion.id]}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
      </Button>
    </Card>
  );
}

export default StudySession;
