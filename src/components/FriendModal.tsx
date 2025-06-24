import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface FriendModalProps {
  open: boolean;
  friendId: string | null;
  onClose: () => void;
  onAddFriend?: () => void;
}

export const FriendModal = ({ open, friendId, onClose, onAddFriend }: FriendModalProps) => {
  const [friend, setFriend] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && friendId) {
      setLoading(true);
      supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .eq('id', friendId)
        .single()
        .then(({ data }) => {
          setFriend(data);
          setLoading(false);
        });
    }
    if (!open) setFriend(null);
  }, [open, friendId]);

  if (!open || !friendId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900">Friend</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-slate-700">Loading...</div>
        ) : friend ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              {friend.avatar_url ? (
                <img src={friend.avatar_url} alt={friend.username} className="h-12 w-12 rounded-full object-cover border border-slate-300" />
              ) : (
                <span className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-700 border border-slate-300">{friend.display_name?.[0] || friend.username?.[0]}</span>
              )}
              <div>
                <div className="font-semibold text-slate-900">{friend.display_name || friend.username}</div>
                <div className="text-xs text-slate-500">@{friend.username}</div>
              </div>
            </div>
            {friend.bio && <div className="text-slate-700 mb-4">{friend.bio}</div>}
            <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white" onClick={onAddFriend}>Add Friend</Button>
          </>
        ) : (
          <div className="text-slate-700">User not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 