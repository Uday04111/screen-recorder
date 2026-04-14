import { useEffect, useState } from 'react';
import { Disc } from 'lucide-react';

interface TimerProps {
  elapsedTime: string;
  isRecording: boolean;
}

export function Timer({ elapsedTime, isRecording }: TimerProps) {
  const [showPulse, setShowPulse] = useState(true);

  // Blink effect for recording indicator
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      setShowPulse((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="flex items-center gap-4 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-lg">
      {/* Recording indicator */}
      <div className="relative">
        <Disc 
          className={`w-6 h-6 transition-opacity duration-300 ${
            showPulse ? 'opacity-100' : 'opacity-40'
          }`} 
        />
        {isRecording && (
          <span className="absolute inset-0 animate-ping">
            <Disc className="w-6 h-6 text-red-400 opacity-75" />
          </span>
        )}
      </div>

      {/* Timer display */}
      <div className="flex flex-col">
        <span className="text-xs text-slate-400 uppercase tracking-wider">
          {isRecording ? 'Recording' : 'Elapsed'}
        </span>
        <span className="text-3xl font-mono font-bold tracking-wider">
          {elapsedTime}
        </span>
      </div>

      {/* Recording status */}
      {isRecording && (
        <div className="ml-2 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
          LIVE
        </div>
      )}
    </div>
  );
}
