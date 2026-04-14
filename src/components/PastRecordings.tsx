import { useState } from 'react';
import { FolderOpen, Trash2, Edit2, Check, X, Video, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { RecordingSession } from '@/types';

interface PastRecordingsProps {
  recordings: RecordingSession[];
  onOpenFolder: (path: string) => void;
  onDelete: (id: string, recordingPath: string) => void;
  onRename: (id: string, newName: string, recordingPath: string) => void;
}

export function PastRecordings({
  recordings,
  onOpenFolder,
  onDelete,
  onRename,
}: PastRecordingsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (recordings.length === 0) {
    return null;
  }

  const startEditing = (recording: RecordingSession) => {
    setEditingId(recording.id);
    setEditName(recording.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      const recording = recordings.find((item) => item.id === editingId);
      if (recording) {
        onRename(editingId, editName.trim(), recording.path);
      }
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
        Recent Recordings
      </h3>

      <ScrollArea className="h-48">
        <div className="space-y-2">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
            >
              {/* Icon */}
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5 text-slate-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {editingId === recording.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={saveEdit}
                    >
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={cancelEdit}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-slate-900 truncate">{recording.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(recording.createdAt)}
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              {editingId !== recording.id && (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onOpenFolder(recording.path)}
                    title="Open folder"
                  >
                    <FolderOpen className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => startEditing(recording)}
                    title="Rename"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Recording?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{recording.name}" and all its files.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(recording.id, recording.path)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
