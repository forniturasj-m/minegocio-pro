import * as XLSX from "xlsx";

export interface FilaImportacion {
  codigo?: string;
  nombre?: string;
  precioActual?: number;
  precioNuevo?: number;
  cantidad?: number;
  error?: string;
}

export async function parsearArchivoExcel(archivo: File): Promise<FilaImportacion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
        const filas = XLSX.utils.sheet_to_json<FilaImportacion>(primeraHoja);
        resolve(filas);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(archivo);
  });
}

export function validarFilasImportacion(filas: FilaImportacion[]): {
  validas: FilaImportacion[];
  conErrores: FilaImportacion[];
} {
  const validas: FilaImportacion[] = [];
  const conErrores: FilaImportacion[] = [];

  filas.forEach((fila) => {
    const errores: string[] = [];

    if (!fila.nombre) errores.push("Falta nombre del producto");
    if (!fila.precioNuevo || fila.precioNuevo <= 0) errores.push("Precio inválido");
    if (fila.precioNuevo && fila.precioNuevo > 9999999.99) errores.push("Precio demasiado alto");

    if (errores.length > 0) {
      conErrores.push({ ...fila, error: errores.join("; ") });
    } else {
      validas.push(fila);
    }
  });

  return { validas, conErrores };
}
