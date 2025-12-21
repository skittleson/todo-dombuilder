const { contextBridge, ipcRenderer } = require('electron');

// Expose file system operations to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data, defaultPath, storageKey) => ipcRenderer.invoke('save-file', data, defaultPath, storageKey),
  loadFile: (storageKey) => ipcRenderer.invoke('load-file', storageKey)
});