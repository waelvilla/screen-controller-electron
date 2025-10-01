import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import screenshot from 'screenshot-desktop';

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // When compiled, __dirname is `dist`. Renderer lives one level up.
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// Handle screenshot capture and saving
ipcMain.handle('capture-screenshot', async () => {
  try {
    const pngBuffer = await screenshot({ format: 'png' });
    const desktopPath = app.getPath('desktop');
    const filePath = path.join(desktopPath, `screenshot-${Date.now()}.png`);
    fs.writeFileSync(filePath, pngBuffer);
    return { ok: true, filePath };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, error: message };
  }
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
