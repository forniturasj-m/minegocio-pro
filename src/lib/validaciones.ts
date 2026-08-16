/**
 * VALIDACIONES CENTRALIZADAS
 * Reglas exactas según TREINTA_QA_SPECIFICATION_V2
 */

export const LIMITES = {
  NOMBRE_PRODUCTO: { min: 3, max: 255 },
  PRECIO: { min: 0.01, max: 9999999.99, decimales: 2 },
  CANTIDAD: { min: 0, max: 1000000 },
  CODIGO_BARRAS: { min: 8, max: 13 },
  DESCRIPCION: { max: 1000 },
  IMPUESTO: { min: 0, max: 100 },
  MARGEN_PRECIO: { min: 1, max: 99 },
} as const;

export interface ErrorValidacion {
  campo: string;
  mensaje: string;
  tipo: "error" | "warning";
}

export function validarProducto(p: any): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];

  if (!p.nombre || p.nombre.trim().length === 0) {
    errores.push({ campo: "nombre", mensaje: "Este campo es obligatorio", tipo: "error" });
  } else {
    const nombre = p.nombre.trim();
    if (nombre.length < LIMITES.NOMBRE_PRODUCTO.min) {
      errores.push({ campo: "nombre", mensaje: `Mínimo ${LIMITES.NOMBRE_PRODUCTO.min} caracteres`, tipo: "error" });
    }
    if (nombre.length > LIMITES.NOMBRE_PRODUCTO.max) {
      errores.push({ campo: "nombre", mensaje: `Máximo ${LIMITES.NOMBRE_PRODUCTO.max} caracteres`, tipo: "error" });
    }
    if (/[<>"'&]/.test(nombre)) {
      errores.push({ campo: "nombre", mensaje: "Caracteres no permitidos: < > \" ' &", tipo: "error" });
    }
  }

  if (p.precioVenta === undefined || p.precioVenta === null || p.precioVenta === "") {
    errores.push({ campo: "precioVenta", mensaje: "Este campo es obligatorio", tipo: "error" });
  } else {
    const precio = Number(p.precioVenta);
    if (isNaN(precio)) {
      errores.push({ campo: "precioVenta", mensaje: "Ingresa un valor válido", tipo: "error" });
    } else {
      if (precio < LIMITES.PRECIO.min) {
        errores.push({ campo: "precioVenta", mensaje: `Mínimo ${LIMITES.PRECIO.min}`, tipo: "error" });
      }
      if (precio > LIMITES.PRECIO.max) {
        errores.push({ campo: "precioVenta", mensaje: "El precio no puede ser mayor a 9,999,999.99", tipo: "error" });
      }
      if (!/^\d+(\.\d{1,2})?$/.test(String(p.precioVenta))) {
        errores.push({ campo: "precioVenta", mensaje: "Máximo 2 decimales", tipo: "error" });
      }
    }
  }

  if (p.costoUnitario === undefined || p.costoUnitario === null || p.costoUnitario === "") {
    errores.push({ campo: "costoUnitario", mensaje: "Este campo es obligatorio", tipo: "error" });
  } else {
    const costo = Number(p.costoUnitario);
    if (isNaN(costo) || costo < LIMITES.PRECIO.min || costo > LIMITES.PRECIO.max) {
      errores.push({ campo: "costoUnitario", mensaje: `Debe estar entre ${LIMITES.PRECIO.min} y 9,999,999.99`, tipo: "error" });
    }
  }

  if (p.cantidadDisponible !== undefined && p.cantidadDisponible !== null && p.cantidadDisponible !== "") {
    const cantidad = Number(p.cantidadDisponible);
    if (!Number.isInteger(cantidad)) {
      errores.push({ campo: "cantidadDisponible", mensaje: "Debe ser número entero", tipo: "error" });
    } else if (cantidad < LIMITES.CANTIDAD.min || cantidad > LIMITES.CANTIDAD.max) {
      errores.push({ campo: "cantidadDisponible", mensaje: `Entre ${LIMITES.CANTIDAD.min} y ${LIMITES.CANTIDAD.max.toLocaleString()}`, tipo: "error" });
    }
  }

  if (p.codigoBarras && p.codigoBarras.trim().length > 0) {
    const codigo = p.codigoBarras.trim();
    if (codigo.length < LIMITES.CODIGO_BARRAS.min) {
      errores.push({ campo: "codigoBarras", mensaje: `Mínimo ${LIMITES.CODIGO_BARRAS.min} caracteres (EAN-8)`, tipo: "error" });
    } else if (codigo.length > LIMITES.CODIGO_BARRAS.max) {
      errores.push({ campo: "codigoBarras", mensaje: `Máximo ${LIMITES.CODIGO_BARRAS.max} caracteres (EAN-13)`, tipo: "error" });
    } else if (!/^\d+$/.test(codigo)) {
      errores.push({ campo: "codigoBarras", mensaje: "Solo números permitidos", tipo: "error" });
    }
  }

  if (p.descripcion && p.descripcion.length > LIMITES.DESCRIPCION.max) {
    errores.push({ campo: "descripcion", mensaje: `Máximo ${LIMITES.DESCRIPCION.max} caracteres`, tipo: "error" });
  }

  if (p.precioVenta && p.costoUnitario) {
    const precio = Number(p.precioVenta);
    const costo = Number(p.costoUnitario);
    if (!isNaN(precio) && !isNaN(costo) && costo > precio) {
      errores.push({ campo: "precioVenta", mensaje: "El costo es mayor que el precio de venta", tipo: "warning" });
    }
  }

  return errores;
}

export function validarTransaccion(t: any): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];

  const tiposValidos = ["venta", "gasto", "compra"];
  if (!t.tipo || !tiposValidos.includes(t.tipo)) {
    errores.push({ campo: "tipo", mensaje: "Selecciona un tipo válido", tipo: "error" });
  }

  if (!t.fecha) {
    errores.push({ campo: "fecha", mensaje: "Este campo es obligatorio", tipo: "error" });
  } else {
    const fecha = new Date(t.fecha);
    if (isNaN(fecha.getTime())) {
      errores.push({ campo: "fecha", mensaje: "Fecha inválida", tipo: "error" });
    } else if (fecha > new Date()) {
      errores.push({ campo: "fecha", mensaje: "No puede ser fecha futura", tipo: "error" });
    }
  }

  if (!t.montoTotal && t.montoTotal !== 0) {
    errores.push({ campo: "montoTotal", mensaje: "Este campo es obligatorio", tipo: "error" });
  } else {
    const monto = Number(t.montoTotal);
    if (isNaN(monto) || monto <= 0) {
      errores.push({ campo: "montoTotal", mensaje: "Debe ser mayor a 0", tipo: "error" });
    }
  }

  if (t.tipo === "venta" && (!t.items || !Array.isArray(t.items) || t.items.length === 0)) {
    errores.push({ campo: "items", mensaje: "Debe haber al menos un producto", tipo: "error" });
  }

  return errores;
}

export function validarCostoOperativo(c: any): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];

  if (!c.fecha) {
    errores.push({ campo: "fecha", mensaje: "Este campo es obligatorio", tipo: "error" });
  } else {
    const fecha = new Date(c.fecha);
    if (fecha > new Date()) {
      errores.push({ campo: "fecha", mensaje: "No puede ser fecha futura", tipo: "error" });
    }
  }

  if (!c.productosComprados || c.productosComprados <= 0) {
    errores.push({ campo: "productosComprados", mensaje: "Debe ser mayor a 0", tipo: "error" });
  } else if (!Number.isInteger(c.productosComprados)) {
    errores.push({ campo: "productosComprados", mensaje: "Debe ser número entero", tipo: "error" });
  }

  const camposCosto = ["peajes", "combustible", "estacionamiento", "desgasteVehicular", "horaTrabajoCosto"];
  for (const campo of camposCosto) {
    const valor = c[campo];
    if (valor !== undefined && valor !== null && valor !== "") {
      const num = Number(valor);
      if (isNaN(num)) {
        errores.push({ campo, mensaje: "Debe ser un número válido", tipo: "error" });
      } else if (num < 0) {
        errores.push({ campo, mensaje: "No puede ser negativo", tipo: "error" });
      }
    }
  }

  return errores;
}

export function mostrarErroresValidacion(errores: ErrorValidacion[], toast: any): boolean {
  if (errores.length === 0) return true;

  const criticos = errores.filter((e) => e.tipo === "error");
  const warnings = errores.filter((e) => e.tipo === "warning");

  criticos.forEach((err) => toast.error(`${err.campo}: ${err.mensaje}`));
  warnings.forEach((adv) => toast.warning(adv.mensaje));

  return criticos.length === 0;
}

export function calcularPrecioSugerido(costoReal: number, margenPorcentaje: number): number {
  if (margenPorcentaje <= 0 || margenPorcentaje >= 100) {
    throw new Error("El margen debe estar entre 1% y 99%");
  }
  const margenDecimal = margenPorcentaje / 100;
  const precio = costoReal / (1 - margenDecimal);
  return Math.round(precio * 100) / 100;
}
