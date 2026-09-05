/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import * as React from "react"
import { Sparkles, Lock, ChevronDownIcon } from "lucide-react"
import { FieldState } from "./input"
import { cn } from "@/lib/utils"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
  fieldState?: FieldState
}

function NativeSelect({
  className,
  size = "default",
  fieldState = "normal",
  ...props
}: NativeSelectProps) {
  let stateClasses = "bg-transparent border-input text-foreground"

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
    <div
      className={cn(
        "group/native-select relative w-fit has-[select:disabled]:opacity-50",
        className
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn("h-10 w-full min-w-0 appearance-none rounded-lg border py-2 pr-10 pl-3 text-base transition-colors outline-none select-none selection:bg-primary selection:text-primary-foreground focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-[size=sm]:py-0.5 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 md:text-sm", stateClasses)}
        disabled={fieldState === "locked" ? true : props.disabled}
        {...props}
      />
      
      {fieldState === "locked" ? (
        <Lock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground/70 select-none" aria-hidden="true" />
      ) : fieldState === "prefilled" ? (
        <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1.5 select-none">
          <Sparkles className="size-4 text-primary/70" />
          <ChevronDownIcon className="size-4 opacity-50" />
        </div>
      ) : (
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground select-none" aria-hidden="true" data-slot="native-select-icon" />
      )}
    </div>
  )
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
