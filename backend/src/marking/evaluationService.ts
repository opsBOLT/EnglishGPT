import {
  getMarkingGuide,
  getQuestionTotals,
  getQuestionType,
  QuestionTotal,
} from './markingCriteria';
import { callEvaluateEndpoint, EvaluateResponse } from './markingApiClient';

export type MarkScore = {
  criterionId: string;
  criterionTitle: string;
  band?: string;
  score: number;
  maxScore: number;
  weight: number;
  reasoning: string;
};

export type EvaluationResult = {
  questionType: string;
  total: number;
  totalMax: number;
  weightedScore: number;
  scores: MarkScore[];
  summary: string;
};

const mapMarksToComponents = (
  totals: QuestionTotal,
  apiResp: EvaluateResponse,
): MarkScore[] => {
  const componentEntries = Object.entries(totals.components);
  console.debug('[evaluationService] mapping components', {
    totals,
    apiRespKeys: Object.keys(apiResp || {}),
  });

  return componentEntries.map(([component, maxScore]) => {
    const fieldName = `${component}_marks` as keyof EvaluateResponse;
    const value = apiResp[fieldName];
    console.debug('[evaluationService] component score', {
      component,
      fieldName,
      value,
      maxScore,
      weight: maxScore / totals.total,
    });

    return {
      criterionId: component,
      criterionTitle: component.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      score: typeof value === 'number' ? value : 0,
      maxScore,
      weight: maxScore / totals.total,
      reasoning: apiResp.feedback || 'No feedback provided.',
    };
  });
};

export const evaluateEssay = async (params: {
  questionType: string;
  essay: string;
}): Promise<EvaluationResult> => {
  console.debug('[evaluationService] evaluateEssay start', {
    questionType: params.questionType,
    essayPreview: params.essay.slice(0, 200) + (params.essay.length > 200 ? '...[truncated]' : ''),
  });

  const question = getQuestionType(params.questionType);
  const totals = getQuestionTotals(params.questionType);
  const guide = getMarkingGuide(params.questionType);

  console.debug('[evaluationService] lookup config', {
    hasQuestion: !!question,
    hasTotals: !!totals,
    hasGuide: !!guide,
    totals,
  });

  if (!question || !totals) {
    throw new Error(`No marking config found for question type: ${params.questionType}`);
  }

  const apiResponse = await callEvaluateEndpoint({
    question_type: params.questionType,
    student_response: params.essay,
    marking_scheme: question.requiresMarkingScheme ? guide ?? undefined : undefined,
    command_word: null,
    text_type: null,
    insert_document: null,
    user_id: 'public-api',
  });

  console.debug('[evaluationService] apiResponse received', {
    feedbackPreview: apiResponse.feedback?.slice(0, 200),
    grade: apiResponse.grade,
    keys: Object.keys(apiResponse || {}),
  });

  const scores = mapMarksToComponents(totals, apiResponse);

  const totalMax = totals.total;
  const total = scores.reduce((sum, s) => sum + s.score, 0);
  const weightedScore = scores.reduce((sum, s) => sum + s.score * s.weight, 0);

  console.debug('[evaluationService] computed totals', { total, totalMax, weightedScore });

  return {
    questionType: params.questionType,
    total,
    totalMax,
    weightedScore,
    scores,
    summary: apiResponse.feedback || 'Evaluation completed.',
  };
};
