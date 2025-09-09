# Battle Pass System Documentation

## Overview

The Battle Pass system allows users to earn rewards based on their tournament points accumulated through participation in padel events. This system encourages engagement and provides tangible rewards for active players.

## Database Schema

### Table: `battle_pass_prizes`

The main table storing all battle pass prizes available for users to claim.

```sql
CREATE TABLE public.battle_pass_prizes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,                                    -- Prize name/title
  description text,                                       -- Detailed prize description
  points_required integer NOT NULL CHECK (points_required >= 0), -- Points needed to claim
  image_url text,                                        -- URL to prize image
  is_active boolean NOT NULL DEFAULT true,               -- Whether prize is available
  display_order integer NOT NULL DEFAULT 0,              -- Display order (ascending)
  created_by uuid REFERENCES public.users(id),           -- Admin who created the prize
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Key Features

1. **Point-Based Rewards**: Users earn tournament points (stored in `users.score`) and can claim prizes when they have enough points.

2. **Flexible Prize Management**: Admins can create, update, activate/deactivate prizes.

3. **Ordered Display**: Prizes are displayed according to `display_order` for consistent presentation.

4. **Audit Trail**: Tracks who created each prize and when it was created/updated.

### Indexes

- `idx_battle_pass_prizes_active_order`: Optimizes queries for active prizes in display order
- `idx_battle_pass_prizes_points_required`: Optimizes filtering by point requirements
- `idx_battle_pass_prizes_created_by`: Optimizes admin-related queries
- `uq_battle_pass_prizes_active_display_order`: Ensures unique display order for active prizes

### Functions

#### `public.is_admin(user_id uuid)`
Helper function used by RLS policies to check if a user has admin privileges.

#### `public.get_user_battle_pass_progress(user_id uuid)`
Returns a complete view of user progress towards all available prizes:

- Prize details (id, title, description, etc.)
- User's current points
- Whether they can claim each prize
- Progress percentage towards each prize

### Views

#### `public.available_battle_pass_prizes`
Public view showing only active prizes, ordered by display order and point requirements.

### Row Level Security (RLS)

The table implements comprehensive RLS policies:

1. **Public Read**: Anonymous users can view active prizes only
2. **Authenticated Read**: Authenticated admins can view all prizes (for management)
3. **Admin Insert**: Only admins can create new prizes
4. **Admin Update**: Only admins can modify existing prizes  
5. **Admin Delete**: Only admins can delete prizes

### Triggers

- **Auto-update timestamp**: `tr_battle_pass_prizes_updated_at` automatically updates the `updated_at` field on row modifications.

## Usage Examples

### For Frontend Applications

```sql
-- Get all available prizes for public display
SELECT * FROM public.available_battle_pass_prizes;

-- Get user's progress towards all prizes
SELECT * FROM public.get_user_battle_pass_progress(auth.uid());

### Claims storage and RPC

- Table: `public.battle_pass_user_prizes`
  - Columns: id (bigint, identity), user_id (uuid, fk users), prize_id (bigint, fk battle_pass_prizes), claimed_at (timestamptz default now())
  - Constraints: unique(user_id, prize_id)
  - RLS:
    - select: auth.uid() = user_id
    - insert: auth.uid() = user_id and prize is active and user score >= points_required

- Function: `public.claim_battle_pass_prize(p_prize_id bigint)` (security invoker)
  - Inserts a claim row for the current user if eligible (RLS enforced). On conflict returns the existing claim.
  - Grants: EXECUTE to role `authenticated`.
  - Usage:
    - select * from public.claim_battle_pass_prize(42);

-- Check if user can claim a specific prize
SELECT 
  bp.title,
  u.score as user_points,
  bp.points_required,
  (u.score >= bp.points_required) as can_claim
FROM battle_pass_prizes bp
CROSS JOIN users u
WHERE bp.id = $1 AND u.id = auth.uid() AND bp.is_active = true;
```

### For Admin Management

```sql
-- Create a new prize
INSERT INTO battle_pass_prizes (title, description, points_required, display_order)
VALUES ('New Prize', 'Prize description', 500, 10);

-- Deactivate a prize
UPDATE battle_pass_prizes SET is_active = false WHERE id = $1;

-- Reorder prizes
UPDATE battle_pass_prizes SET display_order = $1 WHERE id = $2;
```

## Integration with Existing System

The Battle Pass system integrates seamlessly with the existing tournament system:

- **Points Source**: Uses the existing `users.score` field which tracks tournament points
- **Admin System**: Leverages the existing `users.is_admin` field for access control
- **Authentication**: Uses Supabase Auth for user identification and RLS policies

## Migration Information

- **Migration File**: `scripts/migrations/2025_09_06_create_battle_pass_prizes.sql`
- **Sample Data**: Includes 5 sample prizes for testing and demonstration
- **Dependencies**: Requires the existing `users` table with `score` and `is_admin` fields

## API Considerations

When implementing API endpoints, consider:

1. **Public Endpoints**: 
   - GET `/api/battle-pass/prizes` - List active prizes
   - GET `/api/battle-pass/progress` - User progress (authenticated)

2. **Admin Endpoints**:
   - POST `/api/admin/battle-pass/prizes` - Create prize
   - PUT `/api/admin/battle-pass/prizes/:id` - Update prize
   - DELETE `/api/admin/battle-pass/prizes/:id` - Delete prize

3. **Security**: All admin endpoints should verify `is_admin` status via middleware

## Future Enhancements

Potential extensions to consider:

1. **Prize Claims Tracking**: Add table to track when users claim specific prizes
2. **Prize Categories**: Group prizes by type (physical, digital, experiences)
3. **Seasonal Prizes**: Time-limited prizes with expiration dates
4. **Prize Inventory**: Track available quantities for limited prizes
5. **Achievement System**: Unlock criteria beyond just points (e.g., win streaks, participation)