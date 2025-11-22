/**
 * AI Agent Orchestration System
 * Contains all AI agents for the IGCSE English Study Platform
 */

import { xai, COLLECTIONS } from './xai';
import type { Database } from '../types/supabase';

type StudentAssessment = Database['public']['Tables']['student_assessment']['Row'];
type StudySession = Database['public']['Tables']['study_sessions']['Row'];
type PracticeSession = Database['public']['Tables']['practice_sessions']['Row'];
type AIMemory = Database['public']['Tables']['ai_memory']['Row'];

interface WeeklyPlan {
  weeks: Array<{
    week_number: number;
    focus_areas: string[];
    daily_tasks: Array<{
      day: string;
      tasks: Array<{
        title: string;
        duration: string;
        category: string;
        description: string;
      }>;
    }>;
  }>;
}

interface SessionAnalysis {
  weak_topics: string[];
  preferred_methods: string[];
  misconceptions: string[];
  strengths: string[];
}

interface PracticeMarkingResult {
  score: number;
  max_marks: number;
  band_level: string;
  strengths: string[];
  areas_for_improvement: string[];
  improvement_tip: string;
}

/**
 * Study Plan Generator Agent
 * Creates personalized weekly/daily study plans based on assessment data
 */
export async function generateStudyPlan(
  assessment: StudentAssessment
): Promise<WeeklyPlan> {
  const weakQuestionsStr = assessment.weak_questions.join(', ');

  // Map assessment codes to readable values
  const weeklyHoursMap = {
    'A': 'Under 2 hours',
    'B': '3-5 hours',
    'C': '6-9 hours',
    'D': '10+ hours',
  };

  const examTimelineMap = {
    'A': '6+ months',
    'B': '3-6 months',
    'C': '1-3 months',
    'D': 'Less than 1 month',
  };

  const planStructureMap = {
    'A': 'Very structured',
    'B': 'Semi-structured',
    'C': 'Flexible',
    'D': 'Intensive',
  };

  // Search collections for relevant content about weak areas
  const searchQuery = `Mark schemes and practice strategies for: ${weakQuestionsStr}`;

  const systemPrompt = `You are an expert IGCSE English study planner. Create personalized study plans that target student weaknesses while building confidence.

IMPORTANT: You MUST use the document search tool to find relevant marking criteria and strategies from the Paper 1 and Paper 2 collections before creating the plan.

Your plans should:
- Target specific weak question types with focused practice
- Include spaced repetition cycles
- Balance revision and active practice
- Progress from easier to harder content
- Be realistic for the time available`;

  const userPrompt = `Create a personalized IGCSE English study plan for this student:

**Assessment Results:**
- Reading Skill: ${assessment.reading_skill}
- Writing Skill: ${assessment.writing_skill}
- Analysis Skill: ${assessment.analysis_skill}
- Weak Question Types: ${weakQuestionsStr}
- Struggle Reasons: ${assessment.struggle_reasons || 'Not specified'}

**Study Preferences:**
- Weekly Time Available: ${weeklyHoursMap[assessment.weekly_hours]}
- Exam Timeline: ${examTimelineMap[assessment.exam_timeline]}
- Preferred Plan Structure: ${planStructureMap[assessment.plan_structure]}

Search the Paper 1 and Paper 2 collections for:
1. Mark schemes for the weak question types
2. Common mistakes students make
3. Recommended practice progression
4. Time management strategies

Generate a ${assessment.plan_structure === 'D' ? '4' : '8'}-week study plan with daily tasks. Each week should have:
- Clear focus areas (targeting 1-2 weak question types)
- Daily 30-60 minute tasks
- Spaced repetition of previously covered topics
- Increasing difficulty progression
- Balance between revision (40%) and practice (60%)

Return ONLY valid JSON in this exact format:
{
  "weeks": [
    {
      "week_number": 1,
      "focus_areas": ["Paper 1 Q2d Writer's Effect", "Vocabulary"],
      "daily_tasks": [
        {
          "day": "Monday",
          "tasks": [
            {
              "title": "Study Writer's Effect Techniques",
              "duration": "30 mins",
              "category": "Paper 1 Guide/Revision",
              "description": "Watch video on identifying language techniques and their effects"
            }
          ]
        }
      ]
    }
  ]
}`;

  const collections = [COLLECTIONS.PAPER_1, COLLECTIONS.PAPER_2];

  const result = await xai.searchAndChat(
    searchQuery,
    collections,
    systemPrompt,
    'Find marking criteria, common mistakes, and practice strategies for these question types'
  );

  // Now ask for the plan with the context
  const planResponse = await xai.createChatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
    { role: 'assistant', content: result.response },
    { role: 'user', content: 'Now generate the complete study plan in JSON format.' },
  ], { temperature: 0.7 });

  const planText = planResponse.choices[0].message.content;

  // Extract JSON from markdown code blocks if present
  const jsonMatch = planText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, planText];
  const jsonStr = jsonMatch[1] || planText;

  try {
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('Failed to parse study plan JSON:', error);
    throw new Error('Failed to generate study plan. Please try again.');
  }
}

/**
 * Study Session AI Assistant
 * Provides real-time help during study sessions
 */
export async function studySessionChat(
  message: string,
  category: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  userWeakTopics?: string[]
): Promise<string> {
  // Determine which collections to search based on category
  let collections: string[] = [];

  if (category.includes('Paper 1')) {
    collections = [COLLECTIONS.PAPER_1];
  } else if (category.includes('Paper 2')) {
    collections = [COLLECTIONS.PAPER_2];
  } else if (category.includes('Text Types')) {
    collections = [COLLECTIONS.TEXT_TYPES];
  } else if (category.includes('Vocabulary')) {
    collections = [COLLECTIONS.VOCABULARY];
  }

  const systemPrompt = `You are a helpful IGCSE English study assistant helping a student during their study session on: ${category}.

${userWeakTopics && userWeakTopics.length > 0 ? `The student has known weak areas in: ${userWeakTopics.join(', ')}` : ''}

When answering questions:
1. Search the relevant collection for accurate information
2. Give brief, exam-focused answers (2-3 sentences unless explaining complex concepts)
3. Ask follow-up questions to check understanding
4. Suggest related practice questions when appropriate
5. Use specific examples from past papers when relevant

Keep responses concise and student-friendly.`;

  if (collections.length > 0) {
    // Use search and chat for knowledge-based questions
    const result = await xai.searchAndChat(
      message,
      collections,
      systemPrompt,
      'Find relevant marking criteria, examples, or explanations'
    );

    return result.response;
  } else {
    // Fall back to regular chat
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await xai.createChatCompletion(messages, { temperature: 0.7 });
    return response.choices[0].message.content;
  }
}

/**
 * Session Analyzer Agent
 * Analyzes completed study sessions to extract learning insights
 */
export async function analyzeStudySession(
  session: Partial<StudySession>
): Promise<SessionAnalysis> {
  const systemPrompt = `You are an educational data analyst specializing in identifying student learning patterns.

Analyze study session data to extract:
1. Specific weak topics (be granular - e.g., "identifying metaphor effects" not just "language analysis")
2. Preferred revision methods (video, reading, notes, practice)
3. Misconceptions shown in questions or quiz performance
4. Emerging strengths

Be specific and actionable in your analysis.`;

  const questionsAsked = session.questions_asked_ai as any[] || [];
  const quizCorrect = session.quiz_correct || 0;
  const quizIncorrect = session.quiz_incorrect || 0;
  const notesMade = session.notes_made || '';
  const revisionMethods = session.revision_methods || [];

  const userPrompt = `Analyze this study session and extract learning insights:

**Quiz Performance:**
- Correct Answers: ${quizCorrect}
- Incorrect Answers: ${quizIncorrect}
- Success Rate: ${quizCorrect + quizIncorrect > 0 ? Math.round((quizCorrect / (quizCorrect + quizIncorrect)) * 100) : 0}%

**Questions Asked to AI:**
${questionsAsked.map((q: any, i: number) => `${i + 1}. ${q.question || q}`).join('\n') || 'None'}

**Notes Made:**
${notesMade || 'No notes'}

**Revision Methods Used:**
${revisionMethods.join(', ') || 'Not specified'}

**Category:** ${session.category}

Return ONLY valid JSON in this format:
{
  "weak_topics": ["specific topic 1", "specific topic 2"],
  "preferred_methods": ["video", "notes"],
  "misconceptions": ["misconception 1"],
  "strengths": ["strength 1"]
}`;

  const response = await xai.createChatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.3 });

  const analysisText = response.choices[0].message.content;

  // Extract JSON from markdown code blocks if present
  const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, analysisText];
  const jsonStr = jsonMatch[1] || analysisText;

  try {
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('Failed to parse session analysis JSON:', error);
    return {
      weak_topics: [],
      preferred_methods: revisionMethods,
      misconceptions: [],
      strengths: [],
    };
  }
}

/**
 * Practice Marker AI
 * Marks student practice answers against exam board criteria
 */
export async function markPracticeAnswer(
  question: string,
  studentAnswer: string,
  maxMarks: number,
  questionType: string
): Promise<PracticeMarkingResult> {
  // Determine which collection to search
  const isPaper1 = questionType.includes('Paper 1');
  const collections = isPaper1 ? [COLLECTIONS.PAPER_1] : [COLLECTIONS.PAPER_2];

  const systemPrompt = `You are an experienced IGCSE English examiner. Mark student answers using official mark schemes and band descriptors.

Be encouraging but honest. Use exam board terminology. Focus on what would earn marks in a real exam.`;

  const searchQuery = `Mark scheme and band descriptors for ${questionType}`;

  const result = await xai.searchAndChat(
    searchQuery,
    collections,
    systemPrompt,
    'Find the official mark scheme, band descriptors, and example responses for this question type'
  );

  const markingPrompt = `Mark this IGCSE English answer using the official mark scheme:

**Question:** ${question}
**Question Type:** ${questionType}
**Max Marks:** ${maxMarks}

**Student Answer:**
${studentAnswer}

**Mark Scheme Context:**
${result.response}

Provide:
1. Raw score (X/${maxMarks})
2. Band level achieved (e.g., "Band 3 - Sound")
3. What was done well (2-3 specific points with examples from their answer)
4. What was missing for the next band (2-3 specific points)
5. One actionable improvement tip

Return ONLY valid JSON in this format:
{
  "score": 6,
  "max_marks": ${maxMarks},
  "band_level": "Band 3 - Sound",
  "strengths": ["Point 1", "Point 2"],
  "areas_for_improvement": ["Point 1", "Point 2"],
  "improvement_tip": "One clear actionable tip"
}`;

  const markingResponse = await xai.createChatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: markingPrompt },
  ], { temperature: 0.3 });

  const resultText = markingResponse.choices[0].message.content;

  // Extract JSON from markdown code blocks if present
  const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, resultText];
  const jsonStr = jsonMatch[1] || resultText;

  try {
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('Failed to parse marking result JSON:', error);
    throw new Error('Failed to mark answer. Please try again.');
  }
}

/**
 * Personalized Practice Generator
 * Creates curated practice questions based on student weaknesses
 */
export async function generatePersonalizedPractice(
  weakTopics: string[],
  aiMemory: AIMemory[],
  recentScores: number[]
): Promise<any> {
  const systemPrompt = `You are an IGCSE English practice coordinator. Create personalized practice journeys that target student weaknesses while building confidence.

Design question sequences that:
- Start with confidence-building (slightly below current level)
- Progress to challenging weak areas
- Include questions that combine multiple skills
- End with a moderate difficulty success

Use real past paper questions when possible.`;

  const avgScore = recentScores.length > 0
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : 50;

  const weakTopicsStr = weakTopics.join(', ');
  const memoryInsights = aiMemory
    .filter(m => m.confidence_score > 0.6)
    .map(m => `- ${m.memory_type}: ${m.content}`)
    .join('\n');

  const userPrompt = `Generate a personalized practice journey for this student:

**Known Weaknesses:**
${weakTopicsStr}

**AI Memory Insights:**
${memoryInsights || 'No significant patterns yet'}

**Recent Performance:**
- Average Score: ${avgScore.toFixed(1)}%
- Trend: ${recentScores.length >= 2 && recentScores[recentScores.length - 1] > recentScores[0] ? 'Improving' : 'Needs attention'}

Search Paper 1 and Paper 2 collections for past paper questions that:
1. Target the weak topics
2. Match appropriate difficulty (slightly above ${avgScore}% performance level)
3. Provide good progression

Create a sequence of 5-8 questions with:
- Question text or reference
- Predicted difficulty (easy/medium/hard)
- Learning objective
- Question type (Paper 1 Q1f, Paper 2 Q1, etc.)

Return as JSON array.`;

  const collections = [COLLECTIONS.PAPER_1, COLLECTIONS.PAPER_2];

  const result = await xai.searchAndChat(
    `Past paper questions for: ${weakTopicsStr}`,
    collections,
    systemPrompt,
    'Find suitable past paper questions targeting these weak areas'
  );

  return result;
}
