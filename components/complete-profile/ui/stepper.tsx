"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

type StepperProps = {
  steps: string[]
  current: number // 0-indexed
  className?: string
}

export function Stepper({ steps, current, className }: StepperProps) {
  const pct = Math.round(((current + 1) / steps.length) * 100)
  return (
    <div className={cn("w-full space-y-2", className)} aria-label="Progrés del formulari">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{steps[current]}</span>
        <span>
          {current + 1} / {steps.length}
        </span>
      </div>
      <Progress
        value={pct}
        className="h-2 bg-gray-700/60"
        indicatorClassName={
          "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-300 shadow-yellow-400/40 shadow-lg"
        }
      />
    </div>
  )
}

export default Stepper
