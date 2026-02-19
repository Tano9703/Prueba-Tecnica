"use client";

import {
  BarChart3,
  Bell,
  ChevronLeft,
  CircleHelp,
  Gift,
  House,
  LogOut,
  Medal,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Sun,
  Tag,
  Tags,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { clearAuthToken } from "@/lib/cookies";
import { cn } from "@/lib/utils";

const items = [
  { label: "Inicio", href: "/", icon: House },
  { label: "Ventas", href: "/ventas", icon: ShoppingCart },
  { label: "Categorias", href: "/categorias", icon: Tags },
  { label: "Marcas", href: "/marcas", icon: Tag },
  { label: "Productos", href: "/productos", icon: Package },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Estadísticas", href: "/estadisticas", icon: BarChart3 },
  { label: "Descuentos", href: "/descuentos", icon: Percent },
  { label: "Puntos de Lealtad", href: "/puntos-de-lealtad", icon: Gift },
  { label: "Membresías", href: "/membresias", icon: Medal },
  { label: "Notificaciones", href: "/notificaciones", icon: Bell },
  { label: "Configuración", href: "/configuracion", icon: Settings },
  { label: "Ayuda", href: "/ayuda", icon: CircleHelp },
];

function getBreadcrumb(pathname: string) {
  if (pathname === "/") return "Inicio";
  const parts = pathname.split("/").filter(Boolean);
  return `Inicio /${parts.join(" /")}`;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-y-0 left-0 w-[280px] border-r border-border bg-white">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="text-4xl font-bold">Tennis Star</span>
          <button className="rounded-lg p-1 text-muted hover:bg-slate-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <nav className="space-y-1 px-2 py-4">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-base font-medium text-slate-600 transition-colors",
                  isActive && "bg-slate-100 text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pl-[280px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white px-8">
          <span className="text-lg font-medium text-foreground">{getBreadcrumb(pathname)}</span>
          <div className="flex items-center gap-4">
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <Bell className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <Sun className="h-4 w-4" />
            </button>
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              onClick={() => setLogoutOpen(true)}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-700" />
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Cerrar sesión"
        description="¿Seguro que quieres cerrar sesión?"
        confirmLabel="Cerrar sesión"
        onConfirm={() => {
          clearAuthToken();
          setLogoutOpen(false);
          router.push("/login");
        }}
      />
    </div>
  );
}
