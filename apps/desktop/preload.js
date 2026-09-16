const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer (web page)
contextBridge.exposeInMainWorld('novaDesktop', {
  // App info
  getVersion:  () => ipcRenderer.invoke('get-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Window controls
  minimize:   () => ipcRenderer.send('window-minimize'),
  maximize:   () => ipcRenderer.send('window-maximize'),
  close:      () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Notifications
  notify: (title, body) => ipcRenderer.send('show-notification', { title, body }),

  // Open external links in system browser
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // Listen for events from main process
  on: (channel, cb) => {
    const allowed = ['new-chat', 'focus'];
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => cb(...args));
    }
  },
  off: (channel, cb) => ipcRenderer.removeListener(channel, cb),
});
