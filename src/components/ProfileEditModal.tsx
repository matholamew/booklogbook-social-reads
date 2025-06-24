import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileEditModal = ({ open, onOpenChange }: ProfileEditModalProps) => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile on open
  useEffect(() => {
    if (open && user) {
      setLoading(true);
      supabase
        .from('profiles')
        .select('username, display_name, bio, avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            setError('Failed to load profile.');
          } else {
            setUsername(data.username || '');
            setDisplayName(data.display_name || '');
            setBio(data.bio || '');
            setAvatarUrl(data.avatar_url || '');
          }
          setLoading(false);
        });
    }
    if (!open) {
      setError('');
      setLoading(false);
      setAvatarFile(null);
    }
  }, [open, user]);

  // Avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);
    setError('');
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(publicUrlData.publicUrl);
      toast({ title: 'Avatar uploaded!', description: 'Your avatar has been updated.' });
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar.');
    } finally {
      setLoading(false);
    }
  };

  // Save profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Check username uniqueness
      if (username) {
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .neq('id', user.id);
        if (checkError) throw checkError;
        if (existing && existing.length > 0) {
          setError('Username is already taken.');
          setLoading(false);
          return;
        }
      }
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username || null,
          display_name: displayName || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);
      if (updateError) throw updateError;
      toast({ title: 'Profile updated!', description: 'Your profile has been updated.' });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // If not open, do not render (ensures overlay is removed)
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white"
        aria-describedby="profile-edit-description"
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900">Edit Profile</DialogTitle>
        </DialogHeader>
        <p id="profile-edit-description" className="sr-only">
          Edit your username, display name, bio, and avatar.
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-slate-300" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center text-3xl text-slate-600 border-2 border-slate-300">
                  ?
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute bottom-0 right-0 rounded-full p-1 border-2 border-slate-400 bg-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                aria-label="Change avatar"
              >
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="username" className="text-slate-800 font-medium">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a unique username"
              className="mt-1 border-2 border-slate-300 focus:border-slate-700 text-slate-900 bg-white"
              autoComplete="off"
              required
              minLength={3}
              maxLength={32}
              pattern="^[a-zA-Z0-9_]+$"
              title="Letters, numbers, and underscores only"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="displayName" className="text-slate-800 font-medium">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name as shown to others"
              className="mt-1 border-2 border-slate-300 focus:border-slate-700 text-slate-900 bg-white"
              autoComplete="off"
              maxLength={64}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="bio" className="text-slate-800 font-medium">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="mt-1 min-h-[80px] border-2 border-slate-300 focus:border-slate-700 text-slate-900 bg-white"
              maxLength={300}
              disabled={loading}
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200" aria-live="polite">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-2 border-slate-400 text-slate-800 bg-white hover:bg-slate-50" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white" disabled={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 