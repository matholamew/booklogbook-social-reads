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
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatarUrl: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current profile on open
  useEffect(() => {
    if (open && user) {
      (async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, display_name, bio, avatar_url')
          .eq('id', user.id)
          .single();
        if (error) {
          setError('Failed to load profile.');
        } else {
          setFormData({
            username: data.username || '',
            displayName: data.display_name || '',
            bio: data.bio || '',
            avatarUrl: data.avatar_url || '',
          });
        }
      })();
    }
  }, [open, user]);

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarFile(file);
    setLoading(true);
    setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, avatarUrl: publicUrlData.publicUrl }));
      toast({ title: 'Avatar uploaded!', description: 'Your avatar has been updated.' });
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Check username uniqueness
      if (formData.username) {
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formData.username)
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
          username: formData.username || null,
          display_name: formData.displayName || null,
          bio: formData.bio || null,
          avatar_url: formData.avatarUrl || null,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-2 border-slate-300 bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900">Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="relative">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-slate-300" />
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
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
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
              value={formData.displayName}
              onChange={e => setFormData({ ...formData, displayName: e.target.value })}
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
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
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