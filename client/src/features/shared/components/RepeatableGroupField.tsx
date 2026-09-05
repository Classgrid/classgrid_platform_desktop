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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";

interface RepeatableGroupFieldProps {
  label: string;
  items: any[];
  onChange: (items: any[]) => void;
  renderItem: (item: any, index: number, updateItem: (idx: number, key: string, val: any) => void) => React.ReactNode;
  defaultEmptyItem: any;
  maxItems?: number;
}

export function RepeatableGroupField({
  label,
  items,
  onChange,
  renderItem,
  defaultEmptyItem,
  maxItems = 10
}: RepeatableGroupFieldProps) {
  // Ensure items is always an array
  const currentItems = Array.isArray(items) ? items : [];

  const handleAddItem = () => {
    if (currentItems.length < maxItems) {
      onChange([...currentItems, { ...defaultEmptyItem }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...currentItems];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleUpdateItem = (index: number, key: string, value: any) => {
    const newItems = [...currentItems];
    newItems[index] = { ...newItems[index], [key]: value };
    onChange(newItems);
  };

  return (
    <div className="w-full space-y-4">
      {currentItems.map((item, index) => (
        <div key={index} className="relative bg-muted/20 border border-border/50 rounded-xl p-5 pt-8 animate-in fade-in slide-in-from-bottom-2">
          {/* Item Number Badge */}
          <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {label} {index + 1}
          </div>
          
          {/* Remove Button */}
          <button
            type="button"
            onClick={() => handleRemoveItem(index)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Render Fields using the provided render function */}
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
            {renderItem(item, index, handleUpdateItem)}
          </div>
        </div>
      ))}

      {currentItems.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddItem}
          className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 h-12 text-muted-foreground hover:text-foreground transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another {label}
        </Button>
      )}
    </div>
  );
}
