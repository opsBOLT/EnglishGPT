/**
 * API Service Layer
 * Handles all backend operations for the IGCSE English Study Platform
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type StudentAssessment = Database['public']['Tables']['student_assessment']['Insert'];
type StudySession = Database['public']['Tables']['study_sessions'];
type PracticeSession = Database['public']['Tables']['practice_sessions'];
type AIMemory = Database['public']['Tables']['ai_memory']['Insert'];

/**
 * Submit student initial assessment
 */
export async function submitAssessment(
  userId: string,
  assessment: Omit<StudentAssessment, 'user_id'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('student_assessment')
      .upsert({
        user_id: userId,
        ...assessment,
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Generate and save AI study plan
 * NOTE: This function is deprecated. Use the new study plan generation flow via /study-plan/generate
 */
export async function createStudyPlan(userId: string): Promise<{ success: boolean; plan?: any; error?: string }> {
  console.warn('createStudyPlan is deprecated. Use the new OpenRouter-based study plan generation.');
  return { success: false, error: 'This function is deprecated. Use the new study plan generation flow.' };
}

/**
 * Get user's study plan
 */
export async function getStudyPlan(userId: string): Promise<{ plan?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('study_plan')
      .select('plan_data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return { plan: data?.plan_data };
  } catch (error) {
    console.error('Error fetching study plan:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Start a new study session
 */
export async function startStudySession(
  userId: string,
  category: string,
  sessionType: 'study' | 'practice' = 'study'
): Promise<{ sessionId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        session_type: sessionType,
        category,
      })
      .select('id')
      .single();

    if (error) throw error;

    return { sessionId: data.id };
  } catch (error) {
    console.error('Error starting study session:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Update study session with progress data
 */
export async function updateStudySession(
  sessionId: string,
  updates: {
    duration_minutes?: number;
    quiz_correct?: number;
    quiz_incorrect?: number;
    questions_asked_ai?: any[];
    notes_made?: string;
    revision_methods?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('study_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating study session:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Complete study session and trigger AI analysis
 * NOTE: AI analysis temporarily disabled. Sessions are saved without analysis.
 */
export async function completeStudySession(
  sessionId: string,
  userId: string
): Promise<{ success: boolean; analysis?: any; error?: string }> {
  try {
    // Get session data
    const { data: session, error: fetchError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      throw new Error('Session not found');
    }

    // Session completed successfully without AI analysis
    return { success: true };
  } catch (error) {
    console.error('Error completing study session:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Chat with study session AI
 * NOTE: Temporarily returns a placeholder. Integrate with OpenRouter for chat functionality.
 */
export async function chatWithStudyAI(
  userId: string,
  message: string,
  category: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ response?: string; error?: string }> {
  try {
    return { response: 'AI chat is being updated. Please check back soon!' };
  } catch (error) {
    console.error('Error in study AI chat:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Submit practice answer for AI marking
 * NOTE: Use markingClient.ts for marking functionality
 */
export async function submitPracticeAnswer(
  userId: string,
  question: string,
  answer: string,
  maxMarks: number,
  questionType: string
): Promise<{ result?: any; error?: string }> {
  try {
    return { result: null, error: 'Use markingClient.ts for marking functionality' };
  } catch (error) {
    console.error('Error marking practice answer:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Create practice session
 */
export async function createPracticeSession(
  userId: string,
  practiceType: 'personalized' | 'past_paper',
  paperId?: string
): Promise<{ sessionId?: string; questions?: any; error?: string }> {
  try {
    // Create practice session without AI-generated questions for now
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: userId,
        practice_type: practiceType,
        paper_id: paperId,
      })
      .select('id')
      .single();

    if (error) throw error;

    return { sessionId: data.id, questions: null };
  } catch (error) {
    console.error('Error creating practice session:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Complete practice session
 */
export async function completePracticeSession(
  sessionId: string,
  questionsData: any[],
  totalGrade: number,
  weakPoints: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('practice_sessions')
      .update({
        questions_data: questionsData,
        total_grade: totalGrade,
        weak_points: weakPoints,
      })
      .eq('id', sessionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error completing practice session:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get AI memory for user
 */
export async function getAIMemory(userId: string): Promise<{ memory?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ai_memory')
      .select('*')
      .eq('user_id', userId)
      .order('confidence_score', { ascending: false });

    if (error) throw error;

    return { memory: data };
  } catch (error) {
    console.error('Error fetching AI memory:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Get user's assessment
 */
export async function getAssessment(userId: string): Promise<{ assessment?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('student_assessment')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return { assessment: data };
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Get user's study sessions
 */
export async function getStudySessions(userId: string, limit = 10): Promise<{ sessions?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { sessions: data };
  } catch (error) {
    const message = (error as Error).message || '';
    const missingTable = message.includes("Could not find the table 'public.study_sessions'") ||
      message.toLowerCase().includes('relation "study_sessions" does not exist');

    const friendlyMessage = missingTable
      ? 'Supabase table study_sessions is missing. Run the migrations to create it.'
      : message;

    console.error('Error fetching study sessions:', friendlyMessage);
    return { sessions: [], error: friendlyMessage };
  }
}

/**
 * Get user's practice sessions
 */
export async function getPracticeSessions(userId: string, limit = 10): Promise<{ sessions?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { sessions: data };
  } catch (error) {
    const message = (error as Error).message || '';
    const missingTable = message.includes("Could not find the table 'public.practice_sessions'") ||
      message.toLowerCase().includes('relation "practice_sessions" does not exist');

    const friendlyMessage = missingTable
      ? 'Supabase table practice_sessions is missing. Run the migrations to create it.'
      : message;

    console.error('Error fetching practice sessions:', friendlyMessage);
    return { sessions: [], error: friendlyMessage };
  }
}
