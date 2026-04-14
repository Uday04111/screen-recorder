import { Play, Square, X, FolderOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RecordingState } from '@/types';

interface ControlsProps {
  recordingState: RecordingState;
  selectedSource: boolean;
  sessionName: string;
  onSessionNameChange: (name: string) => void;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  onReset: () => void;
  onOpenFolder?: () => void;
  canOpenFolder?: boolean;
}

export function Controls({
  recordingState,
  selectedSource,
  sessionName,
  onSessionNameChange,
  onStart,
  onStop,
  onCancel,
  onReset,
  onOpenFolder,
  canOpenFolder = false,
}: ControlsProps) {
  const isIdle = recordingState === 'idle';
  const isCountdown = recordingState === 'countdown';
  const isRecording = recordingState === 'recording';
  const isStopping = recordingState === 'stopping';
  const isCompleted = recordingState === 'completed';

  return (
    <div className="space-y-4">
      {/* Session name input - only show when idle */}
      {isIdle && (
        <div className="space-y-2">
          <Label htmlFor="session-name" className="text-sm font-medium text-slate-700">
            Session Name (optional)
          </Label>
          <Input
            id="session-name"
            placeholder="Enter a name for this recording..."
            value={sessionName}
            onChange={(e) => onSessionNameChange(e.target.value)}
            className="bg-white"
          />
        </div>
      )}

      {/* Countdown display */}
      {isCountdown && (
        <div className="text-center py-4">
          <p className="text-lg text-slate-600">Recording starts in...</p>
          <p className="text-5xl font-bold text-blue-500 mt-2">3</p>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-3">
        {/* Idle state - Start button */}
        {isIdle && (
          <Button
            onClick={onStart}
            disabled={!selectedSource}
            className="flex-1 h-12 text-lg font-semibold gap-2"
          >
            <Play className="w-5 h-5" />
            Start Recording
          </Button>
        )}

        {/* Recording state - Stop and Cancel buttons */}
        {isRecording && (
          <>
            <Button
              onClick={onStop}
              variant="destructive"
              className="flex-1 h-12 text-lg font-semibold gap-2"
            >
              <Square className="w-5 h-5" />
              Stop Recording
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="h-12 px-4 gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </Button>
          </>
        )}

        {/* Stopping state */}
        {isStopping && (
          <Button disabled className="flex-1 h-12 text-lg font-semibold">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Saving...
          </Button>
        )}

        {/* Completed state - New recording and Open folder buttons */}
        {isCompleted && (
          <>
            <Button
              onClick={onReset}
              className="flex-1 h-12 text-lg font-semibold gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              New Recording
            </Button>
            {canOpenFolder && onOpenFolder && (
              <Button
                onClick={onOpenFolder}
                variant="outline"
                className="h-12 px-4 gap-2"
              >
                <FolderOpen className="w-5 h-5" />
                Open Folder
              </Button>
            )}
          </>
        )}
      </div>

      {/* Helper text */}
      {isIdle && !selectedSource && (
        <p className="text-sm text-amber-600 text-center">
          Please select a screen or window to record
        </p>
      )}
    </div>
  );
}
