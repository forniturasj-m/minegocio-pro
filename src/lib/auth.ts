import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const googleProvider = new GoogleAuthProvider();

export async function registrarConEmail(
  nombre: string,
  nombreNegocio: string,
  email: string,
  password: string
) {
  if (nombre.trim().length < 3) throw new Error("El nombre debe tener al menos 3 caracteres");
  if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");

  const credencial = await createUserWithEmailAndPassword(auth, email, password);
  const usuario = credencial.user;

  await updateProfile(usuario, { displayName: nombre });

  const negocioId = await crearNegocioInicial(usuario.uid, nombreNegocio);
  await crearDocumentoUsuario(usuario.uid, nombre, email, negocioId, "dueno");

  return { usuario, negocioId };
}

export async function loginConEmail(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function loginConGoogle() {
  const resultado = await signInWithPopup(auth, googleProvider);
  const usuario = resultado.user;

  const docUsuario = await getDoc(doc(db, "usuarios", usuario.uid));
  if (!docUsuario.exists()) {
    const negocioId = await crearNegocioInicial(
      usuario.uid,
      usuario.displayName ? `${usuario.displayName} - Mi Negocio` : "Mi Negocio"
    );
    await crearDocumentoUsuario(
      usuario.uid,
      usuario.displayName || "Usuario",
      usuario.email || "",
      negocioId,
      "dueno"
    );
  }

  return resultado;
}

export async function recuperarContrasena(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function cerrarSesion() {
  await signOut(auth);
}

export function observarAuth(callback: (usuario: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

async function crearNegocioInicial(uid: string, nombreNegocio: string): Promise<string> {
  const refNegocio = doc(db, "negocios");
  await setDoc(refNegocio, {
    uid,
    nombre: nombreNegocio,
    moneda: "COP",
    config: { sheetsUrl: null, sincronizacionActiva: false },
    _version: 3,
    _creadoEn: serverTimestamp(),
    _actualizadoEn: serverTimestamp(),
  });
  return refNegocio.id;
}

async function crearDocumentoUsuario(
  uid: string,
  nombre: string,
  email: string,
  negocioId: string,
  rol: string
) {
  await setDoc(doc(db, "usuarios", uid), {
    nombre,
    email,
    negocioId,
    rol,
    _version: 3,
    _creadoEn: serverTimestamp(),
  });
}
