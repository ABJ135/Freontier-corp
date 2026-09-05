import api from "../lib/api";
import type {
  CreateProductPayload,
  Product,
  ProductImage,
  UpdateProductPayload,
} from "../types/product";

export async function getProducts(): Promise<Product[]> {
  const response = await api.get<Product[]>("/products");
  return response.data;
}

export async function getProduct(id: string): Promise<Product> {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

export async function createProduct(
  data: CreateProductPayload,
): Promise<Product> {
  const response = await api.post<Product>("/products", data);
  return response.data;
}

export async function updateProduct(
  id: string,
  data: UpdateProductPayload,
): Promise<Product> {
  const response = await api.patch<Product>(`/products/${id}`, data);
  return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<ProductImage> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ProductImage>(
    `/products/${productId}/images`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

export async function setPrimaryProductImage(
  productId: string,
  imageId: string,
): Promise<ProductImage> {
  const response = await api.patch<ProductImage>(
    `/products/${productId}/images/${imageId}`,
    { isPrimary: true },
  );
  return response.data;
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<void> {
  await api.delete(`/products/${productId}/images/${imageId}`);
}