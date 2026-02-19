import { apiFetch } from "@/lib/api";
import type { PaymentStatus, Sale, SaleStatus } from "@/lib/types";

export type PaymentSimulationResult = "APPROVED" | "DECLINED" | "PENDING" | "RANDOM";
export type PriceAdjustmentType = "DISCOUNT" | "SURCHARGE";

export interface GenerateSaleItemPayload {
  productId: string;
  quantity: number;
  attributes?: Array<{ name: string; value: string }>;
}

export interface GenerateSalePayload {
  customerName?: string;
  customerEmail?: string;
  total?: number;
  items?: GenerateSaleItemPayload[];
  adjustmentType?: PriceAdjustmentType;
  adjustmentPercent?: number;
  paymentMethod?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  notes?: string;
  paymentSimulation?: PaymentSimulationResult;
}

export interface UpdateSalePayload {
  customerName?: string;
  customerEmail?: string;
  total?: number;
  status?: SaleStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  notes?: string;
}

export const salesService = {
  list(search?: string) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    return apiFetch<Sale[]>(`/sales?${params.toString()}`);
  },
  getById(id: string) {
    return apiFetch<Sale>(`/sales/${id}`);
  },
  generate(payload?: GenerateSalePayload) {
    return apiFetch<Sale>("/sales/generate", {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    });
  },
  update(id: string, payload: UpdateSalePayload) {
    return apiFetch<Sale>(`/sales/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  remove(id: string) {
    return apiFetch<Sale>(`/sales/${id}`, {
      method: "DELETE",
    });
  },
  updateStatus(id: string, status: SaleStatus, note?: string) {
    return apiFetch<Sale>(`/sales/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    });
  },
};
