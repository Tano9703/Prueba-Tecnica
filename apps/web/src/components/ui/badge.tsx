import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "border-tertiary/30 bg-tertiary/18 text-tertiary",
        success: "border-quaternary/35 bg-quaternary/15 text-quaternary",
        warning: "border-quaternary/35 bg-quaternary/15 text-quaternary",
        danger: "border-quinary/35 bg-quinary/15 text-quinary",
        info: "border-tertiary/35 bg-tertiary/20 text-tertiary",
        dark: "border-primary bg-primary text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

