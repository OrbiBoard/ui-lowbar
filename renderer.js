import { initPolyfill } from './js/polyfill.js';
import { initTheme } from './js/theme.js';
import { state } from './js/state.js';
import { $, removeLoadingLayer } from './js/utils.js';
import { applyInit } from './js/app.js';
import { initWindowControls, initCollapseLogic, handleWindowStateChange, updateCollapseButtons, initDialogSystem } from './js/ui.js';
import { enableFloatDrag, initFloatListeners } from './js/float.js';

(function() {
  initPolyfill();
  
  // Populate DOM cache
  state.dom.bgView = $('#bgView');
  state.dom.floatWin = $('#floatWin');
  state.dom.floatView = $('#floatView');
  state.dom.floatMask = document.getElementById('floatMask');

  // Init logic
  initWindowControls();
  initCollapseLogic();
  enableFloatDrag();
  initFloatListeners();
  initDialogSystem();

  // Core init
  const themePromise = initTheme();
  
  window.lowbarAPI.onInit(async (payload) => {
    try {
        // Wait for theme (max 500ms to avoid blocking too long if backend slow)
        const timeout = new Promise(r => setTimeout(r, 500));
        await Promise.race([themePromise, timeout]);
    } catch(e) {}
    
    applyInit(payload);
    removeLoadingLayer();
  });

  // Window state listener
  if (window.lowbarAPI.onWindowStateChanged) {
    window.lowbarAPI.onWindowStateChanged(handleWindowStateChange);
  }

  updateCollapseButtons();

  // Fallback for loading layer
  setTimeout(() => {
    removeLoadingLayer();
  }, 3000);
})();
