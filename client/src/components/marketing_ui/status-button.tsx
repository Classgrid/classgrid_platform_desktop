import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const statusButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md border font-medium select-none shadow-sm transition-colors",
  {
    variants: {
      variant: {
        success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400",
        warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400",
        error: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400",
        info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400",
        default: "border-border bg-muted/50 text-foreground dark:bg-muted/20",
      },
      size: {
        default: "h-10 px-6 py-2 text-sm gap-2",
        sm: "h-8 px-3 py-1.5 text-xs gap-1.5",
        lg: "h-12 px-8 py-3 text-base gap-2.5"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface StatusButtonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusButtonVariants> {
  text: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
}

export function StatusButton({ 
  className, 
  variant, 
  size, 
  text, 
  icon,
  showIcon = true,
  ...props 
}: StatusButtonProps) {
  
  const renderIcon = () => {
    if (!showIcon) return null;
    if (icon) return icon;

    const iconClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

    switch (variant) {
      case "success":
        return <CheckCircle2 className={iconClass} />;
      case "warning":
        return <AlertTriangle className={iconClass} />;
      case "error":
        return <XCircle className={iconClass} />;
      case "info":
        return <Info className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };

  return (
    <div 
      className={cn(statusButtonVariants({ variant, size }), className)}
      {...props}
    >
      {renderIcon()}
      {text}
    </div>
  );
}

// For backwards compatibility with the previous VerifiedButton
export function VerifiedButton({ className, text = "Verified", ...props }: Omit<StatusButtonProps, 'text' | 'variant'> & { text?: string }) {
  return <StatusButton variant="success" text={text} className={className} {...props} />;
}
