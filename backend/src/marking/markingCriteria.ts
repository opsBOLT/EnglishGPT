export type CriterionBand = {
  band: string;
  description: string;
  maxScore: number;
};

export type MarkingCriterion = {
  id: string;
  title: string;
  weight: number;
  bands: CriterionBand[];
};

export type QuestionMarkingProfile = {
  questionType: string;
  totalScore: number;
  criteria: MarkingCriterion[];
};

export const markingProfiles: QuestionMarkingProfile[] = [
  {
    questionType: 'Paper 1 Q1f - Summary',
    totalScore: 20,
    criteria: [
      {
        id: 'relevance',
        title: 'Relevance to Prompt',
        weight: 0.35,
        bands: [
          { band: 'A', description: 'Fully addresses all prompt points with clear focus.', maxScore: 7 },
          { band: 'B', description: 'Addresses most points; minor gaps in focus.', maxScore: 5 },
          { band: 'C', description: 'Partially relevant; several gaps or drift.', maxScore: 3 },
          { band: 'D', description: 'Largely off-topic or misses the task.', maxScore: 1 },
        ],
      },
      {
        id: 'analysis',
        title: 'Analysis & Explanation',
        weight: 0.35,
        bands: [
          { band: 'A', description: 'Insightful explanation with clear reasoning.', maxScore: 7 },
          { band: 'B', description: 'Solid explanation; some reasoning gaps.', maxScore: 5 },
          { band: 'C', description: 'Mostly descriptive; limited reasoning.', maxScore: 3 },
          { band: 'D', description: 'Minimal or incorrect explanation.', maxScore: 1 },
        ],
      },
      {
        id: 'language',
        title: 'Language Control',
        weight: 0.3,
        bands: [
          { band: 'A', description: 'Accurate grammar and varied vocabulary.', maxScore: 6 },
          { band: 'B', description: 'Generally accurate; minor slips.', maxScore: 4 },
          { band: 'C', description: 'Frequent errors; meaning sometimes unclear.', maxScore: 2 },
          { band: 'D', description: 'Persistent errors; meaning often unclear.', maxScore: 1 },
        ],
      },
    ],
  },
  {
    questionType: 'Paper 2 Q1 - Directed Writing',
    totalScore: 30,
    criteria: [
      {
        id: 'structure',
        title: 'Organisation & Structure',
        weight: 0.3,
        bands: [
          { band: 'A', description: 'Clear, logical structure; smooth progression.', maxScore: 9 },
          { band: 'B', description: 'Mostly logical; occasional jumps.', maxScore: 7 },
          { band: 'C', description: 'Loose organisation; some coherence issues.', maxScore: 4 },
          { band: 'D', description: 'Disorganised; difficult to follow.', maxScore: 2 },
        ],
      },
      {
        id: 'purpose',
        title: 'Purpose & Audience',
        weight: 0.35,
        bands: [
          { band: 'A', description: 'Tone/register suit audience and task consistently.', maxScore: 10 },
          { band: 'B', description: 'Generally appropriate tone; minor lapses.', maxScore: 8 },
          { band: 'C', description: 'Inconsistent tone; audience not always considered.', maxScore: 5 },
          { band: 'D', description: 'Tone unsuitable; purpose unclear.', maxScore: 3 },
        ],
      },
      {
        id: 'language',
        title: 'Language Control',
        weight: 0.35,
        bands: [
          { band: 'A', description: 'Accurate, varied syntax and vocabulary.', maxScore: 11 },
          { band: 'B', description: 'Generally accurate; some repetition or slips.', maxScore: 9 },
          { band: 'C', description: 'Frequent errors; limited variety.', maxScore: 6 },
          { band: 'D', description: 'Persistent errors; unclear meaning.', maxScore: 3 },
        ],
      },
    ],
  },
];

export const getMarkingProfile = (questionType: string): QuestionMarkingProfile | undefined =>
  markingProfiles.find(profile => profile.questionType === questionType);
