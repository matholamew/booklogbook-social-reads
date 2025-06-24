import { useState } from 'react';
import { Book, Search, User, LogOut } from 'lucide-react';
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
import { ProfileEditModal } from '@/components/ProfileEditModal';

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const handleEditProfileOpenChange = (open: boolean) => {
    console.log('setEditProfileOpen called with:', open);
    setEditProfileOpen(open);
  };

  return (
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Book className="h-6 w-6" />
            <span className="hidden sm:block font-serif text-slate-900">BookLogBook</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 h-4 w-4" />
            <Input
              placeholder="Search books or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-2 border-slate-300 focus:bg-white focus:border-slate-800 transition-colors text-slate-900 placeholder:text-slate-600"
            />
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2 text-slate-800 hover:text-slate-900 hover:bg-slate-200 border border-slate-300 hover:border-slate-400">
                      <User className="h-5 w-5" />
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
                    onCloseComplete={() => setEditProfileOpen(false)}
                  />
                )}
              </>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="p-2 text-slate-800 hover:text-slate-900 hover:bg-slate-200 border border-slate-300 hover:border-slate-400">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
