import api from "../lib/api";
import type {
  Admin,
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  UpdatePreferencesPayload,
} from "../types/auth";

export async function loginUser(data: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/admin/login", data);
  return response.data;
}

export async function forgotAdminPassword(
  data: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  const response = await api.post<ForgotPasswordResponse>(
    "/auth/admin/forgot-password",
    data
  );
  return response.data;
}

export async function resetAdminPassword(
  data: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  const response = await api.post<ResetPasswordResponse>(
    "/auth/admin/reset-password",
    data
  );
  return response.data;
}

/** Invalidate the admin refresh token server-side. POST /auth/admin/logout */
export async function logoutAdmin(refreshToken: string): Promise<void> {
  await api.post("/auth/admin/logout", { refreshToken });
}

/** Fetch the current admin's full profile. GET /auth/admin/me */
export async function getAdminProfile(): Promise<Admin> {
  const response = await api.get<Admin>("/auth/admin/me");
  return response.data;
}

/** Persist notification preferences server-side. PATCH /auth/admin/preferences */
export async function updateAdminPreferences(
  data: UpdatePreferencesPayload
): Promise<Admin> {
  const response = await api.patch<Admin>("/auth/admin/preferences", data);
  return response.data;
}