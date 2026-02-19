"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { systemChecksService } from "@/services/system-checks.service";

type CheckItem = {
  key: string;
  label: string;
  run: () => Promise<unknown>;
};

const checks: CheckItem[] = [
  { key: "auth", label: "Login / sesión", run: () => systemChecksService.checkAuth() },
  { key: "categories", label: "Categorías (listar)", run: () => systemChecksService.checkCategories() },
  { key: "products", label: "Productos (listar)", run: () => systemChecksService.checkProducts() },
  { key: "sales", label: "Ventas (listar)", run: () => systemChecksService.checkSales() },
  { key: "dashboard", label: "Dashboard stats", run: () => systemChecksService.checkDashboard() },
];

export function SystemChecklist() {
  const results = useQueries({
    queries: checks.map((check) => ({
      queryKey: ["system-check", check.key],
      queryFn: check.run,
      retry: 1,
      staleTime: 30000,
    })),
  });

  const lastLoggedSignature = useRef<string>("");

  const checkStatuses = useMemo(() => {
    return checks.map((check, index) => {
      const result = results[index];
      const status = result?.isPending ? "pending" : result?.isSuccess ? "ok" : "error";
      return {
        key: check.key,
        label: check.label,
        status,
      };
    });
  }, [results]);

  const allSettled = checkStatuses.every((check) => check.status !== "pending");
  const signature = checkStatuses.map((check) => `${check.key}:${check.status}`).join("|");

  useEffect(() => {
    if (!allSettled) return;
    if (lastLoggedSignature.current === signature) return;
    lastLoggedSignature.current = signature;

    fetch("/api/system-check-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checks: checkStatuses }),
    }).catch(() => {
      // No interrumpir la UI si el log falla.
    });
  }, [allSettled, checkStatuses, signature]);

  return null;
}
