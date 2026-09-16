'use strict';

const {
  app, BrowserWindow, Tray, Menu, Notification,
  shell, ipcMain, nativeImage, screen,
} = require('electron');
const path  = require('path');
const Store = require('electron-store');

// ─── Config store (persists window size, position, settings) ──────────────────
const store = new Store({
  defaults: {
    windowBounds: { width: 1200, height: 800 },
    windowMaximized: false,
    serverUrl: 'http://129.159.239.56',   // Oracle Cloud by default
    localUrl:  'http://localhost:3000',   // local dev fallback
    useLocal:  false,
  },
});

// ─── Globals ──────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray       = null;
let isQuitting = false;

const isDev  = process.argv.includes('--dev');
const ICON   = path.join(__dirname, 'assets', 'icon.png');
const SERVER = isDev
  ? store.get('localUrl')
  : store.get('serverUrl');

// ─── Single instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── Create main window ───────────────────────────────────────────────────────
function createWindow() {
  const { width, height } = store.get('windowBounds');
  const display = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width:  Math.min(width,  display.width),
    height: Math.min(height, display.height),
    minWidth:  900,
    minHeight: 600,
    icon: ICON,
    title: 'NOVA — AI Assistant',
    backgroundColor: '#0d0d0f',
    show: false,           // show after ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation:    true,
      nodeIntegration:     false,
      sandbox:             false,
      webSecurity:         true,
      allowRunningInsecureContent: true,  // allow HTTP in dev
    },
  });

  // Restore maximized state
  if (store.get('windowMaximized')) mainWindow.maximize();

  // ─── Load the app ─────────────────────────────────────────────────────────
  const loadApp = (url) => {
    console.log(`[NOVA] Loading: ${url}`);
    mainWindow.loadURL(url).catch(() => {
      // If Oracle Cloud is unreachable, show offline page
      mainWindow.loadURL(getOfflinePage());
    });
  };

  loadApp(SERVER);

  // ─── Window events ────────────────────────────────────────────────────────
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.on('resize', saveBounds);
  mainWindow.on('move',   saveBounds);
  mainWindow.on('maximize',   () => store.set('windowMaximized', true));
  mainWindow.on('unmaximize', () => store.set('windowMaximized', false));

  // Minimize to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      // Show tray notification first time
      if (!store.get('trayHintShown')) {
        showNotification('NOVA is still running', 'Click the tray icon to reopen.');
        store.set('trayHintShown', true);
      }
    }
  });

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Navigation security — only allow our server
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(SERVER) && !url.startsWith('http://localhost')) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
}

function saveBounds() {
  if (!mainWindow.isMaximized()) {
    store.set('windowBounds', mainWindow.getBounds());
  }
}

// ─── System tray ──────────────────────────────────────────────────────────────
function createTray() {
  const icon = nativeImage.createFromPath(ICON).resize({ width: 18, height: 18 });
  tray = new Tray(icon);
  tray.setToolTip('NOVA — AI Assistant');

  const buildMenu = () => Menu.buildFromTemplate([
    {
      label: '🤖 NOVA — AI Assistant',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '📂 Open NOVA',
      click: showWindow,
    },
    {
      label: '✨ New Chat',
      click: () => {
        showWindow();
        mainWindow.webContents.send('new-chat');
      },
    },
    { type: 'separator' },
    {
      label: `🌐 Server: ${isDev ? 'Local' : 'Oracle Cloud'}`,
      enabled: false,
    },
    {
      label: isDev ? '🔄 Switch to Cloud' : '🔄 Switch to Local',
      click: () => {
        const newUseLocal = !store.get('useLocal');
        store.set('useLocal', newUseLocal);
        const url = newUseLocal ? store.get('localUrl') : store.get('serverUrl');
        mainWindow.loadURL(url);
        tray.setContextMenu(buildMenu());
      },
    },
    { type: 'separator' },
    {
      label: '❌ Quit NOVA',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(buildMenu());

  // Single click = show window (Linux/Windows)
  tray.on('click', showWindow);
  tray.on('double-click', showWindow);
}

function showWindow() {
  if (!mainWindow) { createWindow(); return; }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

// ─── Native notifications ─────────────────────────────────────────────────────
function showNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: ICON }).show();
  }
}

// ─── App Menu ─────────────────────────────────────────────────────────────────
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
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => { isQuitting = true; app.quit(); },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn',  accelerator: 'CmdOrCtrl+=' },
        { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        {
          label: 'Show / Hide',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => mainWindow?.isVisible() ? mainWindow.hide() : showWindow(),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'NOVA on Oracle Cloud',
          click: () => shell.openExternal('http://129.159.239.56'),
        },
        {
          label: 'NVIDIA NIM APIs',
          click: () => shell.openExternal('https://build.nvidia.com/explore/discover'),
        },
        { type: 'separator' },
        {
          label: `Version ${app.getVersion()}`,
          enabled: false,
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Offline fallback page ────────────────────────────────────────────────────
function getOfflinePage() {
  return `data:text/html,
  <html>
  <head>
    <title>NOVA — Offline</title>
    <style>
      body { background:#0d0d0f; color:#e8e8ed; font-family:system-ui;
             display:flex; align-items:center; justify-content:center;
             height:100vh; margin:0; flex-direction:column; gap:16px; }
      h1 { font-size:1.5rem; color:#6366f1; }
      p  { color:#6b7280; font-size:.9rem; }
      button { background:#6366f1; color:white; border:none; padding:10px 24px;
               border-radius:8px; cursor:pointer; font-size:.9rem; }
      button:hover { background:#4f46e5; }
    </style>
  </head>
  <body>
    <h1>⚡ NOVA</h1>
    <p>Cannot reach the server. Check your internet connection.</p>
    <button onclick="location.reload()">Retry</button>
  </body>
  </html>`;
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-version',  () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () =>
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize()
);
ipcMain.on('window-close',    () => mainWindow?.close());
ipcMain.on('open-external',   (_, url) => shell.openExternal(url));
ipcMain.on('show-notification', (_, { title, body }) => showNotification(title, body));

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  buildAppMenu();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else showWindow();
  });
});

app.on('window-all-closed', () => {
  // Keep app running in tray (don't quit)
  if (process.platform === 'darwin') app.dock?.hide();
});

app.on('before-quit', () => { isQuitting = true; });
