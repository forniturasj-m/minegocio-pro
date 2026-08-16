import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Cliente } from "@/types";

export async function crearCliente(
  negocioId: string,
  cliente: Omit<Cliente, "id" | "creadoEn">
): Promise<string> {
  const ref = doc(collection(db, "negocios", negocioId, "clientes"));
  await setDoc(ref, {
    ...cliente,
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function actualizarCliente(
  negocioId: string,
  clienteId: string,
  datos: Partial<Cliente>
) {
  const ref = doc(db, "negocios", negocioId, "clientes", clienteId);
  await updateDoc(ref, datos);
}

export async function eliminarCliente(
  negocioId: string,
  clienteId: string
) {
  const ref = doc(db, "negocios", negocioId, "clientes", clienteId);
  await deleteDoc(ref);
}

export async function obtenerClientes(negocioId: string): Promise<Cliente[]> {
  const q = query(collection(db, "negocios", negocioId, "clientes"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    creadoEn: doc.data().creadoEn?.toDate?.() || new Date(),
  } as Cliente));
}

export async function buscarClientePorEmail(
  negocioId: string,
  email: string
): Promise<Cliente | null> {
  const clientes = await obtenerClientes(negocioId);
  return clientes.find((c) => c.email === email) || null;
}

export async function buscarClientePorTelefono(
  negocioId: string,
  telefono: string
): Promise<Cliente | null> {
  const clientes = await obtenerClientes(negocioId);
  return clientes.find((c) => c.telefono === telefono) || null;
}
