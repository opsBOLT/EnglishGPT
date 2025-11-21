import React from "react";
import { cn } from "@/lib/utils";

interface LampContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const LampContainer = ({ children, className }: LampContainerProps) => {
  return (
    <div className={cn("min-h-screen w-full relative overflow-hidden", className)}>
      {/* Radial Gradient Background from Top */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, #fff 40%, #7c3aed 100%)",
        }}
      />

      {/* Top Fade Grid Background */}
      <div
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: "20px 30px",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
        }}
      />

      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen">
        {children}
      </div>
    </div>
  );
};
