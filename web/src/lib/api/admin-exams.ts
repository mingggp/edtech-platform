/** Admin Exam CRUD
 *
 * Backend endpoints:
 *   POST   /admin/exams                       -> Exam
 *   GET    /admin/exams/{id}                  -> Exam (full + correct flags)
 *   POST   /admin/exams/{id}/questions        -> Question (รวม choices)
 *   DELETE /admin/questions/{id}
 *   GET    /exams                             -> list (public, ใช้ใน admin ได้)
 */
import { api } from "./client";

export interface AdminChoiceInput {
  text: string;
  is_correct: boolean;
}

export interface AdminQuestionInput {
  text: string;
  image_url?: string | null;
  question_type?: string;
  order?: number;
  choices: AdminChoiceInput[];
}

export interface ExamInput {
  title: string;
  description?: string | null;
  time_limit?: number;
}

export interface AdminExam {
  id: number;
  title: string;
  description: string | null;
  time_limit: number;
  questions: AdminQuestion[];
}

export interface AdminQuestion {
  id: number;
  text: string;
  image_url: string | null;
  question_type: string;
  order: number;
  choices: AdminChoice[];
}

export interface AdminChoice {
  id: number;
  text: string;
  is_correct: boolean;
}

export async function createExam(payload: ExamInput): Promise<AdminExam> {
  const { data } = await api.post<AdminExam>("/admin/exams", payload);
  return data;
}

export async function getAdminExam(id: number | string): Promise<AdminExam> {
  const { data } = await api.get<AdminExam>(`/admin/exams/${id}`);
  return data;
}

export async function addQuestion(examId: number, payload: AdminQuestionInput): Promise<AdminQuestion> {
  const { data } = await api.post<AdminQuestion>(`/admin/exams/${examId}/questions`, payload);
  return data;
}

export async function deleteQuestion(qid: number): Promise<void> {
  await api.delete(`/admin/questions/${qid}`);
}
