export type QuestionType = {
  id: string;
  name: string;
  category: string;
  requiresMarkingScheme: boolean;
  description: string;
};

export type QuestionTotal = {
  total: number;
  components: Record<string, number>;
};

// High-level guidance blobs you can pass to the marking service as context.
export const MARKING_GUIDES: Record<string, string> = {
  igcse_descriptive: `
Core Principle for Descriptive Marking: Marking is about identifying and rewarding strengths in a candidate's work. While weaknesses exist, the primary focus is on how well the work meets the established criteria, guiding the placement within the mark scheme by identifying what the candidate does achieve.
Descriptive essays are assessed on the candidate's ability to create an imaginative and effective piece of writing, judged on two distinct skills: Content and Structure (16 Marks) and Style and Accuracy (24 Marks).
A. Content and Structure (16 Marks): The "What" and "How It's Built"
This component focuses on the strength of the ideas, the development of the description, the creation of atmosphere, and the overall organization.
16-13 Marks (High Level: Compelling, Sophisticated, Excellent)
How Marks are Gained:
`.trim(),
};

// Question Types Configuration
export const QUESTION_TYPES: QuestionType[] = [
  {
    id: 'igcse_summary',
    name: 'Summary',
    category: 'IGCSE',
    requiresMarkingScheme: true,
    description: 'Summarize the key points from a given text',
  },
  {
    id: 'igcse_narrative',
    name: 'Narrative',
    category: 'IGCSE',
    requiresMarkingScheme: false,
    description: 'Create an engaging narrative story',
  },
  {
    id: 'igcse_descriptive',
    name: 'Descriptive',
    category: 'IGCSE',
    requiresMarkingScheme: false,
    description: 'Write a vivid descriptive piece',
  },
  {
    id: 'igcse_writers_effect',
    name: "Writer's Effect",
    category: 'IGCSE',
    requiresMarkingScheme: false,
    description: "Analyze the writer's use of language and its effects",
  },
  {
    id: 'igcse_directed',
    name: 'Directed Writing',
    category: 'IGCSE',
    requiresMarkingScheme: true,
    description: 'Transform text into specific formats for different audiences',
  },
  {
    id: 'igcse_extended_q3',
    name: 'Extended Writing Q3',
    category: 'IGCSE',
    requiresMarkingScheme: true,
    description: 'Extended writing task with specific text type requirements',
  },
  {
    id: 'alevel_comparative',
    name: 'Comparative Analysis 1(b) (P1)',
    category: 'A-Level English (9093)',
    requiresMarkingScheme: true,
    description: 'Compare and analyze different texts',
  },
  {
    id: 'alevel_directed',
    name: 'Directed Writing 1(a) (P2)',
    category: 'A-Level English (9093)',
    requiresMarkingScheme: true,
    description: 'Transform text into a specific format for audience',
  },
  {
    id: 'alevel_text_analysis',
    name: 'Text Analysis Q2 (P1)',
    category: 'A-Level English (9093)',
    requiresMarkingScheme: true,
    description: 'Analyze form, structure, and language in texts',
  },
  {
    id: 'alevel_reflective_commentary',
    name: 'Reflective Commentary P2, Q1(b)',
    category: 'A-Level English (9093)',
    requiresMarkingScheme: true,
    description: 'Reflective commentary on writing process and choices',
  },
  {
    id: 'alevel_language_change',
    name: 'Language Change Analysis (P3, Section A)',
    category: 'A-Level English (9093)',
    requiresMarkingScheme: true,
    description: 'Analyze historical prose extract demonstrating English language change using quantitative data',
  },
  {
    id: 'gp_essay',
    name: 'Essay (Paper 1)',
    category: 'English General Paper (8021)',
    requiresMarkingScheme: true,
    description: 'Write a well-structured essay on a given topic with clear argumentation and evidence',
  },
  {
    id: 'gp_comprehension',
    name: 'Comprehension (Paper 2)',
    category: 'English General Paper (8021)',
    requiresMarkingScheme: true,
    description: 'Answer comprehension questions based on given texts with analysis and evaluation',
  },
];

// Question totals configuration for dynamic grade computation
export const QUESTION_TOTALS: Record<string, QuestionTotal> = {
  igcse_writers_effect: { total: 15, components: { reading: 15 } },
  igcse_narrative: { total: 40, components: { content_structure: 16, style_accuracy: 24 } },
  igcse_descriptive: { total: 40, components: { content_structure: 16, style_accuracy: 24 } },
  igcse_summary: { total: 40, components: { reading: 15, writing: 25 } },
  igcse_directed: { total: 40, components: { reading: 15, writing: 25 } },
  igcse_extended_q3: { total: 25, components: { reading: 15, writing: 10 } },
  alevel_comparative: { total: 25, components: { analysis: 25 } },
  alevel_directed: { total: 50, components: { reading: 25, writing: 25 } },
  alevel_text_analysis: { total: 25, components: { analysis: 25 } },
  alevel_reflective_commentary: { total: 25, components: { reflection: 25 } },
  alevel_language_change: { total: 25, components: { analysis: 25 } },
  gp_essay: { total: 50, components: { argument: 25, writing: 25 } },
  gp_comprehension: { total: 50, components: { reading: 25, evaluation: 25 } },
};

export const getQuestionType = (id: string): QuestionType | undefined =>
  QUESTION_TYPES.find(q => q.id === id);

export const getQuestionTotals = (id: string): QuestionTotal | undefined =>
  QUESTION_TOTALS[id];

export const getMarkingGuide = (id: string): string | undefined => MARKING_GUIDES[id];
