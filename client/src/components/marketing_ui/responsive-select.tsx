import * as React from "react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { NativeSelect, NativeSelectOption } from "./native-select"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"

export interface ResponsiveSelectProps
  extends Omit<React.ComponentProps<"select">, "size"> {
  size?: "sm" | "default"
  placeholder?: string
}

export function ResponsiveSelect({
  className,
  size = "default",
  children,
  value,
  onChange,
  disabled,
  placeholder,
  ...props
}: ResponsiveSelectProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [open, setOpen] = React.useState(false)

  // Extract options from children to use in custom select
  const options = React.useMemo(() => {
    const opts: { value: string; label: React.ReactNode; color?: string }[] = []
    
    const flattenChildren = (kids: any) => {
      React.Children.forEach(kids, (child) => {
        if (!React.isValidElement<any>(child)) return;
        if (child.type === React.Fragment) {
          flattenChildren(child.props.children);
        } else if (child.props && (child.props.value !== undefined || child.type === "option")) {
          let val = String(child.props.value !== undefined ? child.props.value : child.props.children);
          if (val === "") val = "__empty__";
          opts.push({
            value: val,
            label: child.props.children,
            color: child.props["data-color"]
          })
        }
      })
    }
    
    flattenChildren(children)
    return opts
  }, [children])

  // Custom Select (Desktop) - only for lists with <= 800 items to prevent browser freezing
  if (isDesktop && options.length <= 800) {
    let displayValue = value !== undefined ? String(value) : undefined;
    if (displayValue === "") displayValue = "__empty__";

    // Find the currently selected label for the value placeholder
    const selectedOption = options.find((opt) => opt.value === displayValue)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-black dark:border-white/10",
              size === "sm" ? "h-7 rounded-md px-2 text-xs" : "h-9",
              className
            )}
          >
            <div className="flex items-center gap-2 text-foreground flex-1 text-left truncate">
              {selectedOption?.color && (
                <span className={`shrink-0 w-2 h-2 rounded-full ${selectedOption.color}`} />
              )}
              <span className="truncate">{selectedOption ? selectedOption.label : (placeholder || "Select...")}</span>
            </div>
            <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start" 
          side="bottom"
          sideOffset={4}
        >
          <Command>
            <CommandInput placeholder="Search..." className="h-9" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={(currentValue) => {
                      if (onChange) {
                        const trueVal = opt.value === "__empty__" ? "" : opt.value;
                        const event = {
                          target: { value: trueVal },
                          currentTarget: { value: trueVal },
                          preventDefault: () => {},
                          stopPropagation: () => {},
                        } as any;
                        onChange(event);
                      }
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {opt.color && <span className={`shrink-0 w-2 h-2 rounded-full ${opt.color}`} />}
                      <span>{opt.label}</span>
                    </div>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        displayValue === opt.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // Native Select (Mobile)
  return (
    <NativeSelect
      className={className}
      size={size}
      value={value}
      onChange={onChange}
      disabled={disabled}
      {...props}
    >
      {placeholder && (
        <NativeSelectOption value="" disabled>
          {placeholder}
        </NativeSelectOption>
      )}
      {children}
    </NativeSelect>
  )
}
