import { contextBridge, ipcRenderer } from 'electron';

type ScreenshotResult =
  | { ok: true; filePath: string }
  | { ok: false; error: string };

const api = Object.freeze({
  ping: (): string => 'pong',
  takeScreenshot: async (): Promise<ScreenshotResult> => {
    try {
      const result = await ipcRenderer.invoke('take-screenshot');
      return result as ScreenshotResult;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { ok: false, error: message };
    }
  },
  captureScreenshotPng: async (): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> => {
    try {
      const result = await ipcRenderer.invoke('capture-screenshot-png');
      return result as { ok: true; dataUrl: string } | { ok: false; error: string };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { ok: false, error: message };
    }
  },
});

contextBridge.exposeInMainWorld('api', api);
