/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Practice Guides - Paper 2 Questions Database
 * All IGCSE Paper 2 questions organized by type for AI-powered practice
 */

import paperTwoData from './paperTwoPractice.json';

export type PracticeGuideType = 'directed_writing' | 'descriptive_writing' | 'narrative_writing';

export type PracticeGuide = {
  key: PracticeGuideType;
  title: string;
  label: string;
  description: string;
  content: string; // Full formatted content with ALL questions
  questionCount: number;
};

// Helper to format a single question
function formatQuestion(q: any, examInfo: any): string {
  const header = `
### Question from ${examInfo.series} (${examInfo.code})
**Question ${q.question_number}**: ${q.text}
**Word Count**: ${q.word_limit_guidance}
**Marks**: ${q.marks} (${Object.values(q.marks_breakdown).join(' + ')})
`;

  let details = '';
  if (q.context) details += `\n**Context**: ${q.context}\n`;
  if (q.format) details += `**Format**: ${q.format}\n`;
  if (q.title) details += `**Title**: "${q.title}"\n`;
  if (q.required_phrase || q.key_phrase) {
    details += `**Required Phrase**: "${q.required_phrase || q.key_phrase}"\n`;
  }

  if (q.instructions && q.instructions.length > 0) {
    details += `\n**Instructions**:\n${q.instructions.map((inst: string, i: number) => `${i + 1}. ${inst}`).join('\n')}\n`;
  }

  if (q.bullet_points && q.bullet_points.length > 0) {
    details += `\n**Bullet Points to Address**:\n${q.bullet_points.map((bp: string, i: number) => `${i + 1}. ${bp}`).join('\n')}\n`;
  }

  return `${header}${details}\n---\n`;
}

// Build complete content for each question type
function buildDirectedWritingContent(): string {
  const sessions = (paperTwoData as any).exam_sessions;
  const directedQuestions: any[] = [];

  sessions.forEach((session: any) => {
    session.questions
      .filter((q: any) => q.question_type === 'directed_writing' || q.question_type === 'directed_writing_speech')
      .forEach((q: any) => {
        directedQuestions.push({ question: q, exam_info: session.exam_info });
      });
  });

  let content = `# Directed Writing - Paper 2 Section A

## Overview

Directed Writing is the **compulsory** Section A question in IGCSE Paper 2. You **must** answer this question.

### Key Requirements:
- **Read TWO texts** (Text A and Text B from the insert)
- **Evaluate and synthesize** ideas from both texts
- **Write in a specific format** (letter, article, speech, etc.)
- **Address ALL bullet points** given in the question
- **Use your own words** - do not copy from the texts
- **Word count**: 250-350 words
- **Marks**: 15 for content + 25 for quality of writing = **40 marks total**

### Mark Scheme Breakdown

**Content (15 marks):**
- Evaluation of ideas from both texts
- Own views and opinions developed from the texts
- Addressing all bullet points thoroughly
- Synthesizing information effectively

**Quality of Writing (25 marks):**
- Appropriate style and register for the format
- Ambitious vocabulary and varied sentence structures
- Grammar, spelling, and punctuation accuracy
- Clear organization and paragraphing

### Common Formats:
1. **Letter** (formal/informal)
2. **Article** (for magazine/newspaper/website)
3. **Speech** (to deliver to an audience)

---

## All Directed Writing Questions (${directedQuestions.length} questions)

${directedQuestions.map(({ question, exam_info }) => formatQuestion(question, exam_info)).join('\n')}
`;

  return content;
}

function buildDescriptiveWritingContent(): string {
  const sessions = (paperTwoData as any).exam_sessions;
  const descriptiveQuestions: any[] = [];

  sessions.forEach((session: any) => {
    session.questions
      .filter((q: any) => q.question_type === 'descriptive_writing')
      .forEach((q: any) => {
        descriptiveQuestions.push({ question: q, exam_info: session.exam_info });
      });
  });

  let content = `# Descriptive Writing - Paper 2 Section B

## Overview

Descriptive Writing is ONE of the four composition options in Section B. You choose **ONE question** from Questions 2-5.

### Key Requirements:
- **Create vivid sensory descriptions** - engage all 5 senses
- **Show, don't tell** - use imagery and figurative language
- **Maintain consistent atmosphere/mood** throughout
- **Use ambitious vocabulary** and varied sentence structures
- **Word count**: 350-450 words
- **Marks**: 16 for content/structure + 24 for style/accuracy = **40 marks total**

### Mark Scheme Breakdown

**Content and Structure (16 marks):**
- Original and creative descriptions
- Effective use of detail and sensory imagery
- Sustained development and focus
- Clear structure and organization

**Style and Accuracy (24 marks):**
- Ambitious vocabulary choices
- Varied and effective sentence structures
- Figurative language (metaphors, similes, personification)
- Grammar, spelling, and punctuation accuracy

### Techniques to Master:
1. **Sensory details** - sight, sound, smell, taste, touch
2. **Figurative language** - metaphors, similes, personification
3. **Precise adjectives and adverbs**
4. **Varied sentence lengths** for rhythm and emphasis
5. **Atmospheric vocabulary** to create mood

### Common Question Types:
- Describing a place (special building, public space, etc.)
- Describing people (crowd, individual, waiting people, etc.)
- Describing an object or scene
- Describing contrasts (open/closed, day/night, inside/outside)

---

## All Descriptive Writing Questions (${descriptiveQuestions.length} questions)

${descriptiveQuestions.map(({ question, exam_info }) => formatQuestion(question, exam_info)).join('\n')}
`;

  return content;
}

function buildNarrativeWritingContent(): string {
  const sessions = (paperTwoData as any).exam_sessions;
  const narrativeQuestions: any[] = [];

  sessions.forEach((session: any) => {
    session.questions
      .filter((q: any) => q.question_type === 'narrative_writing')
      .forEach((q: any) => {
        narrativeQuestions.push({ question: q, exam_info: session.exam_info });
      });
  });

  let content = `# Narrative Writing - Paper 2 Section B

## Overview

Narrative Writing is ONE of the four composition options in Section B. You choose **ONE question** from Questions 2-5.

### Key Requirements:
- **Tell a compelling story** with clear plot structure
- **Create engaging characters** with realistic dialogue
- **Build tension and conflict** leading to a resolution
- **Use varied narrative techniques** (dialogue, description, action)
- **Word count**: 350-450 words
- **Marks**: 16 for content/structure + 24 for style/accuracy = **40 marks total**

### Mark Scheme Breakdown

**Content and Structure (16 marks):**
- Engaging and well-developed plot
- Effective characterization
- Use of narrative techniques (dialogue, description, action)
- Clear structure with beginning, middle, end

**Style and Accuracy (24 marks):**
- Ambitious vocabulary appropriate to narrative
- Varied sentence structures for effect
- Successful use of narrative voice
- Grammar, spelling, and punctuation accuracy

### Story Structure:
1. **Opening** - Hook the reader, establish setting/character
2. **Development** - Build tension, introduce conflict
3. **Climax** - Peak of action/emotion
4. **Resolution** - Tie up loose ends, satisfying conclusion

### Techniques to Master:
1. **Dialogue** - Reveal character, advance plot
2. **Show, don't tell** - actions reveal feelings
3. **Varied pace** - slow for description, fast for action
4. **Foreshadowing** - hint at what's to come
5. **Sensory details** - make scenes vivid

### Common Question Types:
- **Titled stories** - Given a specific title to use
- **Required phrase** - Must include specific words
- **Thematic prompt** - Story involving specific element (misunderstanding, transformation, etc.)

---

## All Narrative Writing Questions (${narrativeQuestions.length} questions)

${narrativeQuestions.map(({ question, exam_info }) => formatQuestion(question, exam_info)).join('\n')}
`;

  return content;
}

// Generate guides
const directedQuestions = (paperTwoData as any).exam_sessions
  .flatMap((s: any) => s.questions)
  .filter((q: any) => q.question_type === 'directed_writing' || q.question_type === 'directed_writing_speech');

const descriptiveQuestions = (paperTwoData as any).exam_sessions
  .flatMap((s: any) => s.questions)
  .filter((q: any) => q.question_type === 'descriptive_writing');

const narrativeQuestions = (paperTwoData as any).exam_sessions
  .flatMap((s: any) => s.questions)
  .filter((q: any) => q.question_type === 'narrative_writing');

export const PRACTICE_GUIDES: PracticeGuide[] = [
  {
    key: 'directed_writing',
    title: 'Directed Writing Practice',
    label: 'Section A - Compulsory',
    description: 'Master directed writing with real exam questions from past papers. Practice evaluating texts and writing in different formats.',
    content: buildDirectedWritingContent(),
    questionCount: directedQuestions.length,
  },
  {
    key: 'descriptive_writing',
    title: 'Descriptive Writing Practice',
    label: 'Section B - Composition',
    description: 'Develop your descriptive writing skills with past paper questions. Learn to create vivid imagery and sensory details.',
    content: buildDescriptiveWritingContent(),
    questionCount: descriptiveQuestions.length,
  },
  {
    key: 'narrative_writing',
    title: 'Narrative Writing Practice',
    label: 'Section B - Composition',
    description: 'Improve your storytelling with real narrative questions. Practice plot development, characterization, and dialogue.',
    content: buildNarrativeWritingContent(),
    questionCount: narrativeQuestions.length,
  },
];

// Helper function to get a guide by key
export function getPracticeGuide(key: PracticeGuideType): PracticeGuide | null {
  return PRACTICE_GUIDES.find(g => g.key === key) || null;
}

// Get all available question types
export function getAvailableQuestionTypes(): PracticeGuideType[] {
  return PRACTICE_GUIDES.map(g => g.key);
}
