'use strict';

// ─── Linux GPU + sandbox fix (must be FIRST before any other electron code) ───
const { app } = require('electron');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('in-process-gpu');

const {
  BrowserWindow, Tray, Menu, Notification,
  shell, ipcMain, nativeImage, screen,
} = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// ─── Simple JSON-based config store (no external deps, fully CJS) ─────────────
const CONFIG_PATH = path.join(app.getPath('userData'), 'nova-config.json');
const DEFAULTS = {
  windowBounds:    { width: 1200, height: 800 },
  windowMaximized: false,
  serverUrl:       'http://129.159.239.56',
  localUrl:        'http://localhost:3000',
  useLocal:        false,
  trayHintShown:   false,
};

function loadConfig() {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
  } catch {
    return { ...DEFAULTS };
  }
}
function saveConfig(data) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[NOVA] Config save failed:', e.message);
  }
}

let config = loadConfig();

// ─── Globals ──────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray       = null;
let isQuitting = false;

const isDev  = process.argv.includes('--dev');
const ICON   = path.join(__dirname, 'assets', 'icon.png');
const SERVER = config.useLocal ? config.localUrl : config.serverUrl;

// ─── Single instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Load icon safely ─────────────────────────────────────────────────────────
function loadIcon() {
  try {
    if (fs.existsSync(ICON)) {
      return nativeImage.createFromPath(ICON);
    }
  } catch (e) {
    console.error('[NOVA] Icon load failed:', e.message);
  }
  return nativeImage.createEmpty();
}

// ─── Create main window ───────────────────────────────────────────────────────
function createWindow() {
  const { width, height } = config.windowBounds;
  const display = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width:     Math.min(width,  display.width),
    height:    Math.min(height, display.height),
    minWidth:  900,
    minHeight: 600,
    icon:      ICON,
    title:     'NOVA — AI Assistant',
    backgroundColor: '#0d0d0f',
    show: false,
    webPreferences: {
      preload:             path.join(__dirname, 'preload.js'),
      contextIsolation:    true,
      nodeIntegration:     false,
      sandbox:             false,
      webSecurity:         true,
      allowRunningInsecureContent: true,
    },
  });

  if (config.windowMaximized) mainWindow.maximize();

  // ─── Load the app ───────────────────────────────────────────────────────────
  const url = isDev ? config.localUrl : config.serverUrl;
  console.log('[NOVA] Loading:', url);

  mainWindow.loadURL(url).catch((err) => {
    console.error('[NOVA] Load error:', err.message);
    mainWindow.loadURL(getOfflinePage());
  });

  // ─── Window events ──────────────────────────────────────────────────────────
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.on('resize', saveBounds);
  mainWindow.on('move',   saveBounds);
  mainWindow.on('maximize',   () => { config.windowMaximized = true;  saveConfig(config); });
  mainWindow.on('unmaximize', () => { config.windowMaximized = false; saveConfig(config); });

  // Minimize to tray on close
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      if (!config.trayHintShown) {
        showNotification('NOVA is still running', 'Click the tray icon to reopen.');
        config.trayHintShown = true;
        saveConfig(config);
      }
    }
  });

  // External links → system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function saveBounds() {
  if (mainWindow && !mainWindow.isMaximized()) {
    config.windowBounds = mainWindow.getBounds();
    saveConfig(config);
  }
}

// ─── System tray ──────────────────────────────────────────────────────────────
function createTray() {
  try {
    const icon = loadIcon().resize({ width: 18, height: 18 });
    tray = new Tray(icon.isEmpty() ? nativeImage.createFromDataURL(EMPTY_ICON) : icon);
  } catch {
    tray = new Tray(nativeImage.createEmpty());
  }

  tray.setToolTip('NOVA — AI Assistant');
  rebuildTrayMenu();
  tray.on('click',        showWindow);
  tray.on('double-click', showWindow);
}

function rebuildTrayMenu() {
  if (!tray) return;
  const usingLocal = config.useLocal;
  const menu = Menu.buildFromTemplate([
    { label: '⚡ NOVA — AI Assistant', enabled: false },
    { type: 'separator' },
    { label: '📂 Open NOVA',   click: showWindow },
    {
      label: '✨ New Chat',
      click: () => { showWindow(); mainWindow?.webContents.send('new-chat'); },
    },
    { type: 'separator' },
    {
      label: `🌐 ${usingLocal ? '🟡 Local (localhost)' : '🟢 Oracle Cloud'}`,
      enabled: false,
    },
    {
      label: usingLocal ? '☁️ Switch to Cloud' : '💻 Switch to Local',
      click: () => {
        config.useLocal = !config.useLocal;
        saveConfig(config);
        const url = config.useLocal ? config.localUrl : config.serverUrl;
        mainWindow?.loadURL(url).catch(() => mainWindow?.loadURL(getOfflinePage()));
        rebuildTrayMenu();
      },
    },
    { type: 'separator' },
    {
      label: '❌ Quit NOVA',
      click: () => { isQuitting = true; app.quit(); },
    },
  ]);
  tray.setContextMenu(menu);
}

function showWindow() {
  if (!mainWindow) { createWindow(); return; }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

// ─── Native notifications ─────────────────────────────────────────────────────
function showNotification(title, body) {
  try {
    if (Notification.isSupported()) {
      new Notification({ title, body, icon: ICON }).show();
    }
  } catch (e) {
    console.error('[NOVA] Notification failed:', e.message);
  }
}

// ─── App menu ─────────────────────────────────────────────────────────────────
function buildAppMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Chat',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('new-chat'),
        },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => { isQuitting = true; app.quit(); } },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' }, { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn', accelerator: 'CmdOrCtrl+=' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'NOVA on Oracle Cloud', click: () => shell.openExternal('http://129.159.239.56') },
        { label: 'NVIDIA NIM APIs',      click: () => shell.openExternal('https://build.nvidia.com') },
        { type: 'separator' },
        { label: `NOVA v${app.getVersion()}`, enabled: false },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Offline fallback ─────────────────────────────────────────────────────────
function getOfflinePage() {
  return `data:text/html,<html><head><title>NOVA — Offline</title>
  <style>body{background:%230d0d0f;color:%23e8e8ed;font-family:system-ui;display:flex;
  align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px}
  h1{color:%236366f1;font-size:1.5rem}p{color:%236b7280;font-size:.9rem}
  button{background:%236366f1;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer}
  </style></head><body><h1>⚡ NOVA</h1>
  <p>Cannot reach the server. Check your internet connection.</p>
  <button onclick="location.reload()">Retry</button></body></html>`;
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-version',          () => app.getVersion());
ipcMain.handle('get-platform',         () => process.platform);
ipcMain.handle('window-is-maximized',  () => mainWindow?.isMaximized() ?? false);
ipcMain.on('window-minimize',          () => mainWindow?.minimize());
ipcMain.on('window-maximize',          () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window-close',             () => mainWindow?.close());
ipcMain.on('open-external',            (_, url) => shell.openExternal(url));
ipcMain.on('show-notification',        (_, { title, body }) => showNotification(title, body));

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  try {
    buildAppMenu();
    createWindow();
    createTray();
  } catch (e) {
    console.error('[NOVA] Startup error:', e);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else showWindow();
  });
});

app.on('window-all-closed', () => {
  // Stay in tray — don't quit
  if (process.platform === 'darwin') app.dock?.hide();
});

app.on('before-quit', () => { isQuitting = true; });

// Prevent blank icon constant
const EMPTY_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
