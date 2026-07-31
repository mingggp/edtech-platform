/** Achievements / Badges API
 *
 * Backend endpoints (routers/users.py):
 *   GET  /users/me/achievements           -> Badge[]
 *   POST /users/me/achievements/showcase  -> { showcase_badges: string[] }
 *
 * Backend shape (badges.py ALL_BADGES + get_user_badges_status):
 *   { id, name, desc, icon, category, is_unlocked, is_showcased }
 */
import { api } from "./client";

export type BadgeCategory = "General" | "Learning" | "Crazy";

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: BadgeCategory | string;
  is_unlocked: boolean;
  is_showcased: boolean;
}

export async function getMyAchievements(): Promise<Badge[]> {
  const { data } = await api.get<Badge[]>("/users/me/achievements");
  return data;
}

export async function updateShowcase(badgeIds: string[]): Promise<{ showcase_badges: string[] }> {
  const { data } = await api.post<{ showcase_badges: string[] }>(
    "/users/me/achievements/showcase",
    badgeIds
  );
  return data;
}
