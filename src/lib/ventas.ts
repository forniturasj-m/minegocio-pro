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
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Transaccion, TransaccionItem } from "@/types";

export interface VentaData {
  items: TransaccionItem[];
  montoTotal: number;
  montoDescuento?: number;
  metodoPago: "efectivo" | "tarjeta" | "transferencia" | "otro";
  referencia?: string;
  notas?: string;
}

export async function crearVenta(
  negocioId: string,
  usuarioId: string,
  venta: VentaData
): Promise<string> {
  const ref = doc(collection(db, "negocios", negocioId, "transacciones"));
  await setDoc(ref, {
    tipo: "venta",
    ...venta,
    estado: "pendiente",
    usuarioId,
    fecha: serverTimestamp(),
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function completarVenta(
  negocioId: string,
  ventaId: string
) {
  const ref = doc(db, "negocios", negocioId, "transacciones", ventaId);
  await updateDoc(ref, {
    estado: "completada",
    actualizadoEn: serverTimestamp(),
  });
}

export async function cancelarVenta(
  negocioId: string,
  ventaId: string
) {
  const ref = doc(db, "negocios", negocioId, "transacciones", ventaId);
  await updateDoc(ref, {
    estado: "cancelada",
    actualizadoEn: serverTimestamp(),
  });
}

export async function obtenerVentas(
  negocioId: string,
  limite: number = 100
): Promise<Transaccion[]> {
  const q = query(
    collection(db, "negocios", negocioId, "transacciones"),
    where("tipo", "==", "venta"),
    orderBy("creadoEn", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.slice(0, limite).map((doc) => ({
    id: doc.id,
    ...doc.data(),
    fecha: doc.data().fecha?.toDate?.() || new Date(),
    creadoEn: doc.data().creadoEn?.toDate?.() || new Date(),
  } as Transaccion));
}

export async function obtenerVentasPorFecha(
  negocioId: string,
  desde: Date,
  hasta: Date
): Promise<Transaccion[]> {
  const q = query(
    collection(db, "negocios", negocioId, "transacciones"),
    where("tipo", "==", "venta"),
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

export function calcularTotalVentas(ventas: Transaccion[]): number {
  return ventas.reduce((total, venta) => total + (venta.montoTotal || 0), 0);
}

export function calcularPromedioVentas(ventas: Transaccion[]): number {
  if (ventas.length === 0) return 0;
  return calcularTotalVentas(ventas) / ventas.length;
}
