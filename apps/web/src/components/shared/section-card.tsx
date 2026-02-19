import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, className }: SectionCardProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-white p-6 shadow-card", className)}>
      {title ? <h2 className="text-3xl font-bold text-foreground">{title}</h2> : null}
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
      <div className={cn(title || description ? "mt-5" : "")}>{children}</div>
    </section>
  );
}
