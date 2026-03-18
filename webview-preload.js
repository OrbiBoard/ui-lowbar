const { contextBridge, ipcRenderer } = require('electron');

try {
  contextBridge.exposeInMainWorld('lowbarAPI', {
    pluginCall: (targetPluginId, fnName, args) => ipcRenderer.invoke('plugin:call', targetPluginId, fnName, args),
    emitEvent: (name, payload) => ipcRenderer.invoke('plugin:event:emit', name, payload),
    subscribe: (eventName) => ipcRenderer.send('plugin:event:subscribe', eventName),
    onEvent: (handler) => { try { ipcRenderer.on('plugin:event', (_e, { name, payload }) => handler && handler(name, payload)); } catch (e) {} },
    configGetAll: (scope) => ipcRenderer.invoke('config:getAll', scope),
    configGet: (scope, key) => ipcRenderer.invoke('config:get', scope, key),
    configSet: (scope, key, value) => ipcRenderer.invoke('config:set', scope, key, value),
    configEnsureDefaults: (scope, defaults) => ipcRenderer.invoke('config:ensureDefaults', scope, defaults),
    onConfigChanged: (handler) => {
      const listener = (_e, payload) => handler && handler(payload);
      ipcRenderer.on('sys:config-changed', listener);
      return () => ipcRenderer.removeListener('sys:config-changed', listener);
    }
  });
} catch (e) {}

try {
  const dialogIdCounter = { value: 0 };
  const pendingDialogs = new Map();

  function sendToHost(channel, data) {
    try { ipcRenderer.sendToHost(channel, data); } catch (e) {}
  }

  window.__lowbarDialogHandler = {
    show: function(type, message, defaultText) {
      return new Promise((resolve) => {
        const id = ++dialogIdCounter.value;
        pendingDialogs.set(id, resolve);
        sendToHost('lowbar-dialog-request', {
          id: id,
          type: type,
          message: String(message || ''),
          defaultText: String(defaultText || '')
        });
      });
    },
    resolve: function(id, success, value) {
      const resolver = pendingDialogs.get(id);
      if (resolver) {
        pendingDialogs.delete(id);
        resolver({ success: success, value: value });
      }
    }
  };

  window.alert = function(message) {
    window.__lowbarDialogHandler.show('alert', message, '').then(() => {});
    return undefined;
  };

  window.confirm = function(message) {
    return new Promise((resolve) => {
      window.__lowbarDialogHandler.show('confirm', message, '').then(function(result) {
        resolve(result.success === true);
      });
    });
  };
  window.confirm._isAsync = true;

  window.prompt = function(message, defaultText) {
    return new Promise((resolve) => {
      window.__lowbarDialogHandler.show('prompt', message, defaultText || '').then(function(result) {
        resolve(result.success ? result.value : null);
      });
    });
  };
  window.prompt._isAsync = true;

  window.addEventListener('beforeunload', function(e) {
    const handler = window.onbeforeunload;
    if (typeof handler === 'function') {
      const result = handler(e);
      if (result !== undefined && result !== true) {
        e.preventDefault();
        e.returnValue = '';
        window.__lowbarDialogHandler.show('beforeunload', result || '', '').then(function(res) {
          if (res.success) {
            window.onbeforeunload = null;
            window.close();
          }
        });
      }
    }
  });

  ipcRenderer.on('lowbar-dialog-response', (_e, data) => {
    if (data && typeof data.id === 'number') {
      window.__lowbarDialogHandler.resolve(data.id, data.success, data.value);
    }
  });
} catch (e) {}

try {
  const send = (level, args) => {
    try { ipcRenderer.sendToHost('webview-console', { level, args }); } catch (e) {}
  };
  ['log','info','warn','error','debug'].forEach((m) => {
    const orig = console[m] && console[m].bind(console);
    if (!orig) return;
    console[m] = (...args) => { try { send(m, args); } catch (e) {} try { orig(...args); } catch (e) {} };
  });
  window.addEventListener('error', (e) => {
    const msg = e && e.message != null ? String(e.message) : 'Error';
    const src = e && e.filename ? String(e.filename) : '';
    const pos = (e && e.lineno != null ? String(e.lineno) : '0') + ':' + (e && e.colno != null ? String(e.colno) : '0');
    const stack = e && e.error && e.error.stack ? String(e.error.stack) : '';
    send('error', [msg, src + ':' + pos, stack]);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e && e.reason ? (e.reason.stack || e.reason.message || String(e.reason)) : 'UnhandledRejection';
    send('error', ['UnhandledRejection', reason]);
  });
} catch (e) {}