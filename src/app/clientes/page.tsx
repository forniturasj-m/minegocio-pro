"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { obtenerClientes, crearCliente, actualizarCliente, eliminarCliente } from "@/lib/clientes";
import { Cliente } from "@/types";

export default function PaginaClientes() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [negocioId, setNegocioId] = useState("");
  const [filtro, setFiltro] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<Cliente | undefined>();
  const [datos, setDatos] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
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
          await cargarClientes(id);
        }
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    });

    return unsubscribe;
  }, [router]);

  const cargarClientes = async (id: string) => {
    try {
      const clts = await obtenerClientes(id);
      setClientes(clts);
    } catch (e) {
      toast.error("Error al cargar clientes");
    }
  };

  const manejarGuardar = async () => {
    if (!datos.nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }

    try {
      if (clienteEditar) {
        await actualizarCliente(negocioId, clienteEditar.id, datos);
      } else {
        await crearCliente(negocioId, datos);
      }
      toast.success(clienteEditar ? "Cliente actualizado" : "Cliente creado");
      setDatos({ nombre: "", email: "", telefono: "", direccion: "", ciudad: "" });
      setClienteEditar(undefined);
      setModalAbierto(false);
      await cargarClientes(negocioId);
    } catch (e) {
      toast.error("Error al guardar");
    }
  };

  const manejarEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro?")) return;
    try {
      await eliminarCliente(negocioId, id);
      await cargarClientes(negocioId);
      toast.success("Cliente eliminado");
    } catch (e) {
      toast.error("Error al eliminar");
    }
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      c.email?.toLowerCase().includes(filtro.toLowerCase())
  );

  const abrirModal = (cliente?: Cliente) => {
    if (cliente) {
      setClienteEditar(cliente);
      setDatos({
        nombre: cliente.nombre,
        email: cliente.email || "",
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || "",
        ciudad: cliente.ciudad || "",
      });
    } else {
      setClienteEditar(undefined);
      setDatos({ nombre: "", email: "", telefono: "", direccion: "", ciudad: "" });
    }
    setModalAbierto(true);
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen bg-neutro-claro">
        <Sidebar />
        <main className="flex-1 p-xl">
          <p className="text-neutro-medio">Cargando clientes...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutro-claro">
      <Sidebar />
      <main className="flex-1 p-xl space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-h1 text-neutro-oscuro">Clientes</h1>
          <Button onClick={() => abrirModal()}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Cliente
          </Button>
        </div>

        <Input
          placeholder="Buscar por nombre o email..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Total clientes</p>
              <p className="text-h2 text-primario font-numero">{clientes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Con email</p>
              <p className="text-h2 text-exito font-numero">
                {clientes.filter((c) => c.email).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-lg">
              <p className="text-body-sm text-neutro-medio">Con teléfono</p>
              <p className="text-h2 text-secundario font-numero">
                {clientes.filter((c) => c.telefono).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clientes ({clientesFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clientesFiltrados.length === 0 ? (
              <p className="text-neutro-medio">No hay clientes</p>
            ) : (
              <div className="space-y-sm">
                {clientesFiltrados.map((cliente) => (
                  <div key={cliente.id} className="flex justify-between items-start p-md border border-neutro-borde rounded-lg hover:bg-neutro-ultraClaro">
                    <div className="flex-1">
                      <p className="text-body-sm font-semibold text-neutro-oscuro">
                        {cliente.nombre}
                      </p>
                      <div className="flex flex-col gap-xs mt-sm">
                        {cliente.email && (
                          <p className="text-caption text-neutro-medio">{cliente.email}</p>
                        )}
                        {cliente.telefono && (
                          <p className="text-caption text-neutro-medio">{cliente.telefono}</p>
                        )}
                        {cliente.ciudad && (
                          <p className="text-caption text-neutro-medio">{cliente.ciudad}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-sm">
                      <button
                        onClick={() => abrirModal(cliente)}
                        className="text-primario hover:text-primario-hover"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => manejarEliminar(cliente.id)}
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
          titulo={clienteEditar ? "Editar Cliente" : "Nuevo Cliente"}
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={manejarGuardar}>Guardar</Button>
            </>
          }
        >
          <div className="space-y-md">
            <Input
              label="Nombre"
              value={datos.nombre}
              onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={datos.email}
              onChange={(e) => setDatos({ ...datos, email: e.target.value })}
            />
            <Input
              label="Teléfono"
              value={datos.telefono}
              onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
            />
            <Input
              label="Dirección"
              value={datos.direccion}
              onChange={(e) => setDatos({ ...datos, direccion: e.target.value })}
            />
            <Input
              label="Ciudad"
              value={datos.ciudad}
              onChange={(e) => setDatos({ ...datos, ciudad: e.target.value })}
            />
          </div>
        </Modal>
      </main>
    </div>
  );
}
