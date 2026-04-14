import { app, BrowserWindow, ipcMain, desktopCapturer, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep track of active recordings
let activeRecordingId: string | null = null;
let videosDir: string;
const recordingPaths = new Map<string, string>();

type RecordingFileFormat = 'webm' | 'mp4';

interface RecordingSessionOptions {
  sessionName?: string;
  saveDirectory?: string | null;
  fileFormat?: RecordingFileFormat;
  videoBitrateKbps?: number;
}

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

function getExistingRecordingFile(sessionDir: string, type: 'screen' | 'webcam'): string | null {
  const mp4Path = path.join(sessionDir, `${type}.mp4`);
  const webmPath = path.join(sessionDir, `${type}.webm`);
  if (fs.existsSync(mp4Path)) return mp4Path;
  if (fs.existsSync(webmPath)) return webmPath;
  return null;
}

function runFfmpegCommand(configure: (command: ffmpeg.FfmpegCommand) => void) {
  return new Promise<void>((resolve, reject) => {
    const command = ffmpeg();
    configure(command);
    command
      .on('end', () => resolve())
      .on('error', (error) => reject(error))
      .run();
  });
}

async function createMergedFinalVideo(sessionDir: string) {
  const screenPath = getExistingRecordingFile(sessionDir, 'screen');
  if (!screenPath) {
    return null;
  }

  const webcamPath = getExistingRecordingFile(sessionDir, 'webcam');
  const finalPath = path.join(sessionDir, 'final.mp4');

  if (webcamPath) {
    await runFfmpegCommand((command) => {
      command
        .input(screenPath)
        .input(webcamPath)
        .complexFilter([
          '[1:v]scale=iw*0.25:-1[cam]',
          '[0:v][cam]overlay=W-w-20:H-h-20[v]',
        ])
        .outputOptions([
          '-map [v]',
          '-map 0:a?',
          '-c:v libx264',
          '-preset veryfast',
          '-crf 23',
          '-pix_fmt yuv420p',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart',
          '-shortest',
          '-y',
        ])
        .output(finalPath);
    });
  } else {
    await runFfmpegCommand((command) => {
      command
        .input(screenPath)
        .outputOptions([
          '-c:v libx264',
          '-preset veryfast',
          '-crf 23',
          '-pix_fmt yuv420p',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart',
          '-y',
        ])
        .output(finalPath);
    });
  }

  return finalPath;
}

// Set up videos directory in user's home folder
function getVideosDir() {
  const homeDir = app.getPath('home');
  return path.join(homeDir, 'ScreenRecorder', 'videos');
}

// Create the main window
function createWindow() {
  // Electron preload is most reliable as CommonJS on Windows.
  const projectPreloadPath = path.join(app.getAppPath(), 'electron', 'preload.cjs');
  const distPreloadPath = path.join(__dirname, 'preload.js');
  const preloadPath = fs.existsSync(projectPreloadPath) ? projectPreloadPath : distPreloadPath;

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  return mainWindow;
}

// App lifecycle
app.whenReady().then(() => {
  videosDir = getVideosDir();
  
  // Ensure videos directory exists
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app close during recording - clean up unfinished recordings
app.on('before-quit', () => {
  if (activeRecordingId) {
    const recordingPath = recordingPaths.get(activeRecordingId) || path.join(videosDir, activeRecordingId);
    if (fs.existsSync(recordingPath)) {
      // Clean up incomplete recording
      fs.rmSync(recordingPath, { recursive: true, force: true });
    }
  }
});

// IPC Handlers
function getFileNameForType(type: 'screen' | 'webcam', format: RecordingFileFormat) {
  return `${type}.${format}`;
}

// Get available screens and windows for recording
ipcMain.handle('get-sources', async () => {
  try {
    let sources = [];
    try {
      sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 300, height: 200 },
      });
    } catch (primaryError) {
      console.warn('Failed to load window+screen sources, trying screen only:', primaryError);
      sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 300, height: 200 },
      });
    }

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.isEmpty()
        ? ''
        : source.thumbnail.toDataURL(),
    }));
  } catch (error) {
    console.error('Error getting sources:', error);
    const message = error instanceof Error ? error.message : 'Unknown screen source error';
    throw new Error(`Failed to get screen sources: ${message}`);
  }
});

// Create a new recording session with unique ID
ipcMain.handle('create-recording-session', async (_, options?: RecordingSessionOptions) => {
  const sessionName = options?.sessionName;
  const saveDirectory = options?.saveDirectory || videosDir;
  const fileFormat: RecordingFileFormat = options?.fileFormat === 'mp4' ? 'mp4' : 'webm';
  const videoBitrateKbps = options?.videoBitrateKbps;
  const id = uuidv4();
  const sessionDir = path.join(saveDirectory, id);
  
  fs.mkdirSync(sessionDir, { recursive: true });
  
  // Save session metadata
  const metadata = {
    id,
    name: sessionName || `Recording ${new Date().toLocaleString()}`,
    createdAt: new Date().toISOString(),
    path: sessionDir,
    fileFormat,
    videoBitrateKbps,
  };
  
  fs.writeFileSync(
    path.join(sessionDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  activeRecordingId = id;
  recordingPaths.set(id, sessionDir);
  
  return {
    id,
    screenPath: path.join(sessionDir, getFileNameForType('screen', fileFormat)),
    webcamPath: path.join(sessionDir, getFileNameForType('webcam', fileFormat)),
    folderPath: sessionDir,
    fileFormat,
  };
});

// Save recording chunk to file
ipcMain.handle(
  'save-recording-chunk',
  async (
    _,
    recordingId: string,
    type: 'screen' | 'webcam',
    chunk: ArrayBuffer,
    folderPath?: string
  ) => {
  try {
    const sessionDir = folderPath || recordingPaths.get(recordingId) || path.join(videosDir, recordingId);
    const metadataPath = path.join(sessionDir, 'metadata.json');
    let fileFormat: RecordingFileFormat = 'webm';
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        if (metadata.fileFormat === 'mp4') {
          fileFormat = 'mp4';
        }
      } catch {
        fileFormat = 'webm';
      }
    }
    const fileName = getFileNameForType(type, fileFormat);
    const filePath = path.join(sessionDir, fileName);
    
    // Append chunk to file
    const buffer = Buffer.from(chunk);
    
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buffer);
    } else {
      fs.appendFileSync(filePath, buffer);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving chunk:', error);
    throw error;
  }
});

ipcMain.handle('get-default-save-directory', async () => {
  return videosDir;
});

ipcMain.handle('select-save-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: videosDir,
    title: 'Select recording save folder',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// Finalize recording session
ipcMain.handle('finalize-recording', async (_, recordingId: string) => {
  try {
    const sessionDir = recordingPaths.get(recordingId) || path.join(videosDir, recordingId);
    const metadataPath = path.join(sessionDir, 'metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      metadata.completedAt = new Date().toISOString();
      try {
        const finalPath = await createMergedFinalVideo(sessionDir);
        metadata.finalPath = finalPath;
        metadata.mergedAt = finalPath ? new Date().toISOString() : null;
      } catch (mergeError) {
        console.error('Error creating final.mp4:', mergeError);
        metadata.finalPath = null;
        metadata.mergeError = mergeError instanceof Error ? mergeError.message : 'Unknown merge error';
      }
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
    
    if (activeRecordingId === recordingId) {
      activeRecordingId = null;
    }
    recordingPaths.delete(recordingId);
    
    return { success: true, folderPath: sessionDir };
  } catch (error) {
    console.error('Error finalizing recording:', error);
    throw error;
  }
});

// Open folder in file explorer
ipcMain.handle('open-folder', async (_, folderPath: string) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    console.error('Error opening folder:', error);
    throw error;
  }
});

// Get all recordings
ipcMain.handle('get-recordings', async () => {
  try {
    if (!fs.existsSync(videosDir)) {
      return [];
    }
    
    const recordings = [];
    const entries = fs.readdirSync(videosDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metadataPath = path.join(videosDir, entry.name, 'metadata.json');
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          recordings.push(metadata);
        }
      }
    }
    
    return recordings.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting recordings:', error);
    return [];
  }
});

// Rename recording session
ipcMain.handle('rename-recording', async (_, recordingId: string, newName: string, recordingPath?: string) => {
  try {
    const sessionDir = recordingPath || recordingPaths.get(recordingId) || path.join(videosDir, recordingId);
    const metadataPath = path.join(sessionDir, 'metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      metadata.name = newName.trim();
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      return { success: true };
    }
    
    throw new Error('Recording not found');
  } catch (error) {
    console.error('Error renaming recording:', error);
    throw error;
  }
});

// Delete recording
ipcMain.handle('delete-recording', async (_, recordingId: string, recordingPath?: string) => {
  try {
    const sessionDir = recordingPath || recordingPaths.get(recordingId) || path.join(videosDir, recordingId);
    
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      recordingPaths.delete(recordingId);
      return { success: true };
    }
    
    throw new Error('Recording not found');
  } catch (error) {
    console.error('Error deleting recording:', error);
    throw error;
  }
});
