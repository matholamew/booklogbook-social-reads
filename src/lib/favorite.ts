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
  bookTitle,
  bookAuthor,
}: {
  userId: string;
  bookId: string;
  currentFavorite: boolean;
  bookTitle?: string;
  bookAuthor?: string;
}): Promise<{result: 'favorited' | 'unfavorited' | 'removed' | 'error', errorMessage?: string}> {
  // Find the user_books row for this user/book (by original bookId)
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

  // If not in user_books, ensure book exists in books table
  let realBookId = bookId;
  let authorId: string | undefined;
  if (!userBook) {
    // Check if book exists in books table by id
    const { data: bookData, error: bookFetchError } = await supabase
      .from('books')
      .select('id, author_id')
      .eq('id', bookId)
      .maybeSingle();
    if (bookFetchError) {
      console.error('toggleFavoriteBook book fetch error:', bookFetchError);
      return { result: 'error', errorMessage: bookFetchError.message };
    }
    if (!bookData) {
      // Need to create or find the book by title/author
      if (!bookTitle || !bookAuthor) {
        const msg = 'Book details missing. Cannot favorite.';
        console.error(msg);
        return { result: 'error', errorMessage: msg };
      }
      // Check or insert author
      const { data: authorData, error: authorFetchError } = await supabase
        .from('authors')
        .select('id')
        .eq('name', bookAuthor)
        .maybeSingle();
      if (authorFetchError) {
        console.error('toggleFavoriteBook author fetch error:', authorFetchError);
        return { result: 'error', errorMessage: authorFetchError.message };
      }
      if (authorData && authorData.id) {
        authorId = authorData.id;
      } else {
        // Insert author
        const { data: newAuthor, error: authorInsertError } = await supabase
          .from('authors')
          .insert({ name: bookAuthor })
          .select('id')
          .single();
        if (authorInsertError) {
          console.error('toggleFavoriteBook author insert error:', authorInsertError);
          return { result: 'error', errorMessage: authorInsertError.message };
        }
        authorId = newAuthor.id;
      }
      // Now, try to find the book by title and author_id
      const { data: bookByTitle, error: bookByTitleError } = await supabase
        .from('books')
        .select('id')
        .eq('title', bookTitle)
        .eq('author_id', authorId)
        .maybeSingle();
      if (bookByTitleError) {
        console.error('toggleFavoriteBook bookByTitle fetch error:', bookByTitleError);
        return { result: 'error', errorMessage: bookByTitleError.message };
      }
      if (bookByTitle && bookByTitle.id) {
        realBookId = bookByTitle.id;
      } else {
        // Insert book
        const { data: newBook, error: bookInsertError } = await supabase
          .from('books')
          .insert({ title: bookTitle, author_id: authorId })
          .select('id')
          .single();
        if (bookInsertError) {
          console.error('toggleFavoriteBook book insert error:', bookInsertError);
          return { result: 'error', errorMessage: bookInsertError.message };
        }
        realBookId = newBook.id;
      }
    } else {
      // Book found by id, use its author_id
      realBookId = bookData.id;
      authorId = bookData.author_id;
    }
    // After resolving realBookId, check for user_books row for this user and realBookId
    const { data: userBookByRealId, error: userBookByRealIdError } = await supabase
      .from('user_books')
      .select('id, status, favorite')
      .eq('user_id', userId)
      .eq('book_id', realBookId)
      .maybeSingle();
    if (userBookByRealIdError) {
      console.error('toggleFavoriteBook user_books fetch by realBookId error:', userBookByRealIdError);
      return { result: 'error', errorMessage: userBookByRealIdError.message };
    }
    if (userBookByRealId) {
      userBook = userBookByRealId;
    }
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
      book_id: realBookId,
      status: 'planned',
      favorite: true,
    });
  if (insertError) {
    console.error('toggleFavoriteBook user_books insert error:', insertError);
    return { result: 'error', errorMessage: insertError.message };
  }
  return { result: 'favorited' };
} 