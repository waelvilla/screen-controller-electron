import { contextBridge } from 'electron';

// Expose a minimal API to the renderer. Extend as needed.
contextBridge.exposeInMainWorld('api', {
  ping: () => 'pong',
});


