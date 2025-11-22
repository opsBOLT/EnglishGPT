/**
 * Study Content Configuration
 * Defines all study categories, their content, and metadata
 */

export type StudyCategory =
  | 'Paper 1 Guide/Revision'
  | 'Paper 2 Guide/Revision'
  | 'High-Level Example Responses'
  | 'Text Types Criteria'
  | 'Vocabulary Improvement';

export interface ContentSection {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'pdf' | 'interactive';
  url?: string;
  description: string;
}

export interface StudyCategoryConfig {
  id: StudyCategory;
  title: string;
  description: string;
  estimatedTime: string;
  icon: string;
  color: string;
  sections: ContentSection[];
  quizQuestions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'short-answer' | 'text';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

export const STUDY_CATEGORIES: StudyCategoryConfig[] = [
  {
    id: 'Paper 1 Guide/Revision',
    title: 'Paper 1 Guide/Revision',
    description: 'Reading comprehension, summary writing, and writer\'s effect analysis',
    estimatedTime: '45-60 mins',
    icon: '📖',
    color: 'bg-blue-500',
    sections: [
      {
        id: 'p1-intro',
        title: 'Paper 1 Overview',
        duration: '10 mins',
        type: 'video',
        url: '/content/paper1-overview.mp4',
        description: 'Introduction to Paper 1 structure and question types',
      },
      {
        id: 'p1-q1-comprehension',
        title: 'Question 1: Comprehension (a-e)',
        duration: '15 mins',
        type: 'video',
        url: '/content/paper1-q1.mp4',
        description: 'How to answer simple comprehension questions effectively',
      },
      {
        id: 'p1-q1f-summary',
        title: 'Question 1f: Summary Writing',
        duration: '20 mins',
        type: 'pdf',
        url: '/content/paper1-q1f-guide.pdf',
        description: 'Techniques for writing concise summaries',
      },
      {
        id: 'p1-q2-writers-effect',
        title: 'Question 2d: Writer\'s Effect',
        duration: '20 mins',
        type: 'video',
        url: '/content/paper1-q2d.mp4',
        description: 'Analyzing language techniques and their effects',
      },
      {
        id: 'p1-q3-extended',
        title: 'Question 3: Extended Response',
        duration: '15 mins',
        type: 'pdf',
        url: '/content/paper1-q3-guide.pdf',
        description: 'Structuring longer analytical responses',
      },
    ],
    quizQuestions: [
      {
        id: 'p1-q1',
        question: 'What is the most important thing to do when answering comprehension questions?',
        type: 'multiple-choice',
        options: [
          'Use your own words',
          'Quote directly from the text',
          'Use evidence from the text but rephrase',
          'Write as much as possible',
        ],
        correctAnswer: 'Use evidence from the text but rephrase',
        explanation: 'You should use evidence from the text but put it in your own words to show understanding.',
        points: 1,
      },
      {
        id: 'p1-q2',
        question: 'When analyzing writer\'s effect, what should you explain?',
        type: 'multiple-choice',
        options: [
          'Just identify the technique used',
          'Explain what the quote means',
          'Explain the effect the technique has on the reader',
          'Summarize the whole paragraph',
        ],
        correctAnswer: 'Explain the effect the technique has on the reader',
        explanation: 'Writer\'s effect questions require you to analyze HOW the language creates an effect, not just WHAT it means.',
        points: 1,
      },
      {
        id: 'p1-q3',
        question: 'In a summary, approximately how many words should you write?',
        type: 'short-answer',
        correctAnswer: ['120', '120-150', '120 to 150'],
        explanation: 'Summaries should be concise, typically around 120-150 words.',
        points: 1,
      },
    ],
  },
  {
    id: 'Paper 2 Guide/Revision',
    title: 'Paper 2 Guide/Revision',
    description: 'Directed writing, narrative, and descriptive writing techniques',
    estimatedTime: '45-60 mins',
    icon: '✍️',
    color: 'bg-purple-500',
    sections: [
      {
        id: 'p2-intro',
        title: 'Paper 2 Overview',
        duration: '10 mins',
        type: 'video',
        url: '/content/paper2-overview.mp4',
        description: 'Introduction to Paper 2 writing tasks',
      },
      {
        id: 'p2-q1-directed',
        title: 'Question 1: Directed Writing',
        duration: '25 mins',
        type: 'video',
        url: '/content/paper2-q1.mp4',
        description: 'Writing letters, reports, articles, and speeches',
      },
      {
        id: 'p2-q2-narrative',
        title: 'Question 2: Narrative Writing',
        duration: '20 mins',
        type: 'pdf',
        url: '/content/paper2-narrative.pdf',
        description: 'Crafting engaging stories with plot, character, and setting',
      },
      {
        id: 'p2-q2-descriptive',
        title: 'Question 2: Descriptive Writing',
        duration: '20 mins',
        type: 'pdf',
        url: '/content/paper2-descriptive.pdf',
        description: 'Using sensory details and figurative language',
      },
    ],
    quizQuestions: [
      {
        id: 'p2-q1',
        question: 'What are the three main criteria for directed writing?',
        type: 'text',
        correctAnswer: 'Content, structure, and style/audience awareness',
        explanation: 'Directed writing is marked on content (what you include), structure (how you organize), and style (appropriate for audience/purpose).',
        points: 2,
      },
      {
        id: 'p2-q2',
        question: 'Which text type requires a formal tone and clear structure?',
        type: 'multiple-choice',
        options: ['Personal letter', 'Report', 'Blog post', 'Informal email'],
        correctAnswer: 'Report',
        explanation: 'Reports require formal language, clear headings, and professional structure.',
        points: 1,
      },
    ],
  },
  {
    id: 'High-Level Example Responses',
    title: 'High-Level Example Responses',
    description: 'AI-guided analysis of top-band student responses',
    estimatedTime: '30-45 mins',
    icon: '⭐',
    color: 'bg-yellow-500',
    sections: [
      {
        id: 'hler-paper1',
        title: 'Paper 1 Exemplar Analysis',
        duration: '20 mins',
        type: 'interactive',
        description: 'Analyze a Band 1 response for Paper 1 Q2d with AI guidance',
      },
      {
        id: 'hler-paper2',
        title: 'Paper 2 Exemplar Analysis',
        duration: '20 mins',
        type: 'interactive',
        description: 'Break down a top-scoring narrative with AI prompts',
      },
    ],
  },
  {
    id: 'Text Types Criteria',
    title: 'Text Types Criteria',
    description: 'Understanding mark schemes for different text types',
    estimatedTime: '30-40 mins',
    icon: '📋',
    color: 'bg-green-500',
    sections: [
      {
        id: 'tt-letters',
        title: 'Letters (Formal & Informal)',
        duration: '10 mins',
        type: 'pdf',
        url: '/content/text-types-letters.pdf',
        description: 'Format, tone, and structure for different letter types',
      },
      {
        id: 'tt-articles',
        title: 'Articles & Reviews',
        duration: '10 mins',
        type: 'pdf',
        url: '/content/text-types-articles.pdf',
        description: 'Engaging headlines, paragraphing, and opinion writing',
      },
      {
        id: 'tt-reports',
        title: 'Reports & Speeches',
        duration: '10 mins',
        type: 'pdf',
        url: '/content/text-types-reports.pdf',
        description: 'Clear structure, formal language, and persuasive techniques',
      },
    ],
  },
  {
    id: 'Vocabulary Improvement',
    title: 'Vocabulary Improvement',
    description: 'Quiz-based learning for advanced vocabulary',
    estimatedTime: '20-30 mins',
    icon: '📚',
    color: 'bg-red-500',
    sections: [
      {
        id: 'vocab-quiz-1',
        title: 'Advanced Adjectives Quiz',
        duration: '10 mins',
        type: 'interactive',
        description: 'Test your knowledge of descriptive vocabulary',
      },
      {
        id: 'vocab-quiz-2',
        title: 'Transition Words & Phrases',
        duration: '10 mins',
        type: 'interactive',
        description: 'Master connectives for better essay flow',
      },
      {
        id: 'vocab-quiz-3',
        title: 'Synonyms for Common Words',
        duration: '10 mins',
        type: 'interactive',
        description: 'Replace basic words with sophisticated alternatives',
      },
    ],
    quizQuestions: [
      {
        id: 'vocab-q1',
        question: 'What is a more sophisticated synonym for "very big"?',
        type: 'multiple-choice',
        options: ['Really big', 'Enormous', 'Big-sized', 'Super big'],
        correctAnswer: 'Enormous',
        explanation: 'Words like enormous, colossal, immense, or vast are more sophisticated than "very big".',
        points: 1,
      },
      {
        id: 'vocab-q2',
        question: 'Which transition word shows contrast?',
        type: 'multiple-choice',
        options: ['Furthermore', 'However', 'Additionally', 'Moreover'],
        correctAnswer: 'However',
        explanation: '"However" introduces a contrasting idea, while the others show addition.',
        points: 1,
      },
    ],
  },
];

// Helper function to get category by ID
export function getCategoryById(id: StudyCategory): StudyCategoryConfig | undefined {
  return STUDY_CATEGORIES.find(cat => cat.id === id);
}

// Helper function to calculate total progress for a category
export function calculateCategoryProgress(
  categoryId: StudyCategory,
  completedSections: string[]
): number {
  const category = getCategoryById(categoryId);
  if (!category) return 0;

  const totalSections = category.sections.length;
  const completed = completedSections.filter(sId =>
    category.sections.some(s => s.id === sId)
  ).length;

  return Math.round((completed / totalSections) * 100);
}
