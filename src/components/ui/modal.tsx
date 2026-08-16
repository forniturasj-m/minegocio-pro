"use client";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "./button";

interface ModalProps {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  anchoMax?: string;
}

export function Modal({ abierto, alCerrar, titulo, children, footer, anchoMax = "max-w-[500px]" }: ModalProps) {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-md"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
      onClick={alCerrar}
    >
      <div
        className={cn(
          "bg-white rounded-lg shadow-modal w-full max-h-[90vh] overflow-y-auto animate-modal-in",
          anchoMax
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-lg border-b border-neutro-borde">
          <h2 className="text-h3 text-neutro-oscuro">{titulo}</h2>
          <button
            onClick={alCerrar}
            className="text-neutro-medio hover:text-neutro-oscuro transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-lg">{children}</div>
        {footer && (
          <div className="flex justify-end gap-md p-md border-t border-neutro-borde bg-neutro-ultraClaro rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
