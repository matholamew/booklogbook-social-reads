import { useState, useEffect, useRef } from 'react';
import { Book, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProfileEditModal } from './ProfileEditModal';
import { supabase } from '@/integrations/supabase/client';
import { BookModal } from '@/components/BookModal';
import { AuthorModal } from '@/components/AuthorModal';
import { FriendModal } from '@/components/FriendModal';
import { toast } from '@/hooks/use-toast';
import { LottieAnimation } from '@/components/ui/lottie-animation';
import { useAnimation } from '@/hooks/useAnimation';

// Import animation data
const searchAnimation = {
  "v":"5.7.4","fr":60,"ip":0,"op":120,"w":100,"h":100,"nm":"Search","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"Search","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[50,50,0],"ix":2,"l":2},"a":{"a":0,"k":[0,0,0],"ix":1,"l":2},"s":{"a":0,"k":[100,100,100],"ix":6,"l":2}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[40,40],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":0,"ix":4},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse","hd":false},{"ty":"st","c":{"a":0,"k":[0.2,0.2,0.2,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":3,"ix":5},"lc":2,"lj":1,"ml":4,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Circle","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":0,"k":[3,15],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":45,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0.2,0.2,0.2,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Handle","np":3,"cix":2,"bm":0,"ix":2,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60,"s":[100]}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60,"s":[100]}],"ix":2},"o":{"a":0,"k":0,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":120,"st":0,"bm":0}],"markers":[]
};

const userAnimation = {
  "v":"5.7.4","fr":60,"ip":0,"op":120,"w":100,"h":100,"nm":"User","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"User","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[50,50,0],"ix":2,"l":2},"a":{"a":0,"k":[0,0,0],"ix":1,"l":2},"s":{"a":0,"k":[100,100,100],"ix":6,"l":2}},"ao":0,"shapes":[{"ty":"gr","it":[{"d":1,"ty":"el","s":{"a":0,"k":[30,30],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":0,"ix":4},"nm":"Ellipse Path 1","mn":"ADBE Vector Shape - Ellipse","hd":false},{"ty":"fl","c":{"a":0,"k":[0.2,0.2,0.2,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Head","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":0,"k":[20,30],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":0,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0.2,0.2,0.2,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Body","np":3,"cix":2,"bm":0,"ix":2,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60,"s":[100]}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"t":60,"s":[100]}],"ix":2},"o":{"a":0,"k":0,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":120,"st":0,"bm":0}],"markers":[]
};

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any>({ books: [], authors: [], friends: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [modalState, setModalState] = useState<
    | { type: 'book'; id: string }
    | { type: 'author'; id: string }
    | { type: 'friend'; id: string }
    | null
  >(null);

  const {
    lottieRef: searchLottieRef,
    handleMouseEnter: handleSearchMouseEnter,
    handleMouseLeave: handleSearchMouseLeave,
    handleComplete: handleSearchComplete
  } = useAnimation({ autoplay: false, loop: false });

  const {
    lottieRef: userLottieRef,
    handleMouseEnter: handleUserMouseEnter,
    handleMouseLeave: handleUserMouseLeave,
    handleComplete: handleUserComplete
  } = useAnimation({ autoplay: false, loop: false });

  const handleEditProfileOpenChange = (open: boolean) => {
    console.log('setEditProfileOpen called with:', open);
    setEditProfileOpen(open);
  };

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ books: [], authors: [], friends: [] });
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    setShowDropdown(true);
    const fetchResults = async () => {
      // Books
      const { data: books } = await supabase
        .from('books')
        .select('id, title')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);
      // Authors
      const { data: authors } = await supabase
        .from('authors')
        .select('id, name')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);
      // Friends (users)
      const { data: friends } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(5);
      setSearchResults({ books: books || [], authors: authors || [], friends: friends || [] });
      setSearchLoading(false);
    };
    const timeout = setTimeout(fetchResults, 250); // debounce
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Flatten results for keyboard navigation
  const flatResults = [
    ...searchResults.books.map((b: any) => ({ ...b, _type: 'book' })),
    ...searchResults.authors.map((a: any) => ({ ...a, _type: 'author' })),
    ...searchResults.friends.map((f: any) => ({ ...f, _type: 'friend' })),
  ];

  // Handle result selection (click or Enter)
  const handleResultSelect = (result: any) => {
    console.log('Selected result:', result);
    if (result._type === 'book') {
      setModalState({ type: 'book', id: result.id });
    } else if (result._type === 'author') {
      setModalState({ type: 'author', id: result.id });
    } else if (result._type === 'friend') {
      setModalState({ type: 'friend', id: result.id });
    }
    setShowDropdown(false);
  };

  // Update Enter key handler in keyboard navigation
  useEffect(() => {
    if (!showDropdown) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!flatResults.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % flatResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && highlightedIndex < flatResults.length) {
          handleResultSelect(flatResults[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDropdown, flatResults, highlightedIndex]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchResults]);

  // Keyboard navigation and close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  return (
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50" style={{ backgroundColor: '#fff' }}>
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Book className="h-6 w-6" />
            <span className="hidden sm:block font-serif text-slate-900">BookLogBook</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <div 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10"
              onMouseEnter={handleSearchMouseEnter}
              onMouseLeave={handleSearchMouseLeave}
            >
              <LottieAnimation
                lottieRef={searchLottieRef}
                animationData={searchAnimation}
                width={16}
                height={16}
                className="text-slate-600"
                onComplete={handleSearchComplete}
              />
            </div>
            <Input
              ref={searchInputRef}
              placeholder="Search books, authors, or friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-2 border-slate-300 focus:bg-white focus:border-slate-800 transition-colors text-slate-900 placeholder:text-slate-600"
              onFocus={() => searchQuery && setShowDropdown(true)}
              aria-label="Search books, authors, or friends"
              autoComplete="off"
            />
            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto" role="listbox">
                {searchLoading ? (
                  <div className="p-4 text-slate-600">Searching...</div>
                ) : (
                  <>
                    {searchResults.books.length === 0 && searchResults.authors.length === 0 && searchResults.friends.length === 0 ? (
                      <div className="p-4 text-slate-600">No results found.</div>
                    ) : (
                      <>
                        {searchResults.books.length > 0 && (
                          <div>
                            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase">Books</div>
                            {searchResults.books.map((book: any, i: number) => {
                              const flatIdx = i;
                              const resultObj = { ...book, _type: 'book' };
                              return (
                                <div
                                  key={book.id}
                                  className={`px-4 py-2 hover:bg-slate-100 cursor-pointer text-slate-900 ${highlightedIndex === flatIdx ? 'bg-slate-200' : ''}`}
                                  role="option"
                                  aria-selected={highlightedIndex === flatIdx}
                                  onMouseDown={() => handleResultSelect(resultObj)}
                                  onMouseEnter={() => setHighlightedIndex(flatIdx)}
                                >
                                  {book.title}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {searchResults.authors.length > 0 && (
                          <div>
                            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase">Authors</div>
                            {searchResults.authors.map((author: any, i: number) => {
                              const flatIdx = searchResults.books.length + i;
                              const resultObj = { ...author, _type: 'author' };
                              return (
                                <div
                                  key={author.id}
                                  className={`px-4 py-2 hover:bg-slate-100 cursor-pointer text-slate-900 ${highlightedIndex === flatIdx ? 'bg-slate-200' : ''}`}
                                  role="option"
                                  aria-selected={highlightedIndex === flatIdx}
                                  onMouseDown={() => handleResultSelect(resultObj)}
                                  onMouseEnter={() => setHighlightedIndex(flatIdx)}
                                >
                                  {author.name}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {searchResults.friends.length > 0 && (
                          <div>
                            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase">Friends</div>
                            {searchResults.friends.map((friend: any, i: number) => {
                              const flatIdx = searchResults.books.length + searchResults.authors.length + i;
                              const resultObj = { ...friend, _type: 'friend' };
                              return (
                                <div
                                  key={friend.id}
                                  className={`px-4 py-2 hover:bg-slate-100 cursor-pointer flex items-center gap-2 text-slate-900 ${highlightedIndex === flatIdx ? 'bg-slate-200' : ''}`}
                                  role="option"
                                  aria-selected={highlightedIndex === flatIdx}
                                  onMouseDown={() => handleResultSelect(resultObj)}
                                  onMouseEnter={() => setHighlightedIndex(flatIdx)}
                                >
                                  {friend.avatar_url ? (
                                    <img src={friend.avatar_url} alt={friend.username} className="h-6 w-6 rounded-full object-cover border border-slate-300" />
                                  ) : (
                                    <span className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 border border-slate-300">{friend.display_name?.[0] || friend.username?.[0]}</span>
                                  )}
                                  <span className="font-medium">{friend.display_name || friend.username}</span>
                                  <span className="text-xs text-slate-500 ml-2">@{friend.username}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 text-slate-800 hover:text-slate-900 hover:bg-slate-200 border border-slate-300 hover:border-slate-400 flex items-center justify-center"
                      onMouseEnter={handleUserMouseEnter}
                      onMouseLeave={handleUserMouseLeave}
                    >
                      <LottieAnimation
                        lottieRef={userLottieRef}
                        animationData={userAnimation}
                        width={20}
                        height={20}
                        onComplete={handleUserComplete}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="text-slate-600">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditProfileOpen(true)} className="text-slate-900">
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {editProfileOpen && (
                  <ProfileEditModal
                    open={editProfileOpen}
                    onOpenChange={handleEditProfileOpenChange}
                  />
                )}
              </>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 text-slate-800 hover:text-slate-900 hover:bg-slate-200 border border-slate-300 hover:border-slate-400 flex items-center justify-center"
                  onMouseEnter={handleUserMouseEnter}
                  onMouseLeave={handleUserMouseLeave}
                >
                  <LottieAnimation
                    lottieRef={userLottieRef}
                    animationData={userAnimation}
                    width={20}
                    height={20}
                    onComplete={handleUserComplete}
                  />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Modals for search results */}
      {modalState?.type === 'book' && (
        <BookModal
          open={modalState.type === 'book'}
          bookId={modalState.id}
          onClose={() => setModalState(null)}
          onAddToLibrary={() => {/* TODO: implement add to library */}}
        />
      )}
      {modalState?.type === 'author' && (
        <AuthorModal
          open={modalState.type === 'author'}
          authorId={modalState.id}
          onClose={() => setModalState(null)}
          onBookClick={(bookId) => setModalState({ type: 'book', id: bookId })}
        />
      )}
      {modalState?.type === 'friend' && (
        <FriendModal
          open={modalState.type === 'friend'}
          friendId={modalState.id}
          onClose={() => setModalState(null)}
          onAddFriend={async () => {
            if (!user || !modalState?.id) return;
            const { error } = await supabase
              .from('user_follows')
              .insert({ follower_id: user.id, following_id: modalState.id });
            if (error) {
              toast({ title: 'Error', description: 'Could not add friend. They may already be added.', });
            } else {
              toast({ title: 'Friend added!', description: 'You are now following this user.' });
              setModalState(null);
            }
          }}
        />
      )}
    </header>
  );
};
