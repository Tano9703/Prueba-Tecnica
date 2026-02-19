import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EntityFormProps {
  children: ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  className?: string;
}

export function EntityForm({ children, onSubmit, className }: EntityFormProps) {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)}>
      {children}
    </form>
  );
}
