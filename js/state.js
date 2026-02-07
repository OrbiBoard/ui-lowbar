export const state = {
  gEventChannel: null,
  gCallerPluginId: null,
  gInitialFull: false,
  gInitialMax: false,
  gFloatingBoundsPreset: null,
  gFloatJustOpenedAt: 0,
  gFloatSizePercent: 60,
  gFloatWidthPx: null,
  gFloatHeightPx: null,
  gFloatMaximize: false,
  pinned: false,
  isFull: false,
  isMax: false,
  isCollapsed: false,
  // Helper to access DOM elements that might be created later or are static
  dom: {
    bgView: null,
    floatWin: null,
    floatView: null,
    floatMask: null
  }
};
