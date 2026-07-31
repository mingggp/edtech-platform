/** Exam API
 *
 * Backend endpoints (routers/exams.py):
 *   GET  /exams                        -> ExamRead[]
 *   GET  /exams/{id}/take              -> TakeExam (ซ่อน is_correct)
 *   POST /exams/{id}/submit            -> ExamResultRead
 *   GET  /me/exam-results              -> ExamResultRead[]
 *   GET  /me/exam-results/{id}         -> ExamResultDetail (มีเฉลย)
 */
import { api } from "./client";

export interface ExamSummary {
  id: number;
  title: string;
  description: string | null;
  time_limit: number;
  questions?: { id: number }[];
}

export interface TakeQuestion {
  id: number;
  text: string;
  image_url: string | null;
  question_type: string;
  order: number;
  choices: { id: number; text: string }[];
}

export interface TakeExam {
  id: number;
  title: string;
  description: string | null;
  time_limit: number;
  questions: TakeQuestion[];
}

export interface ExamResult {
  id: number;
  user_id: number;
  exam_id: number;
  score: number;
  total_score: number;
  submitted_at: string;
  exam_title: string | null;
  answers_dict: Record<string, number>;
}

export interface ResultQuestionDetail {
  id: number;
  text: string;
  image_url: string | null;
  chosen_choice_id: number | null;
  correct_choice_id: number | null;
  is_correct: boolean;
  choices: { id: number; text: string; is_correct: boolean }[];
}

export interface ResultDetail {
  id: number;
  exam_id: number;
  exam_title: string;
  score: number;
  total_score: number;
  submitted_at: string;
  questions: ResultQuestionDetail[];
}

export async function listExams(): Promise<ExamSummary[]> {
  const { data } = await api.get<ExamSummary[]>("/exams");
  return data;
}

export async function takeExam(id: number | string): Promise<TakeExam> {
  const { data } = await api.get<TakeExam>(`/exams/${id}/take`);
  return data;
}

export async function submitExam(
  id: number | string,
  answers: Record<number, number>
): Promise<ExamResult> {
  // backend expects string keys (JSON)
  const stringAnswers: Record<string, number> = {};
  Object.entries(answers).forEach(([k, v]) => {
    stringAnswers[String(k)] = v;
  });
  const { data } = await api.post<ExamResult>(`/exams/${id}/submit`, {
    answers: stringAnswers,
  });
  return data;
}

export async function listMyResults(): Promise<ExamResult[]> {
  const { data } = await api.get<ExamResult[]>("/me/exam-results");
  return data;
}

export async function getResultDetail(resultId: number | string): Promise<ResultDetail> {
  const { data } = await api.get<ResultDetail>(`/me/exam-results/${resultId}`);
  return data;
}
