export type AdminRole = "ADMIN" | "EMPLOYEE";

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: Admin;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}