import * as React from "react";
import { cn } from "./button";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  label?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, success, label, required, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-body-sm font-semibold text-neutro-oscuro mb-sm">
            {label}
            {required && <span className="text-peligro ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-10 px-3 py-2 rounded-lg border bg-white text-body-sm text-neutro-oscuro placeholder:text-[#9CA3AF] transition-all outline-none",
            error
              ? "border-peligro bg-peligro-fondo"
              : success
              ? "border-exito bg-exito-fondo"
              : "border-neutro-borde focus:border-primario focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)]",
            props.disabled && "bg-neutro-claro border-[#CCCCCC] text-[#9CA3AF] cursor-not-allowed opacity-60",
            className
          )}
          {...props}
        />
        {error && <p className="text-caption text-peligro italic mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
