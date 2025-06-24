import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 min-w-[320px] max-w-[400px] w-full relative" onClick={e => e.stopPropagation()}>
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
            <Button variant="outline" className="w-full mt-2" onClick={onClose}>Close</Button>
          </>
        ) : (
          <div className="text-slate-700">User not found.</div>
        )}
      </div>
    </div>
  );
}; 