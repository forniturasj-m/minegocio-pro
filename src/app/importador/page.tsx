"use client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaginaImportador() {
  return (
    <div className="flex min-h-screen bg-neutro-claro">
      <Sidebar />
      <main className="flex-1 p-xl">
        <div className="flex items-center justify-between mb-lg">
          <h1 className="text-h1 text-neutro-oscuro">Importar Precios</h1>
          <Button>Seleccionar archivo</Button>
        </div>
        <Card>
          <CardContent className="p-lg">
            <p className="text-neutro-medio">Importador de precios - En desarrollo</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
