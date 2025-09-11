# Season Dashboard Components

This folder contains components related to the Season (Temporada) enrollment and assignment flow inside the user dashboard.

## Components

- `SeasonHeader.tsx` – Visual/glass header for the Season tab. Mirrors the look & feel of other area headers (e.g. tournaments) with gradient background, contextual status badge, and primary CTA when enrollment is open.
- `EnrollmentSteps.tsx` – Thin progress indicator (2‑step wizard) used during enrollment.
- `EnrollmentForm.tsx` – Form to submit an enrollment request (group size, participants, payment method, notes, etc.).
- `AssignedClassCard.tsx` – (Not modified) Displays the user's assigned class information (if present).
- `RequestSent.tsx` – Confirmation card shown once a request has been submitted.

## `SeasonHeader` API

```ts
interface SeasonHeaderProps {
	seasonName?: string | null; // Optional dynamic season name
	enrollmentOpen?: boolean; // Whether enrollment is currently open
	hasRequest?: boolean; // User has already sent a request (pending/approved)
	assigned?: boolean; // User already has an active assignment
	onStartEnrollment?: () => void; // Callback to start the enrollment wizard
	className?: string; // Optional wrapper className
}
```

### Behavior

- Shows distinct icon & description depending on state: default, request sent, or assigned.
- Displays status badges: `Sol·licitud enviada` (amber) or `Assignat` (green).
- Renders a primary floating CTA button ("Inscriure'm") only if enrollment is open and user has not submitted a request nor has an assignment.

### Accessibility

- Icons are purely visual; important state is also conveyed with text badges.
- CTA has an `aria-label`.
- Gradient background is placed behind content (`-z-10`) to avoid interference with screen readers.

### Styling Notes

- Reuses existing design tokens (`padel-primary`, glass/blur surfaces) consistent with `TournamentsHeader`.
- Uses transform/opacity GPU-friendly transitions and respects `prefers-reduced-motion` via existing `motion-safe:animate-btn-float` utility.

## Data Flow Overview

- Parent season dashboard page/hook (`useSeasonEnrollment`) supplies state booleans (`enrollmentOpen`, `hasRequest`, `assigned`) and the `onStartEnrollment` handler.
- Header triggers enrollment steps; steps update form; submission updates request state causing header to re-render with new status badge.

## Usage Example

```tsx
import { SeasonHeader } from "@/components/dashboard/season/SeasonHeader";

export function SeasonTab() {
	const { season, hasRequest, assignment, setCurrentStep } =
		useSeasonEnrollment();
	return (
		<SeasonHeader
			seasonName={season?.name}
			enrollmentOpen={!!season}
			hasRequest={hasRequest}
			assigned={!!assignment}
			onStartEnrollment={() => setCurrentStep(1)}
		/>
	);
}
```

## Future Improvements

- Add skeleton state while enrollment status loads.
- Motion reduce fallback for the CTA float if needed.
- Integrate a compact summary of assignment (time/day) once assigned.
