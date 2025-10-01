# Screen Takeover (Electron)

## Run

```bash
npm run dev
```

## Build

Basic dev run uses Electron directly. You can add Forge/Builder later.

## Structure

- `main.js`: Electron main process entry
- `preload.js`: Secure bridge to the renderer
- `renderer/index.html`: UI entry
- `renderer/renderer.js`: Renderer logic
