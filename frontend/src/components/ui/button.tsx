import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Buttons for a card room. Variants are named for the job they do at the table,
// not for shadcn's light-theme defaults:
//   primary   – brass, the one main action on screen (Raise/Bet, Sit down, Rebuy)
//   secondary – a raised neutral for the safe action (Call, Check)
//   quiet     – recedes; for actions you rarely want to rush (Fold)
//   outline   – hairline neutral, for leaving or applying (Leave table, Apply)
//   danger    – clay outline, for the irreversible one (All-in)
//   ghost     – icon-only chrome (history, close)
// Depth on dark comes from a 1px top highlight, never a glow.
const buttonVariants = cva(
  [
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium tabular-nums",
    "transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:size-[18px] [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-brass-400 font-semibold text-brass-ink shadow-[inset_0_1px_0_rgba(255,244,214,0.45)] hover:bg-brass-300",
        secondary:
          "bg-slate-700 text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-slate-600",
        quiet: "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100",
        outline: "border border-white/10 bg-slate-900 text-slate-100 hover:bg-slate-800",
        danger: "border border-clay-500/50 bg-transparent text-clay-300 hover:bg-clay-500/10",
        ghost: "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-9 rounded-lg px-4 text-sm",
        lg: "h-10 rounded-lg px-5 text-sm",
        icon: "h-9 w-9 rounded-lg",
        "icon-sm": "h-7 w-7 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        // Never submit a form by accident; callers opt in with type="submit".
        type={asChild ? type : (type ?? "button")}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
