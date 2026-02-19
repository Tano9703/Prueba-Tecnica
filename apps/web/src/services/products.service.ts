import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/types";

export interface ProductPayload {
  name: string;
  description?: string;
  categoryId: string;
  brand: string;
  gender: string;
  imageUrl?: string;
  price: number;
  options?: Array<{ name: string; values: string[] }>;
}

export const productsService = {
  list(filters?: { search?: string; categoryId?: string }) {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.categoryId) params.set("categoryId", filters.categoryId);
    return apiFetch<Product[]>(`/products?${params.toString()}`);
  },
  getById(id: string) {
    return apiFetch<Product>(`/products/${id}`);
  },
  create(payload: ProductPayload) {
    return apiFetch<Product>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  update(id: string, payload: Partial<ProductPayload>) {
    return apiFetch<Product>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  remove(id: string) {
    return apiFetch<void>(`/products/${id}`, {
      method: "DELETE",
    });
  },
};
