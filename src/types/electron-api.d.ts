interface ElectronSource {
  id: string;
  name: string;
  thumbnail: string;
}

interface ElectronRecordingInfo {
  id: string;
  screenPath: string;
  webcamPath: string;
  folderPath: string;
  fileFormat: 'webm' | 'mp4';
}

interface ElectronRecordingSession {
  id: string;
  name: string;
  createdAt: string;
  completedAt?: string;
  path: string;
}

interface ElectronAPI {
  getSources: () => Promise<ElectronSource[]>;
  createRecordingSession: (options?: {
    sessionName?: string;
    saveDirectory?: string | null;
    fileFormat?: 'webm' | 'mp4';
    videoBitrateKbps?: number;
  }) => Promise<ElectronRecordingInfo>;
  saveRecordingChunk: (
    recordingId: string,
    type: 'screen' | 'webcam',
    chunk: ArrayBuffer,
    folderPath?: string
  ) => Promise<{ success: boolean }>;
  finalizeRecording: (recordingId: string) => Promise<{ success: boolean; folderPath: string }>;
  openFolder: (folderPath: string) => Promise<{ success: boolean }>;
  getDefaultSaveDirectory: () => Promise<string>;
  selectSaveDirectory: () => Promise<string | null>;
  getRecordings: () => Promise<ElectronRecordingSession[]>;
  renameRecording: (
    recordingId: string,
    newName: string,
    recordingPath?: string
  ) => Promise<{ success: boolean }>;
  deleteRecording: (recordingId: string, recordingPath?: string) => Promise<{ success: boolean }>;
}

interface Window {
  electronAPI: ElectronAPI;
}
