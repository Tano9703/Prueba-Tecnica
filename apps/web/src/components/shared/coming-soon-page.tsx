import { Clock3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

interface ComingSoonPageProps {
  title: string;
  breadcrumb: string;
}

export function ComingSoonPage({ title, breadcrumb }: ComingSoonPageProps) {
  return (
    <div>
      <PageHeader title={title} breadcrumb={breadcrumb} />
      <SectionCard>
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-muted" />
          <p className="text-base font-medium text-muted">Próximamente</p>
        </div>
      </SectionCard>
    </div>
  );
}
