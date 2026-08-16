"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginConEmail, loginConGoogle, recuperarContrasena } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, Chrome } from "lucide-react";

export default function PaginaLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarLogin = async () => {
    setCargando(true);
    try {
      const resultado = await loginConEmail(email, password);
      // Esperar a que el token esté listo antes de redirigir
      await resultado.user.getIdToken();
      toast.success("Bienvenido de nuevo");
      router.push("/dashboard");
    } catch (e: any) {
      const mensajes: Record<string, string> = {
        "auth/user-not-found": "No existe una cuenta con este correo",
        "auth/wrong-password": "Contraseña incorrecta",
        "auth/invalid-email": "Correo inválido",
        "auth/too-many-requests": "Demasiados intentos. Espera un momento",
      };
      toast.error(mensajes[e.code] || "Error al iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  const manejarGoogle = async () => {
    setCargando(true);
    try {
      const resultado = await loginConGoogle();
      // Esperar a que el token esté listo antes de redirigir
      await resultado.user.getIdToken();
      toast.success("Bienvenido");
      router.push("/dashboard");
    } catch (e) {
      toast.error("Error al iniciar con Google");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutro-claro flex items-center justify-center p-md">
      <div className="bg-white rounded-lg shadow-normal w-full max-w-[420px] p-xl">
        <h1 className="text-h1 text-center mb-sm text-neutro-oscuro">MiNegocio</h1>
        <p className="text-center text-neutro-medio mb-xl">Inicia sesión para gestionar tu negocio</p>

        <div className="space-y-md">
          <Input
            type="email"
            label="Correo electrónico"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button className="w-full" onClick={manejarLogin} disabled={cargando}>
            {cargando ? "Iniciando..." : "Iniciar sesión"}
          </Button>
          <button
            onClick={async () => {
              await recuperarContrasena(email);
              toast.success("Revisa tu correo");
            }}
            className="w-full text-body-sm text-primario hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <div className="flex items-center gap-md my-lg">
          <div className="flex-1 h-px bg-neutro-borde" />
          <span className="text-body-sm text-neutro-medio">o</span>
          <div className="flex-1 h-px bg-neutro-borde" />
        </div>

        <Button variant="outline" className="w-full" onClick={manejarGoogle} disabled={cargando}>
          <Chrome className="h-4 w-4 mr-sm" /> Continuar con Google
        </Button>

        <p className="text-center text-body-sm text-neutro-medio mt-lg">
          ¿No tienes cuenta?{" "}
          <a href="/registro" className="text-primario font-semibold hover:underline">
            Regístrate gratis
          </a>
        </p>
      </div>
    </div>
  );
}
