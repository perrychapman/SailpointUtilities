const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

let mainWindow;
let backendProcess = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  async function startBackend() {
    if (process.env.NODE_ENV !== 'development') {
      const backendPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'server.js');
      console.log('Starting backend from path:', backendPath);

      // Use the Node executable to start the backend
      const backendWorkingDir = path.dirname(backendPath);

      backendProcess = spawn('node', [backendPath], {
        cwd: backendWorkingDir, //set working directory
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' },
      });
      

      backendProcess.on('error', (err) => {
        console.error('Failed to start backend process:', err);
      });

      backendProcess.on('exit', (code) => {
        console.log(`Backend exited with code ${code}`);
      });

      try {
        await waitOn({
          resources: ['http://localhost:3001/authenticate'],
          timeout: 10000,
        });
        console.log('Backend is up');
      } catch (err) {
        console.error('Backend failed to start or wait timed out:', err);
      }
    }
  }

  function createWindow() {
    if (mainWindow) return;

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:5173');
    } else {
      mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }
  }

  app.whenReady().then(async () => {
    await startBackend(); //wait for server
    createWindow();       //then load UI
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('window-all-closed', () => {
    if (backendProcess) backendProcess.kill();
    if (process.platform !== 'darwin') app.quit();
  });
}
