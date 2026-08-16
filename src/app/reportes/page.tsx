"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { obtenerVentas, calcularTotalVentas } from "@/lib/ventas";
import { obtenerGastos, calcularTotalGastos } from "@/lib/gastos";
import { obtenerProductos } from "@/lib/productos";
import { Transaccion } from "@/types";
import { exportarExcel, exportarPDF } from "@/lib/reportes";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";

export default function PaginaReportes() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [negocioId, setNegocioId] = useState("");
  const [ventas, setVentas] = useState<Transaccion[]>([]);
  const [gastos, setGastos] = useState<Transaccion[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [rangoFecha, setRangoFecha] = useState("7");

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
          await cargarDatos(id);
        }
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    });

    return unsubscribe;
  }, [router]);

  const cargarDatos = async (id: string) => {
    try {
      const [vts, gts, prods] = await Promise.all([
        obtenerVentas(id),
        obtenerGastos(id),
        obtenerProductos(id),
      ]);
      setVentas(vts);
      setGastos(gts);
      setProductos(prods);
    } catch (e) {
      toast.error("Error al cargar datos");
    }
  };

  const totalVentas = calcularTotalVentas(ventas);
  const totalGastos = calcularTotalGastos(gastos);
  const utilidad = totalVentas - totalGastos;
  const margenUtilidad = totalVentas > 0 ? ((utilidad / totalVentas) * 100).toFixed(2) : "0.00";

  const datosGraficoVentas = ventas
    .slice(0, parseInt(rangoFecha))
    .reduce((acc: any, venta) => {
      const fecha = new Date(venta.creadoEn).toLocaleDateString();
      const existente = acc.find((d: any) => d.fecha === fecha);
      if (existente) {
        existente.ventas += venta.montoTotal || 0;
      } else {
        acc.push({ fecha, ventas: venta.montoTotal || 0 });
      }
      return acc;
    }, []);

  const datosGraficoGastos = gastos
    .slice(0, parseInt(rangoFecha))
    .reduce((acc: any, gasto) => {
      const fecha = new Date(gasto.fecha).toLocaleDateString();
      const existente = acc.find((d: any) => d.fecha === fecha);
      if (existente) {
        existente.gastos += gasto.montoTotal || 0;
      } else {
        acc.push({ fecha, gastos: gasto.montoTotal || 0 });
      }
      return acc;
    }, []);

  const datosComparados = datosGraficoVentas
    .map((d: any) => ({
      ...d,
      gastos: datosGraficoGastos.find((g: any) => g.fecha === d.fecha)?.gastos || 0,
    }))
    .reverse();

  const productosTopVentas = productos
    .sort((a, b) => (b.cantidadVendida || 0) - (a.cantidadVendida || 0))
    .slice(0, 5);

  const productosStockBajo = productos
    .filter((p) => p.cantidadDisponible < 10)
    .sort((a, b) => a.cantidadDisponible - b.cantidadDisponible);

  const manejarExportarExcel = () => {
    const datos = ventas.map((v) => ({
      Fecha: new Date(v.creadoEn).toLocaleDateString(),
      Tipo: v.tipo,
      Monto: v.montoTotal,
      Estado: v.estado,
    }));
    exportarExcel(datos, "ventas_reportes");
    toast.success("Exportado a Excel");
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen bg-neutro-claro">
        <Sidebar />
        <main className="flex-1 p-xl">
          <p className="text-neutro-medio">Cargando reportes...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutro-claro">
      <Sidebar />
      <main className="flex-1 p-xl space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-h1 text-neutro-oscuro">Reportes</h1>
          <div className="flex gap-md">
            <select
              className="h-10 px-3 rounded-lg border border-neutro-borde"
              value={rangoFecha}
              onChange={(e) => setRangoFecha(e.target.value)}
            >
              <option value="7">Últimos 7 días</option>
              <option value="14">Últimos 14 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="60">Últimos 60 días</option>
            </select>
            <Button onClick={manejarExportarExcel}>
              <Download className="h-4 w-4 mr-2" /> Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Total Ventas</p>
              <p className="text-h2 text-exito font-numero">
                ${totalVentas.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Total Gastos</p>
              <p className="text-h2 text-peligro font-numero">
                ${totalGastos.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Utilidad Neta</p>
              <p className={`text-h2 font-numero ${utilidad >= 0 ? "text-exito" : "text-peligro"}`}>
                ${utilidad.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Margen %</p>
              <p className={`text-h2 font-numero ${parseFloat(margenUtilidad) >= 0 ? "text-exito" : "text-peligro"}`}>
                {margenUtilidad}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ventas vs Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            {datosComparados.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={datosComparados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="fecha" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="ventas" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-neutro-medio">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Productos</CardTitle>
            </CardHeader>
            <CardContent>
              {productosTopVentas.length > 0 ? (
                <div className="space-y-sm">
                  {productosTopVentas.map((p, i) => (
                    <div key={p.id} className="flex justify-between p-sm border-b border-neutro-borde">
                      <div>
                        <p className="text-body-sm font-semibold">{i + 1}. {p.nombre}</p>
                        <p className="text-caption text-neutro-medio">
                          Stock: {p.cantidadDisponible}
                        </p>
                      </div>
                      <p className="text-body-sm font-numero text-primario">
                        ${p.precioVenta.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutro-medio">Sin datos</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock Bajo ({productosStockBajo.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {productosStockBajo.length > 0 ? (
                <div className="space-y-sm">
                  {productosStockBajo.map((p) => (
                    <div key={p.id} className="flex justify-between p-sm border-b border-neutro-borde">
                      <div>
                        <p className="text-body-sm font-semibold">{p.nombre}</p>
                        <p className="text-caption text-advertencia-texto">
                          ⚠️ Stock bajo
                        </p>
                      </div>
                      <p className="text-body-sm font-numero text-peligro">
                        {p.cantidadDisponible}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutro-medio">Stock normal</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            {datosComparados.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosComparados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="fecha" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="ventas" fill="#10B981" />
                  <Bar dataKey="gastos" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-neutro-medio">Sin datos</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
