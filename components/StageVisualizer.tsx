import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const NUM_BARS = 64;

export default function StageVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const [bars, setBars] = useState<number[]>(Array(NUM_BARS).fill(10));

  useEffect(() => {
    if (!isPlaying) {
      const timeout = setTimeout(() => setBars(Array(NUM_BARS).fill(5)), 0);
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      setBars(Array(NUM_BARS).fill(0).map(() => Math.random() * 80 + 20));
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full aspect-[21/9] min-h-[200px] bg-[#050505] overflow-hidden">
      {/* Background Concentric Circles */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-80">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-red-600/40"
            style={{
              width: `${(i + 1) * 15}%`,
              height: `${(i + 1) * 30}%`,
              boxShadow: '0 0 20px rgba(220, 38, 38, 0.2), inset 0 0 20px rgba(220, 38, 38, 0.2)',
            }}
          />
        ))}
        {/* Starry dots */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
            backgroundSize: '30px 30px', 
            opacity: 0.15 
          }} 
        />
      </div>

      {/* Top Banner */}
      <div className="absolute top-0 left-0 right-0 h-[25%] bg-black/80 border-b border-red-500/30 flex flex-col justify-end overflow-hidden z-10">
        {/* Top Banner Background (Red/Blue circles) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-60">
           <div className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-[0_0_30px_blue]" />
           <div className="absolute left-1/4 w-40 h-40 rounded-full border-4 border-red-500 shadow-[0_0_30px_red]" />
           <div className="absolute right-1/4 w-40 h-40 rounded-full border-4 border-red-500 shadow-[0_0_30px_red]" />
        </div>
        
        {/* Top Banner EQ */}
        <div className="relative w-full h-full flex items-end justify-between px-1 pb-0.5 gap-[1px] md:gap-[2px]">
          {bars.map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-gradient-to-t from-yellow-500 to-orange-300 rounded-t-sm"
              animate={{ height: `${height}%` }}
              transition={{ type: 'tween', duration: 0.15 }}
              style={{ minHeight: '5%' }}
            />
          ))}
        </div>
      </div>

      {/* Left Speaker Stack */}
      <div className="absolute left-[2%] bottom-[5%] w-[12%] h-[60%] flex flex-col gap-1 md:gap-2 z-20">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-md border border-zinc-600 flex items-center justify-center shadow-xl relative overflow-hidden"
            animate={isPlaying ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ repeat: Infinity, duration: 0.25, delay: i * 0.05 }}
          >
            {/* Speaker Cone */}
            <div className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-zinc-950 border-2 md:border-4 border-zinc-800 flex items-center justify-center shadow-inner">
              <div className="w-3 h-3 md:w-6 md:h-6 rounded-full bg-zinc-800" />
            </div>
            {/* Speaker Grill Texture */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
          </motion.div>
        ))}
      </div>

      {/* Right Speaker Stack */}
      <div className="absolute right-[2%] bottom-[5%] w-[12%] h-[60%] flex flex-col gap-1 md:gap-2 z-20">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-md border border-zinc-600 flex items-center justify-center shadow-xl relative overflow-hidden"
            animate={isPlaying ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ repeat: Infinity, duration: 0.25, delay: i * 0.05 }}
          >
            {/* Speaker Cone */}
            <div className="w-8 h-8 md:w-16 md:h-16 rounded-full bg-zinc-950 border-2 md:border-4 border-zinc-800 flex items-center justify-center shadow-inner">
              <div className="w-3 h-3 md:w-6 md:h-6 rounded-full bg-zinc-800" />
            </div>
            {/* Speaker Grill Texture */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
          </motion.div>
        ))}
      </div>

      {/* Left Banner */}
      <div className="absolute left-[18%] bottom-[10%] w-[12%] h-[55%] bg-blue-950 border border-blue-800/50 flex flex-col items-center justify-between overflow-hidden z-10 shadow-[0_0_30px_rgba(30,58,138,0.5)]">
        {/* Top EQ */}
        <div className="w-full h-1/4 flex items-start justify-between gap-[1px] opacity-80 rotate-180">
           {bars.slice(0, 12).map((height, i) => (
            <motion.div key={i} className="flex-1 bg-yellow-500" animate={{ height: `${height}%` }} transition={{ duration: 0.15 }} />
          ))}
        </div>
        {/* Text */}
        <div className="text-center transform -rotate-6 scale-50 md:scale-100">
          <h3 className="text-yellow-400 font-black text-sm md:text-xl leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">COLOSSUS</h3>
          <h3 className="text-white font-black text-base md:text-2xl leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">NIGHT</h3>
        </div>
        {/* Bottom EQ */}
        <div className="w-full h-1/4 flex items-end justify-between gap-[1px] opacity-80">
           {bars.slice(12, 24).map((height, i) => (
            <motion.div key={i} className="flex-1 bg-yellow-500" animate={{ height: `${height}%` }} transition={{ duration: 0.15 }} />
          ))}
        </div>
      </div>

      {/* Right Banner */}
      <div className="absolute right-[18%] bottom-[10%] w-[12%] h-[55%] bg-blue-950 border border-blue-800/50 flex flex-col items-center justify-between overflow-hidden z-10 shadow-[0_0_30px_rgba(30,58,138,0.5)]">
        {/* Top EQ */}
        <div className="w-full h-1/4 flex items-start justify-between gap-[1px] opacity-80 rotate-180">
           {bars.slice(24, 36).map((height, i) => (
            <motion.div key={i} className="flex-1 bg-yellow-500" animate={{ height: `${height}%` }} transition={{ duration: 0.15 }} />
          ))}
        </div>
        {/* Text */}
        <div className="text-center transform -rotate-6 scale-50 md:scale-100">
          <h3 className="text-yellow-400 font-black text-sm md:text-xl leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">COLOSSUS</h3>
          <h3 className="text-white font-black text-base md:text-2xl leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">NIGHT</h3>
        </div>
        {/* Bottom EQ */}
        <div className="w-full h-1/4 flex items-end justify-between gap-[1px] opacity-80">
           {bars.slice(36, 48).map((height, i) => (
            <motion.div key={i} className="flex-1 bg-yellow-500" animate={{ height: `${height}%` }} transition={{ duration: 0.15 }} />
          ))}
        </div>
      </div>

      {/* DJ Booth */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[25%] h-[35%] z-30 flex flex-col items-center justify-end">
        {/* DJ Silhouette */}
        <motion.div 
          className="w-12 h-12 md:w-24 md:h-24 bg-zinc-800 rounded-t-full relative -mb-2 md:-mb-4 z-0"
          animate={isPlaying ? { y: [0, -5, 0], rotate: [0, -2, 2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          {/* Head */}
          <div className="absolute -top-6 md:-top-10 left-1/2 -translate-x-1/2 w-6 h-8 md:w-12 md:h-14 bg-zinc-800 rounded-full" />
          {/* Headphones */}
          <div className="absolute -top-6 md:-top-10 left-1/2 -translate-x-1/2 w-8 h-8 md:w-14 md:h-14 border-t-2 md:border-t-4 border-x-2 md:border-x-4 border-zinc-950 rounded-t-full" />
        </motion.div>
        
        {/* Booth Front */}
        <div className="w-full h-[80%] bg-black border-t-2 md:border-t-4 border-x-2 md:border-x-4 border-zinc-800 rounded-t-xl relative overflow-hidden flex flex-col justify-between z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
           {/* Neon Circles */}
           <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
             <div className="w-[150%] h-[150%] rounded-full border-2 md:border-4 border-red-600 shadow-[0_0_20px_red,inset_0_0_20px_red] translate-y-1/4" />
             <div className="absolute w-[100%] h-[100%] rounded-full border-2 md:border-4 border-blue-600 shadow-[0_0_20px_blue,inset_0_0_20px_blue] translate-y-1/4" />
             <div className="absolute w-[50%] h-[50%] rounded-full border-2 md:border-4 border-red-600 shadow-[0_0_20px_red,inset_0_0_20px_red] translate-y-1/4" />
           </div>
           
           {/* DJ Decks */}
           <div className="w-full h-2 md:h-4 bg-zinc-700 border-b border-zinc-900 flex justify-around items-center px-2 md:px-4 relative z-10">
             <div className="w-4 h-0.5 md:w-8 md:h-1 bg-zinc-900 rounded-full" />
             <div className="w-4 h-0.5 md:w-8 md:h-1 bg-zinc-900 rounded-full" />
           </div>

           {/* Booth EQ */}
           <div className="w-full h-1/3 flex items-end justify-between gap-[1px] md:gap-[2px] px-1 md:px-2 pb-0.5 md:pb-1 relative z-10 bg-black/50">
             {bars.slice(48, 64).map((height, i) => (
              <motion.div key={i} className="flex-1 bg-gradient-to-t from-yellow-500 to-orange-400" animate={{ height: `${height}%` }} transition={{ duration: 0.15 }} />
            ))}
           </div>
        </div>
      </div>
    </div>
  );
}