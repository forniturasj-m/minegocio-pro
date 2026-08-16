import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Producto } from "@/types";

export async function crearProducto(
  negocioId: string,
  producto: Omit<Producto, "id" | "creadoEn" | "actualizadoEn">
): Promise<string> {
  const ref = doc(collection(db, "negocios", negocioId, "productos"));
  await setDoc(ref, {
    ...producto,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function actualizarProducto(
  negocioId: string,
  productoId: string,
  datos: Partial<Producto>
) {
  const ref = doc(db, "negocios", negocioId, "productos", productoId);
  await updateDoc(ref, {
    ...datos,
    actualizadoEn: serverTimestamp(),
  });
}

export async function eliminarProducto(negocioId: string, productoId: string) {
  const ref = doc(db, "negocios", negocioId, "productos", productoId);
  await deleteDoc(ref);
}

export async function obtenerProductos(negocioId: string): Promise<Producto[]> {
  const q = query(
    collection(db, "negocios", negocioId, "productos"),
    where("activo", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    creadoEn: doc.data().creadoEn?.toDate?.() || new Date(),
    actualizadoEn: doc.data().actualizadoEn?.toDate?.() || new Date(),
  } as Producto));
}

export async function buscarProductoPorCodigo(
  negocioId: string,
  codigo: string
): Promise<Producto | null> {
  const q = query(
    collection(db, "negocios", negocioId, "productos"),
    where("codigoBarras", "==", codigo)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    creadoEn: doc.data().creadoEn?.toDate?.() || new Date(),
    actualizadoEn: doc.data().actualizadoEn?.toDate?.() || new Date(),
  } as Producto;
}

export async function actualizarStockProducto(
  negocioId: string,
  productoId: string,
  cantidad: number
) {
  const ref = doc(db, "negocios", negocioId, "productos", productoId);
  await updateDoc(ref, {
    cantidadDisponible: cantidad,
    actualizadoEn: serverTimestamp(),
  });
}
