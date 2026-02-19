import { LoadingState } from "@/components/shared/loading-state";

export default function DashboardLoading() {
  return <LoadingState message="Cargando pantalla..." className="min-h-[60vh]" />;
}
