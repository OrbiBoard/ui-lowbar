const { contextBridge, ipcRenderer } = require('electron');

try { ipcRenderer.send('plugin:register', 'ui-lowbar', []); } catch (e) {}

let __windowId = null;
contextBridge.exposeInMainWorld('lowbarAPI', {
  onInit: (handler) => {
    ipcRenderer.on('lowbar:init', (_e, payload) => {
      try { if (payload && typeof payload.windowId === 'number') __windowId = payload.windowId; } catch (e) {}
      try { handler(payload); } catch (e) {}
    });
  },
  onWindowStateChanged: (handler) => {
    ipcRenderer.on('lowbar:window-state-changed', (_e, payload) => {
      try { handler(payload); } catch (e) {}
    });
  },
  toggleFullscreen: () => ipcRenderer.invoke('plugin:call', 'ui-lowbar', 'toggleFullscreen', [__windowId]),
  windowControl: (cmd) => ipcRenderer.invoke('plugin:call', 'ui-lowbar', 'windowControl', [cmd, __windowId]),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('plugin:call', 'ui-lowbar', 'toggleAlwaysOnTop', [__windowId]),
  emitEvent: (name, payload) => ipcRenderer.invoke('plugin:call', 'ui-lowbar', 'emitEvent', [name, payload]),
  setWindowMode: (mode) => ipcRenderer.invoke('plugin:call', 'ui-lowbar', 'setWindowMode', [mode, __windowId]),
  subscribe: (eventName) => ipcRenderer.send('plugin:event:subscribe', eventName),
  onEvent: (handler) => {
    try { ipcRenderer.on('plugin:event', (_e, { name, payload }) => handler && handler(name, payload)); } catch (e) {}
  },
  pluginCall: (targetPluginId, fnName, args) => ipcRenderer.invoke('plugin:call', targetPluginId, fnName, args),
  
  configGetAll: (scope) => ipcRenderer.invoke('config:getAll', scope),
  configGet: (scope, key) => ipcRenderer.invoke('config:get', scope, key),
  configSet: (scope, key, value) => ipcRenderer.invoke('config:set', scope, key, value),
  configEnsureDefaults: (scope, defaults) => ipcRenderer.invoke('config:ensureDefaults', scope, defaults),
  onConfigChanged: (handler) => {
    const listener = (_e, payload) => handler && handler(payload);
    ipcRenderer.on('sys:config-changed', listener);
    return () => ipcRenderer.removeListener('sys:config-changed', listener);
  },
  
  getTheme: () => ipcRenderer.invoke('config:getTheme'),
  onThemeChanged: (handler) => {
    const listener = (_e, theme) => handler && handler(theme);
    ipcRenderer.on('sys:theme-changed', listener);
    return () => ipcRenderer.removeListener('sys:theme-changed', listener);
  }
});
