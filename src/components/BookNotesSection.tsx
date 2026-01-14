import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, X, Edit2, Trash2, BookOpen, Tag } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface BookNote {
  id: string;
  content: string;
  highlight_text: string | null;
  tags: string[];
  page_number: number | null;
  created_at: string;
  updated_at: string;
}

interface BookNotesSectionProps {
  userBookId: string;
  bookTitle: string;
}

export const BookNotesSection = ({ userBookId, bookTitle }: BookNotesSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<BookNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  
  // New note form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState({
    content: '',
    highlight_text: '',
    tags: '',
    page_number: '',
  });
  const [saving, setSaving] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState({
    content: '',
    highlight_text: '',
    tags: '',
    page_number: '',
  });

  // Fetch notes
  const fetchNotes = async () => {
    if (!user || !userBookId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('book_notes')
        .select('*')
        .eq('user_book_id', userBookId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [userBookId, user]);

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));

  // Filter notes by search and tag
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.highlight_text?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      note.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = !tagFilter || note.tags?.includes(tagFilter);
    
    return matchesSearch && matchesTag;
  });

  const handleAddNote = async () => {
    if (!user || !newNote.content.trim()) return;
    setSaving(true);
    try {
      const tags = newNote.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await supabase
        .from('book_notes')
        .insert({
          user_book_id: userBookId,
          user_id: user.id,
          content: newNote.content.trim(),
          highlight_text: newNote.highlight_text.trim() || null,
          tags,
          page_number: newNote.page_number ? parseInt(newNote.page_number) : null,
        });
      
      if (error) throw error;
      
      toast({ title: 'Note added', description: 'Your note has been saved.' });
      setNewNote({ content: '', highlight_text: '', tags: '', page_number: '' });
      setShowAddForm(false);
      fetchNotes();
      queryClient.invalidateQueries({ queryKey: ['userBooks'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add note.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!user || !editNote.content.trim()) return;
    setSaving(true);
    try {
      const tags = editNote.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await supabase
        .from('book_notes')
        .update({
          content: editNote.content.trim(),
          highlight_text: editNote.highlight_text.trim() || null,
          tags,
          page_number: editNote.page_number ? parseInt(editNote.page_number) : null,
        })
        .eq('id', noteId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({ title: 'Note updated', description: 'Your note has been updated.' });
      setEditingId(null);
      fetchNotes();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update note.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('book_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({ title: 'Note deleted', description: 'Your note has been removed.' });
      fetchNotes();
      queryClient.invalidateQueries({ queryKey: ['userBooks'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete note.' });
    }
  };

  const startEditing = (note: BookNote) => {
    setEditingId(note.id);
    setEditNote({
      content: note.content,
      highlight_text: note.highlight_text || '',
      tags: (note.tags || []).join(', '),
      page_number: note.page_number?.toString() || '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Notes & Highlights
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </div>

      {/* Search and Tag Filter */}
      {notes.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 border-slate-300"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <Badge
                variant={tagFilter === null ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setTagFilter(null)}
              >
                All
              </Badge>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={tagFilter === tag ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Note Form */}
      {showAddForm && (
        <div className="border rounded-lg p-3 bg-slate-50 space-y-3">
          <div>
            <Label className="text-xs text-slate-600">Highlight/Quote (optional)</Label>
            <Textarea
              value={newNote.highlight_text}
              onChange={(e) => setNewNote({ ...newNote, highlight_text: e.target.value })}
              placeholder="Add a memorable quote or highlight..."
              className="mt-1 min-h-[60px] border-slate-300 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600">Your Note</Label>
            <Textarea
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              placeholder="Your thoughts, reflections..."
              className="mt-1 min-h-[80px] border-slate-300 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-600">Tags (comma separated)</Label>
              <Input
                value={newNote.tags}
                onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                placeholder="favorite, chapter1, insight"
                className="mt-1 border-slate-300 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600">Page Number</Label>
              <Input
                type="number"
                value={newNote.page_number}
                onChange={(e) => setNewNote({ ...newNote, page_number: e.target.value })}
                placeholder="42"
                className="mt-1 border-slate-300 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddNote}
              disabled={saving || !newNote.content.trim()}
            >
              {saving ? 'Saving...' : 'Save Note'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {loading ? (
        <div className="text-sm text-slate-500 text-center py-4">Loading notes...</div>
      ) : filteredNotes.length > 0 ? (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {filteredNotes.map(note => (
            <div key={note.id} className="border rounded-lg p-3 bg-white">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editNote.highlight_text}
                    onChange={(e) => setEditNote({ ...editNote, highlight_text: e.target.value })}
                    placeholder="Highlight/Quote"
                    className="min-h-[40px] border-slate-300 text-sm"
                  />
                  <Textarea
                    value={editNote.content}
                    onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                    placeholder="Your note"
                    className="min-h-[60px] border-slate-300 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={editNote.tags}
                      onChange={(e) => setEditNote({ ...editNote, tags: e.target.value })}
                      placeholder="Tags"
                      className="border-slate-300 text-sm"
                    />
                    <Input
                      type="number"
                      value={editNote.page_number}
                      onChange={(e) => setEditNote({ ...editNote, page_number: e.target.value })}
                      placeholder="Page"
                      className="border-slate-300 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateNote(note.id)} disabled={saving}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {note.highlight_text && (
                    <blockquote className="border-l-2 border-primary pl-3 mb-2 italic text-slate-700 text-sm">
                      "{note.highlight_text}"
                    </blockquote>
                  )}
                  <p className="text-slate-800 text-sm whitespace-pre-line">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.page_number && (
                        <span className="text-xs text-slate-500">p. {note.page_number}</span>
                      )}
                      {(note.tags || []).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : notes.length > 0 ? (
        <div className="text-sm text-slate-500 text-center py-4">No notes match your search.</div>
      ) : (
        <div className="text-sm text-slate-500 text-center py-4">
          No notes yet. Add your first note!
        </div>
      )}
    </div>
  );
};