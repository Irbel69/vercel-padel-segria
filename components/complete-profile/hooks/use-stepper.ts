"use client"

import * as React from "react"

export function useStepper(totalSteps: number, initial = 0) {
  const [current, setCurrent] = React.useState(initial)
  const next = React.useCallback(() => setCurrent((c) => Math.min(c + 1, totalSteps - 1)), [totalSteps])
  const prev = React.useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), [])
  const goto = React.useCallback((index: number) => setCurrent(Math.max(0, Math.min(index, totalSteps - 1))), [totalSteps])
  return { current, next, prev, goto, isFirst: current === 0, isLast: current === totalSteps - 1 }
}

export default useStepper
