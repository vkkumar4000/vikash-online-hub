import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-cyber",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-cyber-border bg-transparent hover:bg-cyber-card hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-purple",
        ghost: "hover:bg-cyber-card hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cyber: "bg-gradient-cyber text-cyber-dark font-bold hover:shadow-cyber hover:scale-105 transition-all duration-300",
        hero: "bg-gradient-cyber text-cyber-dark font-bold text-lg px-8 py-4 hover:shadow-cyber hover:scale-105 animate-glow transition-all duration-300",
        glow: "bg-cyber-card border-2 border-cyber-glow text-cyber-glow hover:bg-cyber-glow hover:text-cyber-dark hover:shadow-cyber transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };