import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const map: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "dark" | "default" }> = {
  ACTIVE: { label: "Disponible", variant: "success" },
  INACTIVE: { label: "Agotado", variant: "default" },
  SENT: { label: "Enviado", variant: "info" },
  PREPARING: { label: "En Preparación", variant: "warning" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
  COMPLETED: { label: "Completado", variant: "success" },
  PAID: { label: "Pagado", variant: "dark" },
  FAILED: { label: "Fallido", variant: "danger" },
  PENDING: { label: "Pendiente", variant: "warning" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const item = map[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
