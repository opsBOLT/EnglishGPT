/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Practice Content Service
 * AI-powered practice sessions using practiceGuides.ts
 */

import { PRACTICE_GUIDES, getPracticeGuide, type PracticeGuideType } from '../data/practiceGuides';
import { aiLogger } from './aiLogger';

export type PracticeSessionPlan = {
  topic: string;
  introduction: string;
  selected_questions: Array<{
    question_text: string;
    exam_series: string;
    why_selected: string;
    word_count: string;
    marks: number;
  }>;
  practice_steps: Array<{
    step_number: number;
    title: string;
    instruction: string;
    duration_minutes: number;
    applies_to_questions?: number[];
  }>;
  techniques_focus: Array<{
    technique: string;
    explanation: string;
    example: string;
    practice_tip: string;
  }>;
  model_examples: {
    good_opening: string;
    good_paragraph: string;
    vocabulary_bank: string[];
  };
  success_criteria: string[];
};

/**
 * Get all available practice guides
 */
export function getAllPracticeGuides() {
  return PRACTICE_GUIDES;
}

/**
 * Get practice guide by key
 */
export function getGuideByKey(key: PracticeGuideType) {
  return getPracticeGuide(key);
}

/**
 * Build AI prompt with full practice guide context
 */
export function buildPracticePrompt(
  guideKey: PracticeGuideType,
  userNotes?: string,
  userSummary?: string
): string {
  const guide = getPracticeGuide(guideKey);
  if (!guide) return '';

  return `You are an expert IGCSE English tutor creating a personalized practice session for Paper 2 writing.

AVAILABLE PRACTICE QUESTIONS DATABASE:
${guide.content}

QUESTION TYPE: ${guide.title}
TOTAL QUESTIONS AVAILABLE: ${guide.questionCount}

${userNotes ? `STUDENT'S AI NOTES (analyze their strengths/weaknesses):\n${userNotes}\n` : ''}
${userSummary ? `STUDENT SUMMARY:\n${userSummary}\n` : ''}

YOUR TASK:
Based on the student's AI notes and the questions available above, you will:

1. **SELECT 2-3 QUESTIONS** from the database that best match the student's needs
   - If they struggle with specific skills (e.g., "sensory details"), choose questions that require those skills
   - If they excel in certain areas, choose more challenging variations
   - Mix different exam series for variety

2. **CREATE A STRUCTURED PRACTICE SESSION** with:
   - Introduction explaining why you chose these questions
   - Step-by-step guidance for each question
   - Specific techniques to practice
   - Model examples and vocabulary suggestions

OUTPUT FORMAT (MUST BE VALID JSON):
{
  "topic": "string (e.g., 'Descriptive Writing: Sensory Detail Mastery')",
  "introduction": "string (explain why these questions were selected for this student)",
  "selected_questions": [
    {
      "question_text": "exact question from database",
      "exam_series": "e.g., May/June 2024",
      "why_selected": "why this question suits the student",
      "word_count": "350-450 words",
      "marks": 40
    }
  ],
  "practice_steps": [
    {
      "step_number": 1,
      "title": "Planning Phase",
      "instruction": "detailed instruction",
      "duration_minutes": 10,
      "applies_to_questions": [1, 2]
    }
  ],
  "techniques_focus": [
    {
      "technique": "e.g., Sensory imagery",
      "explanation": "what it is and why it matters",
      "example": "concrete example",
      "practice_tip": "how to practice it"
    }
  ],
  "model_examples": {
    "good_opening": "Example opening for one of the selected questions",
    "good_paragraph": "Example middle paragraph",
    "vocabulary_bank": ["word1", "word2"] (15-20 relevant words)
  },
  "success_criteria": [
    "criterion 1 to aim for",
    "criterion 2",
    "criterion 3"
  ]
}

IMPORTANT RULES:
- SELECT questions intelligently based on student AI notes
- Reference the EXACT question text from the database
- Include exam series info for each selected question
- Make guidance practical and actionable
- Tailor to the specific question type (directed/descriptive/narrative)
- Return ONLY valid JSON, no markdown fences
`;
}

/**
 * Generate practice session using AI
 */
export async function generatePracticeSession(
  guideKey: PracticeGuideType,
  userNotes?: string,
  userSummary?: string,
  apiKey?: string
): Promise<{ session?: PracticeSessionPlan; error?: string }> {
  const prompt = buildPracticePrompt(guideKey, userNotes, userSummary);

  if (!prompt) {
    return { error: 'Practice guide not found' };
  }

  try {
    // Log the prompt
    const startTime = Date.now();
    const logId = aiLogger.logPrompt('study_content', 'x-ai/grok-4.1-fast:free', prompt, {
      guideKey,
      hasUserNotes: !!userNotes,
      hasUserSummary: !!userSummary,
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_ENGLISHGPT_GENERAL_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4.1-fast:free',
        messages: [
          { role: 'system', content: 'Return only JSON. Do not include markdown fences.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 5000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      const duration = Date.now() - startTime;
      aiLogger.logResponse(logId, text, { duration_ms: duration, error: `HTTP ${response.status}` });
      console.error('[practiceContent] AI error', response.status, text);
      return { error: text || 'AI request failed' };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      const duration = Date.now() - startTime;
      aiLogger.logResponse(logId, '', { duration_ms: duration, error: 'Empty AI response' });
      return { error: 'Empty AI response' };
    }

    // Log the successful response
    const duration = Date.now() - startTime;
    aiLogger.logResponse(logId, content, {
      duration_ms: duration,
      tokens: data?.usage?.total_tokens,
    });

    // Try to parse JSON
    let sessionPlan: PracticeSessionPlan;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      sessionPlan = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[practiceContent] Parse error:', parseError);
      console.error('[practiceContent] Content:', content);
      return { error: 'Failed to parse practice session JSON' };
    }

    return { session: sessionPlan };
  } catch (error) {
    console.error('[practiceContent] Generation error:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Get question type color for UI
 */
export function getQuestionTypeColor(type: PracticeGuideType): string {
  const colors: Record<PracticeGuideType, string> = {
    directed_writing: '#3b82f6', // blue
    descriptive_writing: '#f59e0b', // orange
    narrative_writing: '#10b981', // green
  };
  return colors[type];
}

/**
 * Get question type label for UI
 */
export function getQuestionTypeLabel(type: PracticeGuideType): string {
  const labels: Record<PracticeGuideType, string> = {
    directed_writing: 'Directed Writing',
    descriptive_writing: 'Descriptive Writing',
    narrative_writing: 'Narrative Writing',
  };
  return labels[type];
}
