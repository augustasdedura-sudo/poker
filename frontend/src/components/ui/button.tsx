import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Buttons for a card room. Variants are named for the job they do at the table,
// not for shadcn's light-theme defaults:
//   primary   – brass, the one main action on screen (Raise/Bet, Sit down, Rebuy)
//   secondary – a raised neutral for everyday chrome actions
//   call      – a cool slate-blue key for Call / Check
//   quiet     – recedes; for actions you rarely want to rush (Fold)
//   outline   – hairline neutral, for leaving or applying (Leave table, Apply)
//   danger    – filled clay, for the irreversible one (All-in)
//   well      – a small key set inside a recessed well (bet stepper)
//   ghost     – icon-only chrome (history, close)
//
// Material, not effects: every button is a physical key. One 6px radius
// everywhere (no 9999px pills), a 1px lit top edge and a darker bottom edge for
// thickness, and a press that sinks 1px instead of shrinking. No glows, no
// colored shadows — depth is only light and shade.
const buttonVariants = cva(
  [
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium tracking-[0.01em] tabular-nums",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:size-[18px] [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Brass bar: a short top-to-bottom tone shift inside one hue reads as
        // polished metal; the inset top light and bottom shade give it an edge.
        // On press the light flips to an inner shadow, so it feels pushed in.
        primary: [
          // Dark ink with a faint light shadow below: the label looks stamped into the brass.
          "bg-[linear-gradient(180deg,#d6ac5e_0%,#b88e42_100%)] font-bold text-brass-ink [text-shadow:0_1px_0_rgba(255,236,196,0.45)]",
          "shadow-[inset_0_1px_0_rgba(255,240,205,0.55),inset_0_-1px_0_rgba(60,40,10,0.35),0_1px_2px_rgba(0,0,0,0.45)]",
          "hover:bg-[linear-gradient(180deg,#e0b86b_0%,#c29848_100%)]",
          "active:shadow-[inset_0_1px_3px_rgba(60,40,10,0.45)]",
        ].join(" "),
        // Raised slate key with a soft hairline: present, but never competing with brass.
        secondary: [
          "border border-white/[0.08] bg-[#24211d] text-[#ede8df] [text-shadow:0_1px_0_rgba(0,0,0,0.6)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.4)]",
          "hover:border-white/[0.13] hover:bg-[#2c2924]",
          "active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]",
        ].join(" "),
        // Same key, one step lower: a darker face and dimmer label (Fold).
        quiet: [
          "border border-white/[0.06] bg-[#1c1a17] text-[#a9a296] [text-shadow:0_1px_0_rgba(0,0,0,0.6)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.4)]",
          "hover:border-white/[0.11] hover:bg-[#24211d] hover:text-[#ede8df]",
          "active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]",
        ].join(" "),
        outline: "border border-white/10 bg-[#1c1a17] text-[#ede8df] hover:border-white/[0.16] hover:bg-[#24211d]",
        // Deep clay, filled: unmistakably the risky one, but a muted earth red
        // with warm off-white text rather than an alarm-red that shouts.
        danger: [
          "bg-[linear-gradient(180deg,#c4553d_0%,#a8442f_100%)] font-bold text-[#fff6ec] [text-shadow:0_1px_0_rgba(70,18,6,0.55)]",
          "shadow-[inset_0_1px_0_rgba(255,205,185,0.3),inset_0_-1px_0_rgba(60,15,5,0.35),0_1px_2px_rgba(0,0,0,0.45)]",
          "hover:bg-[linear-gradient(180deg,#cd5f47_0%,#b04a34_100%)]",
          "active:shadow-[inset_0_1px_3px_rgba(60,15,5,0.5)]",
        ].join(" "),
        // Call/Check: a cool slate-blue key, so the passive choice is told
        // apart from Fold (warm, dim) and Raise (brass) by temperature alone.
        call: [
          "border border-[#9cb4d6]/[0.14] bg-[linear-gradient(180deg,#2c3541_0%,#232a34_100%)] font-semibold text-[#e6ecf4] [text-shadow:0_1px_0_rgba(0,0,0,0.6)]",
          "shadow-[inset_0_1px_0_rgba(205,222,250,0.09),0_1px_2px_rgba(0,0,0,0.45)]",
          "hover:border-[#9cb4d6]/[0.24] hover:bg-[linear-gradient(180deg,#323c4a_0%,#28303b_100%)]",
          "active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.55)]",
        ].join(" "),
        // A small key that lives inside a recessed well (bet stepper).
        well: [
          "border border-white/[0.07] bg-[#24211d] text-slate-300",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_1px_rgba(0,0,0,0.5)]",
          "hover:bg-[#2c2924] hover:text-[#ede8df]",
        ].join(" "),
        ghost: "text-slate-400 hover:bg-[#24211d] hover:text-slate-100",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-5 text-base",
        xl: "h-12 px-5 text-base font-semibold",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7 rounded [&_svg]:size-4",
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
