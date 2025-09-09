# Battle Pass Admin Components

This folder contains components for managing Battle Pass prizes in the admin dashboard.

## Components

### Core Components
- **PrizesList.tsx**: Main list/grid view of battle pass prizes
- **CreatePrizeDialog.tsx**: Modal for creating new prizes
- **EditPrizeDialog.tsx**: Modal for editing existing prizes
- **DeleteConfirmDialog.tsx**: Confirmation dialog for prize deletion
- **PrizeCard.tsx**: Individual prize card component with drag/drop support
- **PrizeSearch.tsx**: Search and filtering interface
- **PrizeUploader.tsx**: Image upload component for prize images

### UI Components
- **PrizeGrid.tsx**: Grid layout for prize cards
- **PrizeTable.tsx**: Table view for dense data display
- **ViewToggle.tsx**: Toggle between grid/table views
- **PrizeActions.tsx**: Action buttons for each prize
- **StatusBadge.tsx**: Prize status indicators
- **DragHandle.tsx**: Drag handle for reordering

### Form Components
- **PrizeForm.tsx**: Reusable form for create/edit operations
- **ImageUpload.tsx**: Image upload with preview
- **PrizeTypeSelect.tsx**: Prize type selection dropdown

## Hooks

### Data Hooks
- **use-battle-pass-prizes.ts**: Main React Query hook for fetching prizes
- **use-create-prize.ts**: Mutation hook for creating prizes
- **use-update-prize.ts**: Mutation hook for updating prizes
- **use-delete-prize.ts**: Mutation hook for deleting prizes
- **use-reorder-prizes.ts**: Mutation hook for reordering prizes

### UI Hooks  
- **use-prize-form.ts**: Form state management
- **use-drag-drop.ts**: Drag and drop functionality
- **use-view-mode.ts**: View mode state (grid/table)
- **use-prize-search.ts**: Search and filtering logic

## Features

- **CRUD Operations**: Full create, read, update, delete operations
- **Drag & Drop Reordering**: Intuitive prize ordering by display_order
- **Image Upload**: Support for prize images with preview
 - **Search & Filtering**: Find prizes by name, type, status
- **Dual View Modes**: Grid view for visual browsing, table for data management
- **Responsive Design**: Mobile-first with tablet and desktop optimizations
- **Accessibility**: WCAG AA+ compliance with keyboard navigation
- **Real-time Updates**: Optimistic updates with React Query
- **Error Handling**: Comprehensive error states and recovery

## Design System

Follows the established Padel Segrià design system:
- **Colors**: Primary yellow (#e5f000), dark theme
- **Typography**: Clear hierarchy with proper contrast
- **Spacing**: 8px base unit system
- **Animations**: Subtle micro-interactions respecting reduced motion
- **Mobile**: Thumb-friendly touch targets, safe area support