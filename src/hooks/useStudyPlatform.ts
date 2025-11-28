/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Hooks for EnglishGPT Study Platform
 * Provides easy-to-use hooks for all platform features
 */

import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { regenerateStudyPlan, NormalizedStudyPlan } from '../services/studyPlan';

/**
 * Hook for managing study plan
 */
export function useStudyPlan(userId: string) {
  const [plan, setPlan] = useState<NormalizedStudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const result = await api.getStudyPlan(userId);

    if (result.error) {
      setError(result.error);
      setPlan(null);
    } else {
      setPlan(result.plan as NormalizedStudyPlan);
    }

    setLoading(false);
  }, [userId]);

  const generatePlan = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await api.createStudyPlan(userId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return false;
    }

    setPlan(result.plan as NormalizedStudyPlan);
    setLoading(false);
    return true;
  }, [userId]);

  const regeneratePlan = useCallback(async () => {
    if (!userId) return false;

    setLoading(true);
    setError(null);

    const result = await regenerateStudyPlan(userId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return false;
    }

    setPlan(result.plan || null);
    setLoading(false);
    return true;
  }, [userId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return {
    plan,
    loading,
    error,
    generatePlan,
    regeneratePlan,
    refetch: fetchPlan,
  };
}

/**
 * Hook for managing study sessions
 */
export function useStudySession(userId: string) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (category: string, sessionType: 'study' | 'practice' = 'study') => {
    setLoading(true);
    setError(null);

    const result = await api.startStudySession(userId, category, sessionType);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return null;
    }

    setCurrentSessionId(result.sessionId || null);
    setLoading(false);
    return result.sessionId;
  }, [userId]);

  const updateSession = useCallback(async (sessionId: string, updates: any) => {
    setLoading(true);
    setError(null);

    const result = await api.updateStudySession(sessionId, updates);

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
    return result.success;
  }, []);

  const completeSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);

    const result = await api.completeStudySession(sessionId, userId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return null;
    }

    setCurrentSessionId(null);
    setLoading(false);
    return result.analysis;
  }, [userId]);

  return {
    currentSessionId,
    loading,
    error,
    startSession,
    updateSession,
    completeSession,
  };
}

/**
 * Hook for AI chat in study sessions
 */
export function useStudyAI(userId: string, category: string) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    setLoading(true);
    setError(null);

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(newMessages);

    const result = await api.chatWithStudyAI(userId, message, category, messages);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Add assistant response
    setMessages([...newMessages, { role: 'assistant' as const, content: result.response || '' }]);
    setLoading(false);
  }, [userId, category, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  };
}

/**
 * Hook for practice sessions
 */
export function usePracticeSession(userId: string) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPractice = useCallback(async (
    practiceType: 'personalized' | 'past_paper',
    paperId?: string
  ) => {
    setLoading(true);
    setError(null);

    const result = await api.createPracticeSession(userId, practiceType, paperId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return null;
    }

    setCurrentSessionId(result.sessionId || null);
    setQuestions(result.questions);
    setLoading(false);
    return { sessionId: result.sessionId, questions: result.questions };
  }, [userId]);

  const submitAnswer = useCallback(async (
    question: string,
    answer: string,
    maxMarks: number,
    questionType: string
  ) => {
    setLoading(true);
    setError(null);

    const result = await api.submitPracticeAnswer(userId, question, answer, maxMarks, questionType);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return null;
    }

    setLoading(false);
    return result.result;
  }, [userId]);

  const completePractice = useCallback(async (
    sessionId: string,
    questionsData: any[],
    totalGrade: number,
    weakPoints: string[]
  ) => {
    setLoading(true);
    setError(null);

    const result = await api.completePracticeSession(sessionId, questionsData, totalGrade, weakPoints);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return false;
    }

    setCurrentSessionId(null);
    setLoading(false);
    return true;
  }, []);

  return {
    currentSessionId,
    questions,
    loading,
    error,
    startPractice,
    submitAnswer,
    completePractice,
  };
}

/**
 * Hook for fetching user sessions history
 */
export function useSessionHistory(userId: string) {
  const [studySessions, setStudySessions] = useState<any[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const [studyResult, practiceResult] = await Promise.all([
      api.getStudySessions(userId),
      api.getPracticeSessions(userId),
    ]);

    if (studyResult.error || practiceResult.error) {
      setError(studyResult.error || practiceResult.error || 'Failed to fetch history');
      // Fall back to empty arrays so UI can render placeholders
      setStudySessions([]);
      setPracticeSessions([]);
    } else {
      setStudySessions(studyResult.sessions || []);
      setPracticeSessions(practiceResult.sessions || []);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    studySessions,
    practiceSessions,
    loading,
    error,
    refetch: fetchHistory,
  };
}

/**
 * Hook for AI notes
 * Replaces the deprecated useAIMemory hook
 */
export function useAIMemory(userId: string) {
  const [notes, setNotes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemory = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const result = await api.getAINotes(userId);

    if (result.error) {
      setError(result.error);
    } else {
      setNotes(result.notes || null);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMemory();
  }, [fetchMemory]);

  // Convert notes object to grouped structure for backwards compatibility
  const groupedMemory = {
    weak_topics: [],
    preferred_methods: [],
    strengths: [],
    misconceptions: [],
  };

  return {
    notes,
    memory: notes, // alias for backwards compatibility
    groupedMemory,
    loading,
    error,
    refetch: fetchMemory,
  };
}

/**
 * Hook for managing task completions
 */
export function useTaskCompletion(userId: string, planId: string) {
  const [completions, setCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletions = useCallback(async () => {
    if (!userId || !planId) return;

    setLoading(true);
    setError(null);

    const result = await api.getTaskCompletions(userId, planId);

    if (result.error) {
      setError(result.error);
      setCompletions([]);
    } else {
      setCompletions(result.completions || []);
    }

    setLoading(false);
  }, [userId, planId]);

  const markComplete = useCallback(async (
    taskId: string,
    weekNumber: number,
    day: string,
    metadata?: {
      timeSpentMinutes?: number;
      difficultyRating?: number;
      notes?: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    const result = await api.completeTask(userId, planId, taskId, weekNumber, day, metadata);

    if (result.success) {
      await fetchCompletions();  // Refresh completions
    } else {
      setError(result.error || 'Failed to mark task complete');
    }

    setLoading(false);
    return result.success;
  }, [userId, planId, fetchCompletions]);

  const isTaskComplete = useCallback((taskId: string) => {
    return completions.some(c => c.task_id === taskId);
  }, [completions]);

  useEffect(() => {
    fetchCompletions();
  }, [fetchCompletions]);

  return {
    completions,
    loading,
    error,
    markComplete,
    isTaskComplete,
    refetch: fetchCompletions,
  };
}

/**
 * Hook for getting user progress summary
 */
export function useProgressSummary(userId: string) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const result = await api.getProgressSummary(userId);

    if (result.error) {
      setError(result.error);
      setSummary(null);
    } else {
      setSummary(result.summary || null);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
