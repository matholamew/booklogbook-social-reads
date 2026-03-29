

## Deep Analysis: Why Stats Are Wrong

### Root Cause

The problem is in `StatsOverview.tsx` line 12-15:

```tsx
export const StatsOverview = ({ 
  totalBooks = 47, 
  booksThisYear = 12, 
  following = 8 
}: StatsOverviewProps) => {
```

These are **hardcoded default values** (47, 12, 8) that display whenever the real stats are `undefined` -- which happens while the query is loading, or if it errors, or if the data hasn't arrived yet. Since `stats?.totalBooks` evaluates to `undefined` when `stats` is `undefined` (during loading), the destructuring defaults kick in and show 47/12/8.

Your actual database data for your account (73e08b29) shows: **7 total books, 0 finished this year, 0 following**. The query logic in `useUserStats.ts` is actually correct -- the numbers just never reach the UI because the defaults mask them.

### Database Verification

| Status   | Rows | Unique Books |
|----------|------|-------------|
| planned  | 4    | 4           |
| reading  | 2    | 2           |
| finished | 1    | 1           |
| **Total**| **7**| **7**       |

Books finished this year: **0** (the one finished book has no date in 2026).

### Fix Plan

**File 1: `src/components/StatsOverview.tsx`**
- Remove hardcoded default values (47, 12, 8) from props
- Add a new `isLoading` prop
- When `isLoading` is true, render skeleton placeholders instead of numbers
- When loaded, display the actual values (which will be 0 if no data)

**File 2: `src/pages/Index.tsx`**
- Pass `statsLoading` (already destructured on line 31) to `StatsOverview` as `isLoading`
- Change props to use `stats?.totalBooks ?? 0` instead of bare `stats?.totalBooks` so `undefined` never reaches the component

### Technical Details

- `StatsOverview` will accept `isLoading?: boolean` and use the existing `Skeleton` component from `@/components/ui/skeleton` for the number placeholders
- Default prop values will be changed from 47/12/8 to 0/0/0
- No database changes needed -- the query logic is already correct

