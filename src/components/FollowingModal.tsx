import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface FollowingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FriendProfile {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
}

export const FollowingModal = ({ open, onOpenChange }: FollowingModalProps) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const { data: follows, error: followsError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        if (followsError) throw followsError;
        const followingIds = follows?.map((f: any) => f.following_id) || [];
        if (followingIds.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, bio')
          .in('id', followingIds);
        if (profilesError) throw profilesError;
        setFriends(profiles || []);
      } catch (err: any) {
        setError('Failed to load friends.');
      } finally {
        setLoading(false);
      }
    };
    if (open) fetchFriends();
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900">Following</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="p-8 text-center text-slate-600">Loading friends...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : friends.length === 0 ? (
          <div className="p-8 text-center text-slate-600">You are not following anyone yet.</div>
        ) : (
          <div className="space-y-4">
            {friends.map(friend => (
              <div key={friend.id} className="border border-slate-300 bg-white rounded-lg p-4">
                <div className="font-semibold text-slate-900">{friend.display_name || friend.username}</div>
                <div className="text-xs text-slate-500 mb-1">@{friend.username}</div>
                {friend.bio && (
                  <div className="text-sm text-slate-800 line-clamp-2 whitespace-pre-line mt-1">
                    {friend.bio}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 