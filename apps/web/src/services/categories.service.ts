import { apiFetch } from "@/lib/api";
import type { Category } from "@/lib/types";

export interface CategoryPayload {
  name: string;
  position: number;
  parentCategoryId?: string | null;
}

export const categoriesService = {
  list(search?: string) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    return apiFetch<Category[]>(`/categories?${params.toString()}`);
  },
  create(payload: CategoryPayload) {
    return apiFetch<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  update(id: string, payload: Partial<CategoryPayload>) {
    return apiFetch<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  remove(id: string) {
    return apiFetch<void>(`/categories/${id}`, {
      method: "DELETE",
    });
  },
};
