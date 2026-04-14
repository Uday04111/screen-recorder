# Screen Recorder Desktop App

A desktop app built with Electron + React to record screen and webcam, save each session in a unique folder, and generate a merged `final.mp4`.

## What This Project Does

- Lists all available screens/windows.
- Lets the user pick one source to record.
- Optionally records webcam in parallel.
- Saves each session in a UUID folder.
- Stores separate files (`screen.*`, `webcam.*`) plus metadata.
- Creates merged `final.mp4` using FFmpeg after recording stops.

## Tech Stack

- Electron (desktop shell)
- React + TypeScript (UI and recording logic)
- Vite (build/dev)
- Tailwind + shadcn/ui (UI styling/components)
- FFmpeg (`ffmpeg-static` + `fluent-ffmpeg`) for final merge

## Run Locally

### 1) Install dependencies

```bash
npm install
```

### 2) Build Electron main/preload files (one-time or after Electron changes)

```bash
npm run build
```

Important: run as Electron app. Do not test only in browser tab.

### 3) Start in development mode

```bash
npm run dev
```

## How To Use

1. Open app and click `Refresh` to load sources.
2. Select one screen or window.
3. (Optional) Enable webcam.
4. Configure export settings:
   - file format (`webm` or `mp4`)
   - video bitrate
   - custom save location
5. Click `Start Recording`.
6. Click `Stop Recording`.
7. Open session folder from completion screen or recent recordings list.

## Output Files

Each recording session is saved in its own UUID folder:

```text
<save-location>/
  <uuid>/
    metadata.json
    screen.webm or screen.mp4
    webcam.webm or webcam.mp4   (if webcam enabled)
    final.mp4                   (merged result)
```

## Main Features Implemented

- Screen/window source selection
- Webcam toggle + preview
- 3-second countdown
- Live recording timer
- Session naming
- Rename/delete/open previous sessions
- Export settings (format, bitrate, save path)
- Automatic FFmpeg merge to `final.mp4`

## Known Limitations / Notes

- MP4 support in `MediaRecorder` depends on OS/runtime codecs.
- If direct MP4 recording is not supported, recording can fall back to WebM.
- `final.mp4` is still generated through FFmpeg merge.
- No pause/resume recording yet.
- Advanced audio routing (mic + system mixing controls) is not implemented.

## Security Approach

- `contextIsolation: true`
- `nodeIntegration: false`
- Renderer accesses system features only through preload bridge (`window.electronAPI`)

## Project Structure (Important Files)

- `electron/main.ts` - app lifecycle, IPC handlers, file system, FFmpeg merge
- `electron/preload.ts` + `electron/preload.cjs` - secure API bridge
- `src/hooks/useRecorder.ts` - core recording flow/state
- `src/App.tsx` - main UI composition
- `src/components/ExportSettings.tsx` - export options UI

## Scripts

- `npm run dev` - start Vite + Electron
- `npm run build` - build renderer + electron
- `npm run dist` - package desktop installer

## Interview Submission Note

This project focuses on:

- clean UI and user flow
- safe Electron architecture
- resilient recording pipeline
- clear file/session management

If needed, I can also provide a short demo video and a concise architecture walkthrough.
