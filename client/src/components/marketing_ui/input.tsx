import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { Sparkles, Lock } from "lucide-react"

import { cn } from "@/lib/utils"

export type FieldState = "default" | "prefilled" | "locked" | "error" | "normal"

export interface InputProps extends React.ComponentProps<"input"> {
  fieldState?: FieldState
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, fieldState = "normal", ...props }, ref) => {
    
    let stateClasses = "bg-transparent border-input text-foreground placeholder:text-muted-foreground/40"
    
    if (fieldState === "locked") {
      stateClasses = "bg-secondary/40 border-transparent text-foreground opacity-90 cursor-not-allowed focus-visible:ring-0 focus-visible:border-transparent"
    } else if (fieldState === "prefilled") {
      stateClasses = "bg-primary/5 border-primary/20 text-foreground font-medium"
    } else if (fieldState === "default") {
      stateClasses = "bg-transparent border-input text-foreground/80"
    } else if (fieldState === "error") {
      stateClasses = "border-destructive focus-visible:ring-destructive/30"
    }

    return (
      <div className="relative flex w-full items-center">
        <InputPrimitive
          type={type}
          data-slot="input"
          ref={ref as any}
          className={cn(
            "h-10 w-full min-w-0 rounded-lg border px-3 py-2 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:disabled:bg-input/80",
            stateClasses,
            (fieldState === "prefilled" || fieldState === "locked") ? "pr-10" : "",
            className
          )}
          readOnly={fieldState === "locked" ? true : props.readOnly}
          {...props}
        />
        {fieldState === "prefilled" && (
          <Sparkles className="absolute right-3 h-4 w-4 text-primary/70 pointer-events-none" />
        )}
        {fieldState === "locked" && (
          <Lock className="absolute right-3 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
