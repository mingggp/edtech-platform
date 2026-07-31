/** Users-related API calls
 *
 * Backend endpoints (routers/users.py — prefix /users):
 *   GET   /users/me                     -> User
 *   PATCH /users/me                     -> User
 *   POST  /users/me/upload-image        -> { avatar_url } (multipart)
 *   GET   /users/me/courses             -> Enrollment[]
 */
import { api } from "./client";
import type { User } from "@/lib/types";

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}

export interface UpdateMeInput {
  full_name?: string;
  nickname?: string;
  grade_level?: string;
}

export async function updateMe(input: UpdateMeInput): Promise<User> {
  const { data } = await api.patch<User>("/users/me", input);
  return data;
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<{ avatar_url: string }>("/users/me/upload-image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function changePassword(input: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  await api.post("/auth/change-password", input);
}
