"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { obtenerGastos, crearGasto, eliminarGasto, calcularTotalGastos, agruparGastosPorCategoria } from "@/lib/gastos";
import { Transaccion } from "@/types";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const COLORES = {
  operativo: "#0066CC",
  personal: "#FF6B35",
  suministros: "#10B981",
  mantenimiento: "#EF4444",
  otro: "#FBBF24",
};

const CATEGORIAS = ["operativo", "personal", "suministros", "mantenimiento", "otro"];

export default function PaginaGastos() {
  const router = useRouter();
  const [gastos, setGastos] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [negocioId, setNegocioId] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [datos, setDatos] = useState({
    concepto: "",
    categoria: "operativo",
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const docSnap = await getDoc(doc(db, "usuarios", user.uid));
        if (docSnap.exists()) {
          const id = docSnap.data().negocioId;
          setNegocioId(id);
          await cargarGastos(id);
        }
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    });

    return unsubscribe;
  }, [router]);

  const cargarGastos = async (id: string) => {
    try {
      const gts = await obtenerGastos(id);
      setGastos(gts);
    } catch (e) {
      toast.error("Error al cargar gastos");
    }
  };

  const manejarCrearGasto = async () => {
    if (!datos.concepto || !datos.monto) {
      toast.error("Completa todos los campos");
      return;
    }

    try {
      await crearGasto(negocioId, auth.currentUser?.uid || "", {
        concepto: datos.concepto,
        categoria: datos.categoria as "operativo" | "personal" | "suministros" | "mantenimiento" | "otro",
        monto: Number(datos.monto),
        fecha: new Date(datos.fecha),
        descripcion: datos.descripcion,
      });

      toast.success("Gasto registrado");
      setDatos({
        concepto: "",
        categoria: "operativo",
        monto: "",
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
      });
      setModalAbierto(false);
      await cargarGastos(negocioId);
    } catch (e) {
      toast.error("Error al crear gasto");
    }
  };

  const manejarEliminar = async (gastoId: string) => {
    if (!confirm("¿Estás seguro?")) return;
    try {
      await eliminarGasto(negocioId, gastoId);
      await cargarGastos(negocioId);
      toast.success("Gasto eliminado");
    } catch (e) {
      toast.error("Error al eliminar");
    }
  };

  const totalGastos = calcularTotalGastos(gastos);
  const gastosPorCategoria = agruparGastosPorCategoria(gastos);
  const datosGrafico = Object.entries(gastosPorCategoria).map(([categoria, monto]) => ({
    name: categoria,
    value: monto,
  }));

  if (cargando) {
    return (
      <div className="flex min-h-screen bg-neutro-claro">
        <Sidebar />
        <main className="flex-1 p-xl">
          <p className="text-neutro-medio">Cargando gastos...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutro-claro">
      <Sidebar />
      <main className="flex-1 p-xl space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-h1 text-neutro-oscuro">Gastos</h1>
          <Button onClick={() => setModalAbierto(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Gasto
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Total gastos</p>
              <p className="text-h2 text-peligro font-numero">
                ${totalGastos.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Cantidad</p>
              <p className="text-h2 text-primario font-numero">{gastos.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Promedio</p>
              <p className="text-h2 text-secundario font-numero">
                ${(totalGastos / (gastos.length || 1)).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {datosGrafico.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gastos por categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={datosGrafico}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: $${value.toLocaleString()}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosGrafico.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={COLORES[entry.name as keyof typeof COLORES] || "#666"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Últimos gastos ({gastos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {gastos.length === 0 ? (
              <p className="text-neutro-medio">No hay gastos registrados</p>
            ) : (
              <div className="space-y-sm">
                {gastos.slice(0, 20).map((gasto) => (
                  <div key={gasto.id} className="flex justify-between items-center p-sm border-b border-neutro-borde">
                    <div className="flex-1">
                      <p className="text-body-sm font-semibold text-neutro-oscuro">
                        {(gasto as any).concepto}
                      </p>
                      <div className="flex gap-md">
                        <span className="text-caption text-neutro-medio">
                          {(gasto as any).categoria}
                        </span>
                        <span className="text-caption text-neutro-medio">
                          {new Date(gasto.fecha).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-md">
                      <p className="text-body-sm font-numero text-peligro">
                        ${gasto.montoTotal?.toLocaleString()}
                      </p>
                      <button
                        onClick={() => manejarEliminar(gasto.id)}
                        className="text-peligro hover:text-peligro-hover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Modal
          abierto={modalAbierto}
          alCerrar={() => setModalAbierto(false)}
          titulo="Nuevo Gasto"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={manejarCrearGasto}>Registrar Gasto</Button>
            </>
          }
        >
          <div className="space-y-md">
            <Input
              label="Concepto"
              value={datos.concepto}
              onChange={(e) => setDatos({ ...datos, concepto: e.target.value })}
              placeholder="Ej: Arriendo, servicios, etc."
              required
            />
            <div>
              <label className="block text-body-sm font-semibold text-neutro-oscuro mb-sm">
                Categoría
              </label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-neutro-borde"
                value={datos.categoria}
                onChange={(e) => setDatos({ ...datos, categoria: e.target.value })}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Monto"
              type="number"
              step="0.01"
              value={datos.monto}
              onChange={(e) => setDatos({ ...datos, monto: e.target.value })}
              required
            />
            <Input
              label="Fecha"
              type="date"
              value={datos.fecha}
              onChange={(e) => setDatos({ ...datos, fecha: e.target.value })}
              required
            />
            <Input
              label="Descripción (opcional)"
              value={datos.descripcion}
              onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
            />
          </div>
        </Modal>
      </main>
    </div>
  );
}
