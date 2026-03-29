

## Deep Analysis: Why Book Covers Are Not Showing

### Root Causes Found

**There are two distinct problems:**

#### Problem 1: Books added via "Add Book" button have NULL cover_url (primary issue)

The `AddBookButton` component calls the `get-book-cover` edge function to fetch a cover URL before inserting the book. However, the database shows that **8 of the most recent books have `cover_url = NULL`**, while older books have valid URLs.

The edge function logs show **no recent activity**, meaning the function either:
- Is not being called (possibly due to auth/CORS issues)
- Is returning errors that are silently caught

Looking at `AddBookButton.tsx` line 101-118, the cover fetch is wrapped in a try/catch that silently continues on failure (`console.warn` only). If the edge function returns a non-OK response, the book is inserted without a cover.

#### Problem 2: Books added via Google Books search DO save covers correctly

The `GoogleBooksModal` correctly passes `book.coverUrl` from the search results (line 149). The `search-google-books` edge function returns `coverUrl` in its response (line 93). Books added this way have covers in the database. **This path works.**

#### Problem 3: No backfill mechanism for existing NULL covers

There are 8 books already in the database with `cover_url = NULL`. Even if we fix the insert flow, these books will remain without covers unless we backfill them.

### The Fix Plan

#### Step 1: Fix the `get-book-cover` edge function call in AddBookButton
- Add better error logging to understand why the cover fetch is failing
- Ensure the edge function URL construction and auth headers are correct
- The function itself looks correct, so the issue is likely in the calling code or deployment

#### Step 2: Create a backfill mechanism for existing books with NULL covers
- Write a one-time script (or enhance the existing `backfill-covers` edge function) that:
  1. Queries all books where `cover_url IS NULL`
  2. For each, calls Google Books API to find a cover
  3. Updates the `books` table with the found cover URL
- Deploy and invoke this function to fix existing data

#### Step 3: Add a fallback cover fetch on the client side
- In `useUserBooks`, when a book has no `coverUrl`, attempt to fetch one from Google Books API via the edge function
- Cache the result to avoid repeated calls
- This serves as a safety net for any future books that slip through without covers

### Technical Details

**Files to modify:**
1. `src/components/AddBookButton.tsx` - Improve error handling and logging for cover fetch
2. `supabase/functions/backfill-covers/index.ts` - Update to use service role key to update books with NULL covers
3. `src/hooks/useUserBooks.ts` - Remove excessive debug logging, add cover fallback logic
4. Deploy `backfill-covers` edge function and invoke it to fix existing data

**Database changes:** None needed - the `books.cover_url` column and RLS policies (admins/moderators/owners can update) already support this.

**Key insight:** The `books` table UPDATE policy only allows the book creator, admins, or moderators to update. The backfill function must use the service role key to bypass RLS and update all books.

