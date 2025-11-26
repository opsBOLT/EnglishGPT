import { supabase } from '../lib/supabase';

type PlanPayload = {
  summary: string;
  markingResult?: any;
  essay?: string;
  questionType?: string;
};

export type NormalizedStudyPlan = {
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
  weekly_plan: Array<{
    week_number: number;
    theme: string;
    goals: string[];
    focus_papers: string[];
    writing_tasks: string[];
    reading_tasks: string[];
    drills: string[];
    checkpoints: string[];
  }>;
  daily_micro_tasks: Record<string, string[]>;
  exam_drills: string[];
  feedback_loops: string[];
  resources: string[];
  reflection_prompts: string[];
};

/**
 * Create a very detailed study plan using the summary + marking results.
 * The prompt is intentionally massive and exhaustive to guide the LLM output.
 */
export async function createDetailedStudyPlan(userId: string, payload: PlanPayload): Promise<{ plan?: any; error?: string }> {
  const prompt = `
You are an elite IGCSE English tutor. Build a concrete, actionable study plan using:
1) The onboarding conversation summary (student goals/weaknesses/strengths).
2) The automated marking result (question type, score, feedback).
3) The essay text (evidence of style/accuracy).

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

USER SUMMARY (verbatim): ${payload.summary || 'N/A'}
MARKING RESULT RAW JSON (verbatim): ${JSON.stringify(payload.markingResult || {})}
USER ESSAY (verbatim): ${payload.essay || 'N/A'}
WEAKEST QUESTION TYPE (from user): ${payload.questionType || 'N/A'}
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_X_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'grok-4.1-fast',
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
      console.error('[studyPlan] LLM error', response.status, text);
      return { error: text || 'LLM request failed' };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return { error: 'Empty LLM response' };
    }

    let planJson: any;
    try {
      planJson = JSON.parse(content);
    } catch (err) {
      console.error('[studyPlan] parse failed, content:', content);
      return { error: 'Failed to parse study plan JSON' };
    }

    const normalized = normalizePlan(planJson);

    const { error: dbError } = await supabase
      .from('study_plan')
      .upsert({
        user_id: userId,
        plan_data: normalized,
      } as any);

    if (dbError) {
      console.error('[studyPlan] DB save error', dbError);
      return { error: dbError.message };
    }

    return { plan: normalized };
  } catch (error) {
    console.error('[studyPlan] generation error', error);
    return { error: (error as Error).message };
  }
}

/**
 * Normalize the raw LLM response into a predictable shape for the UI.
 */
function normalizePlan(raw: any): NormalizedStudyPlan {
  const asArray = (val: any, fallback: string[] = []) =>
    Array.isArray(val) ? val.map(v => String(v)) : fallback;
  const asNumber = (val: any, fallback: number) => (typeof val === 'number' ? val : fallback);
  const asString = (val: any, fallback = '') => (typeof val === 'string' ? val : fallback);
  const asWeekArray = (val: any) => {
    if (!Array.isArray(val)) return [];
    return val.map((w, idx) => ({
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

  const targets = raw?.targets || {};
  const daily = raw?.daily_micro_tasks || {};
  const normalizedDaily: Record<string, string[]> = {};
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  days.forEach(d => {
    const tasks = daily?.[d] || daily?.[d.charAt(0).toUpperCase() + d.slice(1)] || [];
    normalizedDaily[d] = Array.isArray(tasks) ? tasks.map((t: any) => String(t)) : [];
  });

  return {
    overview: asString(raw?.overview, ''),
    targets: {
      target_grade: asString(targets?.target_grade, 'A'),
      time_frame_weeks: asNumber(targets?.time_frame_weeks, 8),
      weekly_hours: asNumber(targets?.weekly_hours, 5),
    },
    diagnosis: asArray(raw?.diagnosis, []),
    strengths: asArray(raw?.strengths, []),
    weaknesses: asArray(raw?.weaknesses, []),
    priorities: asArray(raw?.priorities, []),
    weekly_plan: asWeekArray(raw?.weekly_plan),
    daily_micro_tasks: normalizedDaily,
    exam_drills: asArray(raw?.exam_drills, []),
    feedback_loops: asArray(raw?.feedback_loops, []),
    resources: asArray(raw?.resources, []),
    reflection_prompts: asArray(raw?.reflection_prompts, []),
  };
}
