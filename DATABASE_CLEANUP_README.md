# Database Cleanup Migration

## Issues Found

After analyzing the codebase and database schema, several issues were identified:

### 1. **Missing Column** 
- `user_books.favorite` - Used extensively in the code but missing from database schema

### 2. **Unused Columns** (safe to remove)
- `books.amazon_price` - Only exists in types, never used
- `books.amazon_url` - Only exists in types, never used  
- `user_books.is_private` - Only exists in types, never used
- `user_books.personal_rating` - Only exists in types, never used

### 3. **Missing Column** (might be needed)
- `books.google_books_url` - Referenced in GoogleBooksModal but not in schema

## Migration Steps

### Option 1: Manual SQL Migration (Recommended)

1. **Run the SQL migration:**
   ```bash
   # Copy the contents of database_cleanup_migration.sql
   # Run it in your Supabase SQL editor
   ```

2. **Update the types file:**
   ```bash
   # Replace src/integrations/supabase/types.ts with updated_schema_types.ts
   cp updated_schema_types.ts src/integrations/supabase/types.ts
   ```

### Option 2: Supabase CLI Migration

If you have Supabase CLI set up:

```bash
# Create a new migration
supabase migration new database_cleanup

# Copy the SQL content to the generated migration file
# Then apply it
supabase db push
```

## What the Migration Does

1. ✅ **Adds missing `favorite` column** to `user_books` table
2. ✅ **Removes unused columns** from `books` and `user_books` tables  
3. ✅ **Adds `google_books_url`** column to `books` table if missing
4. ✅ **Adds performance indexes** for commonly queried columns
5. ✅ **Sets default values** and constraints for data integrity

## After Migration

- Update your types by replacing `src/integrations/supabase/types.ts` with the cleaned schema
- The `favorite` functionality should now work properly
- Database will be more efficient with unused columns removed
- Better query performance with new indexes

## Verification

After running the migration, you can verify it worked by:

1. Checking that favorite books functionality works in the app
2. Confirming unused columns are removed from database
3. Running a simple query to check the schema:

```sql
-- Check user_books schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_books' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check books schema  
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'books' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## Files Created

- `database_cleanup_migration.sql` - SQL migration to run
- `updated_schema_types.ts` - New TypeScript types after cleanup
- `DATABASE_CLEANUP_README.md` - This documentation

## Safety Notes

- The migration uses `IF EXISTS` and `IF NOT EXISTS` clauses for safety
- No data will be lost (only unused columns are removed)
- Migration is idempotent (can be run multiple times safely)
- Backup your database before running if you're concerned