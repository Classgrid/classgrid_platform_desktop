/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/marketing_ui/popover';

interface MultiSelectFieldProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelectField({
  options,
  value = [],
  onChange,
  placeholder = "Select options...",
  disabled = false,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggleOption = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== option));
  };

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background flex flex-wrap gap-2 items-center cursor-text relative transition-all",
            disabled ? "opacity-70 cursor-not-allowed bg-muted/30" : "hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary"
          )}
          onClick={() => !disabled && setOpen(true)}
        >
          {value.length === 0 && (
            <span className="text-muted-foreground ml-1">{placeholder}</span>
          )}
          
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-xs font-medium animate-in zoom-in-95"
            >
              {v}
              {!disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  className="hover:bg-muted rounded-full p-0.5 transition-colors cursor-pointer"
                  onClick={(e) => removeOption(v, e)}
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </span>
          ))}

          <div className="ml-auto absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
          </div>
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-[320px] p-0 shadow-xl border-border rounded-xl" align="start">
        <div className="p-2 border-b border-border/50">
          <input
            type="text"
            className="w-full bg-transparent text-sm outline-none px-2 py-1 placeholder:text-muted-foreground"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                  value.includes(opt) ? "bg-primary/5 font-medium" : ""
                )}
                onClick={() => toggleOption(opt)}
              >
                <div className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm border",
                  value.includes(opt) ? "bg-primary border-primary text-primary-foreground" : "border-input"
                )}>
                  {value.includes(opt) && <Check className="h-3 w-3" />}
                </div>
                {opt}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
