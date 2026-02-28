const { contextBridge } = require('electron');
// Expose safe APIs to renderer if needed in future (currently none needed)
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
});
