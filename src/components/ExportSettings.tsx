import { Folder, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExportSettingsProps {
  fileFormat: 'webm' | 'mp4';
  videoBitrateKbps: number;
  saveDirectory: string | null;
  onFileFormatChange: (format: 'webm' | 'mp4') => void;
  onBitrateChange: (bitrateKbps: number) => void;
  onBrowseSaveDirectory: () => void;
  onResetSaveDirectory: () => void;
  isDisabled?: boolean;
}

export function ExportSettings({
  fileFormat,
  videoBitrateKbps,
  saveDirectory,
  onFileFormatChange,
  onBitrateChange,
  onBrowseSaveDirectory,
  onResetSaveDirectory,
  isDisabled = false,
}: ExportSettingsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-5 h-5 text-slate-500" />
        <h3 className="font-semibold text-slate-900">Export Settings</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-format">File Format</Label>
        <select
          id="file-format"
          value={fileFormat}
          disabled={isDisabled}
          onChange={(event) => onFileFormatChange(event.target.value as 'webm' | 'mp4')}
          className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white disabled:opacity-60"
        >
          <option value="webm">WEBM</option>
          <option value="mp4">MP4</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-bitrate">Video Bitrate (kbps)</Label>
        <Input
          id="video-bitrate"
          type="number"
          min={500}
          step={100}
          disabled={isDisabled}
          value={videoBitrateKbps}
          onChange={(event) => onBitrateChange(Number(event.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>Save Location</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isDisabled}
            className="gap-2"
            onClick={onBrowseSaveDirectory}
          >
            <Folder className="w-4 h-4" />
            Browse
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isDisabled}
            onClick={onResetSaveDirectory}
          >
            Reset
          </Button>
        </div>
        <p className="text-xs text-slate-500 break-all">
          {saveDirectory || 'Default location'}
        </p>
      </div>
    </div>
  );
}
