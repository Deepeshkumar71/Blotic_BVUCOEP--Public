import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 ease-in-out data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-accent data-[state=checked]:shadow-[0_0_20px_rgba(204,117,219,0.4)] data-[state=unchecked]:bg-gray-600/50 data-[state=unchecked]:shadow-inner hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 relative overflow-hidden",
      className,
    )}
    {...props}
    ref={ref}
  >
    {/* Background glow effect */}
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 transition-opacity duration-300 data-[state=checked]:opacity-100" />
    
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0.5 data-[state=checked]:shadow-[0_2px_10px_rgba(0,0,0,0.3)] data-[state=unchecked]:shadow-[0_1px_3px_rgba(0,0,0,0.2)] relative z-10",
      )}
    >
      {/* Inner glow for the thumb */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-gray-100 opacity-90" />
      <div className="absolute inset-0.5 rounded-full bg-white shadow-inner" />
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
