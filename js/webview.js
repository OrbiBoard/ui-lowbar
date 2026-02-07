import { mapLevel, joinArgs } from './utils.js';

export function setupWebview(wv, tag) {
  if (!wv) return;
  
  // Console attachment
  try {
    wv.addEventListener('console-message', (e) => {
      const level = mapLevel(e.level);
      const fn = console[level] || console.log;
      fn('[' + tag + ']', e.message);
    });
  } catch (e) {}
  try {
    wv.addEventListener('ipc-message', (e) => {
      if (e && e.channel === 'webview-console') {
        const p = e.args && e.args[0];
        const level = mapLevel(p && p.level);
        const fn = console[level] || console.log;
        fn('[' + tag + ']', joinArgs(p && p.args));
      }
    });
  } catch (e) {}

  // Fullsize enforcement
  const forceIframeFullSize = () => {
    try {
      const sr = wv.shadowRoot;
      const inner = sr && sr.querySelector('iframe');
      if (inner) {
        inner.style.height = '100%'; inner.style.width = '100%'; inner.style.flex = '1 1 auto'; inner.style.border = '0';
        const s = sr.querySelector('style');
        if (s && !/display:\s*flex/.test(s.textContent)) {
          s.textContent = (s.textContent || '') + '\n:host { display: flex; }';
        }
      }
    } catch (e) {}
  };
  forceIframeFullSize();
  wv.addEventListener('dom-ready', forceIframeFullSize);
  wv.addEventListener('did-finish-load', forceIframeFullSize);
  wv.addEventListener('did-navigate', forceIframeFullSize);
  wv.addEventListener('did-navigate-in-page', forceIframeFullSize);
  try { const mo = new MutationObserver(forceIframeFullSize); mo.observe(wv, { childList: true, subtree: true }); } catch (e) {}

  // Insert CSS
  const iframeCSS = `
    html, body { height: 100% !important; }
    iframe { width: 100% !important; height: 100% !important; border: 0 !important; display: block !important; }
  `;
  const inject = () => { try { wv.insertCSS(iframeCSS); } catch (e) {} };
  wv.addEventListener('dom-ready', inject);
}
