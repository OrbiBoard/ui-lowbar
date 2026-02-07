export function initTheme() {
  function checkSystemTheme() {
    try {
      if (window.matchMedia) {
        const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        const currentMode = document.body.dataset.themeMode || 'system';
        if (currentMode === 'system') {
            if (isLight) document.body.classList.add('theme-light');
            else document.body.classList.remove('theme-light');
        }
      }
    } catch (e) { console.error('Theme check failed:', e); }
  }

  function applyAppTheme(config) {
      if (!config) return;
      const mode = config.mode || 'system';
      const themeColor = config.themeColor;

      document.body.dataset.themeMode = mode;

      if (mode === 'light') {
          document.body.classList.add('theme-light');
      } else if (mode === 'dark') {
          document.body.classList.remove('theme-light');
      } else {
          checkSystemTheme();
      }

      if (themeColor) {
          document.documentElement.style.setProperty('--theme-color', themeColor);
          document.documentElement.style.setProperty('--accent-color', themeColor);
      }
  }

  return new Promise((resolve) => {
      // Setup listeners
      try {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
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

      const doCheck = async () => {
         if (window.lowbarAPI) {
             try {
                 let config = await window.lowbarAPI.configGetAll('system');
                 if (config && Object.keys(config).length > 0) {
                    console.log('[UI-LOWBAR] Theme config loaded:', config);
                    // Map system config to theme format
                    const themeConfig = {
                        mode: config.themeMode,
                        themeColor: config.themeColor
                    };
                    applyAppTheme(themeConfig);
                 }
             } catch (e) { console.error('Failed to get appearance config', e); }
         }
         resolve();
      };
      
      doCheck();

      if (window.lowbarAPI && window.lowbarAPI.onConfigChanged) {
          window.lowbarAPI.onConfigChanged((payload) => {
              console.log('[UI-LOWBAR] Config changed:', payload);
              if (payload && payload.scope === 'system') {
                  doCheck();
              }
          });
      } else {
          // Resolve anyway if no API (polyfill might not have onConfigChanged)
          resolve();
      }
  });
}
