import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutro-claro">
      <div className="text-center space-y-lg p-xl">
        <h1 className="text-h1 text-neutro-oscuro">MiNegocio</h1>
        <p className="text-body text-neutro-medio max-w-md">
          Sistema de gestión completo para pequeños negocios. Ventas, inventario,
          clientes y reportes en un solo lugar.
        </p>
        <div className="flex gap-md justify-center">
          <Link href="/login">
            <Button size="lg">Iniciar sesión</Button>
          </Link>
          <Link href="/registro">
            <Button size="lg" variant="secondary">Registrarse gratis</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
