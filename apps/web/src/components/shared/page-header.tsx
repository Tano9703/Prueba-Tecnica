import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  breadcrumb: string;
  actions?: ReactNode;
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <>
      <header className="mb-5 space-y-3 md:hidden">
        <div>
          <p className="mb-1 text-xs text-tertiary">{breadcrumb}</p>
          <h1 className="text-3xl font-bold leading-tight text-primary">{title}</h1>
        </div>
        {actions ? <div className="flex w-full items-center gap-2 [&>*]:w-full">{actions}</div> : null}
      </header>

      <header className="mb-6 hidden items-center justify-between gap-4 md:flex">
        <div>
          <p className="mb-2 text-sm text-tertiary">{breadcrumb}</p>
          <h1 className="text-5xl font-bold leading-none text-primary">{title}</h1>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
    </>
  );
}

