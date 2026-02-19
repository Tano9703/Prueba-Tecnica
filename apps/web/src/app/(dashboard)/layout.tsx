import { AppLayout } from "@/components/layout/app-layout";
import { requireAuth } from "@/lib/server-auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return <AppLayout>{children}</AppLayout>;
}
