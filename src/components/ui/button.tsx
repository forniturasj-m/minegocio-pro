import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "xl";
}

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-primario text-white hover:bg-primario-hover active:bg-primario-active active:shadow-[0_2px_4px_inset_rgba(0,0,0,0.2)] focus-visible:ring-primario",
      secondary: "bg-transparent border border-primario text-primario hover:bg-[#F0F7FF] active:bg-[#E6F0FF]",
      outline: "border border-neutro-borde bg-white text-neutro-oscuro hover:bg-neutro-claro",
      ghost: "text-neutro-oscuro hover:bg-neutro-claro",
      danger: "bg-peligro text-white hover:bg-peligro-hover active:bg-peligro-active",
      success: "bg-exito text-white hover:bg-exito-hover active:bg-exito-active",
    };

    const sizes = {
      sm: "h-8 px-3 text-caption",
      md: "h-10 px-4 text-body-sm",
      lg: "h-11 px-5 text-body-sm",
      xl: "h-12 px-6 text-body",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
