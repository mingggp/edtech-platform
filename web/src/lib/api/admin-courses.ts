/** Admin Course/Chapter/Lesson CRUD
 *
 * Backend endpoints (routers/courses.py):
 *   POST   /admin/courses
 *   PATCH  /admin/courses/{id}
 *   DELETE /admin/courses/{id}
 *   POST   /admin/courses/{id}/chapters
 *   PATCH  /admin/chapters/{id}
 *   DELETE /admin/chapters/{id}
 *   POST   /admin/chapters/{id}/lessons
 *   PATCH  /admin/lessons/{id}
 *   DELETE /admin/lessons/{id}
 *   POST   /upload/image       multipart -> { url }
 */
import { api } from "./client";
import type { Course, Chapter, Lesson } from "@/lib/types";

// ---------- Course ---------- //
export interface CourseInput {
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail?: string | null;
  target_audience?: string | null;
  highlights?: string | null;
  is_active?: boolean;
}

export async function createCourse(payload: CourseInput): Promise<Course> {
  const { data } = await api.post<Course>("/admin/courses", payload);
  return data;
}

export async function updateCourse(id: number, payload: Partial<CourseInput>): Promise<Course> {
  const { data } = await api.patch<Course>(`/admin/courses/${id}`, payload);
  return data;
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/admin/courses/${id}`);
}

// ---------- Chapter ---------- //
export interface ChapterInput {
  title: string;
  order?: number;
}

export async function addChapter(courseId: number, payload: ChapterInput): Promise<Chapter> {
  const { data } = await api.post<Chapter>(`/admin/courses/${courseId}/chapters`, payload);
  return data;
}

export async function updateChapter(id: number, payload: Partial<ChapterInput>): Promise<Chapter> {
  const { data } = await api.patch<Chapter>(`/admin/chapters/${id}`, payload);
  return data;
}

export async function deleteChapter(id: number): Promise<void> {
  await api.delete(`/admin/chapters/${id}`);
}

// ---------- Lesson ---------- //
export interface LessonInput {
  title: string;
  youtube_id: string;
  duration: number;
  order?: number;
  doc_url?: string | null;
}

export async function addLesson(chapterId: number, payload: LessonInput): Promise<Lesson> {
  const { data } = await api.post<Lesson>(`/admin/chapters/${chapterId}/lessons`, payload);
  return data;
}

export async function updateLesson(id: number, payload: Partial<LessonInput>): Promise<Lesson> {
  const { data } = await api.patch<Lesson>(`/admin/lessons/${id}`, payload);
  return data;
}

export async function deleteLesson(id: number): Promise<void> {
  await api.delete(`/admin/lessons/${id}`);
}

// ---------- Image upload ---------- //
export async function uploadImage(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<{ url: string }>("/upload/image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
