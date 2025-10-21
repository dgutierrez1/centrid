import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300",
        secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        success: "bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300",
        warning: "bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300",
        destructive: "bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-300",
        outline: "border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
