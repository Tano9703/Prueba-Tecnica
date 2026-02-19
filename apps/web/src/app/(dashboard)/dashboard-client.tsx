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
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <SectionCard className="xl:min-h-[520px]">
          {dashboardStatsQuery.isLoading ? (
            <LoadingState message="Cargando inventario..." />
          ) : dashboardStatsQuery.isError ? (
            <p className="text-sm text-quinary">No se pudo cargar el inventario.</p>
          ) : (
            <>
              <div className="mb-5 flex items-start justify-between">
                <h2 className="text-2xl font-bold text-primary sm:text-3xl lg:text-4xl">Inventario de Productos</h2>
              </div>

              <p className="text-4xl font-black sm:text-5xl">{dashboardStatsQuery.data?.inventory.totalProducts ?? 0}</p>
              <p className="text-base text-tertiary">Productos en inventario</p>
              <p className="mt-2 break-words text-2xl font-semibold sm:text-3xl">Valor: {currency(dashboardStatsQuery.data?.inventory.totalValue ?? 0)}</p>

              <div className="mt-5 space-y-2 text-sm">
                {(dashboardStatsQuery.data?.inventory.products ?? []).length === 0 ? (
                  <p className="text-center text-base text-tertiary">No hay productos cargados.</p>
                ) : (
                  (dashboardStatsQuery.data?.inventory.products ?? []).map((item) => (
                    <div key={item.id} className="flex flex-col gap-1 border-b border-tertiary/35 pb-2 sm:flex-row sm:items-start sm:justify-between">
                      <span>{item.name}</span>
                      <span className="whitespace-nowrap text-tertiary">{currency(item.price)}</span>
                    </div>
                  ))
                )}
                {(dashboardStatsQuery.data?.inventory.totalProducts ?? 0) > (dashboardStatsQuery.data?.inventory.products.length ?? 0) ? (
                  <p className="text-center text-base text-tertiary">
                    +{(dashboardStatsQuery.data?.inventory.totalProducts ?? 0) - (dashboardStatsQuery.data?.inventory.products.length ?? 0)} productos más
                  </p>
                ) : null}
              </div>

            </>
          )}
        </SectionCard>

        <SectionCard className="xl:min-h-[520px]" title="Ventas Recientes">
          {salesQuery.isLoading ? (
            <LoadingState message="Cargando ventas..." />
          ) : salesQuery.isError ? (
            <p className="text-sm text-quinary">No se pudieron cargar las ventas.</p>
          ) : (salesQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-tertiary">No hay ventas realizadas todavía.</p>
          ) : (
            <div className="space-y-3">
              {(salesQuery.data ?? []).map((sale) => (
                <div key={sale.id} className="rounded-xl border border-tertiary/35 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-semibold leading-5">{sale.customerName}</p>
                    <p className="font-bold text-quaternary">{currency(sale.total)}</p>
                  </div>
                  <div className="mt-2 flex flex-col gap-1 text-sm text-tertiary sm:flex-row sm:items-center sm:justify-between">
                    <span>Order #{sale.orderNumber}</span>
                    <span>{formatDate(sale.createdAt)}</span>
                  </div>
                  <p className="text-sm text-tertiary">Status: {sale.status}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Productos Más Vendidos" className="h-fit">
          {dashboardStatsQuery.isLoading ? (
            <LoadingState message="Cargando productos..." />
          ) : dashboardStatsQuery.isError ? (
            <p className="text-sm text-quinary">No se pudieron cargar los productos más vendidos.</p>
          ) : (dashboardStatsQuery.data?.topProducts ?? []).length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-tertiary/35 py-14 text-center">
              <p className="text-2xl text-tertiary">No hay productos top para mostrar.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {(dashboardStatsQuery.data?.topProducts ?? []).map((product) => (
                <div key={product.id} className="flex flex-col gap-1 rounded-lg border border-tertiary/35 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                  <p className="whitespace-nowrap text-xs text-tertiary sm:ml-3">{product.sold} uds.</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

