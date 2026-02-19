import { apiFetch } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

export const dashboardService = {
  stats() {
    return apiFetch<DashboardStats>("/dashboard/stats");
  },
};
