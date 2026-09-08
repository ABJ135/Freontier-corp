import api from "../lib/api";
import type {
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
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