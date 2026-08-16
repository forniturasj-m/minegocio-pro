"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormProducto } from "@/components/inventario/FormProducto";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto } from "@/lib/productos";
import { Producto } from "@/types";

export default function PaginaInventario() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | undefined>();
  const [negocioId, setNegocioId] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const docSnap = await (
          await import("firebase/firestore")
        ).getDoc(
          (await import("firebase/firestore")).doc(db, "usuarios", user.uid)
        );
        if (docSnap.exists()) {
          const id = docSnap.data().negocioId;
          setNegocioId(id);
          await cargarProductos(id);
        }
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    });

    return unsubscribe;
  }, [router]);

  const cargarProductos = async (id: string) => {
    try {
      const prods = await obtenerProductos(id);
      setProductos(prods);
    } catch (e) {
      toast.error("Error al cargar productos");
    }
  };

  const manejarGuardar = async (datos: any) => {
    if (!negocioId) return;

    try {
      if (productoEditar) {
        await actualizarProducto(negocioId, productoEditar.id, datos);
      } else {
        await crearProducto(negocioId, datos);
      }
      await cargarProductos(negocioId);
      setProductoEditar(undefined);
    } catch (e) {
      toast.error("Error al guardar producto");
    }
  };

  const manejarEliminar = async (id: string) => {
    if (!negocioId) return;
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;

    try {
      await eliminarProducto(negocioId, id);
      await cargarProductos(negocioId);
      toast.success("Producto eliminado");
    } catch (e) {
      toast.error("Error al eliminar");
    }
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      p.codigoBarras?.includes(filtro)
  );

  if (cargando) {
    return (
      <div className="flex min-h-screen bg-neutro-claro">
        <Sidebar />
        <main className="flex-1 p-xl">
          <p className="text-neutro-medio">Cargando inventario...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutro-claro">
      <Sidebar />
      <main className="flex-1 p-xl space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-h1 text-neutro-oscuro">Inventario</h1>
          <Button onClick={() => setModalAbierto(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
          </Button>
        </div>

        <Input
          placeholder="Buscar por nombre o código..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />

        <Card>
          <CardHeader>
            <CardTitle>
              Productos ({productosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productosFiltrados.length === 0 ? (
              <p className="text-neutro-medio">No hay productos</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-body-sm">
                  <thead>
                    <tr className="border-b border-neutro-borde">
                      <th className="text-left p-md">Nombre</th>
                      <th className="text-left p-md">Código</th>
                      <th className="text-right p-md">Precio</th>
                      <th className="text-right p-md">Stock</th>
                      <th className="text-center p-md">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map((p) => (
                      <tr key={p.id} className="border-b border-neutro-borde hover:bg-neutro-claro">
                        <td className="p-md">{p.nombre}</td>
                        <td className="p-md">{p.codigoBarras || "-"}</td>
                        <td className="text-right p-md font-numero">
                          ${p.precioVenta.toLocaleString()}
                        </td>
                        <td className="text-right p-md font-numero">
                          {p.cantidadDisponible}
                        </td>
                        <td className="p-md flex justify-center gap-sm">
                          <button
                            onClick={() => {
                              setProductoEditar(p);
                              setModalAbierto(true);
                            }}
                            className="text-primario hover:text-primario-hover"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => manejarEliminar(p.id)}
                            className="text-peligro hover:text-peligro-hover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <FormProducto
          abierto={modalAbierto}
          alCerrar={() => {
            setModalAbierto(false);
            setProductoEditar(undefined);
          }}
          onGuardar={manejarGuardar}
          productoInicial={productoEditar}
        />
      </main>
    </div>
  );
}
