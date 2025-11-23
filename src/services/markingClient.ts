type EvaluateParams = {
  questionType: string;
  essay: string;
  markingScheme?: string | null;
  commandWord?: string | null;
  textType?: string | null;
  insertDocument?: string | null;
  userId?: string | null;
};

export type EvaluateResult = {
  id: string;
  user_id: string;
  question_type: string;
  student_response: string;
  timestamp: string;
  full_chat: string | null;
  text_type?: string | null;
  marking_scheme?: string | null;
  total_score?: number | null;
  max_score?: number | null;
  feedback: string;
  grade: string;
  improvement_suggestions: string[];
  strengths: string[];
  next_steps: string[];
  content_structure_marks?: number | string | null;
  style_accuracy_marks?: number | string | null;
  reading_marks?: number | string | null;
  writing_marks?: number | string | null;
  ao1_marks?: number | string | null;
  ao2_marks?: number | string | null;
  ao3_marks?: number | string | null;
  short_id?: string;
};

const API_URL = import.meta.env.VITE_ENGLISHGPT_API_URL || 'https://englishgpt.everythingenglish.xyz';
const X_API_KEY =
  import.meta.env.VITE_INTERNAL_API_KEY ||
  import.meta.env.VITE_ENGLISHGPT_API_KEY;

const KEY_SOURCE = import.meta.env.VITE_INTERNAL_API_KEY
  ? 'VITE_INTERNAL_API_KEY'
  : import.meta.env.VITE_ENGLISHGPT_API_KEY
    ? 'VITE_ENGLISHGPT_API_KEY'
    : null;

const QUESTION_TYPE_MAP: Record<string, string> = {
  'Paper 2 Q2 - Narrative': 'igcse_narrative',
  'Paper 2 Q2 - Descriptive': 'igcse_descriptive',
  'Paper 2 Q1 - Directed Writing': 'igcse_directed',
  'Paper 1 Q1f - Summary': 'igcse_summary',
  "Paper 1 Q2d - Writer's Effect": 'igcse_writers_effect',
  'Paper 1 Q3 - Extended Response': 'igcse_extended_q3',
  'Paper 1 Q2(a-c) - Comprehension and Vocabulary': 'igcse_extended_q3',
  'Paper 1 Q1 (a-e) - Simple Comprehension': 'igcse_extended_q3',
};

const QUESTION_TYPE_MAP_LOWER = Object.fromEntries(
  Object.entries(QUESTION_TYPE_MAP).map(([label, backendKey]) => [label.toLowerCase(), backendKey])
);

// Backend slugs that are already valid and can be passed through.
const VALID_BACKEND_QUESTION_TYPES = new Set<string>([
  ...Object.values(QUESTION_TYPE_MAP),
  'igcse_directed_speech',
  'igcse_directed_letter',
  'igcse_directed_article',
  'alevel_directed_leaflet',
  'alevel_directed_speech',
  'alevel_directed_report',
  'alevel_directed_article',
  'alevel_directed_letter',
  'alevel_directed_blog',
  'alevel_directed_review',
  'alevel_directed_diary',
  'alevel_directed_story',
  'alevel_directed',
  'alevel_comparative',
  'alevel_text_analysis',
  'alevel_language_change',
  'alevel_reflective_commentary',
  'igcse_extended_q3_speech',
  'igcse_extended_q3_journal',
  'igcse_extended_q3_interview',
  'igcse_extended_q3_article',
  'igcse_extended_q3_report',
  'gp_essay',
  'gp_comprehension',
]);

function resolveBackendQuestionType(questionType: string): string {
  const trimmed = questionType?.trim();
  if (!trimmed) {
    throw new Error('Question type is required for marking.');
  }

  const mapped = QUESTION_TYPE_MAP[trimmed] ?? QUESTION_TYPE_MAP_LOWER[trimmed.toLowerCase()];
  if (mapped) {
    return mapped;
  }

  if (VALID_BACKEND_QUESTION_TYPES.has(trimmed)) {
    return trimmed;
  }

  throw new Error(
    `Unsupported question type "${questionType}". Use one of: ${Object.keys(QUESTION_TYPE_MAP).join(', ')}.`
  );
}

export async function evaluateEssayPublic(params: EvaluateParams): Promise<EvaluateResult> {
  if (!X_API_KEY) {
    console.error('[markingClient] Missing marking API key; set X_API_KEY or VITE_ENGLISHGPT_GENERAL_API_KEY.', {
      has_X_API_KEY: !!import.meta.env.X_API_KEY,
      has_VITE_ENGLISHGPT_GENERAL_API_KEY: !!import.meta.env.VITE_ENGLISHGPT_GENERAL_API_KEY,
      has_VITE_ENGLISHGPT_API_KEY: !!import.meta.env.VITE_ENGLISHGPT_API_KEY,
    });
    throw new Error('Missing marking API key');
  }

  const backendQuestionType = resolveBackendQuestionType(params.questionType);
  const url = `${API_URL.replace(/\/$/, '')}/api/public/evaluate`;

  const payload = {
    question_type: backendQuestionType,
    student_response: params.essay,
    marking_scheme: params.markingScheme ?? null,
    command_word: params.commandWord ?? null,
    text_type: params.textType ?? null,
    insert_document: params.insertDocument ?? null,
    user_id: params.userId ?? 'public-api',
  };

  console.debug('[markingClient] Calling evaluate API', {
    url,
    payloadPreview: {
      ...payload,
      student_response: `${params.essay.slice(0, 120)}${params.essay.length > 120 ? '...[truncated]' : ''}`,
    },
    resolvedQuestionType: backendQuestionType,
  });
  console.debug('[markingClient] Using API key source', { source: KEY_SOURCE, keyLength: X_API_KEY.length });

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': X_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[markingClient] Evaluate API failed', resp.status, text);
    throw new Error(`Marking API error ${resp.status}: ${text || resp.statusText}`);
  }

  const json = (await resp.json()) as EvaluateResult;
  console.debug('[markingClient] Evaluate API success', json);
  return json;
}
