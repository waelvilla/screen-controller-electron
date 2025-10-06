import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  screen,
} from 'electron';
import path from 'path';
import { promises as fs } from 'fs';

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // When compiled, __dirname is `dist`. Renderer lives one level up.
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  if (!app.isPackaged) {
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

async function capturePrimaryDisplayPng(): Promise<Buffer> {
  const primaryDisplay = screen.getPrimaryDisplay();
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: primaryDisplay.size,
  });

  const primarySource =
    sources.find((source) => source.display_id === String(primaryDisplay.id)) ?? sources[0];

  if (!primarySource) {
    throw new Error('No screen sources found');
  }

  return primarySource.thumbnail.toPNG();
}

ipcMain.handle('take-screenshot', async () => {
  try {
    const pngBuffer = await capturePrimaryDisplayPng();
    const desktopPath = app.getPath('desktop');
    const outputDir = path.join(desktopPath, 'Screen Takeover');
    await fs.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `screenshot-${Date.now()}.png`);
    await fs.writeFile(filePath, pngBuffer);
    return { ok: true as const, filePath };
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false as const, error: message };
  }
});

ipcMain.handle('capture-screenshot-png', async () => {
  try {
    const pngBuffer = await capturePrimaryDisplayPng();
    const base64 = pngBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    return { ok: true as const, dataUrl };
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false as const, error: message };
  }
});

ipcMain.handle('open-url', async (_event, url: string) => {
  if (!mainWindow) {
    return { ok: false as const, error: 'Main window is not available' };
  }
  try {
    await mainWindow.loadURL(url);
    return { ok: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false as const, error: message };
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
