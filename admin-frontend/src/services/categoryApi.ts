import api from "../lib/api";
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/category";

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>("/categories");
  return response.data;
}

export async function createCategory(
  data: CreateCategoryPayload,
): Promise<Category> {
  const response = await api.post<Category>("/categories", data);
  return response.data;
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryPayload,
): Promise<Category> {
  const response = await api.patch<Category>(`/categories/${id}`, data);
  return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}