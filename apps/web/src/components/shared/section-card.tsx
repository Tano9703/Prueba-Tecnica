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
    <section className={cn("rounded-xl border border-tertiary/35 bg-secondary p-4 shadow-card sm:p-6", className)}>
      {title ? <h2 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h2> : null}
      {description ? <p className="mt-2 text-sm text-tertiary">{description}</p> : null}
      <div className={cn(title || description ? "mt-5" : "")}>{children}</div>
    </section>
  );
}

