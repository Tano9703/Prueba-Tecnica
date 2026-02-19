import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Cargando datos...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex min-h-40 items-center justify-center gap-3 rounded-xl border border-tertiary/35 bg-secondary", className)}>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-tertiary/40 border-t-primary" />
      <p className="text-sm text-tertiary">{message}</p>
    </div>
  );
}

