// Updated database types after cleanup migration
// This shows what the schema should look like after running the migration

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string | null
          id: string
          note: string | null
          user_book_id: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          id?: string
          note?: string | null
          user_book_id?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          id?: string
          note?: string | null
          user_book_id?: string | null
          user_id?: string | null
        }
      }
      authors: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
      }
      books: {
        Row: {
          // REMOVED: amazon_price, amazon_url (unused)
          author_id: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          google_books_url: string | null  // ADDED: referenced in GoogleBooksModal
          id: string
          isbn: string | null
          page_count: number | null
          published_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          google_books_url?: string | null
          id?: string
          isbn?: string | null
          page_count?: number | null
          published_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          google_books_url?: string | null
          id?: string
          isbn?: string | null
          page_count?: number | null
          published_date?: string | null
          title?: string
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
      }
      user_books: {
        Row: {
          book_id: string | null
          created_at: string | null
          date_finished: string | null
          date_started: string | null
          favorite: boolean  // ADDED: used throughout the app
          id: string
          // REMOVED: is_private, personal_rating (unused)
          notes: string | null
          status: Database["public"]["Enums"]["reading_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          date_finished?: string | null
          date_started?: string | null
          favorite?: boolean
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["reading_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          date_finished?: string | null
          date_started?: string | null
          favorite?: boolean
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["reading_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
      }
    }
    Enums: {
      activity_type: "started" | "finished" | "noted" | "added"
      reading_status: "reading" | "finished" | "planned" | "did_not_finish"  // Note: added "did_not_finish"
    }
  }
}

// The rest of the types remain the same...