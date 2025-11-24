const OPENROUTER_API_KEY = import.meta.env.VITE_X_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "x-ai/grok-4.1-fast";

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_details?: any;
}

export interface OpenRouterResponse {
  content: string;
  reasoning_details?: any;
}

export async function callOpenRouter(
  messages: Message[],
  enableReasoning: boolean = true
): Promise<OpenRouterResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(enableReasoning && { reasoning: { enabled: true } })
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const result = await response.json();
  const assistantMessage = result.choices[0].message;

  return {
    content: assistantMessage.content,
    reasoning_details: assistantMessage.reasoning_details
  };
}

export interface OnboardingData {
  readingSkill: string;
  writingSkill: string;
  analysisSkill: string;
  examStruggles: string[];
  markingResult: {
    grade: string;
    feedback: string;
    improvement_suggestions?: string[];
    strengths?: string[];
    next_steps?: string[];
    total_score?: number;
    max_score?: number;
  };
  weaknessQuestionType: string;
  weaknessEssay: string;
}

export interface StudyPlan {
  overview: string;
  targetGrade: string;
  weeklyHours: number;
  weeks: Array<{
    week: number;
    focus: string;
    daily_tasks: Array<{
      day: string;
      tasks: Array<{
        title: string;
        description: string;
        category: string;
        duration: string;
      }>;
    }>;
  }>;
  keyFocusAreas: string[];
  milestones: string[];
}

export async function generateStudyPlan(data: OnboardingData): Promise<StudyPlan> {
  const systemPrompt = `You are an expert IGCSE English tutor creating personalized study plans.
Analyze the student's skills and create a comprehensive 4-week study plan.

Return ONLY valid JSON in this exact format:
{
  "overview": "Brief description of the plan",
  "targetGrade": "A/B/C",
  "weeklyHours": 8,
  "weeks": [
    {
      "week": 1,
      "focus": "Week focus area",
      "daily_tasks": [
        {
          "day": "Monday",
          "tasks": [
            {
              "title": "Task title",
              "description": "What to do",
              "category": "paper1|paper2|vocabulary|examples|text_types",
              "duration": "45 min"
            }
          ]
        }
      ]
    }
  ],
  "keyFocusAreas": ["Area 1", "Area 2", "Area 3"],
  "milestones": ["Milestone 1", "Milestone 2", "Milestone 3", "Milestone 4"]
}`;

  const userPrompt = `Create a personalized IGCSE English study plan based on:

Reading Skill: ${data.readingSkill}
Writing Skill: ${data.writingSkill}
Analysis Skill: ${data.analysisSkill}
Struggles With: ${data.examStruggles.join(', ')}
Question Type: ${data.weaknessQuestionType}
Current Grade: ${data.markingResult.grade}
Feedback: ${data.markingResult.feedback}
Improvements Needed: ${data.markingResult.improvement_suggestions?.join(', ') || 'Not provided'}

Create a 4-week plan with daily tasks (Monday-Friday) focusing on their weakest areas first.
Each week should have 5-7 hours of study time distributed across days.
Include variety: reading comprehension, writing practice, vocabulary, and examples.

Return ONLY the JSON, no other text.`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await callOpenRouter(messages, true);

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const plan = JSON.parse(jsonMatch[0]);
    return plan as StudyPlan;
  } catch (error) {
    console.error('[OpenRouter] Failed to parse study plan:', error);
    console.log('[OpenRouter] Raw response:', response.content);
    throw new Error('Failed to generate valid study plan');
  }
}
