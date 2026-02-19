import { apiFetch } from "@/lib/api";
import type { Category, Product, Sale, User } from "@/lib/types";

export const systemChecksService = {
  checkAuth() {
    return apiFetch<User>("/auth/me");
  },
  checkCategories() {
    return apiFetch<Category[]>("/categories");
  },
  checkProducts() {
    return apiFetch<Product[]>("/products");
  },
  checkSales() {
    return apiFetch<Sale[]>("/sales");
  },
  checkDashboard() {
    return apiFetch("/dashboard/stats");
  },
};
