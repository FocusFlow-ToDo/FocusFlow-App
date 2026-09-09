const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => {
      if (!func.__wrapped) {
        func.__wrapped = (event, ...args) => func(...args);
      }
      ipcRenderer.on(channel, func.__wrapped);
    },
    once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(...args)),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    removeListener: (channel, func) => {
      if (func.__wrapped) {
        ipcRenderer.removeListener(channel, func.__wrapped);
      } else {
        ipcRenderer.removeListener(channel, func);
      }
    }
  }
});

window.addEventListener('DOMContentLoaded', () => {
    console.log('FocusFlow Desktop initialized');
});
