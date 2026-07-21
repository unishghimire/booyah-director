import OBSWebSocket from 'obs-websocket-js';
import { useObsStore } from './obsStore.js';

class ObsService {
  constructor() {
    this.obs = new OBSWebSocket();
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.manualDisconnect = false;
    this.isConnected = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Connection events
    this.obs.on('ConnectionOpened', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.obs.on('ConnectionClosed', (error) => {
      const previouslyConnected = this.isConnected;
      this.isConnected = false;

      const store = useObsStore.getState();

      if (this.manualDisconnect) {
        store.setConnectionStatus('disconnected');
        return;
      }

      // If we were previously connected, trigger reconnect
      if (previouslyConnected) {
        store.setConnectionStatus('error');
        store.setConnectionError(error?.message || 'Connection closed unexpectedly');
        this.attemptReconnect();
      }
    });

    this.obs.on('ConnectionError', (error) => {
      const store = useObsStore.getState();
      store.setConnectionStatus('error');
      store.setConnectionError(error?.message || 'Connection error occurred');
    });

    // OBS events
    this.obs.on('CurrentProgramSceneChanged', (data) => {
      const store = useObsStore.getState();
      store.setProgramScene(data.sceneName);
    });

    this.obs.on('CurrentPreviewSceneChanged', (data) => {
      const store = useObsStore.getState();
      store.setPreviewScene(data.sceneName);
    });

    this.obs.on('SceneItemEnableStateChanged', (data) => {
      const { sceneName, sceneItemId, sceneItemEnabled } = data;
      const store = useObsStore.getState();
      const sceneSources = store.sources[sceneName] || [];
      const updatedSources = sceneSources.map(s => {
        if (s.id === sceneItemId) {
          return { ...s, visible: sceneItemEnabled };
        }
        return s;
      });
      store.setSources(sceneName, updatedSources);
    });
  }

  async connect(address, password) {
    const store = useObsStore.getState();
    const addr = address || store.obsAddress;
    const pass = password !== undefined ? password : store.obsPassword;

    let url = addr;
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      url = `ws://${url}`;
    }

    store.setConnectionStatus('connecting');
    store.setConnectionError(null);
    store.setObsConfig(addr, pass);

    this.manualDisconnect = false;

    try {
      await this.obs.connect(url, pass);
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      store.setConnectionStatus('connected');
      store.saveSettings();

      await this.refreshScenes();
    } catch (error) {
      this.isConnected = false;
      store.setConnectionStatus('error');
      store.setConnectionError(error.message || String(error));
      throw error;
    }
  }

  async disconnect() {
    this.manualDisconnect = true;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    try {
      await this.obs.disconnect();
    } catch (error) {
      console.error('Error during disconnect:', error);
    }

    const store = useObsStore.getState();
    store.setConnectionStatus('disconnected');
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= 10) {
      const store = useObsStore.getState();
      store.setConnectionStatus('error');
      store.setConnectionError('Auto-reconnect failed after 10 attempts.');
      return;
    }

    if (this.reconnectTimeout) {
      return; // Already reconnecting
    }

    this.reconnectAttempts++;
    const store = useObsStore.getState();
    store.setConnectionStatus('connecting');
    store.setConnectionError(`Connection dropped. Reconnecting attempt ${this.reconnectAttempts}/10...`);

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      try {
        if (this.manualDisconnect) return;

        const { obsAddress, obsPassword } = store;
        let url = obsAddress;
        if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
          url = `ws://${url}`;
        }

        await this.obs.connect(url, obsPassword);

        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        store.setConnectionStatus('connected');
        store.setConnectionError(null);
        await this.refreshScenes();
      } catch (err) {
        console.error(`Reconnect attempt ${this.reconnectAttempts} failed:`, err);
        // If it failed and we didn't manually disconnect, try again
        if (!this.isConnected && !this.manualDisconnect) {
          this.attemptReconnect();
        }
      }
    }, 3000);
  }

  async takeScene(sceneName) {
    await this.obs.call('SetCurrentProgramScene', { sceneName });
  }

  async setPreviewScene(sceneName) {
    await this.obs.call('SetCurrentPreviewScene', { sceneName });
  }

  async toggleSourceVisibility(sceneName, sourceName) {
    const store = useObsStore.getState();
    const sceneSources = store.sources[sceneName] || [];
    let source = sceneSources.find(s => s.name === sourceName);

    if (!source || typeof source.id !== 'number') {
      try {
        const itemsResponse = await this.obs.call('GetSceneItemList', { sceneName });
        const mapped = itemsResponse.sceneItems.map(item => ({
          name: item.sourceName,
          visible: item.sceneItemEnabled,
          id: item.sceneItemId
        }));
        store.setSources(sceneName, mapped);
        source = mapped.find(s => s.name === sourceName);
      } catch (err) {
        console.error(`Failed to fetch scene items for scene ${sceneName}:`, err);
      }
    }

    if (source && typeof source.id === 'number') {
      await this.obs.call('SetSceneItemEnabled', {
        sceneName,
        sceneItemId: source.id,
        sceneItemEnabled: !source.visible
      });
    } else {
      throw new Error(`Source "${sourceName}" not found in scene "${sceneName}"`);
    }
  }

  async refreshScenes() {
    const store = useObsStore.getState();
    try {
      const sceneList = await this.obs.call('GetSceneList');
      
      const currentProgram = sceneList.currentProgramSceneName;
      const currentPreview = sceneList.currentPreviewSceneName;
      const scenes = sceneList.scenes || [];
      const sceneNames = scenes.map(s => s.sceneName);

      store.setProgramScene(currentProgram);
      store.setPreviewScene(currentPreview);
      store.setAvailableScenes(sceneNames);

      await Promise.all(scenes.map(async (scene) => {
        try {
          const itemsResponse = await this.obs.call('GetSceneItemList', { sceneName: scene.sceneName });
          const mapped = itemsResponse.sceneItems.map(item => ({
            name: item.sourceName,
            visible: item.sceneItemEnabled,
            id: item.sceneItemId
          }));
          store.setSources(scene.sceneName, mapped);
        } catch (err) {
          console.error(`Failed to fetch scene items for scene ${scene.sceneName}:`, err);
        }
      }));
    } catch (error) {
      console.error('Failed to refresh scenes:', error);
      throw error;
    }
  }
}

export const obsService = new ObsService();
