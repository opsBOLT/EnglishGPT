/**
 * Practice Session Page
 * Displays practice questions with AI marking and feedback
 * Integrates with backend practice session tracking and AI marking service
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePracticeSession } from '../hooks/useStudyPlatform';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Loader2, Send, CheckCircle, AlertCircle, ArrowRight, Home } from 'lucide-react';
import SnowballSpinner from '../components/SnowballSpinner';

interface PracticeSessionProps {
  userId: string; // From auth context
}

interface Question {
  id: string;
  question: string;
  questionType: string; // "Paper 1 Q2d", etc.
  maxMarks: number;
}

export function PracticeSession({ userId }: PracticeSessionProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { submitAnswer, completePractice, loading } = usePracticeSession(userId);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [allResults, setAllResults] = useState<any[]>([]);

  // Sample questions - in production, these would come from the personalized practice generator
  useEffect(() => {
    // Mock questions for demonstration
    const sampleQuestions: Question[] = [
      {
        id: 'q1',
        question: 'Analyze how the writer creates a sense of tension in this passage:\n\n"The wind howled through the empty streets, rattling windows and doors. Sarah\'s footsteps echoed ominously as she hurried home, glancing nervously over her shoulder. Every shadow seemed to move, every sound amplified in the eerie silence."\n\nExplain the effects of the writer\'s language choices.',
        questionType: 'Paper 1 Q2d - Writer\'s Effect',
        maxMarks: 8,
      },
      {
        id: 'q2',
        question: 'Write a summary of the key points about climate change from the following text:\n\n[Sample text would be here]\n\nYour summary should be approximately 120-150 words.',
        questionType: 'Paper 1 Q1f - Summary',
        maxMarks: 10,
      },
      {
        id: 'q3',
        question: 'Write a letter to your local council proposing a new youth center for your community. Include:\n• Why it is needed\n• What facilities it should have\n• How it would benefit young people\n\nWrite in a formal style appropriate for a letter to officials.',
        questionType: 'Paper 2 Q1 - Directed Writing',
        maxMarks: 16,
      },
    ];

    setQuestions(sampleQuestions);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentQuestion) return;

    // Submit to AI for marking
    const result = await submitAnswer(
      currentQuestion.question,
      answer,
      currentQuestion.maxMarks,
      currentQuestion.questionType
    );

    if (result) {
      setFeedback(result);
      setShowFeedback(true);
      setAllResults(prev => [...prev, {
        question: currentQuestion.question,
        answer,
        feedback: result,
      }]);
    }
  };

  const handleNextQuestion = () => {
    setAnswer('');
    setShowFeedback(false);
    setFeedback(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinishPractice();
    }
  };

  const handleFinishPractice = async () => {
    if (!sessionId) return;

    // Calculate total grade
    const totalScore = allResults.reduce((acc, r) => acc + (r.feedback?.score || 0), 0);
    const totalPossible = allResults.reduce((acc, r) => acc + (r.feedback?.max_marks || 0), 0);
    const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    // Extract weak points from feedback
    const weakPoints: string[] = [];
    allResults.forEach(r => {
      if (r.feedback?.areas_for_improvement) {
        weakPoints.push(...r.feedback.areas_for_improvement);
      }
    });

    // Complete practice session
    await completePractice(
      sessionId,
      allResults.map(r => ({
        question: r.question,
        answer: r.answer,
        correct: r.feedback?.score >= (r.feedback?.max_marks * 0.7),
        time_taken: 0, // You could track this with a timer
        ai_feedback: r.feedback,
      })),
      percentage,
      weakPoints
    );

    navigate('/practice/results', { state: { results: allResults, percentage } });
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SnowballSpinner size="md" label="Preparing your practice session..." />
      </div>
    );
  }

  if (showFeedback && feedback) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              AI Feedback
            </h2>

            {/* Score */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Your Score</p>
                  <p className="text-4xl font-bold text-purple-600">
                    {feedback.score}/{feedback.max_marks}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Band Level</p>
                  <p className="text-lg font-semibold">{feedback.band_level}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all"
                  style={{ width: `${(feedback.score / feedback.max_marks) * 100}%` }}
                />
              </div>
            </div>

            {/* Strengths */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                What You Did Well
              </h3>
              <ul className="space-y-2">
                {feedback.strengths.map((strength: string, idx: number) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                To Reach the Next Band
              </h3>
              <ul className="space-y-2">
                {feedback.areas_for_improvement.map((area: string, idx: number) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-yellow-500">→</span>
                    <span className="text-gray-700">{area}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Tip */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="font-semibold text-blue-900 mb-1">💡 Top Tip</p>
              <p className="text-blue-800">{feedback.improvement_tip}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={handleNextQuestion}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Next Question <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinishPractice}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Finish Practice <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Practice Session</h1>
            <p className="text-gray-600">{currentQuestion.questionType}</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/practice')}>
            <Home className="w-4 h-4 mr-2" /> Exit
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area - Question & Answer */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    {currentQuestion.maxMarks} marks
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-lg whitespace-pre-wrap">{currentQuestion.question}</p>
                </div>
              </div>

              {/* Answer Box */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Your Answer</label>
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-1">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 bg-white rounded border-none focus:outline-none min-h-[300px] resize-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {answer.split(' ').filter(w => w).length} words
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || loading}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    AI is marking your answer...
                  </>
                ) : (
                  <>
                    Submit Answer for AI Marking
                    <Send className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </Card>
          </div>

          {/* Right Sidebar - AI Help */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Need Help?</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => alert('AI hint feature would open here')}
                >
                  💡 Request Hint
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => alert('Step-by-step walkthrough would open here')}
                >
                  📚 Step-by-Step Guide
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-purple-50">
              <h3 className="font-semibold mb-2">Tips</h3>
              <ul className="text-sm space-y-2 text-gray-700">
                <li>• Read the question carefully</li>
                <li>• Plan your answer first</li>
                <li>• Use evidence from the text</li>
                <li>• Explain effects, not just techniques</li>
                <li>• Check your spelling and grammar</li>
              </ul>
            </Card>

            {allResults.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Progress</h3>
                <div className="space-y-2">
                  {allResults.map((result, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">
                        Q{idx + 1}: {result.feedback?.score}/{result.feedback?.max_marks}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PracticeSession;
