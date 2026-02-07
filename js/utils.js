export const $ = (sel) => document.querySelector(sel);

export function removeLoadingLayer() {
  const loader = document.getElementById('loading-layer');
  if (loader && loader.style.display !== 'none') {
    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }, 500);
  }
}

export function mapLevel(lvl) {
  if (typeof lvl === 'number') { if (lvl >= 2) return 'error'; if (lvl === 1) return 'warn'; return 'log'; }
  if (lvl === 'error' || lvl === 'warn' || lvl === 'info' || lvl === 'debug') return lvl;
  return 'log';
}

export function joinArgs(args) {
  try {
    return (Array.isArray(args) ? args : [args]).map((a) => {
      if (a == null) return 'null';
      if (typeof a === 'string') return a;
      if (typeof a === 'object') { if (a.stack) return String(a.stack); try { return JSON.stringify(a); } catch (e) { return String(a); } }
      return String(a);
    }).join(' ');
  } catch (e) { return String(args); }
}
