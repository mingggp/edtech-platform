/** Learning / progress API calls
 *
 * Backend endpoints (routers/learning.py):
 *   GET  /courses/{cid}/my-progress              -> { completed_ids: number[] }
 *   POST /courses/{cid}/lessons/{lid}/toggle-progress  -> { completed: boolean }
 *   POST /courses/{cid}/lessons/{lid}/progress   -> { status }   (update seconds)
 *   GET  /courses/{cid}/lessons/{lid}/progress   -> { seconds }
 *   POST /users/me/study-time                    { minutes }
 *   GET  /leaderboard                            -> LeaderboardItem[]
 */
import { api } from "./client";

export interface ProgressResponse {
  completed_ids: number[];
}

/** ดึง list ของ lesson ที่เรียนจบแล้ว */
export async function getProgress(courseId: number | string): Promise<ProgressResponse> {
  const { data } = await api.get<ProgressResponse>(`/courses/${courseId}/my-progress`);
  return data;
}

export async function toggleLessonComplete(
  courseId: number | string,
  lessonId: number | string
): Promise<{ completed: boolean }> {
  const { data } = await api.post<{ completed: boolean }>(
    `/courses/${courseId}/lessons/${lessonId}/toggle-progress`
  );
  return data;
}

export async function updateLessonTime(
  courseId: number | string,
  lessonId: number | string,
  seconds_watched: number
): Promise<void> {
  await api.post(`/courses/${courseId}/lessons/${lessonId}/progress`, {
    seconds_watched,
  });
}

export async function getLessonTime(
  courseId: number | string,
  lessonId: number | string
): Promise<number> {
  const { data } = await api.get<{ seconds: number }>(
    `/courses/${courseId}/lessons/${lessonId}/progress`
  );
  return data.seconds;
}

export async function logStudyTime(minutes: number): Promise<void> {
  await api.post("/users/me/study-time", { minutes });
}

/** schemas.LeaderboardItem */
export interface LeaderboardEntry {
  id: number;
  full_name: string;
  avatar_url: string | null;
  completed_count: number;
  total_minutes: number;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<LeaderboardEntry[]>("/leaderboard");
  return data;
}
