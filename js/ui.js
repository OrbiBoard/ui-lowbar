import { state } from './state.js';
import { $ } from './utils.js';
import { positionFloatWin } from './float.js';

let dialogOverlay = null;
let dialogHeader = null;
let dialogBody = null;
let dialogInputContainer = null;
let dialogInput = null;
let dialogBtnCancel = null;
let dialogBtnConfirm = null;
let currentCallback = null;
let currentType = null;

function closeDialog() {
  if (!dialogOverlay) return;
  dialogOverlay.classList.remove('show');
  setTimeout(() => {
    dialogOverlay.style.visibility = 'hidden';
  }, 200);
  if (dialogInput) dialogInput.value = '';
  currentCallback = null;
  currentType = null;
}

function submitDialog(success, value) {
  if (currentCallback) {
    currentCallback(success, value);
  }
  closeDialog();
}

function showModal(type, message, defaultText, callback) {
  if (!dialogOverlay) return;
  currentType = type;
  currentCallback = callback;
  
  let title = '提示';
  if (type === 'confirm') title = '确认';
  else if (type === 'prompt') title = '输入';
  else if (type === 'beforeunload') title = '确认离开';
  
  dialogHeader.textContent = title;
  dialogBody.textContent = message || '';
  
  dialogInputContainer.style.display = 'none';
  dialogBtnCancel.style.display = 'none';
  dialogBtnConfirm.textContent = '确定';

  if (type === 'alert') {
    dialogBtnConfirm.style.display = 'block';
    setTimeout(() => dialogBtnConfirm.focus(), 50);
  } else if (type === 'confirm' || type === 'beforeunload') {
    dialogBtnCancel.style.display = 'block';
    dialogBtnConfirm.style.display = 'block';
    setTimeout(() => dialogBtnConfirm.focus(), 50);
  } else if (type === 'prompt') {
    dialogInputContainer.style.display = 'block';
    dialogBtnCancel.style.display = 'block';
    dialogBtnConfirm.style.display = 'block';
    dialogInput.value = defaultText || '';
    setTimeout(() => {
      dialogInput.focus();
      dialogInput.select();
    }, 50);
  }

  dialogOverlay.style.visibility = 'visible';
  dialogOverlay.offsetHeight;
  dialogOverlay.classList.add('show');
}

export function showCustomDialog(webview, data) {
  if (!webview || !data) return;
  showModal(data.type, data.message, data.defaultText, (success, value) => {
    try {
      webview.send('lowbar-dialog-response', {
        id: data.id,
        success: success,
        value: value || null
      });
    } catch (e) {}
  });
}

export function setModeClass(isFull, isMax) {
  const body = document.body;
  
  if (isFull) body.classList.add('mode-fullscreen');
  else body.classList.remove('mode-fullscreen');
  
  if (isMax) body.classList.add('mode-maximized');
  else body.classList.remove('mode-maximized');
  
  if (!isFull && !isMax) body.classList.add('mode-windowed');
  else body.classList.remove('mode-windowed');
}

export function updateCollapseButtons() {
  const collapseBtn = document.getElementById('bottom-collapse');
  const expandRightBtn = document.getElementById('bottom-expand-right');
  const expandCenterBtn = document.getElementById('bottom-expand-center');
  if (!state.isFull) {
    if (collapseBtn) collapseBtn.style.display = 'none';
    if (expandRightBtn) expandRightBtn.style.display = 'none';
    if (expandCenterBtn) expandCenterBtn.style.display = 'none';
    return;
  }
  if (state.isCollapsed) {
    if (collapseBtn) collapseBtn.style.display = 'none';
    if (expandRightBtn) expandRightBtn.style.display = 'inline-flex';
    if (expandCenterBtn) expandCenterBtn.style.display = 'none';
  } else {
    if (collapseBtn) collapseBtn.style.display = 'inline-flex';
    if (expandRightBtn) expandRightBtn.style.display = 'none';
    if (expandCenterBtn) expandCenterBtn.style.display = 'none';
  }
}

export function buildItems(container, items) {
  container.innerHTML = '';
  if (!Array.isArray(items)) return;
  for (const it of items) {
    const btn = document.createElement('button');
    btn.className = 'rect-btn';
    btn.dataset.id = it.id || '';
    btn.dataset.type = it.type || '';
    const icon = document.createElement('i');
    icon.className = it.icon || 'ri-function-line';
    const text = document.createElement('span');
    text.textContent = it.text || it.id || '';
    btn.appendChild(icon);
    btn.appendChild(text);
    if (it.active) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const payload = { type: (container.id === 'center-items' ? 'click' : 'left.click'), id: it.id, kind: it.type };
      try {
        if (state.gCallerPluginId) {
          window.lowbarAPI.pluginCall(state.gCallerPluginId, 'onLowbarEvent', [payload]);
        }
      } catch (e) {}
    });
    container.appendChild(btn);
  }
}

export function updateMaxButton(btn, isMax) {
    if (!btn) return;
    const iconClass = isMax ? 'ri-checkbox-multiple-blank-line' : 'ri-checkbox-blank-line';
    const titleText = isMax ? '还原' : '最大化';
    const icon = btn.querySelector('i');
    if (icon) icon.className = iconClass;
    btn.title = titleText;
    const span = btn.querySelector('span');
    if (span) span.textContent = titleText;
}

export function updateFullButton(btn, isFull) {
    if (!btn) return;
    const label = btn.querySelector('span');
    if (label) label.textContent = isFull ? '退出全屏' : '全屏';
}

export function handleWindowStateChange(s) {
    console.log('[UI] handleWindowStateChange:', s);
    
    const wasFull = state.isFull;
    const wasMax = state.isMax;
    
    state.isFull = s.fullscreen;
    
    if (state.isFull) {
        state.isMax = false;
    } else {
        state.isMax = s.maximized;
    }

    setModeClass(state.isFull, state.isMax);
    
    updateMaxButton(document.getElementById('btn-max'), state.isMax);
    updateMaxButton(document.getElementById('bottom-max'), state.isMax);
    
    updateFullButton(document.getElementById('bottom-full'), state.isFull);
    
    if (!state.isFull) {
        if (state.isCollapsed) { 
            state.isCollapsed = false; 
            document.body.classList.remove('collapsed'); 
        }
    }
    updateCollapseButtons();
    
    const fw = document.getElementById('floatWin');
    if (fw && fw.style.display !== 'none' && !state.pinned) { 
        try { if (state.gFloatingBoundsPreset) positionFloatWin(state.gFloatingBoundsPreset); } catch (e) {} 
    }
}

export function initWindowControls() {
  const handleMin = () => window.lowbarAPI.windowControl('minimize');
  const handleMax = () => window.lowbarAPI.windowControl('maximize');
  const handleClose = () => window.lowbarAPI.windowControl('close');
  
  const handleFull = () => {
    window.lowbarAPI.toggleFullscreen();
    // No optimistic update to avoid flickering in non-maximized mode
  };

  $('#btn-min')?.addEventListener('click', handleMin);
  $('#btn-max')?.addEventListener('click', handleMax);
  $('#btn-close')?.addEventListener('click', handleClose);
  $('#btn-full')?.addEventListener('click', handleFull);

  $('#bottom-min')?.addEventListener('click', handleMin);
  $('#bottom-max')?.addEventListener('click', handleMax);
  $('#bottom-close')?.addEventListener('click', handleClose);
  $('#bottom-full')?.addEventListener('click', handleFull);
  
  const pinBtn = document.getElementById('btn-pin');
  if (pinBtn) {
    pinBtn.addEventListener('click', async () => {
      try {
        const res = await window.lowbarAPI.toggleAlwaysOnTop();
        const pinnedVal = (res && typeof res === 'object') ? !!res.result : !!res;
        pinBtn.classList.toggle('active', pinnedVal);
      } catch (e) {}
    });
  }
}

export function initCollapseLogic() {
  const collapseBtn = document.getElementById('bottom-collapse');
  const expandRightBtn = document.getElementById('bottom-expand-right');
  const expandCenterBtn = document.getElementById('bottom-expand-center');
  if (collapseBtn) collapseBtn.addEventListener('click', () => { if (!state.isFull) return; state.isCollapsed = true; document.body.classList.add('collapsed'); updateCollapseButtons(); });
  if (expandRightBtn) expandRightBtn.addEventListener('click', () => { state.isCollapsed = false; document.body.classList.remove('collapsed'); updateCollapseButtons(); });
  if (expandCenterBtn) expandCenterBtn.addEventListener('click', () => { state.isCollapsed = false; document.body.classList.remove('collapsed'); updateCollapseButtons(); });
}

export function initDialogSystem() {
  dialogOverlay = document.getElementById('modal-overlay');
  dialogHeader = document.getElementById('modal-header');
  dialogBody = document.getElementById('modal-body');
  dialogInputContainer = document.getElementById('modal-input-container');
  dialogInput = document.getElementById('modal-input');
  dialogBtnCancel = document.getElementById('modal-btn-cancel');
  dialogBtnConfirm = document.getElementById('modal-btn-confirm');

  if (!dialogOverlay) return;

  dialogBtnCancel.addEventListener('click', () => {
    submitDialog(false, null);
  });

  dialogBtnConfirm.addEventListener('click', () => {
    if (currentType === 'prompt') {
      submitDialog(true, dialogInput.value);
    } else {
      submitDialog(true, true);
    }
  });

  dialogInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      submitDialog(true, dialogInput.value);
    } else if (e.key === 'Escape') {
      submitDialog(false, null);
    }
  });

  const webviews = [state.dom.bgView, state.dom.floatView];
  webviews.forEach(wv => {
    if (!wv) return;
    wv.addEventListener('dialog', (e) => {
      const { messageType, messageText, defaultPromptText } = e;
      showModal(messageType, messageText, defaultPromptText, (success, value) => {
        if (success) {
          try { e.ok(value); } catch(err) {}
        } else {
          try { e.cancel(); } catch(err) {}
        }
      });
    });
  });
}
