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
  feedback?: string;
  grade?: string;
  improvement_suggestions?: string[];
  strengths?: string[];
  next_steps?: string[];
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
const API_KEY = import.meta.env.VITE_ENGLISHGPT_API_KEY;
const X_API_KEY = import.meta.env.X_API_KEY;

export async function evaluateEssayPublic(params: EvaluateParams): Promise<EvaluateResult> {
  if (!API_KEY) {
    console.error('[markingClient] Missing VITE_ENGLISHGPT_API_KEY; cannot call marking API.');
    throw new Error('Missing marking API key');
  }
  if (!X_API_KEY) {
    console.error('[markingClient] Missing X_API_KEY; cannot call marking API.');
    throw new Error('Missing marking API x-api-key');
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

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
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
