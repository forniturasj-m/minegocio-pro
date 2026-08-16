import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface CambioPrecios {
  productoId: string;
  precioAnterior: number;
  precioNuevo: number;
  costoAnterior: number;
  costoNuevo: number;
  cambioPorcentaje: number;
  motivo?: string;
  usuarioId: string;
}

export async function registrarCambioPrecio(
  negocioId: string,
  cambio: CambioPrecios
) {
  const ref = doc(db, "negocios", negocioId, "historialPrecios");
  await setDoc(ref, {
    ...cambio,
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

export function calcularCambioPorcentaje(anterior: number, nuevo: number): number {
  if (anterior === 0) return 0;
  return ((nuevo - anterior) / anterior) * 100;
}
