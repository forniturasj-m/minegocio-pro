import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Transaccion } from "@/types";

export interface GastoData {
  concepto: string;
  categoria: "operativo" | "personal" | "suministros" | "mantenimiento" | "otro";
  monto: number;
  fecha: Date;
  descripcion?: string;
  comprobante?: string;
}

export async function crearGasto(
  negocioId: string,
  usuarioId: string,
  gasto: GastoData
): Promise<string> {
  const ref = doc(collection(db, "negocios", negocioId, "transacciones"));
  await setDoc(ref, {
    tipo: "gasto",
    montoTotal: gasto.monto,
    ...gasto,
    fecha: gasto.fecha,
    estado: "completada",
    usuarioId,
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function actualizarGasto(
  negocioId: string,
  gastoId: string,
  datos: Partial<GastoData>
) {
  const ref = doc(db, "negocios", negocioId, "transacciones", gastoId);
  await updateDoc(ref, {
    ...datos,
    montoTotal: datos.monto || undefined,
    actualizadoEn: serverTimestamp(),
  });
}

export async function eliminarGasto(
  negocioId: string,
  gastoId: string
) {
  const ref = doc(db, "negocios", negocioId, "transacciones", gastoId);
  await updateDoc(ref, {
    estado: "cancelada",
    actualizadoEn: serverTimestamp(),
  });
}

export async function obtenerGastos(
  negocioId: string,
  limite: number = 100
): Promise<Transaccion[]> {
  const q = query(
    collection(db, "negocios", negocioId, "transacciones"),
    where("tipo", "==", "gasto"),
    orderBy("fecha", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.slice(0, limite).map((doc) => ({
    id: doc.id,
    ...doc.data(),
    fecha: doc.data().fecha?.toDate?.() || new Date(),
    creadoEn: doc.data().creadoEn?.toDate?.() || new Date(),
  } as Transaccion));
}

export async function obtenerGastosPorFecha(
  negocioId: string,
  desde: Date,
  hasta: Date
): Promise<Transaccion[]> {
  const q = query(
    collection(db, "negocios", negocioId, "transacciones"),
    where("tipo", "==", "gasto"),
    where("fecha", ">=", desde),
    where("fecha", "<=", hasta),
    orderBy("fecha", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    fecha: doc.data().fecha?.toDate?.() || new Date(),
    creadoEn: doc.data().creadoEn?.toDate?.() || new Date(),
  } as Transaccion));
}

export function calcularTotalGastos(gastos: Transaccion[]): number {
  return gastos.reduce((total, gasto) => total + (gasto.montoTotal || 0), 0);
}

export function agruparGastosPorCategoria(gastos: Transaccion[]): Record<string, number> {
  const agrupados: Record<string, number> = {};
  gastos.forEach((gasto) => {
    const categoria = (gasto as any).categoria || "otro";
    agrupados[categoria] = (agrupados[categoria] || 0) + (gasto.montoTotal || 0);
  });
  return agrupados;
}
