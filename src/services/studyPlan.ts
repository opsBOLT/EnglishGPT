/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../lib/supabase';
import { getAINotes, getTaskCompletions } from './api';
import { aiLogger } from './aiLogger';

type PlanPayload = {
  summary: string;
  aiNotes?: Record<string, any>;  // Full AI notes object from student_ai_notes
  markingResult?: unknown;
  essay?: string;
  questionType?: string;
  previousPlanId?: string;
  previousPlanVersion?: number;
  progressData?: {
    completedCount: number;
    totalCount: number;
    improvingAreas?: string[];
    strugglingAreas?: string[];
  };
};

export type Task = {
  id: string;  // Unique task ID for tracking (e.g., "monday-0-uuid")
  title: string;
  description: string;
  category: 'paper1' | 'paper2' | 'examples' | 'text_types' | 'vocabulary' | 'general';
  duration_minutes: number;
  time_slot?: string;  // Optional scheduling hint (e.g., "morning", "afternoon")
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;  // Timestamp when marked complete
  ai_note_references?: string[];  // Which AI notes informed this task
};

export type TaskCompletionRecord = {
  task_id: string;
  week_number?: number;
  day?: string;
  time_spent_minutes?: number | null;
  difficulty_rating?: number | null;
};

export type NormalizedStudyPlan = {
  plan_id?: string;  // Unique plan ID for tracking completions
  generated_at?: string;  // When the plan was generated
  version?: number;  // For adaptive regeneration tracking

  // Overview sections
  overview: string;
  targets: {
    target_grade: string;
    time_frame_weeks: number;
    weekly_hours: number;
  };
  diagnosis: string[];
  strengths: string[];
  weaknesses: string[];
  priorities: string[];

  // Enhanced weekly structure (UI-ready with nested daily tasks)
  weeks?: Array<{
    week_number: number;
    theme: string;
    start_date?: string;  // Calculated from plan start (ISO string)
    goals: string[];
    focus_papers: string[];
    checkpoints: string[];

    // Transformed daily tasks (nested structure for UI)
    daily_tasks: Array<{
      day: string;  // "monday", "tuesday", ...
      date?: string;  // Actual calendar date (ISO string)
      tasks: Task[];
    }>;
  }>;

  // Legacy structure (for backward compatibility with existing plans)
  weekly_plan?: Array<{
    week_number: number;
    theme: string;
    goals: string[];
    focus_papers: string[];
    writing_tasks: string[];
    reading_tasks: string[];
    drills: string[];
    checkpoints: string[];
  }>;
  daily_micro_tasks?: Record<string, string[]>;

  // Supporting materials
  exam_drills: string[];
  feedback_loops: string[];
  resources: string[];
  reflection_prompts: string[];
};

/**
 * Build contextualized AI notes sections for prompt injection.
 * Groups the 36 AI note fields into digestible categories.
 */
function buildAINotesContext(notes: Record<string, any>): {
  paperSkills: string;
  textTypeSkills: string;
  coreSkills: string;
  learningPatterns: string;
} {
  const formatNote = (key: string, label: string): string => {
    const value = notes[key];
    if (!value || value === 'NO DATA' || value === 'null' || value === null) return '';
    return `${label}: ${value}`;
  };

  // Paper 1 & 2 Skills
  const paper1Notes = [
    formatNote('paper1_reading_comprehension_ai_note', 'Reading Comprehension'),
    formatNote('paper1_summary_ai_note', 'Summary Writing'),
    formatNote('paper1_language_analysis_ai_note', 'Language Analysis (Q2d)'),
    formatNote('paper1_extended_writing_ai_note', 'Extended Writing (Q3)'),
  ].filter(Boolean).join('\n');

  const paper2Notes = [
    formatNote('paper2_directed_writing_ai_note', 'Directed Writing'),
    formatNote('paper2_composition_narrative_ai_note', 'Narrative Composition'),
    formatNote('paper2_composition_descriptive_ai_note', 'Descriptive Composition'),
  ].filter(Boolean).join('\n');

  const paperSkills = [paper1Notes, paper2Notes].filter(Boolean).join('\n\n');

  // Text Type Proficiency
  const textTypeNotes = [
    formatNote('text_type_interview_ai_note', 'Interview'),
    formatNote('text_type_diary_ai_note', 'Journal/Diary'),
    formatNote('text_type_magazine_article_ai_note', 'Magazine Article'),
    formatNote('text_type_newspaper_report_ai_note', 'Newspaper Report'),
    formatNote('text_type_formal_report_ai_note', 'Formal Report'),
    formatNote('text_type_speech_ai_note', 'Speech'),
    formatNote('text_type_letter_formal_ai_note', 'Formal Letter'),
    formatNote('text_type_letter_informal_ai_note', 'Informal Letter'),
  ].filter(Boolean).join('\n');

  // Core Writing Skills
  const coreSkillNotes = [
    formatNote('skill_vorpf_ai_note', 'VORPF Application (Voice/Audience/Register/Purpose/Format)'),
    formatNote('skill_vocabulary_ai_note', 'Vocabulary Range'),
    formatNote('skill_sentence_variety_ai_note', 'Sentence Variety'),
    formatNote('skill_punctuation_ai_note', 'Punctuation'),
    formatNote('skill_paragraph_structure_ai_note', 'Paragraph Structure'),
    formatNote('skill_development_ai_note', 'Idea Development'),
    formatNote('skill_inference_ai_note', 'Inference Skills'),
    formatNote('skill_paraphrasing_ai_note', 'Paraphrasing'),
    formatNote('skill_evaluation_ai_note', 'Critical Evaluation'),
  ].filter(Boolean).join('\n');

  // Learning Patterns & Motivation
  const learningNotes = [
    formatNote('learning_style_ai_note', 'Learning Style'),
    formatNote('motivation_pattern_ai_note', 'Motivation Triggers'),
    formatNote('time_management_ai_note', 'Time Management'),
    formatNote('confidence_level_ai_note', 'Confidence Level'),
    formatNote('specific_struggles_ai_note', 'Known Struggles'),
    formatNote('breakthrough_moments_ai_note', 'Previous Breakthroughs'),
  ].filter(Boolean).join('\n');

  return {
    paperSkills: paperSkills || 'No specific paper skill notes available.',
    textTypeSkills: textTypeNotes || 'No text type proficiency notes available.',
    coreSkills: coreSkillNotes || 'No core skill notes available.',
    learningPatterns: learningNotes || 'No learning pattern notes available.',
  };
}

/**
 * Generate a unique ID for a task
 */
function generateTaskId(day: string, index: number): string {
  // Create a simple unique ID: day-index-timestamp
  return `${day}-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculate the date for a specific day in a specific week
 */
function getDateForDayInWeek(startDate: Date, weekIndex: number, dayName: string): string {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayIndex = daysOfWeek.indexOf(dayName.toLowerCase());
  if (dayIndex === -1) return startDate.toISOString();

  const date = new Date(startDate);
  date.setDate(date.getDate() + (weekIndex * 7) + dayIndex);
  return date.toISOString();
}

/**
 * Add weeks to a date
 */
function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + (weeks * 7));
  return result;
}

/**
 * Parse a task string into a structured Task object
 * Extracts category and duration from the task description
 */
function parseTaskString(taskStr: string, day: string, index: number, aiNotes?: Record<string, any>): Task {
  // Try to extract duration from patterns like "15 min", "20-min", "30 minutes"
  const durationMatch = taskStr.match(/(\d+)[\s-]*(min|minute|minutes)/i);
  const duration = durationMatch ? parseInt(durationMatch[1]) : 20; // default 20 min

  // Determine category based on keywords
  let category: Task['category'] = 'general';
  const lowerTask = taskStr.toLowerCase();
  if (lowerTask.includes('paper 1') || lowerTask.includes('paper1') || lowerTask.includes('reading') || lowerTask.includes('comprehension') || lowerTask.includes('summary') || lowerTask.includes('language analysis')) {
    category = 'paper1';
  } else if (lowerTask.includes('paper 2') || lowerTask.includes('paper2') || lowerTask.includes('directed writing') || lowerTask.includes('composition') || lowerTask.includes('narrative') || lowerTask.includes('descriptive')) {
    category = 'paper2';
  } else if (lowerTask.includes('text type') || lowerTask.includes('letter') || lowerTask.includes('article') || lowerTask.includes('speech') || lowerTask.includes('report') || lowerTask.includes('diary') || lowerTask.includes('interview')) {
    category = 'text_types';
  } else if (lowerTask.includes('vocabulary') || lowerTask.includes('word') || lowerTask.includes('vocab')) {
    category = 'vocabulary';
  } else if (lowerTask.includes('example') || lowerTask.includes('model') || lowerTask.includes('sample')) {
    category = 'examples';
  }

  // Extract title (first 50 chars or until punctuation)
  const title = taskStr.split(/[.!?]/)[0].slice(0, 60).trim() || taskStr.slice(0, 60).trim();

  // Find relevant AI notes that might have informed this task
  const aiNoteRefs: string[] = [];
  if (aiNotes) {
    // Look for AI note fields that might relate to this task's category
    const relevantFields = Object.keys(aiNotes).filter(key => {
      const value = aiNotes[key];
      if (!value || value === 'NO DATA') return false;

      // Check if task content relates to this AI note field
      if (category === 'paper1' && key.includes('paper1')) return true;
      if (category === 'paper2' && key.includes('paper2')) return true;
      if (category === 'text_types' && key.includes('text_type')) return true;
      if (category === 'vocabulary' && key.includes('vocabulary')) return true;

      return false;
    });
    aiNoteRefs.push(...relevantFields);
  }

  return {
    id: generateTaskId(day, index),
    title,
    description: taskStr,
    category,
    duration_minutes: duration,
    status: 'pending',
    ai_note_references: aiNoteRefs.length > 0 ? aiNoteRefs : undefined,
  };
}

/**
 * Transform the LLM-generated plan into a UI-ready structure with nested daily tasks
 */
function transformToUIStructure(
  rawPlan: NormalizedStudyPlan,
  aiNotes?: Record<string, any>
): NormalizedStudyPlan {
  const startDate = new Date(); // Plan starts today
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // If the plan already has the new structure, return it as-is
  if (rawPlan.weeks && rawPlan.weeks.length > 0) {
    return {
      ...rawPlan,
      plan_id: rawPlan.plan_id || `plan-${Date.now()}`,
      generated_at: rawPlan.generated_at || new Date().toISOString(),
      version: rawPlan.version || 1,
    };
  }

  // Transform legacy structure to new structure
  const weeks = rawPlan.weekly_plan?.map((week, weekIndex) => {
    // Build daily_tasks from daily_micro_tasks
    const daily_tasks = daysOfWeek.map(day => {
      const tasksForDay = rawPlan.daily_micro_tasks?.[day] || [];
      const tasks = tasksForDay.map((taskStr, taskIndex) =>
        parseTaskString(taskStr, day, taskIndex, aiNotes)
      );

      return {
        day,
        date: getDateForDayInWeek(startDate, weekIndex, day),
        tasks,
      };
    });

    return {
      week_number: week.week_number,
      theme: week.theme,
      start_date: addWeeks(startDate, weekIndex).toISOString(),
      goals: week.goals,
      focus_papers: week.focus_papers,
      checkpoints: week.checkpoints,
      daily_tasks,
    };
  }) || [];

  return {
    ...rawPlan,
    plan_id: `plan-${Date.now()}`,
    generated_at: new Date().toISOString(),
    version: 1,
    weeks,
    // Keep legacy structure for backward compatibility
    weekly_plan: rawPlan.weekly_plan,
    daily_micro_tasks: rawPlan.daily_micro_tasks,
  };
}

/**
 * Create a very detailed study plan using the summary + marking results + AI notes.
 * The prompt is intentionally massive and exhaustive to guide the LLM output.
 */
export async function createDetailedStudyPlan(userId: string, payload: PlanPayload): Promise<{ plan?: NormalizedStudyPlan; error?: string }> {
  // Fetch AI notes if not provided
  let aiNotes = payload.aiNotes;
  if (!aiNotes) {
    const { notes, error: notesError } = await getAINotes(userId);
    if (notesError) {
      console.warn('[studyPlan] Could not fetch AI notes, generating plan without them:', notesError);
    } else {
      aiNotes = notes as Record<string, any>;
    }
  }

  // Build AI notes context for prompt
  const aiNotesContext = aiNotes ? buildAINotesContext(aiNotes) : null;

  const prompt = `
You are an elite IGCSE English tutor. Build a concrete, actionable study plan using:
1) The onboarding conversation summary (student goals/weaknesses/strengths).
2) The automated marking result (question type, score, feedback).
3) The essay text (evidence of style/accuracy).
4) The comprehensive AI-identified skill profile and learning patterns (36 data points).

NON-NEGOTIABLE OUTPUT FORMAT (JSON ONLY, NO MARKDOWN, NO PROSE OUTSIDE JSON):
{
  "overview": string,
  "targets": { "target_grade": string, "time_frame_weeks": number, "weekly_hours": number },
  "diagnosis": string[],
  "strengths": string[],
  "weaknesses": string[],
  "priorities": string[],
  "weekly_plan": [
    {
      "week_number": number,
      "theme": string,
      "goals": string[],
      "focus_papers": string[],            // e.g., ["Paper 1 Q2d", "Paper 2 Directed Writing"]
      "writing_tasks": string[],
      "reading_tasks": string[],
      "drills": string[],                  // include duration and timed constraints
      "checkpoints": string[]              // measurable success criteria
    }
  ],
  "daily_micro_tasks": {
    "monday": string[], "tuesday": string[], "wednesday": string[],
    "thursday": string[], "friday": string[], "saturday": string[], "sunday": string[]
  },
  "exam_drills": string[],                 // concrete past-paper style prompts aligned to weaknesses
  "feedback_loops": string[],              // self-check, model answers, timed rewrites, peer/coach review
  "resources": string[],                   // links or search terms
  "reflection_prompts": string[]           // short self-evaluation prompts
}

CONTENT RULES (BE EXTREMELY SPECIFIC AND USEFUL):
- Use SUMMARY to anchor goals/weaknesses/strengths.
- Use MARKING_RESULT to prioritize fixes; cite exact weak question types (e.g., Paper 1 Q2d Writer's Effect).
- Default targets if missing: target_grade="A", weekly_hours=4–6, time_frame_weeks=8.
- Weekly plan: 2–3 timed drills/week with decreasing prep time; measurable checkpoints (e.g., "score 6/10 on timed Q2d under 12 minutes").
- Include writer's effect drills with effect-on-reader language stems if weak; include directed writing/narrative/descriptive scaffolds if weak; include vocabulary/sentence-variation drills for concision/precision.
- Daily micro tasks: 15–30 minute tasks, explicit and actionable.
- Drills must state duration and timing constraints.
|
CONTEXT ABOUT IGCSE ENGLISH. EVERYTHING YOU NEED TO KNOW AND MUST READ, DO NOT MAKE ANY GUIDES, OR ANYHTING ELSE THAN WHAT IS IN THESE RULES. DO NOT DEVIATE FROM THESE RULES UP. THIS IS JUST FOR CONTEXT:

IGCSE English Exam Structure

    Paper 1 Reading (2 hours, 80 marks)
    Covers comprehension and analysis of provided texts plus an extended writing task.

        Question 1: Short answer reading comprehension (15 marks)

        Question 2: Language analysis focusing on writer's effect (15 marks)

        Question 3: Extended writing based on a source text (25 marks)

        Summary writing also included.

    Paper 2 Writing (2 hours, 80 marks)
    Focuses on writing skills with two sections:

        Section A Directed Writing (40 marks): Respond to scenario with one of speech, article, or letter formats. This requires argumentative, persuasive, or informative writing based on two contrasting texts.

        Section B Composition (40 marks): Creative writing - narrative or descriptive essay.

Absolutely — I can break down **every question in Paper 1**, including **each sub-question**, **what it is asking**, **how to answer it**, and **the context behind it**, using the guide you uploaded.
Everything below is pulled directly from your document and expanded into an easy-to-use teaching/exam-prep format.


---

# ⭐ FULL BREAKDOWN OF PAPER 1 — EVERY QUESTION + SUB-QUESTION

*(For 0500/0990, based on current format in your PDF)*

---

# **📌 PAPER 1 OVERVIEW**

Paper 1 has **3 main questions**, but inside them are **multiple sub-sections**. Each requires a different skill.

### **Marks**

| Question   | Task                        | Marks        |
| ---------- | --------------------------- | ------------ |
| **1(a–e)** | Short reading comprehension | **15 marks** |
| **1(f)**   | Summary writing             | **15 marks** |
| **2(a–c)** | Vocabulary + meaning        | **3 marks**  |
| **2(d)**   | Writer’s effect             | **15 marks** |
| **3**      | Extended response           | **25 marks** |

Time: **2 hours**.

---

# **🔶 QUESTION 1(a–e): READING COMPREHENSION**

**Skills tested:** retrieval, inference, understanding (NOT analysis).
**Source:** Text A or B (depending on paper).

---

## **1(a) – 1(d): Short-answer questions**

### **What is being tested?**

* Your ability to **find specific information** in the text.
* Mark = number of points needed.

### **How to answer**

* **Copy directly** from the text unless it says “in your own words.”
* Be **concise**.
* Use **bullet points** if multiple marks.

### **Context from guide**

Your document states:

* “The number of marks = number of points needed”
* “Use bullet points”
* “Copy directly unless told otherwise”


### **Common question types**

* **Definition** (e.g., “What does X mean?” → give own words)
* **Retrieval** (list reasons, events, actions)
* **Inference** (“Why was she surprised?” → requires logic + text)

---

## **1(e): USING YOUR OWN WORDS**

This is the **only Q1 sub-question that requires paraphrasing**.
Worth **3 marks** → 3 separate ideas.

### **What is being tested?**

* Paraphrasing
* Inference
* Ability to avoid lifting phrases

### **How to answer**

* Find 3 key ideas
* Rewrite using synonyms
* Avoid repeating text vocabulary
* Check: “Would this make sense without the original text?”

### **From your guide:**

* “Avoid lifting phrases; use synonyms; restructure sentences.”
* “3 marks = 3 different reasons in your own words.”


---

# **🔶 QUESTION 1(f): SUMMARY WRITING**

**Marks: 15 total (10 content + 5 writing)**
**Word limit: 120 words** — examiner stops reading after this.

### **What is being tested?**

* Summary skills
* Selection of relevant ideas
* Paraphrasing
* Concise writing

### **Structure**

One paragraph
No introduction or conclusion

### **Steps**

1. Identify what the question is asking you to summarise
2. Locate **10–13 points** in the text
3. Paraphrase each idea
4. Combine into smooth 120-word paragraph

### **From your guide:**

* “One paragraph only.”
* “Use your own words.”
* “10–13 distinct points.”


---

# **🔶 QUESTION 2(a–c): VOCABULARY + INTERPRETATION**

Total: **3 marks**

---

## **2(a): FIND A WORD OR PHRASE**

You copy EXACTLY from the text.
Usually worth 1 mark.

---

## **2(b): DEFINE THE WORD**

Meaning must be in **your own words**.

Example from guide:
“Clamped” = seized, grabbed tightly


---

## **2(c): SELECT & EXPLAIN QUOTE**

Worth **3 marks**
Structure required:

### **How to answer**

Choose **ONE** quote + give **THREE distinct points**.

### **Example from guide:**

Quote: “energizing fresh water shower”

* Point 1: energizing → excitement
* Point 2: fresh water → appreciation of nature
* Point 3: shower → embracing the experience


### **Common mistake:**

Choosing more than one quote


---

# **🔶 QUESTION 2(d): WRITER’S EFFECT (LANGUAGE ANALYSIS)**

**Marks: 15**
**Task:** Analyse the language in TWO paragraphs from Text C.

---

## **What is being tested?**

* Understanding imagery
* Effects on the reader
* Connotations
* Ability to explain meaning + deeper meaning

---

## **Required Structure (QME method)**

Your guide gives a fixed structure:

### **Paragraph 1**

1. Overall effect of the paragraph
2. **Three images:** each must include

   * Quote
   * Meaning (explicit)
   * Connotations
   * Effect

### **Paragraph 2**

Same structure again

Total: **6 images** (3 per paragraph)



---

## **What NOT to do**

* No analysis of devices (“this metaphor shows”)
* No more than 3 images per paragraph
* Don’t choose weak/obvious quotes


---

# **🔶 QUESTION 3: EXTENDED RESPONSE**

**Marks: 25** (15 content + 10 style)

You must use **information from Text C** but write in a **new format** (letter, diary, report, article, interview etc).

---

## **Structure**

Template recommended by your guide:

### **Paragraph 1: Bullet Point 1**

How you felt when X happened + why

### **Paragraph 2: Bullet Point 2**

Describe X and your reactions

### **Paragraph 3: Bullet Point 3**

Thoughts/feelings now about X
(most inference needed here)

### **Conclusion**

1–2 sentences only



---

## **What the examiner wants**

* Include **10–15 details** from the text
* Develop 3–4 ideas per paragraph
* Keep consistent voice (VORPF method)

  * Voice
  * Audience
  * Register
  * Purpose
  * Format

Major Text Types Overview (Paper 1 Q3 & Paper 2 Q1)

    Paper 1, Question 3 Text Types

        Interview

        Journal/Diary

        Magazine Article

        Newspaper Report

        Formal Report

        Speech/Talk

        Letter (Formal or Informal)

    Paper 2, Question 1 Text Types

        Speech

        Magazine Article

        Letter (Formal or Informal)

VARPF Framework (Voice, Audience, Register, Purpose, Format)

    Voice: Who is writing? (Student, journalist, employee, character)

    Audience: Who is reading? (School, general public, boss, friend)

    Register: Formality level—Formal, Semi-formal, Informal (Cambridge expects minimal slang or casual language even in diaries/ informal letters)

    Purpose: Persuade, Inform, Argue, Entertain, Reflect, Describe

    Format: The structure and conventions of the text type (script for interviews, subheadings in reports, greetings in letters, etc.)

Detailed Text Type Features and Expectations

    Interview: Script format with interviewer and interviewee; semi-formal conversational tone; only use the three given questions; interviewee does 95% of talking; no introductions or conclusions; use fillers and varied punctuation for spoken effect.

    Journal/Diary: Personal, reflective, first person, semi-formal; emotional language; dates at the start; no full story arcs, just moments; use emotive language, pauses with ellipses, rhetorical questions; no dialogue quoting.

    Magazine Article: Semi-formal, engaging, often chatty or dramatic; headlines with alliteration, puns, emotive language; direct address with collective pronouns; mix humor with serious content.

    Newspaper Report: Formal, factual, neutral tone; 5W opening paragraph structure; avoid bias and emotional language; use passive voice and reporting verbs; include 1-3 relevant quotes; short, factual headlines.

    Formal Report: Most formal text; structured with clear subheadings transforming bullet points; formal vocabulary; objective and neutral tone; use modal verbs for suggestions; avoid contractions and exclamations; use relative clauses and formal transitions.

    Speech: Semi-formal spoken tone; direct audience address; rhetorical questions; repetition for emphasis; emotive language; personal anecdotes; call to action; multiple styles - persuasive, argumentative, informative.

    Letter: Formal or informal depending on audience; formal letters require polite, professional tone; informal letters allow contractions, emotive language; always include greeting and sign-off; structure body in paragraphs responding to bullet points; avoid slang in formal.

Assessment and Marking Criteria

    Content: Full coverage of all bullet points or question parts; relevant ideas; high marks for development beyond surface-level; mix explicit and implicit ideas with elaboration.

    Structure: Clear paragraphing responding to each bullet point equally; introduction and conclusion where appropriate; logical flow.

    Style and Accuracy: Consistent VARPF; varied sentence structures (simple, compound, complex; punctuation variety for effect); ambitious but accurate vocabulary; minimal spelling, punctuation, grammar errors; formal or semi-formal register as required.

    Evaluation (Paper 2 Section A): Critical engagement with texts; find at least one good counter-argument to gain high marks; do not just summarize; develop balanced arguments clearly.

Common Student Struggles and Advice Relevant for Study Plans

    Inconsistent register or informal language leaking into formal texts.

    Failure to develop beyond listing points; lack of deeper explanation or inference especially on implicit bullet points.

    Overly long or uneven paragraph lengths skewing marks.

    Copying large text chunks without paraphrasing for Paper 1 Q3 and Paper 2 writing.

    Insufficient use of evaluation in directed writing (lack of counter-arguments or critical perspective).

    Time management issues leading to incomplete questions or minimal proofreading.

    Missing the importance of VARPF analysis before writing.

    Weak vocabulary variety and repetitive sentence structures.
  

    PLEASE PLEASE PLEASE USE THIS INFORMATION BELOW OF THE USER AND THEIR ESSAY TO CREATE A VERY PERSONALISED STUDY PLAN. VERY VERY VERY PERSONALISED.

## STUDENT PERSONALIZATION DATA

### Onboarding Summary
${payload.summary || 'N/A'}

${aiNotesContext ? `
### AI-Identified Skill Profile (Use these insights to hyper-personalize tasks and drills)

#### Paper-Specific Skills
${aiNotesContext.paperSkills}

#### Text Type Proficiency
${aiNotesContext.textTypeSkills}

#### Core Writing Skills
${aiNotesContext.coreSkills}

#### Learning Patterns & Motivation
${aiNotesContext.learningPatterns}
` : ''}

### Recent Performance (Weakness Essay)
Essay Type: ${payload.questionType || 'N/A'}
MARKING RESULT RAW JSON (verbatim): ${JSON.stringify(payload.markingResult || {})}
USER ESSAY (verbatim): ${payload.essay || 'N/A'}

${payload.progressData ? `
### Progress To Date (Adaptive Context)
Completed Tasks: ${payload.progressData.completedCount}/${payload.progressData.totalCount}
${payload.progressData.improvingAreas && payload.progressData.improvingAreas.length > 0
  ? `Areas Showing Improvement: ${payload.progressData.improvingAreas.join(', ')}`
  : ''}
${payload.progressData.strugglingAreas && payload.progressData.strugglingAreas.length > 0
  ? `Still Struggling With: ${payload.progressData.strugglingAreas.join(', ')}`
  : ''}
` : ''}

## INSTRUCTIONS FOR PERSONALIZATION
Use the AI notes above to:
- Reference specific weaknesses in tasks (e.g., "Focus on VORPF framework - you struggle with audience adaptation")
- Target drills to exact pain points (e.g., "Daily 10-min drill on punctuation variety - currently overusing commas")
- Adapt to learning style (e.g., "You learn best with examples first - each drill includes model answer before practice")
- Embed motivation triggers (e.g., "Track improvement in timed conditions - your breakthrough area")
- Adjust difficulty based on text type proficiency
`;

  try {
    // Log the prompt
    const startTime = Date.now();
    const logId = aiLogger.logPrompt('study_plan', 'x-ai/grok-4.1-fast:free', prompt, { userId });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_ENGLISHGPT_GENERAL_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4.1-fast:free',
        messages: [
          { role: 'system', content: 'Return only JSON. Do not include markdown fences.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      const duration = Date.now() - startTime;
      aiLogger.logResponse(logId, text, { duration_ms: duration, error: `HTTP ${response.status}` });
      console.error('[studyPlan] LLM error', response.status, text);
      return { error: text || 'LLM request failed' };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      const duration = Date.now() - startTime;
      aiLogger.logResponse(logId, '', { duration_ms: duration, error: 'Empty LLM response' });
      return { error: 'Empty LLM response' };
    }

    // Log the successful response
    const duration = Date.now() - startTime;
    aiLogger.logResponse(logId, content, {
      duration_ms: duration,
      tokens: data?.usage?.total_tokens
    });

    let planJson: unknown;
    try {
      planJson = JSON.parse(content);
    } catch {
      console.error('[studyPlan] parse failed, content:', content);
      return { error: 'Failed to parse study plan JSON' };
    }

    const normalized = normalizePlan(planJson);

    // Transform to UI-ready structure with nested daily tasks, unique IDs, and dates
    const transformed = transformToUIStructure(normalized, aiNotes);
    const version = payload.previousPlanVersion ? payload.previousPlanVersion + 1 : (transformed.version || 1);
    const basePlanId = payload.previousPlanId
      ? payload.previousPlanId.replace(/-v\d+$/, '')
      : transformed.plan_id || `plan-${Date.now()}`;
    const planId = payload.previousPlanId
      ? `${basePlanId}-v${version}`
      : basePlanId;
    const finalPlan: NormalizedStudyPlan = {
      ...transformed,
      plan_id: planId,
      version,
      generated_at: transformed.generated_at || new Date().toISOString(),
    };

    console.log('[studyPlan] Transformed plan to UI structure with', finalPlan.weeks?.length || 0, 'weeks');

    const { error: dbError } = await supabase
      .from('study_plan')
      .upsert({
        user_id: userId,
        plan_data: finalPlan,
        is_active: true,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('[studyPlan] DB save error', dbError);
      return { error: dbError.message };
    }

    return { plan: finalPlan };
  } catch (error) {
    console.error('[studyPlan] generation error', error);
    return { error: (error as Error).message };
  }
}

/**
 * Normalize the raw LLM response into a predictable shape for the UI.
 */
const CATEGORY_LABELS: Record<Task['category'], string> = {
  paper1: 'Paper 1',
  paper2: 'Paper 2',
  examples: 'Examples',
  text_types: 'Text Types',
  vocabulary: 'Vocabulary',
  general: 'General Skills',
};

function buildProgressSignals(
  plan: NormalizedStudyPlan | null | undefined,
  completions: TaskCompletionRecord[] = []
): {
  completedCount: number;
  totalCount: number;
  improvingAreas: string[];
  strugglingAreas: string[];
} {
  const totals: Record<Task['category'], { total: number; completed: number }> = {
    paper1: { total: 0, completed: 0 },
    paper2: { total: 0, completed: 0 },
    examples: { total: 0, completed: 0 },
    text_types: { total: 0, completed: 0 },
    vocabulary: { total: 0, completed: 0 },
    general: { total: 0, completed: 0 },
  };

  const taskLookup = new Map<string, Task>();

  plan?.weeks?.forEach(week => {
    week.daily_tasks?.forEach(day => {
      day.tasks?.forEach(task => {
        totals[task.category].total += 1;
        taskLookup.set(task.id, task);
      });
    });
  });

  completions?.forEach(completion => {
    const task = taskLookup.get(completion.task_id);
    if (task) {
      totals[task.category].completed += 1;
    }
  });

  const improvingAreas = Object.entries(totals)
    .filter(([, stats]) => stats.total > 0 && stats.completed / stats.total >= 0.65)
    .map(([key]) => CATEGORY_LABELS[key as Task['category']] || key);

  const strugglingAreas = Object.entries(totals)
    .filter(([, stats]) => stats.total > 0 && stats.completed / stats.total <= 0.4)
    .map(([key]) => CATEGORY_LABELS[key as Task['category']] || key);

  const totalCount = Object.values(totals).reduce((sum, s) => sum + s.total, 0);

  return {
    completedCount: completions?.length || 0,
    totalCount,
    improvingAreas,
    strugglingAreas,
  };
}

export async function regenerateStudyPlan(
  userId: string
): Promise<{ plan?: NormalizedStudyPlan; error?: string }> {
  try {
    const { data: planRow, error: planError } = await supabase
      .from('study_plan')
      .select('id, plan_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (planError) throw planError;

    const currentPlan = planRow?.plan_data as NormalizedStudyPlan | undefined;
    const planId = currentPlan?.plan_id || planRow?.id || '';

    const { completions } = planId
      ? await getTaskCompletions(userId, planId)
      : { completions: [] };

    const { notes, error: notesError } = await getAINotes(userId);
    if (notesError) throw new Error(notesError);

    const summaryText = typeof (notes as any)?.onboarding_summary === 'string'
      ? (notes as any).onboarding_summary
      : 'NO DATA: onboarding summary missing';

    const progressData = buildProgressSignals(currentPlan, completions || []);

    return await createDetailedStudyPlan(userId, {
      summary: summaryText,
      aiNotes: notes as Record<string, any>,
      progressData,
      previousPlanId: planId || undefined,
      previousPlanVersion: currentPlan?.version,
    });
  } catch (error) {
    console.error('[studyPlan] regenerateStudyPlan failed', error);
    return { error: (error as Error).message };
  }
}

/**
 * Normalize the raw LLM response into a predictable shape for the UI.
 */
function normalizePlan(raw: unknown): NormalizedStudyPlan {
  const asArray = (val: unknown, fallback: string[] = []) =>
    Array.isArray(val) ? val.map(v => String(v)) : fallback;
  const asNumber = (val: unknown, fallback: number) => (typeof val === 'number' ? val : fallback);
  const asString = (val: unknown, fallback = '') => (typeof val === 'string' ? val : fallback);
  const asWeekArray = (val: unknown) => {
    if (!Array.isArray(val)) return [];
    return val.map((w: any, idx: number) => ({
      week_number: asNumber(w?.week_number, idx + 1),
      theme: asString(w?.theme, ''),
      goals: asArray(w?.goals, []),
      focus_papers: asArray(w?.focus_papers, []),
      writing_tasks: asArray(w?.writing_tasks, []),
      reading_tasks: asArray(w?.reading_tasks, []),
      drills: asArray(w?.drills, []),
      checkpoints: asArray(w?.checkpoints, []),
    }));
  };

  const rawObj = raw as any;
  const targets = rawObj?.targets || {};
  const daily = rawObj?.daily_micro_tasks || {};
  const normalizedDaily: Record<string, string[]> = {};
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  days.forEach(d => {
    const tasks = daily?.[d] || daily?.[d.charAt(0).toUpperCase() + d.slice(1)] || [];
    normalizedDaily[d] = Array.isArray(tasks) ? tasks.map((t: unknown) => String(t)) : [];
  });

  return {
    overview: asString(rawObj?.overview, ''),
    targets: {
      target_grade: asString(targets?.target_grade, 'A'),
      time_frame_weeks: asNumber(targets?.time_frame_weeks, 8),
      weekly_hours: asNumber(targets?.weekly_hours, 5),
    },
    diagnosis: asArray(rawObj?.diagnosis, []),
    strengths: asArray(rawObj?.strengths, []),
    weaknesses: asArray(rawObj?.weaknesses, []),
    priorities: asArray(rawObj?.priorities, []),
    weekly_plan: asWeekArray(rawObj?.weekly_plan),
    daily_micro_tasks: normalizedDaily,
    exam_drills: asArray(rawObj?.exam_drills, []),
    feedback_loops: asArray(rawObj?.feedback_loops, []),
    resources: asArray(rawObj?.resources, []),
    reflection_prompts: asArray(rawObj?.reflection_prompts, []),
  };
}
