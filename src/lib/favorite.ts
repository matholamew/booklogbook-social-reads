import { supabase } from '@/integrations/supabase/client';

/**
 * Toggles the favorite status of a book for a user.
 *
 * @param userId - The user's ID
 * @param bookId - The book's ID
 * @param currentFavorite - Current favorite status (true/false)
 * @returns {Promise<'favorited' | 'unfavorited' | 'removed' | 'error'>}
 */
export async function toggleFavoriteBook({
  userId,
  bookId,
  currentFavorite,
}: {
  userId: string;
  bookId: string;
  currentFavorite: boolean;
}): Promise<'favorited' | 'unfavorited' | 'removed' | 'error'> {
  // Find the user_books row for this user/book
  const { data: userBook, error: fetchError } = await supabase
    .from('user_books')
    .select('id, status, favorite')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle();
  if (fetchError) return 'error';

  if (!userBook) {
    // Not in list: add as planned + favorite
    const { error: insertError } = await supabase
      .from('user_books')
      .insert({
        user_id: userId,
        book_id: bookId,
        status: 'planned',
        favorite: true,
      });
    return insertError ? 'error' : 'favorited';
  }

  if (!currentFavorite) {
    // Already in list, just set favorite true
    const { error: updateError } = await supabase
      .from('user_books')
      .update({ favorite: true })
      .eq('id', userBook.id);
    return updateError ? 'error' : 'favorited';
  }

  // Unfavoriting
  if (userBook.status === 'planned') {
    // If status is planned, remove from list
    const { error: deleteError } = await supabase
      .from('user_books')
      .delete()
      .eq('id', userBook.id);
    return deleteError ? 'error' : 'removed';
  } else {
    // Otherwise, just set favorite false
    const { error: updateError } = await supabase
      .from('user_books')
      .update({ favorite: false })
      .eq('id', userBook.id);
    return updateError ? 'error' : 'unfavorited';
  }
} 