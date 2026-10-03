"use client";

import { forwardRef } from "react";
import { buttonClasses, type ButtonVariant, type ButtonSize } from "./button-styles";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { buttonClasses };