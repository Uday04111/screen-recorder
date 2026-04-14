const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  createRecordingSession: (options) => ipcRenderer.invoke('create-recording-session', options),
  saveRecordingChunk: (recordingId, type, chunk, folderPath) =>
    ipcRenderer.invoke('save-recording-chunk', recordingId, type, chunk, folderPath),
  finalizeRecording: (recordingId) => ipcRenderer.invoke('finalize-recording', recordingId),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  getDefaultSaveDirectory: () => ipcRenderer.invoke('get-default-save-directory'),
  selectSaveDirectory: () => ipcRenderer.invoke('select-save-directory'),
  getRecordings: () => ipcRenderer.invoke('get-recordings'),
  renameRecording: (recordingId, newName, recordingPath) =>
    ipcRenderer.invoke('rename-recording', recordingId, newName, recordingPath),
  deleteRecording: (recordingId, recordingPath) =>
    ipcRenderer.invoke('delete-recording', recordingId, recordingPath),
});
