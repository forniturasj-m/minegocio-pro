"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import { validarProducto } from "@/lib/validaciones";
import { Producto } from "@/types";

interface FormProductoProps {
  abierto: boolean;
  alCerrar: () => void;
  onGuardar: (producto: any) => Promise<void>;
  productoInicial?: Producto;
}

export function FormProducto({
  abierto,
  alCerrar,
  onGuardar,
  productoInicial,
}: FormProductoProps) {
  const [cargando, setCargando] = useState(false);
  const [datos, setDatos] = useState({
    nombre: productoInicial?.nombre || "",
    descripcion: productoInicial?.descripcion || "",
    precioVenta: productoInicial?.precioVenta || "",
    costoUnitario: productoInicial?.costoUnitario || "",
    cantidadDisponible: productoInicial?.cantidadDisponible || 0,
    codigoBarras: productoInicial?.codigoBarras || "",
    categoria: productoInicial?.categoria || "",
  });

  const manejarGuardar = async () => {
    const errores = validarProducto(datos);
    if (errores.length > 0) {
      errores.forEach((e) => toast.error(`${e.campo}: ${e.mensaje}`));
      return;
    }

    setCargando(true);
    try {
      await onGuardar({
        ...datos,
        precioVenta: Number(datos.precioVenta),
        costoUnitario: Number(datos.costoUnitario),
        activo: true,
      });
      toast.success(productoInicial ? "Producto actualizado" : "Producto creado");
      setDatos({
        nombre: "",
        descripcion: "",
        precioVenta: "",
        costoUnitario: "",
        cantidadDisponible: 0,
        codigoBarras: "",
        categoria: "",
      });
      alCerrar();
    } catch (e) {
      toast.error("Error al guardar");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={productoInicial ? "Editar Producto" : "Nuevo Producto"}
      footer={
        <>
          <Button variant="ghost" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button onClick={manejarGuardar} disabled={cargando}>
            {cargando ? "Guardando..." : "Guardar"}
          </Button>
        </>
      }
    >
      <div className="space-y-md">
        <Input
          label="Nombre del producto"
          value={datos.nombre}
          onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
          required
        />
        <Input
          label="Descripción"
          value={datos.descripcion}
          onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })}
        />
        <Input
          label="Precio de venta"
          type="number"
          step="0.01"
          value={datos.precioVenta}
          onChange={(e) => setDatos({ ...datos, precioVenta: e.target.value })}
          required
        />
        <Input
          label="Costo unitario"
          type="number"
          step="0.01"
          value={datos.costoUnitario}
          onChange={(e) => setDatos({ ...datos, costoUnitario: e.target.value })}
          required
        />
        <Input
          label="Cantidad disponible"
          type="number"
          value={datos.cantidadDisponible}
          onChange={(e) =>
            setDatos({ ...datos, cantidadDisponible: Number(e.target.value) })
          }
        />
        <Input
          label="Código de barras"
          value={datos.codigoBarras}
          onChange={(e) => setDatos({ ...datos, codigoBarras: e.target.value })}
        />
        <Input
          label="Categoría"
          value={datos.categoria}
          onChange={(e) => setDatos({ ...datos, categoria: e.target.value })}
        />
      </div>
    </Modal>
  );
}
