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

export async function evaluateEssayPublic(params: EvaluateParams): Promise<EvaluateResult> {
  if (!X_API_KEY) {
    console.error('[markingClient] Missing marking API key; set X_API_KEY or VITE_ENGLISHGPT_GENERAL_API_KEY.', {
      has_X_API_KEY: !!import.meta.env.X_API_KEY,
      has_VITE_ENGLISHGPT_GENERAL_API_KEY: !!import.meta.env.VITE_ENGLISHGPT_GENERAL_API_KEY,
      has_VITE_ENGLISHGPT_API_KEY: !!import.meta.env.VITE_ENGLISHGPT_API_KEY,
    });
    throw new Error('Missing marking API key');
  }

  const url = `${API_URL.replace(/\/$/, '')}/api/public/evaluate`;

  const payload = {
    question_type: params.questionType,
    student_response: params.essay,
    marking_scheme: params.markingScheme ?? null,
    command_word: params.commandWord ?? null,
    text_type: params.textType ?? null,
    insert_document: params.insertDocument ?? null,
    user_id: params.userId ?? 'public-api',
  };

  console.debug('[markingClient] Calling evaluate API', { url, payloadPreview: { ...payload, student_response: `${params.essay.slice(0, 120)}${params.essay.length > 120 ? '...[truncated]' : ''}` } });
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
