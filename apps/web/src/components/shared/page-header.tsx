import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  breadcrumb: string;
  actions?: ReactNode;
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div>
        <p className="mb-2 text-sm text-muted">{breadcrumb}</p>
        <h1 className="text-5xl font-bold leading-none text-foreground">{title}</h1>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
