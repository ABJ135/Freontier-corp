import type { Category } from "./category";

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  category: Category;
  images: ProductImage[];
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  priceCents: number;
  stock: number;
  categoryId: string;
  description?: string;
  compareAtPriceCents?: number;
}

export interface UpdateProductPayload {
  sku?: string;
  name?: string;
  priceCents?: number;
  stock?: number;
  categoryId?: string;
  description?: string;
  compareAtPriceCents?: number;
}