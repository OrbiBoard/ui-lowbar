import { state } from './state.js';
import { $ } from './utils.js';
import { positionFloatWin } from './float.js';

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
    // If we are exiting fullscreen, we should ensure we don't accidentally get stuck in 'maximized' mode
    // if the system reports maximized:true during the transition.
    // However, if the window truly is maximized, we want to know.
    
    // Logic: 
    // 1. Update Fullscreen state
    state.isFull = s.fullscreen;
    
    // 2. Update Maximized state
    state.isMax = s.maximized;

    // 3. Apply class
    setModeClass(state.isFull, state.isMax);
    
    // 4. Update controls
    updateMaxButton(document.getElementById('btn-max'), state.isMax);
    updateMaxButton(document.getElementById('bottom-max'), state.isMax);
    
    updateFullButton(document.getElementById('bottom-full'), state.isFull);
    
    // 5. If we are NOT in fullscreen, verify collapse state
    if (!state.isFull) {
        if (state.isCollapsed) { 
            state.isCollapsed = false; 
            document.body.classList.remove('collapsed'); 
        }
    }
    updateCollapseButtons();
    
    // Position float window if needed (since fullscreen mode changes layout height)
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
  const overlay = document.getElementById('modal-overlay');
  const header = document.getElementById('modal-header');
  const body = document.getElementById('modal-body');
  const inputContainer = document.getElementById('modal-input-container');
  const input = document.getElementById('modal-input');
  const btnCancel = document.getElementById('modal-btn-cancel');
  const btnConfirm = document.getElementById('modal-btn-confirm');

  if (!overlay) return;

  let currentCallback = null;
  let currentType = null;

  function close() {
    overlay.classList.remove('show');
    // Give time for transition
    setTimeout(() => {
        overlay.style.visibility = 'hidden';
    }, 200);
    input.value = '';
    currentCallback = null;
    currentType = null;
  }

  function submit(success, value) {
    if (currentCallback) {
        currentCallback(success, value);
    }
    close();
  }

  btnCancel.addEventListener('click', () => {
    submit(false, null);
  });

  btnConfirm.addEventListener('click', () => {
    if (currentType === 'prompt') {
      submit(true, input.value);
    } else {
      submit(true, true);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        submit(true, input.value);
    } else if (e.key === 'Escape') {
        submit(false, null);
    }
  });

  function showModal(type, message, defaultText, callback) {
    currentType = type;
    currentCallback = callback;
    
    // Determine title based on type
    let title = '提示';
    if (type === 'confirm') title = '确认';
    else if (type === 'prompt') title = '输入';
    else if (type === 'beforeunload') title = '确认离开';
    
    header.textContent = title;
    body.textContent = message || '';
    
    // Setup inputs and buttons
    inputContainer.style.display = 'none';
    btnCancel.style.display = 'none';
    btnConfirm.textContent = '确定';

    if (type === 'alert') {
        // Alert: Only OK
        btnConfirm.style.display = 'block';
        setTimeout(() => btnConfirm.focus(), 50);
    } else if (type === 'confirm' || type === 'beforeunload') {
        // Confirm: OK/Cancel
        btnCancel.style.display = 'block';
        btnConfirm.style.display = 'block';
        setTimeout(() => btnConfirm.focus(), 50);
    } else if (type === 'prompt') {
        // Prompt: Input + OK/Cancel
        inputContainer.style.display = 'block';
        btnCancel.style.display = 'block';
        btnConfirm.style.display = 'block';
        input.value = defaultText || '';
        setTimeout(() => {
            input.focus();
            input.select();
        }, 50);
    }

    // Show
    overlay.style.visibility = 'visible';
    overlay.offsetHeight; // Force reflow
    overlay.classList.add('show');
  }

  // Bind to webviews
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
