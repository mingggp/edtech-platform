/** Public profile API
 *
 * Backend endpoint (routers/users.py):
 *   GET /users/{user_id}/public  -> UserPublicProfile
 */
import { api } from "./client";

export interface PublicProfile {
  id: number;
  full_name: string | null;
  nickname: string | null;
  grade_level: string | null;
  dek_code: string | null;
  avatar_url: string | null;
  total_minutes: number;
  showcase_badges: string | null; // CSV ของ badge id
  total_courses: number;
  total_completed: number;
}

export async function getPublicProfile(userId: number | string): Promise<PublicProfile> {
  const { data } = await api.get<PublicProfile>(`/users/${userId}/public`);
  return data;
}
