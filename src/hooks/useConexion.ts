"use client";
import { useEffect, useState } from "react";

export function useConexion() {
  const [conectado, setConectado] = useState(true);

  useEffect(() => {
    const handleOnline = () => setConectado(true);
    const handleOffline = () => setConectado(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setConectado(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return conectado;
}
