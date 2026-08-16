export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precioVenta: number;
  costoUnitario: number;
  cantidadDisponible: number;
  codigoBarras?: string;
  imagenes?: string[];
  categoria?: string;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface Transaccion {
  id: string;
  tipo: "venta" | "gasto" | "compra";
  fecha: Date;
  montoTotal: number;
  items?: TransaccionItem[];
  estado: "pendiente" | "completada" | "cancelada";
  creadoEn: Date;
}

export interface TransaccionItem {
  productoId: string;
  cantidad: number;
  precioUnitarioMomentoVenta?: number;
  subtotal?: number;
}

export interface Cliente {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  creadoEn: Date;
}

export interface Negocio {
  id: string;
  uid: string;
  nombre: string;
  moneda: string;
  config?: {
    sheetsUrl?: string;
    sincronizacionActiva?: boolean;
  };
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  negocioId: string;
  rol: "dueno" | "empleado" | "admin";
  creadoEn: Date;
}
