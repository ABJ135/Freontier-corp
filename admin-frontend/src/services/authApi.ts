import api from "../lib/api";
import type { LoginPayload, LoginResponse } from "../types/auth";

export async function loginUser(data: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/admin/login", data);
  return response.data;
}