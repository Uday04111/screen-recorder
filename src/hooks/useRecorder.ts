import { useState, useRef, useCallback, useEffect } from 'react';
import type { 
  ScreenSource, 
  RecordingState, 
  RecordingConfig, 
  RecordingInfo,
  ActiveRecording,
  RecordingSession 
} from '@/types';

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getElectronAPI() {
  if (!window.electronAPI) {
    throw new Error('Electron bridge not available. Please run the desktop app with "npm run dev" (Electron), not in a regular browser tab.');
  }
  return window.electronAPI;
}

function resolveRecorderFormat(
  preferred: 'webm' | 'mp4'
): { format: 'webm' | 'mp4'; mimeType: string } {
  const mp4Candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4;codecs=h264,aac',
    'video/mp4',
  ];
  const webmCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  if (preferred === 'mp4') {
    const supportedMp4 = mp4Candidates.find((type) => MediaRecorder.isTypeSupported(type));
    if (supportedMp4) {
      return { format: 'mp4', mimeType: supportedMp4 };
    }
  }

  const supportedWebm = webmCandidates.find((type) => MediaRecorder.isTypeSupported(type));
  if (supportedWebm) {
    return { format: 'webm', mimeType: supportedWebm };
  }

  // Last-resort fallback for permissive user agents.
  return { format: 'webm', mimeType: 'video/webm' };
}

export function useRecorder() {
  // State
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [sources, setSources] = useState<ScreenSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<ScreenSource | null>(null);
  const [config, setConfig] = useState<RecordingConfig>({
    screenSourceId: null,
    enableWebcam: false,
    sessionName: '',
    fileFormat: 'webm',
    videoBitrateKbps: 5000,
    saveDirectory: null,
  });
  const [defaultSaveDirectory, setDefaultSaveDirectory] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [completedRecording, setCompletedRecording] = useState<{
    recordingId: string;
    folderPath: string;
    sessionName: string;
  } | null>(null);
  const [pastRecordings, setPastRecordings] = useState<RecordingSession[]>([]);

  // Refs for recording
  const activeRecordingRef = useRef<ActiveRecording | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenChunksRef = useRef<Blob[]>([]);
  const webcamChunksRef = useRef<Blob[]>([]);

  // Load past recordings on mount
  useEffect(() => {
    loadPastRecordings();
  }, []);

  useEffect(() => {
    const loadDefaultSaveDirectory = async () => {
      try {
        const directory = await getElectronAPI().getDefaultSaveDirectory();
        setDefaultSaveDirectory(directory);
      } catch (err) {
        console.error('Error loading default save directory:', err);
      }
    };

    loadDefaultSaveDirectory();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (activeRecordingRef.current) {
        stopRecording();
      }
    };
  }, []);

  // Timer functions
  const startTimer = useCallback(() => {
    setElapsedTime(0);
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Load available screen sources
  const loadSources = useCallback(async () => {
    try {
      setError(null);
      setIsLoadingSources(true);
      const sources = await getElectronAPI().getSources();
      setSources(sources);
      return sources;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load screen sources. Please try again.';
      setError(message);
      console.error('Error loading sources:', err);
      return [];
    } finally {
      setIsLoadingSources(false);
    }
  }, []);

  // Load past recordings
  const loadPastRecordings = useCallback(async () => {
    try {
      const recordings = await getElectronAPI().getRecordings();
      setPastRecordings(recordings);
    } catch (err) {
      console.error('Error loading past recordings:', err);
    }
  }, []);

  // Select a screen source
  const selectSource = useCallback((source: ScreenSource) => {
    setSelectedSource(source);
    setConfig((prev) => ({ ...prev, screenSourceId: source.id }));
  }, []);

  // Toggle webcam
  const toggleWebcam = useCallback((enabled: boolean) => {
    setConfig((prev) => ({ ...prev, enableWebcam: enabled }));
  }, []);

  // Set session name
  const setSessionName = useCallback((name: string) => {
    setConfig((prev) => ({ ...prev, sessionName: name }));
  }, []);

  const setFileFormat = useCallback((fileFormat: 'webm' | 'mp4') => {
    setConfig((prev) => ({ ...prev, fileFormat }));
  }, []);

  const setVideoBitrate = useCallback((videoBitrateKbps: number) => {
    if (!Number.isFinite(videoBitrateKbps) || videoBitrateKbps <= 0) {
      return;
    }
    setConfig((prev) => ({ ...prev, videoBitrateKbps }));
  }, []);

  const selectSaveDirectory = useCallback(async () => {
    try {
      const selected = await getElectronAPI().selectSaveDirectory();
      if (selected) {
        setConfig((prev) => ({ ...prev, saveDirectory: selected }));
      }
    } catch (err) {
      console.error('Error selecting save directory:', err);
    }
  }, []);

  const resetSaveDirectory = useCallback(() => {
    setConfig((prev) => ({ ...prev, saveDirectory: null }));
  }, []);

  // Get screen stream with audio
  const getScreenStream = useCallback(async (sourceId: string): Promise<MediaStream> => {
    const constraints: any = {
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop',
        },
      },
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
        },
      },
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }, []);

  // Get webcam stream
  const getWebcamStream = useCallback(async (): Promise<MediaStream> => {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false, // Webcam doesn't record audio, screen does
    });
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!selectedSource) {
      setError('Please select a screen or window to record');
      return;
    }

    try {
      setError(null);
      setRecordingState('countdown');
      setCountdownValue(3);
      for (let i = 3; i > 0; i -= 1) {
        setCountdownValue(i);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Create recording session
      const sessionName = config.sessionName || `Recording ${new Date().toLocaleString()}`;
      const resolvedScreenFormat = resolveRecorderFormat(config.fileFormat);
      const resolvedWebcamFormat = resolveRecorderFormat(config.fileFormat);
      const actualFormat =
        resolvedScreenFormat.format === 'mp4' && resolvedWebcamFormat.format === 'mp4'
          ? 'mp4'
          : 'webm';
      if (config.fileFormat === 'mp4' && actualFormat !== 'mp4') {
        console.warn('MP4 is not supported on this device. Falling back to WEBM.');
      }
      const recordingInfo: RecordingInfo = await getElectronAPI().createRecordingSession({
        sessionName,
        saveDirectory: config.saveDirectory || defaultSaveDirectory,
        fileFormat: actualFormat,
        videoBitrateKbps: config.videoBitrateKbps,
      });

      // Get streams
      let screenStream: MediaStream | null = null;
      let webcamStream: MediaStream | null = null;

      try {
        screenStream = await getScreenStream(selectedSource.id);
      } catch (err) {
        throw new Error('Failed to access screen. Please ensure you have granted screen recording permissions.');
      }

      if (config.enableWebcam) {
        try {
          webcamStream = await getWebcamStream();
        } catch (err) {
          console.warn('Webcam access denied, continuing without webcam');
        }
      }

      // Create media recorders
      const screenRecorder = new MediaRecorder(screenStream, {
        mimeType: resolvedScreenFormat.mimeType,
        videoBitsPerSecond: config.videoBitrateKbps * 1000,
      });

      let webcamRecorder: MediaRecorder | null = null;
      if (webcamStream) {
        webcamRecorder = new MediaRecorder(webcamStream, {
          mimeType: resolvedWebcamFormat.mimeType,
          videoBitsPerSecond: config.videoBitrateKbps * 1000,
        });
      }

      // Reset chunks
      screenChunksRef.current = [];
      webcamChunksRef.current = [];

      // Handle screen data
      screenRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          screenChunksRef.current.push(event.data);
        }
      };

      // Handle webcam data
      if (webcamRecorder) {
        webcamRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            webcamChunksRef.current.push(event.data);
          }
        };
      }

      // Store active recording
      activeRecordingRef.current = {
        recordingId: recordingInfo.id,
        sessionName,
        fileFormat: recordingInfo.fileFormat,
        screenRecorder,
        webcamRecorder,
        screenStream,
        webcamStream,
        startTime: Date.now(),
        folderPath: recordingInfo.folderPath,
      };

      // Start recording
      screenRecorder.start(1000); // Collect data every second
      if (webcamRecorder) {
        webcamRecorder.start(1000);
      }

      setRecordingState('recording');
      startTimer();
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      setRecordingState('idle');
      console.error('Error starting recording:', err);
    }
  }, [selectedSource, config, defaultSaveDirectory, getScreenStream, getWebcamStream, startTimer]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    const activeRecording = activeRecordingRef.current;
    if (!activeRecording) return;

    try {
      setRecordingState('stopping');
      stopTimer();

      const stopRecorder = (recorder: MediaRecorder | null) => {
        if (!recorder || recorder.state === 'inactive') {
          return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
          const handleStop = () => {
            cleanup();
            resolve();
          };
          const handleError = (event: Event) => {
            cleanup();
            const mediaEvent = event as ErrorEvent;
            reject(
              mediaEvent.error ??
                new Error('An unknown MediaRecorder error occurred while stopping recording')
            );
          };
          const cleanup = () => {
            recorder.removeEventListener('stop', handleStop);
            recorder.removeEventListener('error', handleError);
          };

          recorder.addEventListener('stop', handleStop, { once: true });
          recorder.addEventListener('error', handleError, { once: true });

          // Flush any buffered data before stopping.
          try {
            recorder.requestData();
          } catch {
            // Ignore if requestData is not allowed in current state.
          }

          recorder.stop();
        });
      };

      await Promise.all([
        stopRecorder(activeRecording.screenRecorder),
        stopRecorder(activeRecording.webcamRecorder),
      ]);

      // Save screen recording
      if (screenChunksRef.current.length > 0) {
        const screenBlob = new Blob(screenChunksRef.current, {
          type: activeRecording.fileFormat === 'mp4' ? 'video/mp4' : 'video/webm',
        });
        const screenBuffer = await screenBlob.arrayBuffer();
        await getElectronAPI().saveRecordingChunk(
          activeRecording.recordingId,
          'screen',
          screenBuffer,
          activeRecording.folderPath
        );
      } else {
        console.warn('No screen chunks captured; screen.webm will not be created.');
      }

      // Save webcam recording
      if (webcamChunksRef.current.length > 0) {
        const webcamBlob = new Blob(webcamChunksRef.current, {
          type: activeRecording.fileFormat === 'mp4' ? 'video/mp4' : 'video/webm',
        });
        const webcamBuffer = await webcamBlob.arrayBuffer();
        await getElectronAPI().saveRecordingChunk(
          activeRecording.recordingId,
          'webcam',
          webcamBuffer,
          activeRecording.folderPath
        );
      } else if (activeRecording.webcamRecorder) {
        console.warn('No webcam chunks captured; webcam.webm will not be created.');
      }

      // Finalize recording
      await getElectronAPI().finalizeRecording(activeRecording.recordingId);

      // Stop streams
      activeRecording.screenStream?.getTracks().forEach((track) => track.stop());
      activeRecording.webcamStream?.getTracks().forEach((track) => track.stop());

      // Set completed recording
      setCompletedRecording({
        recordingId: activeRecording.recordingId,
        folderPath: activeRecording.folderPath,
        sessionName: activeRecording.sessionName,
      });

      // Clear active recording
      activeRecordingRef.current = null;
      screenChunksRef.current = [];
      webcamChunksRef.current = [];

      // Refresh past recordings
      await loadPastRecordings();

      setRecordingState('completed');
    } catch (err: any) {
      setError(err.message || 'Failed to stop recording');
      console.error('Error stopping recording:', err);
      setRecordingState('recording');
    }
  }, [stopTimer, loadPastRecordings]);

  // Cancel recording (discard)
  const cancelRecording = useCallback(async () => {
    const activeRecording = activeRecordingRef.current;
    if (activeRecording) {
      // Stop recorders
      if (activeRecording.screenRecorder && activeRecording.screenRecorder.state !== 'inactive') {
        activeRecording.screenRecorder.stop();
      }
      if (activeRecording.webcamRecorder && activeRecording.webcamRecorder.state !== 'inactive') {
        activeRecording.webcamRecorder.stop();
      }

      // Stop streams
      activeRecording.screenStream?.getTracks().forEach((track) => track.stop());
      activeRecording.webcamStream?.getTracks().forEach((track) => track.stop());

      // Delete recording
      await getElectronAPI().deleteRecording(activeRecording.recordingId);

      activeRecordingRef.current = null;
    }

    stopTimer();
    setElapsedTime(0);
    setRecordingState('idle');
    setError(null);
  }, [stopTimer]);

  // Reset to idle state
  const reset = useCallback(() => {
    setRecordingState('idle');
    setElapsedTime(0);
    setError(null);
    setCompletedRecording(null);
    setSelectedSource(null);
    setConfig({
      screenSourceId: null,
      enableWebcam: false,
      sessionName: '',
      fileFormat: 'webm',
      videoBitrateKbps: 5000,
      saveDirectory: null,
    });
  }, []);

  // Open recording folder
  const openFolder = useCallback(async (folderPath: string) => {
    try {
      await getElectronAPI().openFolder(folderPath);
    } catch (err) {
      console.error('Error opening folder:', err);
    }
  }, []);

  // Delete a past recording
  const deletePastRecording = useCallback(async (recordingId: string, recordingPath: string) => {
    try {
      await getElectronAPI().deleteRecording(recordingId, recordingPath);
      await loadPastRecordings();
    } catch (err) {
      console.error('Error deleting recording:', err);
    }
  }, [loadPastRecordings]);

  // Rename a past recording
  const renamePastRecording = useCallback(async (recordingId: string, newName: string, recordingPath: string) => {
    try {
      await getElectronAPI().renameRecording(recordingId, newName, recordingPath);
      await loadPastRecordings();
    } catch (err) {
      console.error('Error renaming recording:', err);
    }
  }, [loadPastRecordings]);

  return {
    // State
    recordingState,
    isLoadingSources,
    countdownValue,
    sources,
    selectedSource,
    config,
    defaultSaveDirectory,
    elapsedTime: formatTime(elapsedTime),
    error,
    completedRecording,
    pastRecordings,

    // Actions
    loadSources,
    selectSource,
    toggleWebcam,
    setSessionName,
    setFileFormat,
    setVideoBitrate,
    selectSaveDirectory,
    resetSaveDirectory,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    openFolder,
    deletePastRecording,
    renamePastRecording,
    refreshPastRecordings: loadPastRecordings,
  };
}
