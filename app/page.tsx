'use client';

import { Music } from 'lucide-react';
import MusicPlayer from '@/components/MusicPlayer';

export default function Dashboard() {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-950 text-slate-50 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-800 bg-slate-900/50 flex-col z-20">
        <div className="p-6">
          <h1 className="text-2xl font-black tracking-tight text-red-500 uppercase italic">
            Buzz Bingo
            <span className="block text-sm font-bold text-sky-400 not-italic mt-1">Cricklewood</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all bg-sky-500/10 text-sky-400 font-bold"
          >
            <Music className="w-5 h-5" />
            <span>Audio Player</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden pb-[72px] md:pb-0">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          <MusicPlayer />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-around items-center p-2 z-50 pb-safe">
        <button
          className="flex flex-col items-center p-2 w-20 rounded-xl transition-all text-sky-400 bg-sky-500/10 font-bold"
        >
          <Music className="w-6 h-6 mb-1" />
          <span className="text-[10px]">Music</span>
        </button>
      </nav>
    </div>
  );
}
