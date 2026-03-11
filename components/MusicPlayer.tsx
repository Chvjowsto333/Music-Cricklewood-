'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload, 
  Music as MusicIcon, ListMusic, Shuffle, Repeat, Repeat1, Plus, 
  Trash2, Disc3, MoreVertical, PlayCircle, Info, Copyright, Mic2,
  ThumbsUp, ThumbsDown, Share2, Download
} from 'lucide-react';
import { get, set } from 'idb-keyval';
import StageVisualizer from './StageVisualizer';

const DUMMY_LYRICS = [
  { time: 0, text: "♪ (Music playing) ♪" },
  { time: 5, text: "Welcome to the Buzz Bingo Cricklewood track" },
  { time: 10, text: "We got the lyrics flowing, no looking back" },
  { time: 15, text: "All music and lyrics copyright by Kamil" },
  { time: 20, text: "Keeping it real, you know the deal" },
  { time: 25, text: "Drop the beat, let the rhythm take control" },
  { time: 30, text: "This is the sound that moves your soul" },
  { time: 35, text: "♪ (Chorus) ♪" },
  { time: 40, text: "Yeah, we're playing it live" },
  { time: 45, text: "Taking a dive into the vibe" },
  { time: 50, text: "Transcription scrolling automatically" },
  { time: 55, text: "Just like you wanted, practically" },
  { time: 60, text: "♪ (Instrumental break) ♪" },
  { time: 75, text: "Back on the mic, finishing strong" },
  { time: 80, text: "Thanks for listening to this demo song" },
  { time: 85, text: "♪ (Fading out) ♪" }
];

interface ActiveSong {
  id: string;
  title: string;
  artist: string;
  url: string;
}

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
}

type RepeatMode = 'none' | 'all' | 'one';

type VoteType = 'up' | 'down';
type VoteReason = 'lyrics' | 'soundtrack' | 'both';

interface Vote {
  type: VoteType;
  reason?: VoteReason;
}

export default function MusicPlayer() {
  const [songs, setSongs] = useState<ActiveSong[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([{ id: 'default', name: 'All Songs', songIds: [] }]);
  const [activePlaylistId, setActivePlaylistId] = useState<string>('default');
  
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');

  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [votingOn, setVotingOn] = useState<{ id: string, type: VoteType } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const currentSongId = queue[currentIndex];
  const currentSong = songs.find(s => s.id === currentSongId);

  const activeLyricIndex = DUMMY_LYRICS.reduce((acc, lyric, index) => {
    return progress >= lyric.time ? index : acc;
  }, 0);

  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (container && isPlaying && currentSong) {
      const activeEl = container.children[activeLyricIndex] as HTMLElement;
      if (activeEl) {
        container.scrollTo({
          top: activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [activeLyricIndex, isPlaying, currentSong]);

  // Load from API and IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/songs');
        const fetchedSongs: ActiveSong[] = await response.json();
        
        const storedPlaylists = await get<Playlist[]>('playlists') || [{ id: 'default', name: 'All Songs', songIds: [] }];
        const storedVotes = await get<Record<string, Vote>>('votes') || {};
        
        // Ensure default playlist has all songs
        const allSongIds = fetchedSongs.map(s => s.id);
        const updatedPlaylists = storedPlaylists.map(p => {
          if (p.id === 'default') {
            return { ...p, songIds: allSongIds };
          }
          // Filter out deleted songs from other playlists
          return { ...p, songIds: p.songIds.filter(id => allSongIds.includes(id)) };
        });
        
        setSongs(fetchedSongs);
        setPlaylists(updatedPlaylists);
        setVotes(storedVotes);
        
        if (updatedPlaylists[0].songIds.length > 0) {
          setQueue(updatedPlaylists[0].songIds);
          setCurrentIndex(0);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save to IndexedDB when data changes
  useEffect(() => {
    if (!isLoaded) return;
    set('playlists', playlists).catch(console.error);
    set('votes', votes).catch(console.error);
  }, [playlists, votes, isLoaded]);

  const handleVoteClick = (e: React.MouseEvent, songId: string, type: VoteType) => {
    e.stopPropagation();
    if (votes[songId]?.type === type && !votingOn) {
      // Toggle off if already voted and not currently selecting reason
      const newVotes = { ...votes };
      delete newVotes[songId];
      setVotes(newVotes);
      setVotingOn(null);
    } else {
      setVotingOn({ id: songId, type });
    }
  };

  const submitVoteReason = (e: React.MouseEvent, songId: string, type: VoteType, reason: VoteReason) => {
    e.stopPropagation();
    setVotes(prev => ({
      ...prev,
      [songId]: { type, reason }
    }));
    setVotingOn(null);
  };

  // Audio playback control
  useEffect(() => {
    if (audioRef.current && queue.length > 0 && currentIndex >= 0) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.warn("Playback prevented:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentIndex, queue]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload songs');
      }

      const uploadedSongs: ActiveSong[] = await response.json();

      setSongs(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newUniqueSongs = uploadedSongs.filter(s => !existingIds.has(s.id));
        return [...prev, ...newUniqueSongs];
      });
      
      const newSongIds = uploadedSongs.map(s => s.id);
      
      setPlaylists(prev => prev.map(p => {
        if (p.id === 'default' || p.id === activePlaylistId) {
          const existingIds = new Set(p.songIds);
          const uniqueNewIds = newSongIds.filter(id => !existingIds.has(id));
          return { ...p, songIds: [...p.songIds, ...uniqueNewIds] };
        }
        return p;
      }));
      
      if (queue.length === 0 && newSongIds.length > 0) {
        setQueue(newSongIds);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload songs');
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const shuffleArray = (array: string[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
    if (!isShuffle) {
      // Turning ON
      if (currentIndex >= 0 && queue.length > 0) {
        const currentSongId = queue[currentIndex];
        const remaining = queue.filter(id => id !== currentSongId);
        const newQueue = [currentSongId, ...shuffleArray(remaining)];
        setQueue(newQueue);
        setCurrentIndex(0);
      } else {
        setQueue(shuffleArray(queue));
      }
    } else {
      // Turning OFF
      const activePlaylist = playlists.find(p => p.id === activePlaylistId);
      if (activePlaylist) {
        const originalQueue = activePlaylist.songIds;
        const currentSongId = queue[currentIndex];
        const newIndex = originalQueue.indexOf(currentSongId);
        setQueue(originalQueue);
        setCurrentIndex(newIndex >= 0 ? newIndex : 0);
      }
    }
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    } else if (repeatMode === 'all') {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      setCurrentIndex(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  }, [currentIndex, queue.length, repeatMode]);

  const playPrev = () => {
    if (queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (repeatMode === 'all') {
        setCurrentIndex(queue.length - 1);
      } else {
        setCurrentIndex(0);
      }
      setIsPlaying(true);
    }
  };

  const handleSongEnd = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.warn);
      }
    } else {
      playNext();
    }
  };

  const handleShare = async (e: React.MouseEvent, song: ActiveSong) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({
          title: song.title,
          text: `Check out ${song.title} by ${song.artist}!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`Check out ${song.title} by ${song.artist}!`);
        alert('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleDownload = (e: React.MouseEvent, song: ActiveSong) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = song.url;
    a.download = `${song.title} - ${song.artist}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const createNewPlaylist = () => {
    const name = prompt("Enter playlist name:");
    if (name && name.trim()) {
      const newPlaylist: Playlist = {
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        songIds: []
      };
      setPlaylists(prev => [...prev, newPlaylist]);
      setActivePlaylistId(newPlaylist.id);
    }
  };

  const deletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'default') return;
    if (confirm("Are you sure you want to delete this playlist?")) {
      setPlaylists(prev => prev.filter(p => p.id !== id));
      if (activePlaylistId === id) {
        setActivePlaylistId('default');
      }
    }
  };

  const removeSong = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePlaylistId === 'default') {
      if (!confirm("Are you sure you want to delete this song completely?")) return;
      
      try {
        await fetch(`/api/songs?id=${encodeURIComponent(songId)}`, {
          method: 'DELETE'
        });
        
        // Remove completely
        setSongs(prev => prev.filter(s => s.id !== songId));
        setPlaylists(prev => prev.map(p => ({
          ...p,
          songIds: p.songIds.filter(id => id !== songId)
        })));
        setQueue(prev => prev.filter(id => id !== songId));
        if (queue[currentIndex] === songId) {
          setIsPlaying(false);
          setCurrentIndex(0);
        } else if (queue.indexOf(songId) < currentIndex) {
          setCurrentIndex(prev => prev - 1);
        }
      } catch (error) {
        console.error('Error deleting song:', error);
        alert('Failed to delete song');
      }
    } else {
      // Remove from current playlist only
      setPlaylists(prev => prev.map(p => {
        if (p.id === activePlaylistId) {
          return { ...p, songIds: p.songIds.filter(id => id !== songId) };
        }
        return p;
      }));
      setQueue(prev => prev.filter(id => id !== songId));
      if (queue[currentIndex] === songId) {
        setIsPlaying(false);
        setCurrentIndex(0);
      } else if (queue.indexOf(songId) < currentIndex) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  const playSong = (songId: string) => {
    const activePlaylist = playlists.find(p => p.id === activePlaylistId);
    if (!activePlaylist) return;
    
    let newQueue = activePlaylist.songIds;
    if (isShuffle) {
      const remaining = newQueue.filter(id => id !== songId);
      newQueue = [songId, ...shuffleArray(remaining)];
    }
    
    setQueue(newQueue);
    setCurrentIndex(newQueue.indexOf(songId));
    setIsPlaying(true);
  };

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const activePlaylistSongs = activePlaylist?.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as ActiveSong[] || [];

  const top5Songs = [...songs]
    .map(song => {
      const vote = votes[song.id];
      let score = 0;
      if (vote?.type === 'up') score = 1;
      if (vote?.type === 'down') score = -1;
      return { ...song, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full text-zinc-500">Loading library...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 md:gap-6 p-3 md:p-6 max-w-[1400px] mx-auto pb-6">
      
      {/* Left Sidebar - Playlists */}
      <div className="order-2 lg:order-1 w-full lg:w-72 flex flex-col gap-4 bg-slate-900/40 rounded-3xl p-4 md:p-6 border border-slate-800/50 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-100 font-bold text-lg flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-sky-400" />
            Your Library
          </h3>
          <button 
            onClick={createNewPlaylist} 
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Create Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 min-h-[150px] lg:min-h-0">
          {playlists.map(p => (
            <div 
              key={p.id} 
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                activePlaylistId === p.id 
                  ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold' 
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent font-medium'
              }`}
              onClick={() => setActivePlaylistId(p.id)}
            >
              <span className="truncate pr-2">{p.name}</span>
              {p.id !== 'default' && (
                <button 
                  onClick={(e) => deletePlaylist(p.id, e)} 
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-md transition-all"
                  title="Delete Playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="order-1 lg:order-2 flex-1 flex flex-col gap-4 md:gap-6 min-w-0">
        
        {/* Info Message */}
        <div className="bg-slate-900/60 border border-sky-500/30 rounded-2xl p-4 md:p-5 text-slate-200 text-sm md:text-base shadow-lg backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 w-full">
              <p className="font-bold text-sky-400">How songs are created:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li><strong>All-in-one:</strong> Lyrics and audio generated in one go.</li>
                <li><strong>Separated:</strong> Lyrics generated separately, then audio style applied (better results, but more difficult).</li>
              </ul>
              <p className="text-slate-400 text-xs md:text-sm mt-2">
                <em>Note:</em> These are only demo/examples. Some of them might be good in this condition. All can be customized, including adjusted flow, text, and rhythm.
              </p>
              <div className="mt-3 pt-3 border-t border-sky-500/20 flex items-center gap-2 text-sky-300 font-medium bg-sky-500/5 p-2 rounded-lg">
                <Copyright className="w-4 h-4 flex-shrink-0" />
                <span>I have full music and lyrics copyright. By Kamil.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Now Playing Screen */}
        <div className="bg-slate-900/40 rounded-3xl p-4 md:p-6 border border-slate-800/50 shadow-xl backdrop-blur-sm flex flex-col gap-6 relative overflow-hidden">
          
          {/* Stage Visualizer */}
          <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
             <StageVisualizer isPlaying={isPlaying} />
          </div>

          {/* Info & Controls */}
          <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full">
             {/* Song Info */}
             <div className="flex-1 text-center md:text-left min-w-0 w-full">
               <h2 className="text-2xl sm:text-3xl font-black text-white truncate mb-1 drop-shadow-md">
                 {currentSong ? currentSong.title : 'No track selected'}
               </h2>
               <p className="text-base sm:text-lg text-slate-400 font-medium truncate">
                 {currentSong ? currentSong.artist : 'Select a song to play'}
               </p>
             </div>

             {/* Controls Container */}
             <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
                {/* Playback Controls */}
                <div className="flex items-center justify-center md:justify-end gap-2 sm:gap-4 md:gap-6">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 md:p-3 rounded-full transition-colors ${isShuffle ? 'text-sky-400 bg-sky-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                    title="Shuffle"
                  >
                    <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  
                  <button
                    onClick={playPrev}
                    disabled={!currentSong}
                    className="p-2 md:p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full disabled:opacity-50 transition-colors"
                  >
                    <SkipBack className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                  </button>
                  
                  <button
                    onClick={() => {
                      if (currentSong) setIsPlaying(!isPlaying);
                    }}
                    disabled={!currentSong}
                    className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center bg-sky-500 hover:bg-sky-400 text-white rounded-full disabled:opacity-50 transition-all shadow-xl hover:scale-105 active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 fill-current ml-1 md:ml-2" />}
                  </button>
                  
                  <button
                    onClick={playNext}
                    disabled={!currentSong}
                    className="p-2 md:p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full disabled:opacity-50 transition-colors"
                  >
                    <SkipForward className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                  </button>
                  
                  <button
                    onClick={toggleRepeat}
                    className={`p-2 md:p-3 rounded-full transition-colors ${repeatMode !== 'none' ? 'text-sky-400 bg-sky-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                    title={`Repeat: ${repeatMode}`}
                  >
                    {repeatMode === 'one' ? <Repeat1 className="w-5 h-5 md:w-6 md:h-6" /> : <Repeat className="w-5 h-5 md:w-6 md:h-6" />}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full md:w-64 space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500 hover:accent-sky-400 transition-all"
                    disabled={!currentSong}
                  />
                  <div className="flex justify-between text-xs md:text-sm text-slate-500 font-mono font-medium">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
             </div>
          </div>
          
          {/* Volume Control */}
            <div className="hidden md:flex items-center justify-center md:justify-start gap-3 mt-6">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setIsMuted(false);
                }}
                className="w-24 md:w-32 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-slate-400 hover:accent-slate-300"
              />
            </div>

            {/* Live Lyrics Transcription */}
            <div className="mt-6 bg-slate-950/50 rounded-xl border border-slate-800/50 p-4 h-32 md:h-40 overflow-hidden relative group w-full">
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
              
              <div className="absolute top-2 left-4 z-20 flex items-center gap-2 text-sky-400/80 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-slate-950/80 px-2 py-1 rounded-md backdrop-blur-sm">
                <Mic2 className="w-3 h-3" />
                <span>Live Transcription</span>
              </div>
              
              <div 
                ref={lyricsContainerRef}
                className="h-full overflow-y-auto custom-scrollbar pb-12 pt-8 scroll-smooth"
              >
                {currentSong ? (
                  DUMMY_LYRICS.map((lyric, idx) => (
                    <p 
                      key={idx} 
                      className={`text-center py-1.5 transition-all duration-500 px-4 ${
                        idx === activeLyricIndex 
                          ? 'text-sky-400 font-bold text-base md:text-lg scale-105 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' 
                          : idx < activeLyricIndex 
                            ? 'text-slate-500 text-xs md:text-sm' 
                            : 'text-slate-400 text-xs md:text-sm'
                      }`}
                    >
                      {lyric.text}
                    </p>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                    Play a song to see live transcription
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Current Playlist Songs */}
        <div className="flex-1 bg-slate-900/40 rounded-3xl p-4 md:p-6 border border-slate-800/50 shadow-xl backdrop-blur-sm flex flex-col min-h-[300px] lg:min-h-0">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-1">{activePlaylist?.name || 'Playlist'}</h3>
              <p className="text-xs md:text-sm text-slate-400">{activePlaylistSongs.length} songs</p>
            </div>
            <label className="cursor-pointer px-3 py-2 md:px-4 md:py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2 text-sm md:text-base">
              <Upload className="w-4 h-4" />
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
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {activePlaylistSongs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 p-4 md:p-8 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <MusicIcon className="w-6 h-6 md:w-8 md:h-8 opacity-50" />
                </div>
                <p className="text-sm md:text-base font-medium">No songs in this playlist. Upload some to get started!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activePlaylistSongs.map((song, index) => {
                  const isCurrent = currentSongId === song.id;
                  return (
                    <div
                      key={`${song.id}-${index}`}
                      onClick={() => playSong(song.id)}
                      className={`group flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-xl cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-slate-800/80 text-white'
                          : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="w-6 md:w-8 text-center flex-shrink-0">
                        {isCurrent && isPlaying ? (
                          <div className="flex gap-0.5 items-end justify-center h-3 md:h-4">
                            <div className="w-1 bg-sky-400 animate-[bounce_1s_infinite_0ms]"></div>
                            <div className="w-1 bg-sky-400 animate-[bounce_1s_infinite_200ms]"></div>
                            <div className="w-1 bg-sky-400 animate-[bounce_1s_infinite_400ms]"></div>
                          </div>
                        ) : (
                          <span className={`text-xs md:text-sm font-mono font-bold ${isCurrent ? 'text-sky-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm md:text-base font-bold truncate ${isCurrent ? 'text-sky-400' : 'text-slate-200'}`}>
                          {song.title}
                        </p>
                        <p className="text-xs md:text-sm text-slate-500 font-medium truncate">{song.artist}</p>
                        
                        {/* Voting Prompt */}
                        {votingOn?.id === song.id && (
                          <div className="mt-2 flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                            <span className="text-xs text-slate-400 font-medium">What was {votingOn.type === 'up' ? 'good' : 'bad'}?</span>
                            <button onClick={(e) => submitVoteReason(e, song.id, votingOn.type, 'lyrics')} className="text-[10px] md:text-xs px-2 py-1 bg-slate-800 hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 rounded-md transition-colors border border-slate-700 hover:border-sky-500/50">Lyrics</button>
                            <button onClick={(e) => submitVoteReason(e, song.id, votingOn.type, 'soundtrack')} className="text-[10px] md:text-xs px-2 py-1 bg-slate-800 hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 rounded-md transition-colors border border-slate-700 hover:border-sky-500/50">Soundtrack</button>
                            <button onClick={(e) => submitVoteReason(e, song.id, votingOn.type, 'both')} className="text-[10px] md:text-xs px-2 py-1 bg-slate-800 hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 rounded-md transition-colors border border-slate-700 hover:border-sky-500/50">Both</button>
                          </div>
                        )}
                        
                        {/* Display Vote Reason if voted and not currently voting */}
                        {votes[song.id] && votingOn?.id !== song.id && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${votes[song.id].type === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {votes[song.id].reason === 'lyrics' ? 'Lyrics' : votes[song.id].reason === 'soundtrack' ? 'Soundtrack' : 'Lyrics & Soundtrack'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 md:gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleVoteClick(e, song.id, 'up')}
                          className={`p-1.5 md:p-2 rounded-lg transition-all ${votes[song.id]?.type === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                          title="Thumbs Up"
                        >
                          <ThumbsUp className={`w-4 h-4 ${votes[song.id]?.type === 'up' ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleVoteClick(e, song.id, 'down')}
                          className={`p-1.5 md:p-2 rounded-lg transition-all ${votes[song.id]?.type === 'down' ? 'text-red-400 bg-red-500/10' : 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'}`}
                          title="Thumbs Down"
                        >
                          <ThumbsDown className={`w-4 h-4 ${votes[song.id]?.type === 'down' ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleShare(e, song)}
                          className="p-1.5 md:p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, song)}
                          className="p-1.5 md:p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => removeSong(song.id, e)}
                          className="p-1.5 md:p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                          title="Remove from playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Songs */}
        {songs.length > 0 && (
          <div className="bg-slate-900/40 rounded-3xl p-4 md:p-6 border border-slate-800/50 shadow-xl backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1">Top 5 Tracks</h3>
                <p className="text-xs md:text-sm text-slate-400">Highest ranked songs</p>
              </div>
            </div>
            
            <div className="space-y-1">
              {top5Songs.map((song, index) => {
                const isCurrent = currentSongId === song.id;
                return (
                  <div
                    key={`top5-${song.id}-${index}`}
                    onClick={() => playSong(song.id)}
                    className={`group flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-xl cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-slate-800/80 text-white'
                        : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-6 md:w-8 text-center flex-shrink-0">
                      <span className={`text-xs md:text-sm font-mono font-bold ${index < 3 ? 'text-yellow-500' : 'text-slate-500'}`}>
                        #{index + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm md:text-base font-bold truncate ${isCurrent ? 'text-sky-400' : 'text-slate-200'}`}>
                        {song.title}
                      </p>
                      <p className="text-xs md:text-sm text-slate-500 font-medium truncate">{song.artist}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {votes[song.id] && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${votes[song.id].type === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {votes[song.id].type === 'up' ? 'Liked' : 'Disliked'}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleShare(e, song)}
                        className="p-1.5 md:p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDownload(e, song)}
                        className="p-1.5 md:p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
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
            handleTimeUpdate();
            if (isPlaying) audioRef.current?.play().catch(console.warn);
          }}
        />
      )}
    </div>
  );
}
