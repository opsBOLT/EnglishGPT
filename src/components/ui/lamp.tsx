import React, { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { GridPattern } from "./grid-pattern";

type GridPatternProps = ComponentProps<typeof GridPattern>;

interface LampContainerProps {
  children: React.ReactNode;
  className?: string;
  gridProps?: GridPatternProps;
}

export const LampContainer = ({
  children,
  className,
  gridProps,
}: LampContainerProps) => {
  return (
    <div className={cn("min-h-screen w-full relative overflow-hidden", className)}>
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, #fff 40%, #7c3aed 100%)",
        }}
      />
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
      {gridProps && (
        <GridPattern
          {...gridProps}
          className={cn("z-20", gridProps.className)}
        />
      )}
      <div className="relative z-30 flex flex-col items-center justify-center min-h-screen">
        {children}
      </div>
    </div>
  );
};
