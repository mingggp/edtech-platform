import { api } from "./client";
import type { Course, Chapter, MyCourse } from "@/lib/types";

export async function listCourses(params?: { search?: string; category?: string }): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/courses", { params });
  return data;
}

export async function getCourse(id: number | string): Promise<Course> {
  const { data } = await api.get<Course>(`/courses/${id}`);
  return data;
}

export async function getCourseChapters(courseId: number | string): Promise<Chapter[]> {
  const { data } = await api.get<Chapter[]>(`/courses/${courseId}/chapters`);
  return data;
}

/** /users/me/courses คืน flat shape (ไม่ใช่ EnrollmentRead) */
export async function getMyEnrollments(): Promise<MyCourse[]> {
  const { data } = await api.get<MyCourse[]>("/users/me/courses");
  return data;
}
