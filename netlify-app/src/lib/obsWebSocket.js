import OBSWebSocket from 'obs-websocket-js';
import { useObsStore } from './obsStore';

class ObsService {
  constructor() {
    this.obs = new OBSWebSocket();
    this.setupListeners();
  }

  setupListeners() {
    this.obs.on('ConnectionOpened', () => {
      useObsStore.setState({ connectionStatus: 'connected' });
    });

    this.obs.on('ConnectionClosed', () => {
      useObsStore.setState({ connectionStatus: 'disconnected' });
    });

    this.obs.on('ConnectionError', (error) => {
      console.error('OBS WebSocket connection error:', error);
      useObsStore.setState({ connectionStatus: 'error' });
    });
  }

  async connect(address, password) {
    useObsStore.setState({ connectionStatus: 'connecting' });
    try {
      let url = address;
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        url = `ws://${url}`;
      }
      await this.obs.connect(url, password);
      useObsStore.setState({ connectionStatus: 'connected' });
    } catch (err) {
      console.error('OBS Connection failed:', err);
      useObsStore.setState({ connectionStatus: 'error' });
      throw err;
    }
  }

  async disconnect() {
    try {
      await this.obs.disconnect();
      useObsStore.setState({ connectionStatus: 'disconnected' });
    } catch (err) {
      console.error('OBS Disconnect failed:', err);
    }
  }
}

export const obsService = new ObsService();
