import { state } from './state.js';
import { $ } from './utils.js';

export function positionFloatWin(preset) {
  const fw = state.dom.floatWin || $('#floatWin');
  if (!fw) return;
  
  const vw = window.innerWidth || 1200;
  const vh = window.innerHeight || 800;
  const scale = Math.min(100, Math.max(1, state.gFloatSizePercent)) / 100;
  let wDesired = (state.gFloatWidthPx && state.gFloatWidthPx > 0) ? state.gFloatWidthPx : Math.floor(vw * scale);
  let hDesired = (state.gFloatHeightPx && state.gFloatHeightPx > 0) ? state.gFloatHeightPx : Math.floor(vh * scale);
  const isCenter = preset === 'center';
  const bb = document.getElementById('bottombar');
  const bottomH = bb ? bb.offsetHeight : (document.body.classList.contains('mode-fullscreen') ? 80 : 68);
  const gap = 6;
  if (state.gFloatMaximize) { wDesired = vw; hDesired = vh; }
  const maxW = state.gFloatMaximize ? Math.max(200, vw - 48) : Math.min(1200, Math.floor(vw * 0.9));
  const w = Math.min(wDesired, maxW);
  const maxH = state.gFloatMaximize ? Math.max(160, Math.floor(vh - bottomH - gap - 12)) : Math.floor(vh * 0.9);
  const h = Math.min(hDesired, maxH);
  const left = isCenter ? Math.max(24, Math.round((vw - w) / 2)) : 24;
  const top = Math.max(12, vh - bottomH - gap - h);
  fw.style.left = left + 'px';
  fw.style.top = top + 'px';
  fw.style.width = w + 'px';
  fw.style.height = h + 'px';
}

export function enableFloatDrag() {
  const fw = state.dom.floatWin || $('#floatWin');
  if (!fw) return;
  const bar = fw.querySelector('.float-titlebar');
  let dragging = false; let sx=0, sy=0, ox=0, oy=0;
  if (window.PointerEvent) {
    if (bar && bar.style) bar.style.touchAction = 'none';
    let rafScheduled=false; let dxLatest=0; let dyLatest=0;
    const applyMove = ()=>{ rafScheduled=false; fw.style.left=(ox+dxLatest)+'px'; fw.style.top=(oy+dyLatest)+'px'; };
    const onDown = (e) => { if (e.pointerType==='mouse' && e.button!==0) return; dragging=true; sx=e.clientX; sy=e.clientY; const r=fw.getBoundingClientRect(); ox=r.left; oy=r.top; e.preventDefault(); try{ window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp, { once:true }); }catch (e) {} };
    const onMove = (e) => { if (!dragging) return; dxLatest=e.clientX-sx; dyLatest=e.clientY-sy; if (!rafScheduled) { rafScheduled=true; requestAnimationFrame(applyMove); } };
    const onUp = () => { dragging=false; rafScheduled=false; try{ window.removeEventListener('pointermove', onMove); }catch (e) {} };
    bar.addEventListener('pointerdown', onDown);
    fw.addEventListener('pointerdown', (e) => { if (e.pointerType==='mouse' && e.button!==0) return; if (e.target!==fw) return; dragging=true; sx=e.clientX; sy=e.clientY; const r=fw.getBoundingClientRect(); ox=r.left; oy=r.top; e.preventDefault(); try{ window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp, { once:true }); }catch (e) {} });
  } else {
    let rafScheduled=false; let dxLatest=0; let dyLatest=0;
    const applyMove = ()=>{ rafScheduled=false; fw.style.left=(ox+dxLatest)+'px'; fw.style.top=(oy+dyLatest)+'px'; };
    const onDownMouse = (e) => { if (e.button!==0) return; dragging=true; sx=e.clientX; sy=e.clientY; const r=fw.getBoundingClientRect(); ox=r.left; oy=r.top; try{ window.addEventListener('mousemove', onMoveMouse); window.addEventListener('mouseup', onUpMouse, { once:true }); }catch (e) {} };
    const onMoveMouse = (e) => { if (!dragging) return; dxLatest=e.clientX-sx; dyLatest=e.clientY-sy; if (!rafScheduled) { rafScheduled=true; requestAnimationFrame(applyMove); } };
    const onUpMouse = () => { dragging=false; rafScheduled=false; try{ window.removeEventListener('mousemove', onMoveMouse); }catch (e) {} };
    bar.addEventListener('mousedown', onDownMouse);
    fw.addEventListener('mousedown', (e) => { if (e.button!==0) return; if (e.target !== fw) return; dragging = true; sx = e.clientX; sy = e.clientY; const r = fw.getBoundingClientRect(); ox=r.left; oy=r.top; try{ window.addEventListener('mousemove', onMoveMouse); window.addEventListener('mouseup', onUpMouse, { once:true }); }catch (e) {} });
  }
}

export function syncModeFromFloat() {
  const fv = state.dom.floatView || $('#floatView');
  if (!fv) return;
  try {
    const u = new URL(fv.src, window.location.href);
    const mode = u.searchParams.get('mode');
    const minsStr = u.searchParams.get('mins');
    const mins = minsStr != null ? parseInt(minsStr, 10) : null;
    
    if (state.gFloatJustOpenedAt && (Date.now() - state.gFloatJustOpenedAt) < 300) return;
    if (mode === 'calendar' || mode === 'clock' || mode === 'countdown' || mode === 'stopwatch') {
      const evt = { type: 'float.mode', mode };
      if (mode === 'countdown' && mins != null && !Number.isNaN(mins) && mins > 0) evt.mins = mins;
      try {
        if (state.gEventChannel) window.lowbarAPI.emitEvent(state.gEventChannel, evt);
        else window.lowbarAPI.emitEvent('lowbar:click', evt);
      } catch (e) { console.error('[LOWBAR] Error emitting float mode event:', e); }
      try {
        if (state.gCallerPluginId) window.lowbarAPI.pluginCall(state.gCallerPluginId, 'onLowbarEvent', [evt]);
      } catch (e) { console.error('[LOWBAR] Error calling plugin for float mode:', e); }
    }
  } catch (e) { console.error('[LOWBAR] Error in syncModeFromFloat:', e); }
}

export function initFloatListeners() {
  const fw = state.dom.floatWin;
  const mask = state.dom.floatMask;
  const fv = state.dom.floatView;

  $('#float-close')?.addEventListener('click', () => { 
    fw.style.opacity = '0'; fw.style.transform = 'translateY(8px)';
    setTimeout(() => { fw.style.display = 'none'; if (mask) mask.style.display = 'none'; }, 160);
  });
  
  $('#float-pin')?.addEventListener('click', () => {
    state.pinned = !state.pinned;
    $('#float-pin').classList.toggle('active', state.pinned);
    if (mask) mask.style.display = (!state.pinned && fw && fw.style.display !== 'none') ? 'block' : 'none';
  });

  if (mask) {
    mask.addEventListener('mousedown', () => {
      if (!fw) return;
      if (fw.style.display === 'none' || state.pinned) return;
      if (state.gFloatJustOpenedAt && (Date.now() - state.gFloatJustOpenedAt) < 200) return;
      fw.style.opacity = '0'; fw.style.transform = 'translateY(8px)';
      setTimeout(() => { fw.style.display = 'none'; mask.style.display = 'none'; }, 160);
      state.gFloatJustOpenedAt = 0;
    });
  }

  window.addEventListener('resize', () => {
    if (!fw || fw.style.display === 'none' || state.pinned) return;
    try { if (state.gFloatingBoundsPreset) positionFloatWin(state.gFloatingBoundsPreset); } catch (e) {}
  });
  
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (fw && fw.style.display !== 'none') {
        fw.style.opacity = '0'; fw.style.transform = 'translateY(8px)';
        setTimeout(() => { fw.style.display = 'none'; if (mask) mask.style.display = 'none'; }, 160);
      }
    }
  });

  if (fv) {
    const hideFloatLoading = () => {
      const fl = document.getElementById('float-loading');
      if (fl) fl.style.display = 'none';
    };
    fv.addEventListener('dom-ready', hideFloatLoading);
    fv.addEventListener('did-finish-load', hideFloatLoading);
    fv.addEventListener('did-fail-load', hideFloatLoading);
    
    // Sync mode
    fv.addEventListener('did-navigate', syncModeFromFloat);
    fv.addEventListener('did-navigate-in-page', syncModeFromFloat);
    fv.addEventListener('dom-ready', syncModeFromFloat);
  }
}
