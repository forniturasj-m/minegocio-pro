"use client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";

export default function PaginaConfiguracion() {
  return (
    <div className="flex min-h-screen bg-neutro-claro">
      <Sidebar />
      <main className="flex-1 p-xl">
        <h1 className="text-h1 text-neutro-oscuro mb-lg">Configuración</h1>
        <Card>
          <CardContent className="p-lg">
            <p className="text-neutro-medio">Panel de configuración - En desarrollo</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
