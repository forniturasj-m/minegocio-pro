"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Package, TrendingDown,
  Users, FileText, BarChart3, Settings, LogOut, Upload,
} from "lucide-react";
import { cerrarSesion } from "@/lib/auth";

const menu = [
  { href: "/dashboard", etiqueta: "Panel de Control", icono: LayoutDashboard },
  { href: "/ventas", etiqueta: "Ventas", icono: ShoppingCart },
  { href: "/inventario", etiqueta: "Inventario", icono: Package },
  { href: "/gastos", etiqueta: "Gastos", icono: TrendingDown },
  { href: "/clientes", etiqueta: "Clientes", icono: Users },
  { href: "/importador", etiqueta: "Importar Precios", icono: Upload },
  { href: "/reportes", etiqueta: "Reportes", icono: BarChart3 },
  { href: "/configuracion", etiqueta: "Configuración", icono: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-neutro-borde min-h-screen flex flex-col">
      <div className="p-lg border-b border-neutro-borde">
        <h1 className="text-h2 text-primario">MiNegocio</h1>
        <p className="text-caption text-neutro-medio">Sistema de Gestión</p>
      </div>

      <nav className="flex-1 p-md space-y-xs">
        {menu.map((item) => {
          const activo = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-md px-md py-sm rounded-lg text-body-sm transition-colors ${
                activo
                  ? "bg-primario-50 text-primario font-semibold"
                  : "text-neutro-oscuro hover:bg-neutro-claro"
              }`}
            >
              <item.icono className="h-5 w-5" />
              {item.etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="p-md border-t border-neutro-borde">
        <button
          onClick={() => cerrarSesion()}
          className="flex items-center gap-md px-md py-sm rounded-lg text-body-sm text-neutro-oscuro hover:bg-neutro-claro w-full"
        >
          <LogOut className="h-5 w-5" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
