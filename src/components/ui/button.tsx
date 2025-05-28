
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 hover:scale-105 transform",
  {
    variants: {
      variant: {
        default: "bg-verifyvision-teal text-white hover:bg-verifyvision-teal/90 shadow-md hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-brand-blue-900 text-brand-blue-900 hover:bg-verifyvision-teal hover:text-white hover:border-verifyvision-teal",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-verifyvision-teal hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
        warm: "bg-verifyvision-teal text-white hover:bg-verifyvision-teal/90 shadow-md hover:shadow-lg",
        primary: "bg-verifyvision-teal text-white hover:bg-verifyvision-teal/90 shadow-md hover:shadow-lg",
        gradient: "bg-gradient-to-r from-verifyvision-teal to-verifyvision-blue text-white hover:opacity-90 shadow-md hover:shadow-lg",
        analysis: "bg-verifyvision-teal text-white hover:bg-verifyvision-teal/90 shadow-md hover:shadow-lg",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-amber-500 text-white hover:bg-amber-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-2.5 py-1.5 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        compact: "h-8 px-2 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
