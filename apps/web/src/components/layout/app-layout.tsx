"use client";

import {
  BarChart3,
  Bell,
  CircleHelp,
  Gift,
  House,
  LogOut,
  Menu,
  Medal,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Sun,
  Tag,
  Tags,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

function SidebarNavigation({ pathname }: { pathname: string }) {
  return (
    <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto px-2 py-4">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex h-10 items-center gap-3 rounded-xl px-3 text-base font-medium text-tertiary transition-colors",
              isActive && "bg-tertiary/18 text-primary",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-secondary text-primary">
      <div className="lg:hidden">
        {mobileMenuOpen ? <button className="fixed inset-0 z-30 bg-primary/35" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú" /> : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[280px] border-r border-tertiary/35 bg-secondary transition-transform",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-tertiary/35 px-4">
            <span className="text-2xl font-bold">Tennis Star</span>
            <button className="rounded-lg p-1 text-tertiary hover:bg-tertiary/18" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú">
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarNavigation pathname={pathname} />
        </aside>

        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-tertiary/35 bg-secondary px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-lg p-2 text-tertiary hover:bg-tertiary/18" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate text-sm font-medium text-primary">{getBreadcrumb(pathname)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg p-2 text-tertiary hover:bg-tertiary/18"
              onClick={() => setLogoutOpen(true)}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-quaternary" />
          </div>
        </header>

        <main className="p-4">{children}</main>
      </div>

      <div className="hidden lg:block">
        <aside className="fixed inset-y-0 left-0 z-30 w-[280px] border-r border-tertiary/35 bg-secondary">
          <div className="flex h-16 items-center border-b border-tertiary/35 px-4">
            <span className="text-4xl font-bold">Tennis Star</span>
          </div>
          <SidebarNavigation pathname={pathname} />
        </aside>

        <div className="pl-[280px]">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-tertiary/35 bg-secondary px-8">
            <span className="text-lg font-medium text-primary">{getBreadcrumb(pathname)}</span>
            <div className="flex items-center gap-4">
              <button className="rounded-lg p-2 text-tertiary hover:bg-tertiary/18">
                <Bell className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 text-tertiary hover:bg-tertiary/18">
                <Sun className="h-4 w-4" />
              </button>
              <button
                className="rounded-lg p-2 text-tertiary hover:bg-tertiary/18"
                onClick={() => setLogoutOpen(true)}
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-quaternary" />
            </div>
          </header>
          <main className="p-8">{children}</main>
        </div>
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

