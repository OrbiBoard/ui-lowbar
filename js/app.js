import { state } from './state.js';
import { $ } from './utils.js';
import { setupWebview } from './webview.js';
import { positionFloatWin } from './float.js';
import { buildItems, setModeClass, updateMaxButton } from './ui.js';

function setupEventHandler() {
    try {
        window.lowbarAPI.onEvent((name, data) => {
          if (!state.gEventChannel || name !== state.gEventChannel || !data || typeof data !== 'object') return;
          if (data.type === 'update') {
            switch (data.target) {
              case 'backgroundUrl': {
                const bgv = document.getElementById('bgView');
                if (bgv && data.value) { bgv.src = data.value; bgv.style.display = 'block'; }
                break;
              }
              case 'floatingUrl': {
                const fv2 = document.getElementById('floatView');
                const fw2 = document.getElementById('floatWin');
                const fl2 = document.getElementById('float-loading');
                if (fv2 && fw2 && data.value) { 
                  if (fv2.src !== data.value && fl2) fl2.style.display = 'flex';
                  fv2.src = data.value; 
                  fw2.style.display = 'block';
                  fw2.style.opacity = '0';
                  fw2.style.transform = 'translateY(8px)';
                  requestAnimationFrame(() => { fw2.style.opacity = '1'; fw2.style.transform = 'translateY(0)'; });
                  try { if (state.gFloatingBoundsPreset) positionFloatWin(state.gFloatingBoundsPreset); } catch (e) {}
                  const mask2 = document.getElementById('floatMask');
                  if (mask2 && !state.pinned) mask2.style.display = 'block';
                  state.gFloatJustOpenedAt = Date.now();
                } else {
                  if (fv2 && fw2 && !data.value) {
                    if (state.pinned) return;
                    fw2.style.opacity = '0';
                    fw2.style.transform = 'translateY(8px)';
                    setTimeout(() => {
                      fw2.style.display = 'none';
                      const mask2 = document.getElementById('floatMask');
                      if (mask2) mask2.style.display = 'none';
                      if (fl2) fl2.style.display = 'none';
                    }, 160);
                  }
                }
                break;
              }
              case 'floatingBounds': {
                const fw2 = document.getElementById('floatWin');
                if (!fw2) break;
                const v = data.value;
                if (typeof v === 'string') {
                  if (v === 'max') {
                    state.gFloatMaximize = true;
                    const preset = 'center';
                    state.gFloatingBoundsPreset = preset;
                    positionFloatWin(preset);
                  } else {
                    state.gFloatMaximize = false;
                    const preset = v === 'left' ? 'left' : 'center';
                    state.gFloatingBoundsPreset = preset;
                    positionFloatWin(preset);
                  }
                } else if (v && typeof v === 'object') {
                  const { x, y, width, height } = v;
                  if (Number.isFinite(width) && width > 0) state.gFloatWidthPx = Math.floor(width);
                  if (Number.isFinite(height) && height > 0) state.gFloatHeightPx = Math.floor(height);
                  if (Number.isFinite(x) && Number.isFinite(y)) {
                    fw2.style.left = Math.floor(x) + 'px';
                    fw2.style.top = Math.floor(y) + 'px';
                    if (Number.isFinite(width) && width > 0) fw2.style.width = Math.floor(width) + 'px';
                    if (Number.isFinite(height) && height > 0) fw2.style.height = Math.floor(height) + 'px';
                  } else {
                    state.gFloatMaximize = false;
                    const preset = state.gFloatingBoundsPreset || 'center';
                    positionFloatWin(preset);
                  }
                }
                break;
              }
              case 'floatingMaximize': {
                state.gFloatMaximize = !!data.value;
                positionFloatWin(state.gFloatingBoundsPreset || 'center');
                break;
              }
              case 'floatingSizePercent': {
                const p = parseInt(data.value, 10);
                if (!Number.isNaN(p)) {
                  state.gFloatSizePercent = Math.min(100, Math.max(1, p));
                  positionFloatWin(state.gFloatingBoundsPreset || 'center');
                }
                break;
              }
              case 'floatingWidth': {
                const w = parseInt(data.value, 10);
                if (!Number.isNaN(w) && w > 0) state.gFloatWidthPx = w;
                positionFloatWin(state.gFloatingBoundsPreset || 'center');
                break;
              }
              case 'floatingHeight': {
                const h = parseInt(data.value, 10);
                if (!Number.isNaN(h) && h > 0) state.gFloatHeightPx = h;
                positionFloatWin(state.gFloatingBoundsPreset || 'center');
                break;
              }
              case 'centerItems': {
                const centerEl = document.getElementById('center-items');
                document.querySelector('.center.area')?.classList.add('has-content');
                if (centerEl && Array.isArray(data.value)) buildItems(centerEl, data.value);
                break;
              }
              case 'leftItems': {
                const leftEl = document.getElementById('left-items');
                if (leftEl && Array.isArray(data.value)) buildItems(leftEl, data.value);
                break;
              }
            }
          }
        });
      } catch (e) {}
}

export function applyInit(payload) {
    if (!payload) payload = {};
    console.log('[UI-LOWBAR] applyInit called with:', payload);
    try {
      const safeSetText = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };
      const safeSetClass = (sel, val) => { const el = $(sel); if (el) el.className = val; };

      safeSetText('#top-title', payload.title || 'UI模板-低栏应用');
      safeSetText('#bottom-title', payload.title || 'UI模板-低栏应用');
      document.title = payload.title || 'UI模板-低栏应用';
      safeSetClass('#top-icon', payload.icon || 'ri-layout-bottom-line');
      safeSetClass('#bottom-icon', payload.icon || 'ri-layout-bottom-line');

      if (payload.title) safeSetText('#loading-title', payload.title);
      if (payload.icon) safeSetClass('#loading-icon', payload.icon);

      state.gEventChannel = payload.eventChannel || null;
      state.gCallerPluginId = payload.callerPluginId || null;
      
      if (payload.floatingSizePercent != null) {
        const p = parseInt(payload.floatingSizePercent, 10);
        if (!Number.isNaN(p)) state.gFloatSizePercent = Math.min(100, Math.max(1, p));
      }
      if (payload.floatingWidth != null) {
        const w = parseInt(payload.floatingWidth, 10);
        if (!Number.isNaN(w) && w > 0) state.gFloatWidthPx = w;
      }
      if (payload.floatingHeight != null) {
        const h = parseInt(payload.floatingHeight, 10);
        if (!Number.isNaN(h) && h > 0) state.gFloatHeightPx = h;
      }

      const topics = Array.isArray(payload.subscribeTopics) ? payload.subscribeTopics : (state.gEventChannel ? [state.gEventChannel] : []);
      try { topics.forEach((t) => window.lowbarAPI.subscribe(t)); } catch (e) {}

      setupEventHandler();

      const bg = $('#bgView');
      const fw = $('#floatWin');
      const fv = $('#floatView');
      
      setupWebview(bg, 'bgView');
      setupWebview(fv, 'floatView');

      if (payload.backgroundUrl) {
        bg.src = payload.backgroundUrl; bg.style.display = 'block';
      } else {
        bg.src = 'about:blank'; bg.style.display = 'none';
      }
      
      if (payload.floatingUrl) {
        fv.src = payload.floatingUrl; fw.style.display = 'block';
        fw.style.opacity = '0'; fw.style.transform = 'translateY(8px)';
        requestAnimationFrame(() => { fw.style.opacity = '1'; fw.style.transform = 'translateY(0)'; });
        const mask = document.getElementById('floatMask');
        if (mask && !state.pinned) mask.style.display = 'block';
        state.gFloatJustOpenedAt = Date.now();
      } else {
        fv.src = 'about:blank';
        fw.style.opacity = '0'; fw.style.transform = 'translateY(8px)';
        setTimeout(() => { fw.style.display = 'none'; }, 160);
        const mask = document.getElementById('floatMask');
        if (mask) mask.style.display = 'none';
      }

      // Floating bounds logic
      if (payload.floatingBounds && typeof payload.floatingBounds === 'object') {
        const { x, y, width, height } = payload.floatingBounds;
        if (Number.isFinite(width) && width > 0) state.gFloatWidthPx = Math.floor(width);
        if (Number.isFinite(height) && height > 0) state.gFloatHeightPx = Math.floor(height);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          fw.style.left = Math.floor(x) + 'px'; fw.style.top = Math.floor(y) + 'px';
          if (Number.isFinite(width) && width > 0) fw.style.width = Math.floor(width) + 'px';
          if (Number.isFinite(height) && height > 0) fw.style.height = Math.floor(height) + 'px';
        } else {
          positionFloatWin(state.gFloatingBoundsPreset || 'center');
        }
      } else if (typeof payload.floatingBounds === 'string') {
        const preset = payload.floatingBounds === 'left' ? 'left' : 'center';
        state.gFloatingBoundsPreset = preset;
        positionFloatWin(preset);
      } else {
        state.gFloatingBoundsPreset = 'center';
        positionFloatWin('center');
      }

      const centerEl = $('#center-items');
      const leftEl = $('#left-items');
      if (Array.isArray(payload.centerItems)) {
        document.querySelector('.center.area')?.classList.add('has-content');
        buildItems(centerEl, payload.centerItems);
      }
      if (Array.isArray(payload.leftItems)) {
        buildItems(leftEl, payload.leftItems);
      }
      
      // Caps and Mode
      const caps = payload.capabilities || { maximizable: true, fullscreenable: true };
      const mode = payload.windowMode || 'all_modes';
      const topMax = $('#btn-max');
      const topFull = $('#btn-full');
      const bottomMax = $('#bottom-max');
      const bottomFull = $('#bottom-full');

      if (caps.maximizable) { topMax.style.display = 'inline-flex'; topFull.style.display = 'none'; }
      else if (caps.fullscreenable) { topMax.style.display = 'none'; topFull.style.display = 'inline-flex'; }
      else { topMax.style.display = 'none'; topFull.style.display = 'none'; }

      if (mode === 'fullscreen_only') { bottomFull.style.display = 'none'; bottomMax.style.display = 'none'; }
      else if (caps.fullscreenable) { bottomFull.style.display = 'inline-flex'; bottomMax.style.display = 'none'; }
      else if (caps.maximizable) { bottomFull.style.display = 'none'; bottomMax.style.display = 'inline-flex'; }
      else { bottomFull.style.display = 'none'; bottomMax.style.display = 'none'; }

      document.querySelector('.left').classList.add('has-content');
      document.querySelector('.right').classList.add('has-content');

      const initMode = (payload && payload.windowMode) ? String(payload.windowMode) : 'all_modes';
      if (initMode === 'fullscreen_only') { state.gInitialFull = true; state.gInitialMax = false; }
      else if (initMode === 'fullscreen_maximized') { state.gInitialFull = false; state.gInitialMax = true; }
      else { state.gInitialFull = false; state.gInitialMax = false; }
      if (typeof payload.maximized === 'boolean') state.gInitialMax = payload.maximized;
      if (typeof payload.fullscreen === 'boolean') state.gInitialFull = payload.fullscreen;
      
      state.isFull = state.gInitialFull;
      state.isMax = state.gInitialMax;
      
      console.log('[UI-LOWBAR] Initial state:', { isFull: state.isFull, isMax: state.isMax });
      setModeClass(state.isFull, state.isMax);
      
      updateMaxButton(document.getElementById('btn-max'), state.isMax);
      updateMaxButton(document.getElementById('bottom-max'), state.isMax);

    } catch (err) {
      console.error('applyInit failed', err);
    }
}
