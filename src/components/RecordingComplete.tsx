import { CheckCircle, FolderOpen, FileVideo, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RecordingCompleteProps {
  sessionName: string;
  folderPath: string;
  elapsedTime: string;
  onOpenFolder: () => void;
  onNewRecording: () => void;
}

export function RecordingComplete({
  sessionName,
  folderPath,
  elapsedTime,
  onOpenFolder,
  onNewRecording,
}: RecordingCompleteProps) {
  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Recording Complete!</h2>
        <p className="text-slate-500 mt-1">Your recording has been saved successfully</p>
      </div>

      {/* Recording details card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileVideo className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500">Session Name</p>
              <p className="font-medium text-slate-900 truncate">{sessionName}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500">Duration</p>
              <p className="font-medium text-slate-900">{elapsedTime}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500">Saved to</p>
              <p className="font-medium text-slate-900 text-sm break-all">{folderPath}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onNewRecording}
          className="flex-1 h-12 text-lg font-semibold gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          New Recording
        </Button>
        <Button
          onClick={onOpenFolder}
          variant="outline"
          className="h-12 px-6 gap-2"
        >
          <FolderOpen className="w-5 h-5" />
          Open Folder
        </Button>
      </div>
    </div>
  );
}
