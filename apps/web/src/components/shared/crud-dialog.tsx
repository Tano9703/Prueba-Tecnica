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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 pt-4 sm:items-center sm:p-0">
      <button
        className="absolute inset-0 bg-primary/35"
        onClick={() => onOpenChange(false)}
        aria-label="Cerrar modal"
      />
      <section
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 max-h-[calc(100vh-1.25rem)] w-[calc(100vw-1rem)] max-w-3xl overflow-y-auto rounded-xl border border-tertiary/35 bg-secondary p-4 shadow-lg sm:max-h-[90vh] sm:w-[95vw] sm:p-6",
          maxWidthClassName,
        )}
      >
        <header className="mb-4 pr-8">
          <h3 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h3>
        </header>
        <button
          className="absolute right-4 top-4 rounded-md p-2 text-tertiary hover:bg-tertiary/18"
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

