
import React, { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  (
    {
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            "--spread": "90deg",
            "--radius": "12px",
            "--speed": "1.5s",
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap rounded-xl border-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 px-6 py-3 text-white font-medium shadow-lg",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px hover:shadow-xl",
          "before:absolute before:inset-0 before:z-[-1] before:rounded-xl before:bg-gradient-to-r before:from-pink-500 before:via-purple-500 before:to-blue-500 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
          "after:absolute after:inset-[2px] after:z-[-1] after:rounded-[10px] after:bg-gradient-to-r after:from-pink-500/20 after:via-purple-500/20 after:to-blue-500/20",
          className,
        )}
        ref={ref}
        {...props}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-75 blur-sm animate-pulse" />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%]" />
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);

RainbowButton.displayName = "RainbowButton";

export { RainbowButton };
