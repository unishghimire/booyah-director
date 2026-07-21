import { create } from 'zustand';

export const useObsStore = create((set, get) => ({
  connectionStatus: 'disconnected', // 'connected' | 'connecting' | 'disconnected' | 'error'
  obsAddress: 'localhost:4455',
  obsPassword: '',
  
  setObsConfig: (address, password) => {
    set({ obsAddress: address, obsPassword: password });
  },
  
  saveSettings: () => {
    const { obsAddress, obsPassword } = get();
    localStorage.setItem('obs_address', obsAddress);
    localStorage.setItem('obs_password', obsPassword);
  },
  
  loadSettings: () => {
    const address = localStorage.getItem('obs_address') || 'localhost:4455';
    const password = localStorage.getItem('obs_password') || '';
    set({ obsAddress: address, obsPassword: password });
  }
}));
