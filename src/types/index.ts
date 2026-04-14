// Screen/Window source for recording
export interface ScreenSource {
  id: string;
  name: string;
  thumbnail: string;
}

// Recording session metadata
export interface RecordingSession {
  id: string;
  name: string;
  createdAt: string;
  completedAt?: string;
  path: string;
}

// Recording state
export type RecordingState = 'idle' | 'selecting' | 'countdown' | 'recording' | 'stopping' | 'completed';

// Recording configuration
export interface RecordingConfig {
  screenSourceId: string | null;
  enableWebcam: boolean;
  sessionName: string;
  fileFormat: 'webm' | 'mp4';
  videoBitrateKbps: number;
  saveDirectory: string | null;
}

// Recording info returned from main process
export interface RecordingInfo {
  id: string;
  screenPath: string;
  webcamPath: string;
  folderPath: string;
  fileFormat: 'webm' | 'mp4';
}

// Active recording handles
export interface ActiveRecording {
  recordingId: string;
  sessionName: string;
  fileFormat: 'webm' | 'mp4';
  screenRecorder: MediaRecorder | null;
  webcamRecorder: MediaRecorder | null;
  screenStream: MediaStream | null;
  webcamStream: MediaStream | null;
  startTime: number;
  folderPath: string;
}

// Timer state
export interface TimerState {
  elapsed: number;
  formatted: string;
}

// Recording stats
export interface RecordingStats {
  screenSize: number;
  webcamSize: number;
  duration: number;
}
