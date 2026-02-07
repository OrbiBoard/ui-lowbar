export function initPolyfill() {
  // 开发预览环境 polyfill：当不存在 window.lowbarAPI 时，提供最小可用实现
  (function ensureLowbarApi(){
    if (window.lowbarAPI) return;
    const makeUrl = (rel) => { try { return new URL(rel, window.location.href).href; } catch(e){ return rel; } };
    const query = new URLSearchParams(window.location.search || '');
    const previewWindowMode = query.get('windowMode') || query.get('wm') || 'all_modes';
    const previewPayload = {
      title: 'UI模板-低栏应用',
      windowMode: previewWindowMode,
      icon: 'ri-layout-bottom-line',
      backgroundUrl: makeUrl('../ui-lowbar-caller/background/clock.html?date=0&seconds=0&blink=0'),
      floatingUrl: null,
      floatingBounds: 'center',
      floatingSizePercent: 48,
      eventChannel: 'example-lowbar',
      subscribeTopics: ['example-lowbar'],
      capabilities: { maximizable: true, fullscreenable: true },
      centerItems: [ { id:'openControls', text:'功能选择', icon:'ri-tools-line' } ],
      leftItems: [
        { id:'clock-date', text:'显示日期', icon:'ri-calendar-line', active: false },
        { id:'clock-seconds', text:'显示秒数', icon:'ri-time-line', active: false },
        { id:'clock-blink', text:'冒号闪烁', icon:'ri-flashlight-line', active: false }
      ],
      backgroundTargets: {
        clock: makeUrl('../ui-lowbar-caller/background/clock.html'),
        calendar: makeUrl('../ui-lowbar-caller/background/calendar.html'),
        countdown: makeUrl('../ui-lowbar-caller/background/countdown.html'),
        stopwatch: makeUrl('../ui-lowbar-caller/background/stopwatch.html')
      },
      callerPluginId: 'ui-lowbar-caller'
    };
    let onEventHandler = null;
    const state = {
      currentMode: 'clock',
      clockOpts: { date: 0, seconds: 0, blink: 0 },
      bgTargets: previewPayload.backgroundTargets,
      floatBase: makeUrl('../ui-lowbar-caller/float/control.html')
    };
    const eventQueue = [];
    const dispatchUpdate = (target, value) => {
      const event = { name: 'example-lowbar', data: { type: 'update', target, value } };
      if (onEventHandler) {
        try { onEventHandler(event.name, event.data); } catch (e) { console.error('[LOWBAR POLYFILL] Error in dispatchUpdate:', e); }
      } else {
        eventQueue.push(event);
      }
    };
    window.lowbarAPI = {
      onInit: (handler) => { setTimeout(() => { try { handler(previewPayload); } catch (e) {} }, 100); },
      windowControl: () => ({ ok: true }),
      toggleFullscreen: () => ({ ok: true }),
      toggleAlwaysOnTop: () => ({ result: false }),
      emitEvent: () => ({ ok: true }),
      subscribe: () => {},
      onEvent: (handler) => { 
        onEventHandler = handler; 
        while (eventQueue.length > 0) {
          const event = eventQueue.shift();
          try {
            handler(event.name, event.data);
          } catch (e) {
            console.error('[LOWBAR POLYFILL] Error processing queued event:', e);
          }
        }
      },
      pluginCall: (_targetPluginId, fnName, args) => {
        try {
          if (fnName !== 'onLowbarEvent') return { ok: true };
          const payload = Array.isArray(args) ? args[0] : null;
          if (!payload || typeof payload !== 'object') return { ok: true };
          if (payload.type === 'click') {
            if (payload.id === 'openControls') {
              const u = new URL(state.floatBase);
              u.searchParams.set('mode', state.currentMode);
              dispatchUpdate('floatingUrl', u.href);
            }
          }
          return { ok: true };
        } catch (e) { return { ok: true }; }
      }
    };
  })();
}
