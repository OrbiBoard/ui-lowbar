const CSS_VARS = {
  dark: {
    '--bg': '#121621',
    '--fg': '#ededed',
    '--muted': '#94a3b8',
    '--panel': 'rgba(255, 255, 255, 0.04)',
    '--item-bg': 'rgba(255, 255, 255, 0.04)',
    '--border': 'rgba(255, 255, 255, 0.12)',
    '--bg-sidebar': 'transparent',
    '--bg-titlebar': '#121621',
    '--bg-modal': '#1b1f2a',
    '--fg-title': '#e5e7eb',
    '--btn-secondary-bg': 'rgba(255, 255, 255, 0.06)',
    '--input-bg': 'rgba(255, 255, 255, 0.1)',
    '--secondary-bg': 'rgba(34, 46, 63, 0.95)',
    '--slider-bg': 'rgba(255, 255, 255, 0.2)',
    '--hover': 'rgba(255, 255, 255, 0.08)'
  },
  light: {
    '--bg': '#f3f4f6',
    '--fg': '#1f2937',
    '--muted': '#6b7280',
    '--panel': '#ffffff',
    '--item-bg': '#f3f4f6',
    '--border': '#e5e7eb',
    '--bg-sidebar': 'transparent',
    '--bg-titlebar': '#ffffff',
    '--bg-modal': '#ffffff',
    '--fg-title': '#111827',
    '--btn-secondary-bg': 'rgba(0, 0, 0, 0.05)',
    '--input-bg': 'rgba(0, 0, 0, 0.05)',
    '--secondary-bg': 'rgba(245, 245, 245, 0.95)',
    '--slider-bg': 'rgba(0, 0, 0, 0.1)',
    '--hover': 'rgba(0, 0, 0, 0.05)'
  }
};

function adjustBrightness(hex, percent) {
  if (!hex || typeof hex !== 'string') return '#238f4a';
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return hex;
  const num = parseInt(cleanHex, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 35, g: 143, b: 74 };
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return { r: 35, g: 143, b: 74 };
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16)
  };
}

function getSystemDarkMode() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    return false;
  }
}

function getEffectiveMode(mode) {
  if (mode === 'system') {
    return getSystemDarkMode() ? 'dark' : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

function applyTheme(mode, color) {
  const root = document.documentElement;
  const effectiveMode = getEffectiveMode(mode);
  const accent = color || '#238f4a';
  const { r, g, b } = hexToRgb(accent);
  
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--theme-color', accent);
  root.style.setProperty('--accent-color', accent);
  
  const vars = CSS_VARS[effectiveMode] || CSS_VARS.dark;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  const activeColor = effectiveMode === 'dark' 
    ? `rgba(${r}, ${g}, ${b}, 0.25)`
    : `rgba(${r}, ${g}, ${b}, 0.1)`;
  root.style.setProperty('--active', activeColor);
  
  const gradientAccent = effectiveMode === 'dark' 
    ? adjustBrightness(accent, -40)
    : adjustBrightness(accent, 60);
  root.style.setProperty('--bg-gradient-start', gradientAccent);
  
  document.body.dataset.themeMode = mode;
  
  if (effectiveMode === 'dark') {
    root.classList.remove('theme-light');
    root.classList.add('theme-dark');
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
  } else {
    root.classList.remove('theme-dark');
    root.classList.add('theme-light');
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
  }
}

export function initTheme() {
  function checkSystemTheme() {
    try {
      if (window.matchMedia) {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const currentMode = document.body.dataset.themeMode || 'system';
        if (currentMode === 'system') {
          if (isDark) {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
          } else {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
          }
        }
      }
    } catch (e) { console.error('Theme check failed:', e); }
  }

  return new Promise((resolve) => {
    try {
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => {
          const currentMode = document.body.dataset.themeMode || 'system';
          if (currentMode === 'system') {
            checkSystemTheme();
          }
        };
        if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', listener);
        else if (mediaQuery.addListener) mediaQuery.addListener(listener);
      }
    } catch(e) {}
    
    checkSystemTheme();

    const doInit = async () => {
      try {
        if (window.lowbarAPI?.getTheme) {
          const theme = await window.lowbarAPI.getTheme();
          if (theme.ok) {
            applyTheme(theme.mode, theme.color);
          }
        } else if (window.lowbarAPI?.configGetAll) {
          const config = await window.lowbarAPI.configGetAll('system');
          if (config && Object.keys(config).length > 0) {
            applyTheme(config.themeMode, config.themeColor);
          }
        }
      } catch (e) { 
        console.error('Failed to get theme config', e); 
        applyTheme('system', '#238f4a');
      }
      resolve();
    };
    
    doInit();

    if (window.lowbarAPI?.onThemeChanged) {
      window.lowbarAPI.onThemeChanged((theme) => {
        if (theme) {
          applyTheme(theme.mode, theme.color);
        }
      });
    } else if (window.lowbarAPI?.onConfigChanged) {
      window.lowbarAPI.onConfigChanged((payload) => {
        if (payload && payload.scope === 'system') {
          if (payload.key === 'themeMode' || payload.key === 'themeColor') {
            doInit();
          }
        }
      });
    } else {
      resolve();
    }
  });
}
