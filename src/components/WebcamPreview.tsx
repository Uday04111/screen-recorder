import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface WebcamPreviewProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  isRecording: boolean;
}

export function WebcamPreview({ enabled, onToggle, isRecording }: WebcamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Start/stop webcam preview based on enabled state
  useEffect(() => {
    if (!enabled) {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setError(null);
      return;
    }

    // Start webcam preview
    const startWebcam = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error('Webcam error:', err);
        setError(err.name === 'NotAllowedError' 
          ? 'Camera permission denied' 
          : 'Could not access camera'
        );
        onToggle(false);
      } finally {
        setIsLoading(false);
      }
    };

    startWebcam();

    // Cleanup
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [enabled, onToggle]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {enabled ? (
            <Video className="w-5 h-5 text-blue-500" />
          ) : (
            <VideoOff className="w-5 h-5 text-slate-400" />
          )}
          <span className="font-medium text-slate-900">Webcam</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Label 
            htmlFor="webcam-toggle" 
            className="text-sm text-slate-500 cursor-pointer"
          >
            {enabled ? 'On' : 'Off'}
          </Label>
          <Switch
            id="webcam-toggle"
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={isRecording}
          />
        </div>
      </div>

      {/* Preview area */}
      <div className="relative aspect-video bg-slate-900">
        {enabled ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-4">
                <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
                <p className="text-sm text-center">{error}</p>
              </div>
            )}

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                REC
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <VideoOff className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Webcam is disabled</p>
            <p className="text-xs mt-1 opacity-70">Toggle to enable</p>
          </div>
        )}
      </div>
    </div>
  );
}
