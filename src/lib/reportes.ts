import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ReporteVentas {
  fecha: Date;
  montoTotal: number;
  cantidad: number;
  productos: Array<{
    nombre: string;
    cantidad: number;
    monto: number;
  }>;
}

export function exportarExcel(datos: any[], nombreArchivo: string) {
  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
}

export function exportarPDF(titulo: string, datos: any[], columnas: string[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(titulo, 14, 22);

  const filas = datos.map((item) =>
    columnas.map((col) => item[col] || "")
  );

  autoTable(doc, {
    head: [columnas],
    body: filas,
    startY: 30,
  });

  doc.save(`${titulo}.pdf`);
}
