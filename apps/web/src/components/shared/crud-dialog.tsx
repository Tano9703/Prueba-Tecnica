import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

export function CrudDialog({ open, onOpenChange, title, children, maxWidthClassName }: CrudDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        className="absolute inset-0 bg-slate-900/35"
        onClick={() => onOpenChange(false)}
        aria-label="Cerrar modal"
      />
      <section
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto rounded-xl border border-border bg-white p-6 shadow-lg",
          maxWidthClassName,
        )}
      >
        <header className="mb-4 pr-8">
          <h3 className="text-3xl font-bold text-foreground">{title}</h3>
        </header>
        <button
          className="absolute right-4 top-4 rounded-md p-2 text-muted hover:bg-slate-100"
          onClick={() => onOpenChange(false)}
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </section>
    </div>
  );
}
