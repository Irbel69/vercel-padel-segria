# Complete Profile components

This folder contains small presentational components used by the `app/complete-profile` flow.

Files

- `header.tsx` — Compact card header used on the Complete Profile page. Renders a square logo badge, sparkle accent and the title/subtitle. Keep this component small and presentation-only.

Usage

Import the header and place it in the `CardHeader` of the complete profile page:

```tsx
import CompleteProfileHeader from "@/components/complete-profile/header"

<CardHeader>
  <CompleteProfileHeader title="Completa el teu perfil" subtitle="Només 3 passos..." />
</CardHeader>
```

Notes

- The header expects the global CSS variables like `--padel-primary` and the `logo-glow` utility to exist in the project.
- Styling is intentionally minimalist — adjust typography and spacing in the page if you need different sizes.
# components/complete-profile

Purpose: Encapsulate UI and hooks used by the Complete Profile flow.

Contents
- ui/phone-input.tsx — Modern, accessible phone number input (ES +34 formatting), built on top of shadcn Input.
- ui/stepper.tsx — Minimal progress stepper using the shared Progress component.
- hooks/use-stepper.ts — Small hook to manage step index and navigation helpers.

Hooks
- use-stepper
  - current: number (0-indexed)
  - next/prev/goto helpers
  - isFirst/isLast booleans

Data flow
- The page `app/complete-profile/page.tsx` owns the form state (name, surname, phone, …).
- PhoneInput receives `value` and `onChange` to stay controlled.
- Stepper gets `steps` labels and the `current` index; it renders progress and counts.

Usage example

```tsx
import { PhoneInput } from "@/components/complete-profile/ui/phone-input"
import { Stepper } from "@/components/complete-profile/ui/stepper"
import useStepper from "@/components/complete-profile/hooks/use-stepper"

const steps = ["Dades bàsiques", "Contacte", "Polítiques"]
const { current, next, prev, isFirst, isLast } = useStepper(steps.length)

<Stepper steps={steps} current={current} />
<PhoneInput value={phone} onChange={setPhone} />
```

Accessibility
- Keyboard friendly; visible focus via shared Input styles.
- Respect reduced motion (container animations should be conditional where used).

Notes
- Keep components small and composable; avoid arbitrary values; rely on design tokens (Tailwind theme, CSS vars).
