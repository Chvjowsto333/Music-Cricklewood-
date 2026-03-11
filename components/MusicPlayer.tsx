'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Upload,
  Music as MusicIcon,
  ListMusic,
  Shuffle,
  Repeat,
  Repeat1,
  Plus,
  Trash2,
  Disc3,
  MoreVertical,
  PlayCircle,
  Info,
  Copyright,
  Mic2,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
} from 'lucide-react'
import { get, set } from 'idb-keyval'
import StageVisualizer from './StageVisualizer'

const DUMMY_LYRICS = [
  { time: 0, text: '♪ (Music playing) ♪' },
  { time: 5, text: 'Welcome to the Buzz Bingo Cricklewood track' },
  { time: 10, text: 'We got the lyrics flowing, no looking back' },
  { time: 15, text: 'All music and lyrics copyright by Kamil' },
  { time: 20, text: 'Keeping it real, you know the deal' },
  { time: 25, text: 'Drop the beat, let the rhythm take control' },
  { time: 30, text: 'This is the sound that moves your soul' },
  { time: 35, text: '♪ (Chorus) ♪' },
  { time: 40, text: "Yeah, we're playing it live" },
  { time: 45, text: 'Taking a dive into the vibe' },
  { time: 50, text: 'Transcription scrolling automatically' },
  { time: 55, text: 'Just like you wanted, practically' },
  { time: 60, text: '♪ (Instrumental break) ♪' },
  { time: 75, text: 'Back on the mic, finishing strong' },
  { time: 80, text: 'Thanks for listening to this demo song' },
  { time: 85, text: '♪ (Fading out) ♪' },
]

interface ActiveSong {
  id: string
  title: string
  artist: string
  url: string
}

interface Playlist {
  id: string
  name: string
  songIds: string[]
}

type RepeatMode = 'none' | 'all' | 'one'

type VoteType = 'up' | 'down'
type VoteReason = 'lyrics' | 'soundtrack' | 'both'

interface Vote {
  type: VoteType
  reason?: VoteReason
}

export default function MusicPlayer() {
  const [songs, setSongs] = useState<ActiveSong[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 'default', name: 'All Songs', songIds: [] },
  ])
  const [activePlaylistId, setActivePlaylistId] = useState<string>('default')

  const [queue, setQueue] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none')

  const [votes, setVotes] = useState<Record<string, Vote>>({})
  const [votingOn, setVotingOn] = useState<{
    id: string
    type: VoteType
  } | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lyricsContainerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const currentSongId = queue[currentIndex]
  const currentSong = songs.find((s) => s.id === currentSongId)

  const activeLyricIndex = DUMMY_LYRICS.reduce((acc, lyric, index) => {
    return progress >= lyric.time ? index : acc
  }, 0)

  useEffect(() => {
    const container = lyricsContainerRef.current
    if (container && isPlaying && currentSong) {
      const activeEl = container.children[activeLyricIndex] as HTMLElement
      if (activeEl) {
        container.scrollTo({
          top:
            activeEl.offsetTop -
            container.clientHeight / 2 +
            activeEl.clientHeight / 2,
          behavior: 'smooth',
        })
      }
    }
  }, [activeLyricIndex, isPlaying, currentSong])

  // Load from API and IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/songs')
        const fetchedSongs: ActiveSong[] = await response.json()

        const storedPlaylists = (await get<Playlist[]>('playlists')) || [
          { id: 'default', name: 'All Songs', songIds: [] },
        ]
        const storedVotes = (await get<Record<string, Vote>>('votes')) || {}

        // Ensure default playlist has all songs
        const allSongIds = fetchedSongs.map((s) => s.id)
        const updatedPlaylists = storedPlaylists.map((p) => {
          if (p.id === 'default') {
            return { ...p, songIds: allSongIds }
          }
          // Filter out deleted songs from other playlists
          return {
            ...p,
            songIds: p.songIds.filter((id) => allSongIds.includes(id)),
          }
        })

        setSongs(fetchedSongs)
        setPlaylists(updatedPlaylists)
        setVotes(storedVotes)

        if (updatedPlaylists[0].songIds.length > 0) {
          setQueue(updatedPlaylists[0].songIds)
          setCurrentIndex(0)
        }
      } catch (e) {
        console.error('Failed to load data', e)
      } finally {
        setIsLoaded(true)
      }
    }
    loadData()
  }, [])

  // Save to IndexedDB when data changes
  useEffect(() => {
    if (!isLoaded) return
    set('playlists', playlists).catch(console.error)
    set('votes', votes).catch(console.error)
  }, [playlists, votes, isLoaded])

  const handleVoteClick = (
    e: React.MouseEvent,
    songId: string,
    type: VoteType,
  ) => {
    e.stopPropagation()
    if (votes[songId]?.type === type && !votingOn) {
      // Toggle off if already voted and not currently selecting reason
      const newVotes = { ...votes }
      delete newVotes[songId]
      setVotes(newVotes)
      setVotingOn(null)
    } else {
      setVotingOn({ id: songId, type })
    }
  }

  const submitVoteReason = (
    e: React.MouseEvent,
    songId: string,
    type: VoteType,
    reason: VoteReason,
  ) => {
    e.stopPropagation()
    setVotes((prev) => ({
      ...prev,
      [songId]: { type, reason },
    }))
    setVotingOn(null)
  }

  // Audio playback control
  useEffect(() => {
    if (audioRef.current && queue.length > 0 && currentIndex >= 0) {
      if (isPlaying) {
        audioRef.current
          .play()
          .catch((e) => console.warn('Playback prevented:', e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentIndex, queue])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append('files', file)
    })

    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload songs')
      }

      const uploadedSongs: ActiveSong[] = await response.json()

      setSongs((prev) => {
        const existingIds = new Set(prev.map((s) => s.id))
        const newUniqueSongs = uploadedSongs.filter(
          (s) => !existingIds.has(s.id),
        )
        return [...prev, ...newUniqueSongs]
      })

      const newSongIds = uploadedSongs.map((s) => s.id)

      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id === 'default' || p.id === activePlaylistId) {
            const existingIds = new Set(p.songIds)
            const uniqueNewIds = newSongIds.filter((id) => !existingIds.has(id))
            return { ...p, songIds: [...p.songIds, ...uniqueNewIds] }
          }
          return p
        }),
      )

      if (queue.length === 0 && newSongIds.length > 0) {
        setQueue(newSongIds)
        setCurrentIndex(0)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload songs')
    } finally {
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const shuffleArray = (array: string[]) => {
    const newArr = [...array]
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
    }
    return newArr
  }

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle)
    if (!isShuffle) {
      // Turning ON
      if (currentIndex >= 0 && queue.length > 0) {
        const currentSongId = queue[currentIndex]
        const remaining = queue.filter((id) => id !== currentSongId)
        const newQueue = [currentSongId, ...shuffleArray(remaining)]
        setQueue(newQueue)
        setCurrentIndex(0)
      } else {
        setQueue(shuffleArray(queue))
      }
    } else {
      // Turning OFF
      const activePlaylist = playlists.find((p) => p.id === activePlaylistId)
      if (activePlaylist) {
        const originalQueue = activePlaylist.songIds
        const currentSongId = queue[currentIndex]
        const newIndex = originalQueue.indexOf(currentSongId)
        setQueue(originalQueue)
        setCurrentIndex(newIndex >= 0 ? newIndex : 0)
      }
    }
  }

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'none') return 'all'
      if (prev === 'all') return 'one'
      return 'none'
    })
  }

  const playNext = useCallback(() => {
    if (queue.length === 0) return
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsPlaying(true)
    } else if (repeatMode === 'all') {
      setCurrentIndex(0)
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
      setCurrentIndex(0)
      if (audioRef.current) audioRef.current.currentTime = 0
    }
  }, [currentIndex, queue.length, repeatMode])

  const playPrev = () => {
    if (queue.length === 0) return
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
    } else {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      } else if (repeatMode === 'all') {
        setCurrentIndex(queue.length - 1)
      } else {
        setCurrentIndex(0)
      }
      setIsPlaying(true)
    }
  }

  const handleSongEnd = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(console.warn)
      }
    } else {
      playNext()
    }
  }

  const handleShare = async (e: React.MouseEvent, song: ActiveSong) => {
    e.stopPropagation()
    try {
      if (navigator.share) {
        await navigator.share({
          title: song.title,
          text: `Check out ${song.title} by ${song.artist}!`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(
          `Check out ${song.title} by ${song.artist}!`,
        )
        alert('Copied to clipboard!')
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  const handleDownload = (e: React.MouseEvent, song: ActiveSong) => {
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = song.url
    a.download = `${song.title} - ${song.artist}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime)
      setDuration(audioRef.current.duration || 0)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const createNewPlaylist = () => {
    const name = prompt('Enter playlist name:')
    if (name && name.trim()) {
      const newPlaylist: Playlist = {
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        songIds: [],
      }
      setPlaylists((prev) => [...prev, newPlaylist])
      setActivePlaylistId(newPlaylist.id)
    }
  }

  const deletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (id === 'default') return
    if (confirm('Are you sure you want to delete this playlist?')) {
      setPlaylists((prev) => prev.filter((p) => p.id !== id))
      if (activePlaylistId === id) {
        setActivePlaylistId('default')
      }
    }
  }

  const removeSong = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (activePlaylistId === 'default') {
      if (!confirm('Are you sure you want to delete this song completely?'))
        return

      try {
        await fetch(`/api/songs?id=${encodeURIComponent(songId)}`, {
          method: 'DELETE',
        })

        // Remove completely
        setSongs((prev) => prev.filter((s) => s.id !== songId))
        setPlaylists((prev) =>
          prev.map((p) => ({
            ...p,
            songIds: p.songIds.filter((id) => id !== songId),
          })),
        )
        setQueue((prev) => prev.filter((id) => id !== songId))
        if (queue[currentIndex] === songId) {
          setIsPlaying(false)
          setCurrentIndex(0)
        } else if (queue.indexOf(songId) < currentIndex) {
          setCurrentIndex((prev) => prev - 1)
        }
      } catch (error) {
        console.error('Error deleting song:', error)
        alert('Failed to delete song')
      }
    } else {
      // Remove from current playlist only
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id === activePlaylistId) {
            return { ...p, songIds: p.songIds.filter((id) => id !== songId) }
          }
          return p
        }),
      )
      setQueue((prev) => prev.filter((id) => id !== songId))
      if (queue[currentIndex] === songId) {
        setIsPlaying(false)
        setCurrentIndex(0)
      } else if (queue.indexOf(songId) < currentIndex) {
        setCurrentIndex((prev) => prev - 1)
      }
    }
  }

  const playSong = (songId: string) => {
    const activePlaylist = playlists.find((p) => p.id === activePlaylistId)
    if (!activePlaylist) return

    let newQueue = activePlaylist.songIds
    if (isShuffle) {
      const remaining = newQueue.filter((id) => id !== songId)
      newQueue = [songId, ...shuffleArray(remaining)]
    }

    setQueue(newQueue)
    setCurrentIndex(newQueue.indexOf(songId))
    setIsPlaying(true)
  }

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId)
  const activePlaylistSongs =
    (activePlaylist?.songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter(Boolean) as ActiveSong[]) || []

  const top5Songs = [...songs]
    .map((song) => {
      const vote = votes[song.id]
      let score = 0
      if (vote?.type === 'up') score = 1
      if (vote?.type === 'down') score = -1
      return { ...song, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Loading library...
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-4 p-3 pb-6 md:gap-6 md:p-6 lg:flex-row">
      {/* Left Sidebar - Playlists */}
      <div className="order-2 flex w-full flex-col gap-4 rounded-3xl border border-slate-800/50 bg-slate-900/40 p-4 shadow-xl backdrop-blur-sm md:p-6 lg:order-1 lg:w-72">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100">
            <ListMusic className="h-5 w-5 text-sky-400" />
            Your Library
          </h3>
          <button
            onClick={createNewPlaylist}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            title="Create Playlist"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="custom-scrollbar min-h-[150px] flex-1 space-y-1 overflow-y-auto pr-2 lg:min-h-0">
          {playlists.map((p) => (
            <div
              key={p.id}
              className={`group flex cursor-pointer items-center justify-between rounded-xl p-3 transition-all ${
                activePlaylistId === p.id
                  ? 'border border-sky-500/20 bg-sky-500/10 font-bold text-sky-400'
                  : 'border border-transparent font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
              onClick={() => setActivePlaylistId(p.id)}
            >
              <span className="truncate pr-2">{p.name}</span>
              {p.id !== 'default' && (
                <button
                  onClick={(e) => deletePlaylist(p.id, e)}
                  className="rounded-md p-1.5 text-slate-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                  title="Delete Playlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="order-1 flex min-w-0 flex-1 flex-col gap-4 md:gap-6 lg:order-2">
        {/* Info Message */}
        <div className="rounded-2xl border border-sky-500/30 bg-slate-900/60 p-4 text-sm text-slate-200 shadow-lg backdrop-blur-sm md:p-5 md:text-base">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-400" />
            <div className="w-full space-y-2">
              <p className="font-bold text-sky-400">How songs are created:</p>
              <ul className="list-disc space-y-1 pl-4 text-slate-300">
                <li>
                  <strong>All-in-one:</strong> Lyrics and audio generated in one
                  go.
                </li>
                <li>
                  <strong>Separated:</strong> Lyrics generated separately, then
                  audio style applied (better results, but more difficult).
                </li>
              </ul>
              <p className="mt-2 text-xs text-slate-400 md:text-sm">
                <em>Note:</em> These are only demo/examples. Some of them might
                be good in this condition. All can be customized, including
                adjusted flow, text, and rhythm.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg border-t border-sky-500/20 bg-sky-500/5 p-2 pt-3 font-medium text-sky-300">
                <Copyright className="h-4 w-4 flex-shrink-0" />
                <span>I have full music and lyrics copyright. By Kamil.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Now Playing Screen */}
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-800/50 bg-slate-900/40 p-4 shadow-xl backdrop-blur-sm md:p-6">
          {/* Stage Visualizer */}
          <div className="w-full overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
            <StageVisualizer isPlaying={isPlaying} />
          </div>

          {/* Info & Controls */}
          <div className="z-10 flex w-full flex-col items-center gap-6 md:flex-row">
            {/* Song Info */}
            <div className="w-full min-w-0 flex-1 text-center md:text-left">
              <h2 className="mb-1 truncate text-2xl font-black text-white drop-shadow-md sm:text-3xl">
                {currentSong ? currentSong.title : 'No track selected'}
              </h2>
              <p className="truncate text-base font-medium text-slate-400 sm:text-lg">
                {currentSong ? currentSong.artist : 'Select a song to play'}
              </p>
            </div>

            {/* Controls Container */}
            <div className="flex w-full flex-col items-center gap-4 md:w-auto md:items-end">
              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 md:justify-end md:gap-6">
                <button
                  onClick={toggleShuffle}
                  className={`rounded-full p-2 transition-colors md:p-3 ${isShuffle ? 'bg-sky-500/10 text-sky-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                  title="Shuffle"
                >
                  <Shuffle className="h-5 w-5 md:h-6 md:w-6" />
                </button>

                <button
                  onClick={playPrev}
                  disabled={!currentSong}
                  className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50 md:p-3"
                >
                  <SkipBack className="h-6 w-6 fill-current md:h-8 md:w-8" />
                </button>

                <button
                  onClick={() => {
                    if (currentSong) setIsPlaying(!isPlaying)
                  }}
                  disabled={!currentSong}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-xl transition-all hover:scale-105 hover:bg-sky-400 active:scale-95 disabled:opacity-50 sm:h-16 sm:w-16 md:h-20 md:w-20"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current sm:h-8 sm:w-8 md:h-10 md:w-10" />
                  ) : (
                    <Play className="ml-1 h-6 w-6 fill-current sm:h-8 sm:w-8 md:ml-2 md:h-10 md:w-10" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  disabled={!currentSong}
                  className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50 md:p-3"
                >
                  <SkipForward className="h-6 w-6 fill-current md:h-8 md:w-8" />
                </button>

                <button
                  onClick={toggleRepeat}
                  className={`rounded-full p-2 transition-colors md:p-3 ${repeatMode !== 'none' ? 'bg-sky-500/10 text-sky-400' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="h-5 w-5 md:h-6 md:w-6" />
                  ) : (
                    <Repeat className="h-5 w-5 md:h-6 md:w-6" />
                  )}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full space-y-2 md:w-64">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={progress}
                  onChange={handleSeek}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-sky-500 transition-all hover:accent-sky-400"
                  disabled={!currentSong}
                />
                <div className="flex justify-between font-mono text-xs font-medium text-slate-500 md:text-sm">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Volume Control */}
          <div className="mt-6 hidden items-center justify-center gap-3 md:flex md:justify-start">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-500 transition-colors hover:text-slate-300"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value))
                setIsMuted(false)
              }}
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-slate-800 accent-slate-400 hover:accent-slate-300 md:w-32"
            />
          </div>

          {/* Live Lyrics Transcription */}
          <div className="group relative mt-6 h-32 w-full overflow-hidden rounded-xl border border-slate-800/50 bg-slate-950/50 p-4 md:h-40">
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-8 bg-gradient-to-b from-slate-950 to-transparent" />
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-gradient-to-t from-slate-950 to-transparent" />

            <div className="absolute top-2 left-4 z-20 flex items-center gap-2 rounded-md bg-slate-950/80 px-2 py-1 text-[10px] font-bold tracking-wider text-sky-400/80 uppercase backdrop-blur-sm md:text-xs">
              <Mic2 className="h-3 w-3" />
              <span>Live Transcription</span>
            </div>

            <div
              ref={lyricsContainerRef}
              className="custom-scrollbar h-full overflow-y-auto scroll-smooth pt-8 pb-12"
            >
              {currentSong ? (
                DUMMY_LYRICS.map((lyric, idx) => (
                  <p
                    key={idx}
                    className={`px-4 py-1.5 text-center transition-all duration-500 ${
                      idx === activeLyricIndex
                        ? 'scale-105 text-base font-bold text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] md:text-lg'
                        : idx < activeLyricIndex
                          ? 'text-xs text-slate-500 md:text-sm'
                          : 'text-xs text-slate-400 md:text-sm'
                    }`}
                  >
                    {lyric.text}
                  </p>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-600">
                  Play a song to see live transcription
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Playlist Songs */}
        <div className="flex min-h-[300px] flex-1 flex-col rounded-3xl border border-slate-800/50 bg-slate-900/40 p-4 shadow-xl backdrop-blur-sm md:p-6 lg:min-h-0">
          <div className="mb-4 flex items-center justify-between md:mb-6">
            <div>
              <h3 className="mb-1 text-lg font-bold text-white md:text-xl">
                {activePlaylist?.name || 'Playlist'}
              </h3>
              <p className="text-xs text-slate-400 md:text-sm">
                {activePlaylistSongs.length} songs
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-500 md:px-4 md:py-2 md:text-base">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Add Songs</span>
              <span className="sm:hidden">Add</span>
              <input
                type="file"
                accept="audio/mpeg, audio/mp3, audio/wav, audio/ogg, .mp3, .wav, .ogg"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
            {activePlaylistSongs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4 p-4 text-center text-slate-500 md:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/50 md:h-16 md:w-16">
                  <MusicIcon className="h-6 w-6 opacity-50 md:h-8 md:w-8" />
                </div>
                <p className="text-sm font-medium md:text-base">
                  No songs in this playlist. Upload some to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {activePlaylistSongs.map((song, index) => {
                  const isCurrent = currentSongId === song.id
                  return (
                    <div
                      key={`${song.id}-${index}`}
                      onClick={() => playSong(song.id)}
                      className={`group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-all md:gap-4 md:p-3 ${
                        isCurrent
                          ? 'bg-slate-800/80 text-white'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <div className="w-6 flex-shrink-0 text-center md:w-8">
                        {isCurrent && isPlaying ? (
                          <div className="flex h-3 items-end justify-center gap-0.5 md:h-4">
                            <div className="w-1 animate-[bounce_1s_infinite_0ms] bg-sky-400"></div>
                            <div className="w-1 animate-[bounce_1s_infinite_200ms] bg-sky-400"></div>
                            <div className="w-1 animate-[bounce_1s_infinite_400ms] bg-sky-400"></div>
                          </div>
                        ) : (
                          <span
                            className={`font-mono text-xs font-bold md:text-sm ${isCurrent ? 'text-sky-400' : 'text-slate-600 group-hover:text-slate-400'}`}
                          >
                            {index + 1}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-bold md:text-base ${isCurrent ? 'text-sky-400' : 'text-slate-200'}`}
                        >
                          {song.title}
                        </p>
                        <p className="truncate text-xs font-medium text-slate-500 md:text-sm">
                          {song.artist}
                        </p>

                        {/* Voting Prompt */}
                        {votingOn?.id === song.id && (
                          <div
                            className="mt-2 flex flex-wrap items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-medium text-slate-400">
                              What was {votingOn.type === 'up' ? 'good' : 'bad'}
                              ?
                            </span>
                            <button
                              onClick={(e) =>
                                submitVoteReason(
                                  e,
                                  song.id,
                                  votingOn.type,
                                  'lyrics',
                                )
                              }
                              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-300 transition-colors hover:border-sky-500/50 hover:bg-sky-500/20 hover:text-sky-400 md:text-xs"
                            >
                              Lyrics
                            </button>
                            <button
                              onClick={(e) =>
                                submitVoteReason(
                                  e,
                                  song.id,
                                  votingOn.type,
                                  'soundtrack',
                                )
                              }
                              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-300 transition-colors hover:border-sky-500/50 hover:bg-sky-500/20 hover:text-sky-400 md:text-xs"
                            >
                              Soundtrack
                            </button>
                            <button
                              onClick={(e) =>
                                submitVoteReason(
                                  e,
                                  song.id,
                                  votingOn.type,
                                  'both',
                                )
                              }
                              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-300 transition-colors hover:border-sky-500/50 hover:bg-sky-500/20 hover:text-sky-400 md:text-xs"
                            >
                              Both
                            </button>
                          </div>
                        )}

                        {/* Display Vote Reason if voted and not currently voting */}
                        {votes[song.id] && votingOn?.id !== song.id && (
                          <div className="mt-1 flex items-center gap-1">
                            <span
                              className={`rounded-sm px-1.5 py-0.5 text-[10px] ${votes[song.id].type === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                            >
                              {votes[song.id].reason === 'lyrics'
                                ? 'Lyrics'
                                : votes[song.id].reason === 'soundtrack'
                                  ? 'Soundtrack'
                                  : 'Lyrics & Soundtrack'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-100 transition-opacity group-hover:opacity-100 md:gap-2 md:opacity-0">
                        <button
                          onClick={(e) => handleVoteClick(e, song.id, 'up')}
                          className={`rounded-lg p-1.5 transition-all md:p-2 ${votes[song.id]?.type === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
                          title="Thumbs Up"
                        >
                          <ThumbsUp
                            className={`h-4 w-4 ${votes[song.id]?.type === 'up' ? 'fill-current' : ''}`}
                          />
                        </button>
                        <button
                          onClick={(e) => handleVoteClick(e, song.id, 'down')}
                          className={`rounded-lg p-1.5 transition-all md:p-2 ${votes[song.id]?.type === 'down' ? 'bg-red-500/10 text-red-400' : 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'}`}
                          title="Thumbs Down"
                        >
                          <ThumbsDown
                            className={`h-4 w-4 ${votes[song.id]?.type === 'down' ? 'fill-current' : ''}`}
                          />
                        </button>
                        <button
                          onClick={(e) => handleShare(e, song)}
                          className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-sky-500/10 hover:text-sky-400 md:p-2"
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, song)}
                          className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-sky-500/10 hover:text-sky-400 md:p-2"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => removeSong(song.id, e)}
                          className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-red-500/20 hover:text-red-400 md:p-2"
                          title="Remove from playlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Songs */}
        {songs.length > 0 && (
          <div className="flex flex-col rounded-3xl border border-slate-800/50 bg-slate-900/40 p-4 shadow-xl backdrop-blur-sm md:p-6">
            <div className="mb-4 flex items-center justify-between md:mb-6">
              <div>
                <h3 className="mb-1 text-lg font-bold text-white md:text-xl">
                  Top 5 Tracks
                </h3>
                <p className="text-xs text-slate-400 md:text-sm">
                  Highest ranked songs
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {top5Songs.map((song, index) => {
                const isCurrent = currentSongId === song.id
                return (
                  <div
                    key={`top5-${song.id}-${index}`}
                    onClick={() => playSong(song.id)}
                    className={`group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-all md:gap-4 md:p-3 ${
                      isCurrent
                        ? 'bg-slate-800/80 text-white'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-6 flex-shrink-0 text-center md:w-8">
                      <span
                        className={`font-mono text-xs font-bold md:text-sm ${index < 3 ? 'text-yellow-500' : 'text-slate-500'}`}
                      >
                        #{index + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-bold md:text-base ${isCurrent ? 'text-sky-400' : 'text-slate-200'}`}
                      >
                        {song.title}
                      </p>
                      <p className="truncate text-xs font-medium text-slate-500 md:text-sm">
                        {song.artist}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {votes[song.id] && (
                        <span
                          className={`rounded-sm px-1.5 py-0.5 text-[10px] ${votes[song.id].type === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                        >
                          {votes[song.id].type === 'up' ? 'Liked' : 'Disliked'}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleShare(e, song)}
                        className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-sky-500/10 hover:text-sky-400 md:p-2"
                        title="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDownload(e, song)}
                        className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-sky-500/10 hover:text-sky-400 md:p-2"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleSongEnd}
          onLoadedMetadata={() => {
            handleTimeUpdate()
            if (isPlaying) audioRef.current?.play().catch(console.warn)
          }}
        />
      )}
    </div>
  )
}
