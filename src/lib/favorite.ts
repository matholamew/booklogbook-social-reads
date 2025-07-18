import { supabase } from '@/integrations/supabase/client';

/**
 * Toggles the favorite status of a book for a user.
 *
 * @param userId - The user's ID
 * @param bookId - The book's ID
 * @param currentFavorite - Current favorite status (true/false)
 * @param bookTitle - The book's title (required if book needs to be created)
 * @param bookAuthor - The book's author (required if book needs to be created)
 * @returns {Promise<{result: 'favorited' | 'unfavorited' | 'removed' | 'error', errorMessage?: string}>}
 */
export async function toggleFavoriteBook({
  userId,
  bookId,
  currentFavorite,
}: {
  userId: string;
  bookId: string;
  currentFavorite: boolean;
}): Promise<{result: 'favorited' | 'unfavorited' | 'removed' | 'error', errorMessage?: string}> {

  // Find the user_books row for this user/book
  let { data: userBook, error: fetchError } = await supabase
    .from('user_books')
    .select('id, status, favorite')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle();

  if (fetchError) {
    console.error('toggleFavoriteBook fetch error:', fetchError);
    return { result: 'error', errorMessage: fetchError.message };
  }

  // If userBook exists, update or delete as needed
  if (userBook) {
    if (!currentFavorite) {
      // Already in list, just set favorite true
      const { error: updateError } = await supabase
        .from('user_books')
        .update({ favorite: true })
        .eq('id', userBook.id);
      if (updateError) {
        console.error('toggleFavoriteBook update error:', updateError);
        return { result: 'error', errorMessage: updateError.message };
      }
      return { result: 'favorited' };
    }

    // Unfavoriting
    if (userBook.status === 'planned') {
      // If status is planned, remove from list
      const { error: deleteError } = await supabase
        .from('user_books')
        .delete()
        .eq('id', userBook.id);
      if (deleteError) {
        console.error('toggleFavoriteBook delete error:', deleteError);
        return { result: 'error', errorMessage: deleteError.message };
      }
      return { result: 'removed' };
    } else {
      // Otherwise, just set favorite false
      const { error: updateError } = await supabase
        .from('user_books')
        .update({ favorite: false })
        .eq('id', userBook.id);
      if (updateError) {
        console.error('toggleFavoriteBook update error:', updateError);
        return { result: 'error', errorMessage: updateError.message };
      }
      return { result: 'unfavorited' };
    }
  }

  // If userBook does not exist, insert new row
  const { error: insertError } = await supabase
    .from('user_books')
    .insert({
      user_id: userId,
      book_id: bookId,
      status: 'planned',
      favorite: true,
    });

  if (insertError) {
    console.error('toggleFavoriteBook user_books insert error:', insertError);
    return { result: 'error', errorMessage: insertError.message };
  }

  return { result: 'favorited' };
} 