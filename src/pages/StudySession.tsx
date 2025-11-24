/**
 * Study Session Page
 * 3-column layout: AI Assistant (left) | Content Viewer (center) | Notes (right)
 * Integrates with backend services for session tracking and AI chat
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudySession, useStudyAI } from '../hooks/useStudyPlatform';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { getCategoryById, type StudyCategory } from '../config/studyContent';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Loader2, Send, Play, Pause, X, CheckCircle } from 'lucide-react';
import SnowballSpinner from '../components/SnowballSpinner';

interface StudySessionProps {
  userId: string; // Pass from auth context
}

export function StudySession({ userId }: StudySessionProps) {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState<{ correct: number; incorrect: number }>({
    correct: 0,
    incorrect: 0,
  });

  const notesRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Backend integration
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { startSession, updateSession, completeSession, loading: sessionLoading } = useStudySession(userId);
  const { messages, sendMessage, loading: aiLoading, clearMessages } = useStudyAI(
    userId,
    category as StudyCategory || 'Paper 1 Guide/Revision'
  );

  // Timer
  const timer = useSessionTimer();

  // Get category configuration
  const categoryConfig = getCategoryById(category as StudyCategory);

  // Start session on mount
  useEffect(() => {
    if (!categoryConfig) {
      navigate('/study');
      return;
    }

    const initSession = async () => {
      const id = await startSession(category as string, 'study');
      if (id) {
        setSessionId(id);
        timer.start();
      }
    };

    initSession();

    // Cleanup on unmount
    return () => {
      if (sessionId) {
        handleEndSession();
      }
    };
  }, [category]);

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
    if (!categoryConfig) return;

    const currentSection = categoryConfig.sections[currentSectionIndex];
    setCompletedSections(prev => [...prev, currentSection.id]);

    // Show quiz if available
    if (categoryConfig.quizQuestions && categoryConfig.quizQuestions.length > 0) {
      setShowQuiz(true);
    } else {
      moveToNextSection();
    }
  };

  // Move to next section
  const moveToNextSection = () => {
    if (!categoryConfig) return;

    if (currentSectionIndex < categoryConfig.sections.length - 1) {
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
    const total = correct + incorrect;
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
    const analysis = await completeSession(sessionId, userId);

    if (analysis) {
      alert(`Session completed! AI identified these areas to focus on: ${analysis.weak_topics.join(', ')}`);
    }

    navigate('/study');
  };

  if (!categoryConfig) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <SnowballSpinner size="md" label="Loading your study session..." />
      </div>
    );
  }

  const currentSection = categoryConfig.sections[currentSectionIndex];
  const progress = ((currentSectionIndex + 1) / categoryConfig.sections.length) * 100;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - AI Assistant */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-lg">AI Study Assistant</h3>
          <p className="text-sm text-gray-600">Ask questions about {category}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="mb-4">💡 Try asking:</p>
              <div className="space-y-2 text-sm">
                <button
                  className="block w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-left"
                  onClick={() => setAiInput("How do I identify writer's effect?")}
                >
                  How do I identify writer's effect?
                </button>
                <button
                  className="block w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-left"
                  onClick={() => setAiInput('Give me an example of a good summary')}
                >
                  Give me an example
                </button>
                <button
                  className="block w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-left"
                  onClick={() => setAiInput('Check my understanding')}
                >
                  Check my understanding
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-purple-100 ml-4'
                  : 'bg-gray-100 mr-4'
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

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={aiLoading}
            />
            <Button
              onClick={handleAskAI}
              disabled={aiLoading || !aiInput.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Center Panel - Content Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Header with progress */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold">{currentSection.title}</h2>
              <p className="text-gray-600">{currentSection.description}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="text-right">
                <div className="text-2xl font-mono">
                  {String(timer.hours).padStart(2, '0')}:
                  {String(timer.minutes).padStart(2, '0')}:
                  {String(timer.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500">
                  {timer.isPaused ? (
                    <span className="text-yellow-600">Paused (inactive)</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )}
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

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Section {currentSectionIndex + 1} of {categoryConfig.sections.length}
          </p>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showQuiz ? (
            <Card className="max-w-4xl mx-auto p-8">
              {currentSection.type === 'video' && (
                <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center text-white">
                  {/* Replace with actual video player */}
                  <div className="text-center">
                    <p className="text-xl mb-2">Video Player</p>
                    <p className="text-sm text-gray-400">{currentSection.url}</p>
                    <p className="text-xs text-gray-500 mt-4">
                      Integrate with your video hosting service
                    </p>
                  </div>
                </div>
              )}

              {currentSection.type === 'pdf' && (
                <div className="bg-gray-100 rounded-lg p-8 min-h-[500px] flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <p className="text-xl mb-2">PDF Viewer</p>
                    <p className="text-sm">{currentSection.url}</p>
                    <p className="text-xs mt-4">
                      Integrate with react-pdf or similar library
                    </p>
                  </div>
                </div>
              )}

              {currentSection.type === 'interactive' && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8 min-h-[500px]">
                  <h3 className="text-xl font-semibold mb-4">Interactive Content</h3>
                  <p className="text-gray-700">{currentSection.description}</p>
                  <p className="text-sm text-gray-500 mt-4">
                    Special interactive mode would be implemented here
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Duration: {currentSection.duration}
                </div>
                <Button
                  onClick={handleCompleteSection}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Complete Section <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          ) : (
            <StudyQuiz
              questions={categoryConfig.quizQuestions || []}
              onComplete={handleQuizComplete}
            />
          )}
        </div>
      </div>

      {/* Right Panel - Notes */}
      <div className="w-1/4 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-lg">Your Notes</h3>
          <p className="text-xs text-gray-600">Auto-saved every 10 seconds</p>
        </div>

        <textarea
          ref={notesRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Take notes here...&#10;&#10;• Key points&#10;• Important techniques&#10;• Things to remember"
          className="flex-1 p-4 resize-none focus:outline-none font-mono text-sm"
        />

        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {notes.length} characters
          </p>
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
  questions: any[];
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
        ? q.correctAnswer.map(a => a.toLowerCase())
        : [q.correctAnswer.toLowerCase()];

      if (correctAnswer.some(ca => userAnswer === ca || userAnswer?.includes(ca))) {
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
        ? q.correctAnswer.map(a => a.toLowerCase())
        : [q.correctAnswer.toLowerCase()];
      return correctAnswer.some(ca => userAnswer === ca || userAnswer?.includes(ca));
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
