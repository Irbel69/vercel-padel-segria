# EventCard Components

This folder contains the modular implementation of the EventCard component, which has been split into smaller, focused components for better maintainability and reusability.

## Structure

```
EventCard/
├── index.tsx          # Main export file
├── EventCard.tsx      # Main orchestrating component
├── Hero.tsx           # Hero section with image/gradient background and overlays
├── Content.tsx        # Content section with title, date, location, and prizes
├── ProgressBar.tsx    # Animated progress bar component
├── Actions.tsx        # CTA buttons (register, unregister, etc.)
└── utils.ts           # Utility functions
```

## Components

### EventCard (Main Component)
The main orchestrating component that manages state and coordinates all sub-components.

**Responsibilities:**
- Manages `isInFocus` state for scroll-based animations
- Calculates derived values (`occupied`, `isAlmostFull`, `isFull`)
- Applies motion effects and scroll scaling
- Renders all sub-components with proper props

### Hero Component
Handles the top section of the card with background and overlays.

**Features:**
- Image or gradient background with padel court pattern
- Status badges (status and registration status)
- Capacity indicator pill with color coding
- Map button for location
- Conditional styling based on `imageUrl`

### Content Component
Displays the main content information of the event.

**Features:**
- Event title and date
- Location with `shortLocation` helper
- Secondary info (registration deadline, partner info)
- Prizes display
- Conditional text styling based on `imageUrl`

### ProgressBar Component
Animated progress bar showing tournament capacity.

**Features:**
- Animated progress fill with gradient colors
- Sparkle effects when card is in focus
- Moving shine animation
- Color coding based on capacity (emerald/yellow/gray)

### Actions Component
Handles all CTA buttons and user interactions.

**Features:**
- Register button with conditional rendering
- Unregister button with processing states
- Confirmed state button
- "View details" link
- Responsive layout (full width on mobile, inline on desktop)

### Utils
Utility functions used across components.

**Functions:**
- `shortLocation`: Shortens location strings by taking the second part if multiple parts exist

## Usage

### Basic Usage (Backward Compatible)
```tsx
import EventCard from "@/components/tournaments/ui/EventCard";

// Same API as before
<EventCard
  event={event}
  processingEvents={processingEvents}
  onInvite={onInvite}
  onUnregister={onUnregister}
  formatDate={formatDate}
  formatDateTime={formatDateTime}
  canRegister={canRegister}
  canUnregister={canUnregister}
  // ... other props
/>
```

### Advanced Usage (Individual Components)
```tsx
import { Hero, Content, ProgressBar, Actions } from "@/components/tournaments/ui/EventCard";

// Use individual components for custom layouts
<Hero event={event} imageUrl={imageUrl} /* ... */ />
<Content event={event} formatDate={formatDate} /* ... */ />
<ProgressBar occupied={occupied} isInFocus={isInFocus} /* ... */ />
<Actions event={event} onInvite={onInvite} /* ... */ />
```

## Migration Notes

- The original `EventCard.tsx` file now serves as a re-export wrapper for backward compatibility
- All existing imports will continue to work without changes
- The new modular structure allows for better testing and reusability
- Each component receives only the props it needs, improving performance

## Props Flow

The main `EventCard` component receives all props and distributes them to sub-components:

- **Hero**: `event`, `imageUrl`, badge functions, `canRegister`, `capacityPillColor`
- **Content**: `event`, `formatDate`, `formatDateTime`, `imageUrl`
- **ProgressBar**: `occupied`, `isFull`, `isAlmostFull`, `isInFocus`
- **Actions**: `event`, `processingEvents`, callback functions, `imageUrl`

## State Management

- `isInFocus` state is managed in the main component and affects the `ProgressBar`
- Scroll scale effects are applied at the main component level
- Processing states for buttons are passed down from parent

## Styling

- Conditional styling based on `imageUrl` presence affects text colors throughout
- Motion effects are handled by Framer Motion
- Responsive design follows mobile-first approach
- Color coding uses the established design system (emerald/yellow/slate)