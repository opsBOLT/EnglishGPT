type EvaluateRequest = {
  question_type: string;
  student_response: string;
  marking_scheme?: string | null;
  command_word?: string | null;
  text_type?: string | null;
  insert_document?: string | null;
  user_id?: string | null;
};

export type EvaluateResponse = {
  feedback: string;
  grade: string;
  reading_marks?: number | null;
  writing_marks?: number | null;
  ao1_marks?: number | null;
  ao2_marks?: number | null;
  ao3_marks?: number | null;
  content_structure_marks?: number | null;
  style_accuracy_marks?: number | null;
  improvement_suggestions?: string[];
  strengths?: string[];
  next_steps?: string[];
  short_id?: string;
};

const BASE_URL = process.env.PUBLIC_MARKING_API_BASE_URL || 'https://your-host';
const API_URL = process.env.ENGLISHGPT_API_URL || process.env.PUBLIC_MARKING_API_BASE_URL || BASE_URL;
const API_KEY = process.env.ENGLISHGPT_API_KEY || process.env.INTERNAL_API_KEY;

if (!API_KEY) {
  // Fail fast to avoid silent unauthenticated calls
  console.warn('[markingApiClient] INTERNAL_API_KEY is not set; calls will fail.');
}

export async function callEvaluateEndpoint(body: EvaluateRequest): Promise<EvaluateResponse> {
  const url = `${API_URL.replace(/\/$/, '')}/api/public/evaluate`;
  console.debug('[markingApiClient] evaluate: url', url);
  console.debug('[markingApiClient] evaluate: payload', {
    ...body,
    student_response: body.student_response.slice(0, 200) + (body.student_response.length > 200 ? '...[truncated]' : ''),
  });

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    },
    body: JSON.stringify(body),
  });

  console.debug('[markingApiClient] evaluate: status', resp.status);

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('[markingApiClient] evaluate: error body', text);
    throw new Error(`Marking API error ${resp.status}: ${text || resp.statusText}`);
  }

  const json = (await resp.json()) as EvaluateResponse;
  console.debug('[markingApiClient] evaluate: response', json);
  return json;
}
