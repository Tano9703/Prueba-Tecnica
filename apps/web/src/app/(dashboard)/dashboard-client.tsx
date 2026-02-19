"use client";

import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { dashboardService } from "@/services/dashboard.service";
import { salesService } from "@/services/sales.service";

function currency(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardClientPage() {
  const dashboardStatsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardService.stats(),
  });

  const salesQuery = useQuery({
    queryKey: ["dashboard-recent-sales"],
    queryFn: () => salesService.list(),
    select: (sales) =>
      [...sales]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
  });

  return (
    <div>
      <PageHeader title="Inicio" breadcrumb="Inicio" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <SectionCard className="min-h-[520px]">
          {dashboardStatsQuery.isLoading ? (
            <LoadingState message="Cargando inventario..." />
          ) : dashboardStatsQuery.isError ? (
            <p className="text-sm text-[#B42318]">No se pudo cargar el inventario.</p>
          ) : (
            <>
              <div className="mb-5 flex items-start justify-between">
                <h2 className="text-4xl font-bold text-foreground">Inventario de Productos</h2>
              </div>

              <p className="text-5xl font-black">{dashboardStatsQuery.data?.inventory.totalProducts ?? 0}</p>
              <p className="text-base text-muted">Productos en inventario</p>
              <p className="mt-2 text-3xl font-semibold">Valor: {currency(dashboardStatsQuery.data?.inventory.totalValue ?? 0)}</p>

              <div className="mt-5 space-y-2 text-sm">
                {(dashboardStatsQuery.data?.inventory.products ?? []).length === 0 ? (
                  <p className="text-center text-base text-muted">No hay productos cargados.</p>
                ) : (
                  (dashboardStatsQuery.data?.inventory.products ?? []).map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 border-b border-border pb-2">
                      <span>{item.name}</span>
                      <span className="whitespace-nowrap text-muted">{currency(item.price)}</span>
                    </div>
                  ))
                )}
                {(dashboardStatsQuery.data?.inventory.totalProducts ?? 0) > (dashboardStatsQuery.data?.inventory.products.length ?? 0) ? (
                  <p className="text-center text-base text-muted">
                    +{(dashboardStatsQuery.data?.inventory.totalProducts ?? 0) - (dashboardStatsQuery.data?.inventory.products.length ?? 0)} productos más
                  </p>
                ) : null}
              </div>

            </>
          )}
        </SectionCard>

        <SectionCard className="min-h-[520px]" title="Ventas Recientes">
          {salesQuery.isLoading ? (
            <LoadingState message="Cargando ventas..." />
          ) : salesQuery.isError ? (
            <p className="text-sm text-[#B42318]">No se pudieron cargar las ventas.</p>
          ) : (salesQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">No hay ventas realizadas todavía.</p>
          ) : (
            <div className="space-y-3">
              {(salesQuery.data ?? []).map((sale) => (
                <div key={sale.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-5">{sale.customerName}</p>
                    <p className="font-bold text-[#16A34A]">{currency(sale.total)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-sm text-muted">
                    <span>Order #{sale.orderNumber}</span>
                    <span>{formatDate(sale.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted">Status: {sale.status}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Productos Más Vendidos" className="h-fit">
          {dashboardStatsQuery.isLoading ? (
            <LoadingState message="Cargando productos..." />
          ) : dashboardStatsQuery.isError ? (
            <p className="text-sm text-[#B42318]">No se pudieron cargar los productos más vendidos.</p>
          ) : (dashboardStatsQuery.data?.topProducts ?? []).length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border py-14 text-center">
              <p className="text-2xl text-muted">No hay productos top para mostrar.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {(dashboardStatsQuery.data?.topProducts ?? []).map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                  <p className="ml-3 whitespace-nowrap text-xs text-muted">{product.sold} uds.</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
