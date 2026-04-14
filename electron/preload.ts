import { contextBridge, ipcRenderer } from 'electron';

// Define the API exposed to the renderer process
export interface ElectronAPI {
  // Screen capture sources
  getSources: () => Promise<Array<{
    id: string;
    name: string;
    thumbnail: string;
  }>>;
  
  // Recording session management
  createRecordingSession: (options?: {
    sessionName?: string;
    saveDirectory?: string | null;
    fileFormat?: 'webm' | 'mp4';
    videoBitrateKbps?: number;
  }) => Promise<{
    id: string;
    screenPath: string;
    webcamPath: string;
    folderPath: string;
    fileFormat: 'webm' | 'mp4';
  }>;
  
  // Save recording data
  saveRecordingChunk: (
    recordingId: string,
    type: 'screen' | 'webcam',
    chunk: ArrayBuffer,
    folderPath?: string
  ) => Promise<{ success: boolean }>;
  
  // Finalize recording
  finalizeRecording: (recordingId: string) => Promise<{ success: boolean; folderPath: string }>;
  
  // File operations
  openFolder: (folderPath: string) => Promise<{ success: boolean }>;
  getDefaultSaveDirectory: () => Promise<string>;
  selectSaveDirectory: () => Promise<string | null>;
  
  // Recording management
  getRecordings: () => Promise<Array<{
    id: string;
    name: string;
    createdAt: string;
    completedAt?: string;
    path: string;
  }>>;
  
  renameRecording: (
    recordingId: string,
    newName: string,
    recordingPath?: string
  ) => Promise<{ success: boolean }>;
  
  deleteRecording: (recordingId: string, recordingPath?: string) => Promise<{ success: boolean }>;
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Get available screen/window sources
  getSources: () => ipcRenderer.invoke('get-sources'),
  
  // Create a new recording session
  createRecordingSession: (options?: {
    sessionName?: string;
    saveDirectory?: string | null;
    fileFormat?: 'webm' | 'mp4';
    videoBitrateKbps?: number;
  }) =>
    ipcRenderer.invoke('create-recording-session', options),
  
  // Save a chunk of recording data
  saveRecordingChunk: (
    recordingId: string,
    type: 'screen' | 'webcam',
    chunk: ArrayBuffer,
    folderPath?: string
  ) =>
    ipcRenderer.invoke('save-recording-chunk', recordingId, type, chunk, folderPath),
  
  // Finalize a recording session
  finalizeRecording: (recordingId: string) => 
    ipcRenderer.invoke('finalize-recording', recordingId),
  
  // Open a folder in the system's file explorer
  openFolder: (folderPath: string) => 
    ipcRenderer.invoke('open-folder', folderPath),
  getDefaultSaveDirectory: () => ipcRenderer.invoke('get-default-save-directory'),
  selectSaveDirectory: () => ipcRenderer.invoke('select-save-directory'),
  
  // Get all saved recordings
  getRecordings: () => ipcRenderer.invoke('get-recordings'),
  
  // Rename a recording
  renameRecording: (recordingId: string, newName: string, recordingPath?: string) => 
    ipcRenderer.invoke('rename-recording', recordingId, newName, recordingPath),
  
  // Delete a recording
  deleteRecording: (recordingId: string, recordingPath?: string) => 
    ipcRenderer.invoke('delete-recording', recordingId, recordingPath),
} as ElectronAPI);

// Type declaration for the global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
