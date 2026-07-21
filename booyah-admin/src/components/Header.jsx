import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Header({ user }) {
  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Logged out');
  };

  return (
    <div className="h-16 bg-[#0a0e1a] border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#7C3AED]" />
        <span className="font-orbitron text-[10px] text-gray-400 tracking-wider">ADMIN CONTROL CENTER</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-orbitron text-[10px] text-white">{user?.email}</p>
          <p className="font-orbitron text-[8px] text-[#7C3AED]">SUPER ADMIN</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-orbitron"
        >
          <LogOut className="w-3 h-3" /> LOGOUT
        </button>
      </div>
    </div>
  );
}
