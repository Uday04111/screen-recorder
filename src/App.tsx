import { useEffect } from 'react';
import { Video, MonitorPlay } from 'lucide-react';
import { useRecorder } from '@/hooks/useRecorder';
import { ScreenSelector } from '@/components/ScreenSelector';
import { Timer } from '@/components/Timer';
import { WebcamPreview } from '@/components/WebcamPreview';
import { Controls } from '@/components/Controls';
import { ExportSettings } from '@/components/ExportSettings';
import { RecordingComplete } from '@/components/RecordingComplete';
import { PastRecordings } from '@/components/PastRecordings';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Separator } from '@/components/ui/separator';
import './App.css';

function App() {
  const {
    // State
    recordingState,
    isLoadingSources,
    countdownValue,
    sources,
    selectedSource,
    config,
    defaultSaveDirectory,
    elapsedTime,
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
  } = useRecorder();

  // Load sources on mount
  useEffect(() => {
    loadSources();
  }, [loadSources]);

  // Determine UI state
  const isIdle = recordingState === 'idle';
  const isCountdown = recordingState === 'countdown';
  const isRecording = recordingState === 'recording';
  const isStopping = recordingState === 'stopping';
  const isCompleted = recordingState === 'completed';

  // Show main recording interface
  const showRecordingInterface = isRecording || isStopping;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <MonitorPlay className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Screen Recorder</h1>
                <p className="text-sm text-slate-500">Record your screen and webcam</p>
              </div>
            </div>

            {/* Timer - show when recording */}
            {(isRecording || isStopping) && (
              <Timer elapsedTime={elapsedTime} isRecording={isRecording} />
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Error display */}
        {error && (
          <div className="mb-6">
            <ErrorDisplay message={error} onDismiss={() => {}} />
          </div>
        )}

        {/* Idle state - Setup interface */}
        {isIdle && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Screen selection */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 h-[600px]">
                <ScreenSelector
                  sources={sources}
                  selectedSource={selectedSource}
                  onSelect={selectSource}
                  onRefresh={loadSources}
                  isLoading={isLoadingSources}
                />
              </div>
            </div>

            {/* Right column - Settings and controls */}
            <div className="space-y-6">
              {/* Webcam preview */}
              <WebcamPreview
                enabled={config.enableWebcam}
                onToggle={toggleWebcam}
                isRecording={false}
              />

              {/* Controls */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <Controls
                  recordingState={recordingState}
                  selectedSource={!!selectedSource}
                  sessionName={config.sessionName}
                  onSessionNameChange={setSessionName}
                  onStart={startRecording}
                  onStop={stopRecording}
                  onCancel={cancelRecording}
                  onReset={reset}
                />
              </div>

              <ExportSettings
                fileFormat={config.fileFormat}
                videoBitrateKbps={config.videoBitrateKbps}
                saveDirectory={config.saveDirectory || defaultSaveDirectory}
                onFileFormatChange={setFileFormat}
                onBitrateChange={setVideoBitrate}
                onBrowseSaveDirectory={selectSaveDirectory}
                onResetSaveDirectory={resetSaveDirectory}
                isDisabled={!isIdle}
              />

              {/* Past recordings */}
              {pastRecordings.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <PastRecordings
                    recordings={pastRecordings}
                    onOpenFolder={openFolder}
                    onDelete={deletePastRecording}
                    onRename={renamePastRecording}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Countdown state */}
        {isCountdown && (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xl">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Get Ready!</h2>
              <p className="text-slate-500 mb-8">Recording will start in a few seconds...</p>
              <div className="text-6xl font-bold text-blue-500">{countdownValue}</div>
            </div>
          </div>
        )}

        {/* Recording state */}
        {showRecordingInterface && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recording info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="text-center py-12">
                  <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Video className="w-16 h-16 text-red-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Recording in Progress</h2>
                  <p className="text-slate-500 mb-2">
                    Recording: <span className="font-medium text-slate-700">{selectedSource?.name}</span>
                  </p>
                  {config.enableWebcam && (
                    <p className="text-sm text-blue-500">Webcam enabled</p>
                  )}
                </div>

                <Separator className="my-8" />

                <Controls
                  recordingState={recordingState}
                  selectedSource={!!selectedSource}
                  sessionName={config.sessionName}
                  onSessionNameChange={setSessionName}
                  onStart={startRecording}
                  onStop={stopRecording}
                  onCancel={cancelRecording}
                  onReset={reset}
                />
              </div>
            </div>

            {/* Webcam preview during recording */}
            <div>
              <WebcamPreview
                enabled={config.enableWebcam}
                onToggle={() => {}}
                isRecording={true}
              />
            </div>
          </div>
        )}

        {/* Completed state */}
        {isCompleted && completedRecording && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <RecordingComplete
                sessionName={completedRecording.sessionName}
                folderPath={completedRecording.folderPath}
                elapsedTime={elapsedTime}
                onOpenFolder={() => openFolder(completedRecording.folderPath)}
                onNewRecording={reset}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
