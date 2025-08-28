# DayEditorDialog component group

This folder contains the modularized parts of the large `DayEditorDialog` component.

Purpose: break the original monolithic component into small, testable subcomponents
and keep a single public entry point for backward compatibility.

Files

- `DayEditorDialog.tsx` — main orchestrator component (client). Holds state and handlers.
- `PreviewView.tsx` — renders the read-only preview of the day's schedule.
- `EditView.tsx` — renders the edit form for creating/modifying schedule templates.
- `BlocksList.tsx` — lists blocks and delegates individual block rendering.
- `BlockCard.tsx` — UI for a single block (lesson or break) with controls.
- `utils.ts` — shared helper functions used by subcomponents.

Usage

Import the component the same way as before:

```tsx
import DayEditorDialog from "@/components/lessons/DayEditorDialog";
```

Notes

- The top-level `components/lessons/DayEditorDialog.tsx` file was kept as the public entry
  and updated to delegate UI to these subcomponents.
- Presentational logic is in the subcomponents so it's easier to test and maintain.
