import { create } from 'zustand';

export const useObsStore = create((set, get) => ({
  // Connection state
  connectionStatus: 'disconnected', // 'connected' | 'connecting' | 'disconnected' | 'error'
  obsAddress: 'localhost:4444',
  obsPassword: '',
  connectionError: null,
  
  // Scene state
  currentProgramScene: '',
  currentPreviewScene: '',
  availableScenes: [],
  
  // Source visibility state (per scene)
  sources: {}, // { sceneName: [{ name, visible }] }
  
  // Settings persistence
  settingsLoaded: false,
  
  // Actions
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setConnectionError: (err) => set({ connectionError: err }),
  setProgramScene: (scene) => set({ currentProgramScene: scene }),
  setPreviewScene: (scene) => set({ currentPreviewScene: scene }),
  setAvailableScenes: (scenes) => set({ availableScenes: scenes }),
  setSources: (sceneName, sources) => set((state) => ({
    sources: { ...state.sources, [sceneName]: sources }
  })),
  toggleSourceVisible: (sceneName, sourceName) => set((state) => {
    const sceneSources = state.sources[sceneName] || [];
    return {
      sources: {
        ...state.sources,
        [sceneName]: sceneSources.map(s =>
          s.name === sourceName ? { ...s, visible: !s.visible } : s
        )
      }
    };
  }),
  setObsConfig: (address, password) => set({ obsAddress: address, obsPassword: password }),
  
  // Persist settings to localStorage
  saveSettings: () => {
    const { obsAddress, obsPassword } = get();
    localStorage.setItem('obs_config', JSON.stringify({ obsAddress, obsPassword }));
  },
  loadSettings: () => {
    try {
      const saved = JSON.parse(localStorage.getItem('obs_config') || '{}');
      set({
        obsAddress: saved.obsAddress || 'localhost:4444',
        obsPassword: saved.obsPassword || '',
        settingsLoaded: true,
      });
    } catch {
      set({ settingsLoaded: true });
    }
  },
}));
