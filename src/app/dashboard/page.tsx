"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { obtenerVentas, calcularTotalVentas } from "@/lib/ventas";
import { obtenerGastos, calcularTotalGastos } from "@/lib/gastos";
import { obtenerProductos } from "@/lib/productos";
import { obtenerClientes } from "@/lib/clientes";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar,
} from "recharts";

export default function PaginaDashboard() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({
    ventasTotal: 0,
    gastosTotal: 0,
    utilidad: 0,
    productosCount: 0,
    clientesCount: 0,
    ventasDelMes: 0,
  });
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);

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
          const negocioId = docSnap.data().negocioId;
          await cargarDatos(negocioId);
        }
      } catch (e) {
        console.error(e);
        toast.error("Error al cargar dashboard");
      }
      setCargando(false);
    });

    return unsubscribe;
  }, [router]);

  const cargarDatos = async (negocioId: string) => {
    try {
      const [ventas, gastos, productos, clientes] = await Promise.all([
        obtenerVentas(negocioId),
        obtenerGastos(negocioId),
        obtenerProductos(negocioId),
        obtenerClientes(negocioId),
      ]);

      const totalVentas = calcularTotalVentas(ventas);
      const totalGastos = calcularTotalGastos(gastos);
      const utilidad = totalVentas - totalGastos;

      // Datos para gráfico (últimos 7 días)
      const datosGraf = ventas
        .slice(0, 7)
        .reduce((acc: any, venta) => {
          const fecha = new Date(venta.creadoEn).toLocaleDateString();
          const existente = acc.find((d: any) => d.fecha === fecha);
          if (existente) {
            existente.Ventas += venta.montoTotal || 0;
            existente.Gastos += gastos
              .filter((g) => new Date(g.fecha).toLocaleDateString() === fecha)
              .reduce((t, g) => t + (g.montoTotal || 0), 0);
          } else {
            const gastosDelDia = gastos
              .filter((g) => new Date(g.fecha).toLocaleDateString() === fecha)
              .reduce((t, g) => t + (g.montoTotal || 0), 0);
            acc.push({
              fecha,
              Ventas: venta.montoTotal || 0,
              Gastos: gastosDelDia,
            });
          }
          return acc;
        }, [])
        .reverse();

      setDatosGrafico(datosGraf);
      setStats({
        ventasTotal: totalVentas,
        gastosTotal: totalGastos,
        utilidad,
        productosCount: productos.length,
        clientesCount: clientes.length,
        ventasDelMes: totalVentas,
      });
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar datos");
    }
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen bg-neutro-claro">
        <Sidebar />
        <main className="flex-1 p-xl">
          <p className="text-neutro-medio">Cargando dashboard...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutro-claro">
      <Sidebar />
      <main className="flex-1 p-xl space-y-lg">
        <h1 className="text-h1 text-neutro-oscuro">Panel de Control</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Ventas del mes</p>
              <p className="text-h2 text-exito font-numero">
                ${stats.ventasTotal.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Gastos del mes</p>
              <p className="text-h2 text-peligro font-numero">
                ${stats.gastosTotal.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Utilidad</p>
              <p className={`text-h2 font-numero ${stats.utilidad >= 0 ? "text-exito" : "text-peligro"}`}>
                ${stats.utilidad.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Productos</p>
              <p className="text-h2 text-primario font-numero">
                {stats.productosCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Clientes</p>
              <p className="text-h2 text-primario font-numero">
                {stats.clientesCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Margen</p>
              <p className="text-h2 text-secundario font-numero">
                {stats.ventasTotal > 0
                  ? ((stats.utilidad / stats.ventasTotal) * 100).toFixed(2)
                  : "0.00"}
                %
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ventas vs Gastos (últimos 7 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {datosGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="fecha" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="Ventas" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Gastos" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-neutro-medio">Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
