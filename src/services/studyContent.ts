/* eslint-disable @typescript-eslint/no-explicit-any */
import { IGCSE_MAIN_GUIDES, type IgcseGuide } from '../data/igcseGuides';
import { aiLogger } from './aiLogger';

export type StudySection = {
  id: string;
  title: string;
  content: string;
  order: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  type: 'multiple-choice' | 'short-answer' | 'text';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
};

export type StudySessionPlan = {
  topic: string;
  introduction: string;
  goals: string[];
  sections: Array<{
    title: string;
    notes: string;
    quiz?: QuizQuestion[];
  }>;
  quiz?: QuizQuestion[];
};

/**
 * Parse sections from markdown content
 * Extracts sections based on markdown headers (##)
 */
export function parseGuideSections(guide: IgcseGuide): StudySection[] {
  const sections: StudySection[] = [];
  const lines = guide.content.split('\n');

  let currentSection: { title: string; content: string[] } | null = null;
  let order = 0;

  for (const line of lines) {
    // Check for ## headers (main sections)
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection) {
        sections.push({
          id: `${guide.key}-section-${order}`,
          title: currentSection.title,
          content: currentSection.content.join('\n').trim(),
          order,
        });
        order++;
      }

      // Start new section
      currentSection = {
        title: line.replace('## ', '').replace(/^\d+\.\s*/, '').trim(),
        content: [],
      };
    } else if (currentSection) {
      // Add content to current section
      currentSection.content.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections.push({
      id: `${guide.key}-section-${order}`,
      title: currentSection.title,
      content: currentSection.content.join('\n').trim(),
      order,
    });
  }

  return sections;
}

/**
 * Get a specific guide by key
 */
export function getGuideByKey(key: string): IgcseGuide | null {
  return IGCSE_MAIN_GUIDES.find(g => g.key === key) || null;
}

/**
 * Get sections for a specific guide
 */
export function getGuideSections(guideKey: string): StudySection[] {
  const guide = getGuideByKey(guideKey);
  if (!guide) return [];
  return parseGuideSections(guide);
}

/**
 * Get a specific section by ID
 */
export function getSectionById(guideKey: string, sectionId: string): StudySection | null {
  const sections = getGuideSections(guideKey);
  return sections.find(s => s.id === sectionId) || null;
}

/**
 * Generate AI prompt with igcseGuides context for study session
 */
export function buildStudySessionPrompt(
  guideKey: string,
  taskType?: string,
  userNotes?: string,
  userSummary?: string
): string {
  const guide = getGuideByKey(guideKey);
  if (!guide) return '';

  const sections = parseGuideSections(guide);
  const sectionList = sections
    .map((s, idx) => `Section ${idx + 1}: ${s.title}`)
    .join('\n');

  const taskContext = taskType
    ? `\nTASK TYPE FOCUS: ${taskType}\nFocus your session specifically on this skill/question type.\n`
    : '';

  return `You are an expert IGCSE English tutor creating a personalized study session.

AVAILABLE GUIDE CONTENT:
${guide.content}

SECTIONS AVAILABLE (you can reference these by calling specific sections):
${sectionList}
${taskContext}
${userNotes ? `STUDENT'S AI NOTES:\n${userNotes}\n` : ''}
${userSummary ? `STUDENT SUMMARY:\n${userSummary}\n` : ''}

YOUR TASK:
1. Create a focused study session based on the guide content above
2. Break it into 3-5 digestible sections with clear explanations
3. For each section, provide:
   - A clear title
   - Detailed notes (pull from the guide content)
   - 2-3 quiz questions to test understanding

4. Generate a final quiz with 5-10 questions covering all sections

OUTPUT FORMAT (MUST BE VALID JSON):
{
  "topic": "string (e.g., 'Writer's Effect Analysis')",
  "introduction": "string (welcoming message explaining what we'll cover)",
  "goals": ["goal 1", "goal 2", "goal 3"],
  "sections": [
    {
      "title": "section title",
      "notes": "detailed explanation (300-500 words, pulled from guide)",
      "quiz": [
        {
          "id": "q1",
          "question": "question text",
          "type": "multiple-choice" | "short-answer" | "text",
          "options": ["option1", "option2", "option3", "option4"] (only for multiple-choice),
          "correctAnswer": "correct answer" (or ["answer1", "answer2"] for multiple acceptable answers),
          "explanation": "why this is correct",
          "points": 1
        }
      ]
    }
  ],
  "quiz": [
    // Final comprehensive quiz questions (5-10 questions)
  ]
}

IMPORTANT RULES:
- Use the guide content as your primary source
- Make notes practical and exam-focused
- Include specific examples from the guide
- Questions should test understanding, not just memorization
- Vary question types (multiple-choice, short-answer, text)
- Return ONLY valid JSON, no markdown fences or extra text
`;
}

/**
 * Generate study session using AI
 */
export async function generateStudySession(
  guideKey: string,
  taskType?: string,
  userNotes?: string,
  userSummary?: string,
  apiKey?: string
): Promise<{ session?: StudySessionPlan; error?: string }> {
  const prompt = buildStudySessionPrompt(guideKey, taskType, userNotes, userSummary);

  if (!prompt) {
    return { error: 'Guide not found' };
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
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      const duration = Date.now() - startTime;
      aiLogger.logResponse(logId, text, { duration_ms: duration, error: `HTTP ${response.status}` });
      console.error('[studyContent] AI error', response.status, text);
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
    let sessionPlan: StudySessionPlan;
    try {
      // Remove markdown fences if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      sessionPlan = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[studyContent] Parse error:', parseError);
      console.error('[studyContent] Content:', content);
      return { error: 'Failed to parse study session JSON' };
    }

    return { session: sessionPlan };
  } catch (error) {
    console.error('[studyContent] Generation error:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Get all available guides
 */
export function getAllGuides(): IgcseGuide[] {
  return IGCSE_MAIN_GUIDES;
}

/**
 * Search guides by keyword
 */
export function searchGuides(keyword: string): IgcseGuide[] {
  const lowerKeyword = keyword.toLowerCase();
  return IGCSE_MAIN_GUIDES.filter(
    guide =>
      guide.title.toLowerCase().includes(lowerKeyword) ||
      guide.description.toLowerCase().includes(lowerKeyword) ||
      guide.content.toLowerCase().includes(lowerKeyword)
  );
}
