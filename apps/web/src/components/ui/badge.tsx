import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "border-slate-200 bg-slate-100 text-slate-700",
        success: "border-[#86efac] bg-[#DCFCE7] text-[#166534]",
        warning: "border-[#fdba74] bg-[#FFEDD5] text-[#9A3412]",
        danger: "border-[#fca5a5] bg-[#FEE2E2] text-[#991B1B]",
        info: "border-[#c7d2fe] bg-[#E0E7FF] text-[#3730A3]",
        dark: "border-[#0B1739] bg-[#0B1739] text-white",
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
