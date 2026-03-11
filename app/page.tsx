'use client'

import { Music } from 'lucide-react'
import MusicPlayer from '@/components/MusicPlayer'

export default function Dashboard() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-950 font-sans text-slate-50 md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="z-20 hidden w-64 flex-col border-r border-slate-800 bg-slate-900/50 md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-black tracking-tight text-red-500 uppercase italic">
            Buzz Bingo
            <span className="mt-1 block text-sm font-bold text-sky-400 not-italic">
              Cricklewood
            </span>
          </h1>
        </div>
        <nav className="flex-1 space-y-2 px-4">
          <button className="flex w-full items-center space-x-3 rounded-xl bg-sky-500/10 px-4 py-3 font-bold text-sky-400 transition-all">
            <Music className="h-5 w-5" />
            <span>Audio Player</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="relative flex-1 overflow-hidden pb-[72px] md:pb-0">
        <div className="custom-scrollbar absolute inset-0 overflow-y-auto">
          <MusicPlayer />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="pb-safe fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around border-t border-slate-800 bg-slate-900/95 p-2 backdrop-blur-md md:hidden">
        <button className="flex w-20 flex-col items-center rounded-xl bg-sky-500/10 p-2 font-bold text-sky-400 transition-all">
          <Music className="mb-1 h-6 w-6" />
          <span className="text-[10px]">Music</span>
        </button>
      </nav>
    </div>
  )
}
