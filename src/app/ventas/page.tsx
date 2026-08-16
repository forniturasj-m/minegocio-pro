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
import { obtenerVentas, crearVenta, cancelarVenta, calcularTotalVentas } from "@/lib/ventas";
import { obtenerProductos } from "@/lib/productos";
import { Transaccion, Producto } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PaginaVentas() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Transaccion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [negocioId, setNegocioId] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta" | "transferencia" | "otro">("efectivo");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState("");

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
          await Promise.all([cargarVentas(id), cargarProductos(id)]);
        }
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    });

    return unsubscribe;
  }, [router]);

  const cargarVentas = async (id: string) => {
    try {
      const vtas = await obtenerVentas(id);
      setVentas(vtas);
    } catch (e) {
      toast.error("Error al cargar ventas");
    }
  };

  const cargarProductos = async (id: string) => {
    try {
      const prods = await obtenerProductos(id);
      setProductos(prods);
    } catch (e) {
      toast.error("Error al cargar productos");
    }
  };

  const manejarAgregarProducto = () => {
    if (!productoSeleccionado || !cantidad) {
      toast.error("Selecciona producto y cantidad");
      return;
    }

    const prod = productos.find((p) => p.id === productoSeleccionado);
    if (!prod) return;

    const cant = Number(cantidad);
    if (cant > prod.cantidadDisponible) {
      toast.error("Stock insuficiente");
      return;
    }

    const item = {
      productoId: productoSeleccionado,
      cantidad: cant,
      precioUnitarioMomentoVenta: prod.precioVenta,
      subtotal: cant * prod.precioVenta,
      nombreProducto: prod.nombre,
    };

    setItems([...items, item]);
    setProductoSeleccionado("");
    setCantidad("");
  };

  const manejarEliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const manejarCrearVenta = async () => {
    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    try {
      await crearVenta(negocioId, auth.currentUser?.uid || "", {
        items,
        montoTotal: items.reduce((t, i) => t + i.subtotal, 0),
        metodoPago,
      });

      toast.success("Venta creada");
      setItems([]);
      setMetodoPago("efectivo");
      setModalAbierto(false);
      await cargarVentas(negocioId);
    } catch (e) {
      toast.error("Error al crear venta");
    }
  };

  const montoTotal = items.reduce((t, i) => t + i.subtotal, 0);
  const totalVentas = calcularTotalVentas(ventas);

  const datosGrafico = ventas.reduce((acc: any, venta) => {
    const fecha = new Date(venta.creadoEn).toLocaleDateString();
    const existente = acc.find((d: any) => d.fecha === fecha);
    if (existente) {
      existente.total += venta.montoTotal || 0;
      existente.cantidad += 1;
    } else {
      acc.push({ fecha, total: venta.montoTotal || 0, cantidad: 1 });
    }
    return acc;
  }, []);

  if (cargando) {
    return (
      <div className="flex min-h-screen bg-neutro-claro">
        <Sidebar />
        <main className="flex-1 p-xl">
          <p className="text-neutro-medio">Cargando ventas...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutro-claro">
      <Sidebar />
      <main className="flex-1 p-xl space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-h1 text-neutro-oscuro">Ventas</h1>
          <Button onClick={() => setModalAbierto(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nueva Venta
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Total ventas</p>
              <p className="text-h2 text-exito font-numero">
                ${totalVentas.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Cantidad</p>
              <p className="text-h2 text-primario font-numero">{ventas.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Promedio</p>
              <p className="text-h2 text-secundario font-numero">
                ${(totalVentas / (ventas.length || 1)).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {datosGrafico.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ventas por día</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="fecha" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                  <Bar dataKey="total" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Últimas ventas ({ventas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {ventas.length === 0 ? (
              <p className="text-neutro-medio">No hay ventas</p>
            ) : (
              <div className="space-y-sm">
                {ventas.slice(0, 10).map((venta) => (
                  <div key={venta.id} className="flex justify-between p-sm border-b border-neutro-borde">
                    <div>
                      <p className="text-body-sm font-semibold text-neutro-oscuro">
                        {new Date(venta.creadoEn).toLocaleDateString()}
                      </p>
                      <p className="text-caption text-neutro-medio">
                        {venta.items?.length || 0} artículos
                      </p>
                    </div>
                    <p className="text-body-sm font-numero text-exito">
                      ${venta.montoTotal?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Modal
          abierto={modalAbierto}
          alCerrar={() => setModalAbierto(false)}
          titulo="Nueva Venta"
          anchoMax="max-w-[600px]"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={manejarCrearVenta} disabled={items.length === 0}>
                Crear Venta
              </Button>
            </>
          }
        >
          <div className="space-y-md">
            <div className="flex gap-sm">
              <select
                className="flex-1 h-10 px-3 rounded-lg border border-neutro-borde"
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
              >
                <option value="">Selecciona producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} - Stock: {p.cantidadDisponible}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-24"
              />
              <Button onClick={manejarAgregarProducto}>Agregar</Button>
            </div>

            {items.length > 0 && (
              <>
                <div className="space-y-sm border-t border-neutro-borde pt-md">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-sm border border-neutro-borde rounded-lg">
                      <div>
                        <p className="text-body-sm font-semibold">{item.nombreProducto}</p>
                        <p className="text-caption text-neutro-medio">
                          {item.cantidad} x ${item.precioUnitarioMomentoVenta}
                        </p>
                      </div>
                      <div className="flex items-center gap-md">
                        <p className="text-body-sm font-numero">
                          ${item.subtotal.toLocaleString()}
                        </p>
                        <button
                          onClick={() => manejarEliminarItem(i)}
                          className="text-peligro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutro-borde pt-md">
                  <p className="text-body font-semibold flex justify-between">
                    <span>Total:</span>
                    <span className="text-exito">${montoTotal.toLocaleString()}</span>
                  </p>
                </div>

                <select
                  className="w-full h-10 px-3 rounded-lg border border-neutro-borde"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as any)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </>
            )}
          </div>
        </Modal>
      </main>
    </div>
  );
}
