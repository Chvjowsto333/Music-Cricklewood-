import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const NUM_BARS = 64

export default function StageVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const [bars, setBars] = useState<number[]>(Array(NUM_BARS).fill(10))

  useEffect(() => {
    if (!isPlaying) {
      const timeout = setTimeout(() => setBars(Array(NUM_BARS).fill(5)), 0)
      return () => clearTimeout(timeout)
    }

    const interval = setInterval(() => {
      setBars(
        Array(NUM_BARS)
          .fill(0)
          .map(() => Math.random() * 80 + 20),
      )
    }, 150)

    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <div className="relative aspect-[21/9] min-h-[200px] w-full overflow-hidden bg-[#050505]">
      {/* Background Concentric Circles */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-80">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-red-600/40"
            style={{
              width: `${(i + 1) * 15}%`,
              height: `${(i + 1) * 30}%`,
              boxShadow:
                '0 0 20px rgba(220, 38, 38, 0.2), inset 0 0 20px rgba(220, 38, 38, 0.2)',
            }}
          />
        ))}
        {/* Starry dots */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            opacity: 0.15,
          }}
        />
      </div>

      {/* Top Banner */}
      <div className="absolute top-0 right-0 left-0 z-10 flex h-[25%] flex-col justify-end overflow-hidden border-b border-red-500/30 bg-black/80">
        {/* Top Banner Background (Red/Blue circles) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-60">
          <div className="h-32 w-32 rounded-full border-4 border-blue-500 shadow-[0_0_30px_blue]" />
          <div className="absolute left-1/4 h-40 w-40 rounded-full border-4 border-red-500 shadow-[0_0_30px_red]" />
          <div className="absolute right-1/4 h-40 w-40 rounded-full border-4 border-red-500 shadow-[0_0_30px_red]" />
        </div>

        {/* Top Banner EQ */}
        <div className="relative flex h-full w-full items-end justify-between gap-[1px] px-1 pb-0.5 md:gap-[2px]">
          {bars.map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-sm bg-gradient-to-t from-yellow-500 to-orange-300"
              animate={{ height: `${height}%` }}
              transition={{ type: 'tween', duration: 0.15 }}
              style={{ minHeight: '5%' }}
            />
          ))}
        </div>
      </div>

      {/* Left Speaker Stack */}
      <div className="absolute bottom-[5%] left-[2%] z-20 flex h-[60%] w-[12%] flex-col gap-1 md:gap-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="relative flex flex-1 items-center justify-center overflow-hidden rounded-md border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-xl"
            animate={isPlaying ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ repeat: Infinity, duration: 0.25, delay: i * 0.05 }}
          >
            {/* Speaker Cone */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-950 shadow-inner md:h-16 md:w-16 md:border-4">
              <div className="h-3 w-3 rounded-full bg-zinc-800 md:h-6 md:w-6" />
            </div>
            {/* Speaker Grill Texture */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, black 1px, transparent 1px)',
                backgroundSize: '4px 4px',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Right Speaker Stack */}
      <div className="absolute right-[2%] bottom-[5%] z-20 flex h-[60%] w-[12%] flex-col gap-1 md:gap-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="relative flex flex-1 items-center justify-center overflow-hidden rounded-md border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-xl"
            animate={isPlaying ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ repeat: Infinity, duration: 0.25, delay: i * 0.05 }}
          >
            {/* Speaker Cone */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-950 shadow-inner md:h-16 md:w-16 md:border-4">
              <div className="h-3 w-3 rounded-full bg-zinc-800 md:h-6 md:w-6" />
            </div>
            {/* Speaker Grill Texture */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, black 1px, transparent 1px)',
                backgroundSize: '4px 4px',
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Left Banner */}
      <div className="absolute bottom-[10%] left-[18%] z-10 flex h-[55%] w-[12%] flex-col items-center justify-between overflow-hidden border border-blue-800/50 bg-blue-950 shadow-[0_0_30px_rgba(30,58,138,0.5)]">
        {/* Top EQ */}
        <div className="flex h-1/4 w-full rotate-180 items-start justify-between gap-[1px] opacity-80">
          {bars.slice(0, 12).map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-yellow-500"
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
        {/* Text */}
        <div className="scale-50 -rotate-6 transform text-center md:scale-100">
          <h3 className="text-sm leading-none font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] md:text-xl">
            COLOSSUS
          </h3>
          <h3 className="text-base leading-none font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] md:text-2xl">
            NIGHT
          </h3>
        </div>
        {/* Bottom EQ */}
        <div className="flex h-1/4 w-full items-end justify-between gap-[1px] opacity-80">
          {bars.slice(12, 24).map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-yellow-500"
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>

      {/* Right Banner */}
      <div className="absolute right-[18%] bottom-[10%] z-10 flex h-[55%] w-[12%] flex-col items-center justify-between overflow-hidden border border-blue-800/50 bg-blue-950 shadow-[0_0_30px_rgba(30,58,138,0.5)]">
        {/* Top EQ */}
        <div className="flex h-1/4 w-full rotate-180 items-start justify-between gap-[1px] opacity-80">
          {bars.slice(24, 36).map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-yellow-500"
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
        {/* Text */}
        <div className="scale-50 -rotate-6 transform text-center md:scale-100">
          <h3 className="text-sm leading-none font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] md:text-xl">
            COLOSSUS
          </h3>
          <h3 className="text-base leading-none font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] md:text-2xl">
            NIGHT
          </h3>
        </div>
        {/* Bottom EQ */}
        <div className="flex h-1/4 w-full items-end justify-between gap-[1px] opacity-80">
          {bars.slice(36, 48).map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-yellow-500"
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>

      {/* DJ Booth */}
      <div className="absolute bottom-0 left-1/2 z-30 flex h-[35%] w-[25%] -translate-x-1/2 flex-col items-center justify-end">
        {/* DJ Silhouette */}
        <motion.div
          className="relative z-0 -mb-2 h-12 w-12 rounded-t-full bg-zinc-800 md:-mb-4 md:h-24 md:w-24"
          animate={isPlaying ? { y: [0, -5, 0], rotate: [0, -2, 2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          {/* Head */}
          <div className="absolute -top-6 left-1/2 h-8 w-6 -translate-x-1/2 rounded-full bg-zinc-800 md:-top-10 md:h-14 md:w-12" />
          {/* Headphones */}
          <div className="absolute -top-6 left-1/2 h-8 w-8 -translate-x-1/2 rounded-t-full border-x-2 border-t-2 border-zinc-950 md:-top-10 md:h-14 md:w-14 md:border-x-4 md:border-t-4" />
        </motion.div>

        {/* Booth Front */}
        <div className="relative z-10 flex h-[80%] w-full flex-col justify-between overflow-hidden rounded-t-xl border-x-2 border-t-2 border-zinc-800 bg-black shadow-[0_-10px_30px_rgba(0,0,0,0.8)] md:border-x-4 md:border-t-4">
          {/* Neon Circles */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="h-[150%] w-[150%] translate-y-1/4 rounded-full border-2 border-red-600 shadow-[0_0_20px_red,inset_0_0_20px_red] md:border-4" />
            <div className="absolute h-[100%] w-[100%] translate-y-1/4 rounded-full border-2 border-blue-600 shadow-[0_0_20px_blue,inset_0_0_20px_blue] md:border-4" />
            <div className="absolute h-[50%] w-[50%] translate-y-1/4 rounded-full border-2 border-red-600 shadow-[0_0_20px_red,inset_0_0_20px_red] md:border-4" />
          </div>

          {/* DJ Decks */}
          <div className="relative z-10 flex h-2 w-full items-center justify-around border-b border-zinc-900 bg-zinc-700 px-2 md:h-4 md:px-4">
            <div className="h-0.5 w-4 rounded-full bg-zinc-900 md:h-1 md:w-8" />
            <div className="h-0.5 w-4 rounded-full bg-zinc-900 md:h-1 md:w-8" />
          </div>

          {/* Booth EQ */}
          <div className="relative z-10 flex h-1/3 w-full items-end justify-between gap-[1px] bg-black/50 px-1 pb-0.5 md:gap-[2px] md:px-2 md:pb-1">
            {bars.slice(48, 64).map((height, i) => (
              <motion.div
                key={i}
                className="flex-1 bg-gradient-to-t from-yellow-500 to-orange-400"
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.15 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
