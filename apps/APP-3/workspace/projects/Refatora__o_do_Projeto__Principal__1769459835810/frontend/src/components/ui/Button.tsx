
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-gold-500 text-black hover:bg-gold-400 border-transparent",
      outline: "bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-gold-500/50",
      ghost: "bg-transparent text-slate-400 hover:text-white"
    }

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium tracking-widest uppercase transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-500 disabled:pointer-events-none disabled:opacity-50 h-12 px-8 py-2",
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

===FILE: frontend/src/components/Navbar.tsx===
LANGUAGE: typescript
