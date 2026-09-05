import api from "../lib/api";
import type { Admin, CreateEmployeePayload } from "../types/auth";

export async function createEmployee(
  data: CreateEmployeePayload,
): Promise<Admin> {
  const response = await api.post<Admin>("/auth/admin/employees", data);
  return response.data;
}

export async function getEmployees(): Promise<Admin[]> {
  const response = await api.get<Admin[]>("/auth/admin/employees");
  return response.data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/auth/admin/employees/${id}`);
}