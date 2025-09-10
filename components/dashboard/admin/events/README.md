# Events Admin Components

This folder contains components for managing events in the admin dashboard.

## Components

### Core Components
- **EventsPage.tsx**: Main page component that orchestrates all event management functionality
- **EventsHeader.tsx**: Header section with title and create button
- **EventsSearch.tsx**: Search bar for filtering events
- **EventsList.tsx**: Main list component with pagination
- **EventCard.tsx**: Individual event card component with actions
- **CreateEditEventModal.tsx**: Modal for creating and editing events
- **ParticipantsModal.tsx**: Modal for managing event participants
- **ImageUploader.tsx**: Image upload component for event covers

## Hooks

### Data Hooks
- **use-events.ts**: Main hook for events data, pagination, and search functionality
- **use-event-modal.ts**: Hook for managing create/edit event modal state and operations
- **use-participants-modal.ts**: Hook for managing participants modal and user/pair operations

## Features

- **CRUD Operations**: Full create, read, update, delete operations for events
- **Search & Filtering**: Find events by title or location with debounced search
- **Pagination**: Efficient pagination for large event lists
- **Image Management**: Event cover image upload and management
- **Participants Management**: Add/remove individual users or pairs to events
- **User Search**: Search functionality for adding participants
- **Pair Management**: Support for pair-based tournaments
- **Responsive Design**: Mobile-first with tablet and desktop optimizations
- **Real-time Updates**: Immediate UI updates with proper error handling
- **Force Delete**: Handle deletion of events with existing registrations

## Event Management

### Event Creation/Editing
- Title, date, location (with map picker)
- Maximum participants and pair requirements
- Registration deadline
- Prizes description
- Cover image upload

### Participants Management
- View all registered participants (individuals and pairs)
- Add individual users by search
- Add pairs by searching for two users
- Remove participants or entire pairs
- Visual indication of registration limits

### AFG (Auto-registered) semantics

- "AFG Usuari": un usuari registrat automàticament a l'esdeveniment (usuari sol), no té parella associada.
- "AFG Parella": entrada on hi ha una parella (dos usuaris) registrada junts; aquests es representen com a "parella".

Quan s'afegeix un usuari des del panell d'Admin: si una entrada és "AFG Usuari" no té parella; si és "AFG Parella" consten dos usuaris amb el mateix pair_id.

### Participants modal — selección y accesibilidad

- La llista de resultats de cerca ara fa que tota la fila sigui clicable — això inclou l'avatar, el nom i el text: fer clic sobre qualsevol lloc de la fila afegeix l'usuari (si no està ja inscrit).
- També es pot activar amb teclat (Enter o Space) quan la fila està enfocada.
- El botó "Afegir" romandrà disponible com a alternativa; s'ha previst evitar triggers dobles quan es fa clic sobre el botó (s'atura la propagació de l'event).

Aquest comportament millora la usabilitat i palia problemes en pantalles tàctils on el botó petit podia ser difícil de prémer.

## Design System

Follows the established Padel Segrià design system:
- **Colors**: Primary yellow (#e5f000), dark theme
- **Typography**: Clear hierarchy with proper contrast
- **Spacing**: 8px base unit system
- **Animations**: Subtle micro-interactions respecting reduced motion
- **Mobile**: Thumb-friendly touch targets, safe area support

## Usage

```tsx
import { AdminEventsPage } from "@/components/dashboard/admin/events";

// In your page component
export default function EventsAdminPage() {
  return <AdminEventsPage />;
}
```

## Security

- Admin-only access with proper permission checks
- Secure image upload handling
- Protected API endpoints for all operations
- Input validation and sanitization
- CSRF protection through cookies/tokens