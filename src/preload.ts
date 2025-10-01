import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  ping: (): string => 'pong',
  takeScreenshot: async (): Promise<{ ok: true; filePath: string } | { ok: false; error: string }> => {
    return await ipcRenderer.invoke('capture-screenshot');
  },
});
