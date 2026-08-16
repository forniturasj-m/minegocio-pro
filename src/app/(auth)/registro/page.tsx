"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarConEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function PaginaRegistro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarRegistro = async () => {
    if (!nombre || !nombreNegocio || !email || !password) {
      toast.error("Completa todos los campos");
      return;
    }

    setCargando(true);
    try {
      const { usuario } = await registrarConEmail(nombre, nombreNegocio, email, password);
      // Esperar a que el usuario tenga un token válido antes de redirigir
      await usuario.getIdToken();
      toast.success("Cuenta creada exitosamente");
      router.push("/dashboard");
    } catch (e: any) {
      const mensajes: Record<string, string> = {
        "auth/email-already-in-use": "Este correo ya está registrado",
        "auth/weak-password": "La contraseña es muy débil",
      };
      toast.error(mensajes[e.code] || "Error al registrarse");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutro-claro flex items-center justify-center p-md">
      <div className="bg-white rounded-lg shadow-normal w-full max-w-[420px] p-xl">
        <h1 className="text-h1 text-center mb-sm text-neutro-oscuro">MiNegocio</h1>
        <p className="text-center text-neutro-medio mb-xl">Crea tu cuenta gratis</p>

        <div className="space-y-md">
          <Input
            type="text"
            label="Tu nombre"
            placeholder="Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <Input
            type="text"
            label="Nombre del negocio"
            placeholder="Mi Tienda"
            value={nombreNegocio}
            onChange={(e) => setNombreNegocio(e.target.value)}
            required
          />
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
          <Button className="w-full" onClick={manejarRegistro} disabled={cargando}>
            {cargando ? "Registrando..." : "Registrarse"}
          </Button>
        </div>

        <p className="text-center text-body-sm text-neutro-medio mt-lg">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-primario font-semibold hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
