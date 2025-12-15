import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Music2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Lock,
  Unlock,
  Radio,
  Users,
  Timer,
  TimerReset,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '../design-system/Button';

interface RestRoomProps {
  onNavigate?: (page: string) => void;
}

type Scene = { id: number; name: string; image: string; audio: string };

const SCENES: Scene[] = [
  { id: 1, name: '场景 1', image: '/Rest/1.jpg', audio: '/Rest/1.mp3' },
  { id: 2, name: '场景 2', image: '/Rest/2.jpg', audio: '/Rest/2.mp3' },
  { id: 3, name: '场景 3', image: '/Rest/3.jpg', audio: '/Rest/3.mp3' },
  { id: 4, name: '场景 4', image: '/Rest/4.jpg', audio: '/Rest/4.mp3' },
  { id: 5, name: '场景 5', image: '/Rest/5.jpg', audio: '/Rest/5.mp3' },
  { id: 6, name: '场景 6', image: '/Rest/6.jpg', audio: '/Rest/6.mp3' }
];

export function RestRoom({ onNavigate }: RestRoomProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [currentBg, setCurrentBg] = useState(SCENES[0].image);
  const [nextBg, setNextBg] = useState<string | null>(null);
  const [bgFading, setBgFading] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem('rest-room-volume');
    const num = stored ? Number(stored) : 60;
    return Number.isFinite(num) ? Math.min(Math.max(num, 0), 100) : 60;
  });
  const [activeAudioKey, setActiveAudioKey] = useState<'a' | 'b'>('a');
  const audioARef = useRef<HTMLAudioElement>(new Audio(SCENES[0].audio));
  const audioBRef = useRef<HTMLAudioElement>(new Audio());
  const [playHint, setPlayHint] = useState('点击播放开始音乐');

  const [leftCollapsed, setLeftCollapsed] = useState(true);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [leftPinned, setLeftPinned] = useState(false);
  const [rightPinned, setRightPinned] = useState(false);
  const [lastActive, setLastActive] = useState(Date.now());
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isTypingRoom, setIsTypingRoom] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [showScenePicker, setShowScenePicker] = useState(false);

  const [roomId, setRoomId] = useState('');
  const [joinedRoom, setJoinedRoom] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const activeAudio = activeAudioKey === 'a' ? audioARef.current : audioBRef.current;
  const standbyAudio = activeAudioKey === 'a' ? audioBRef.current : audioARef.current;

  useEffect(() => {
    const resizeHandler = () => setIsMobile(window.innerWidth < 1024);
    resizeHandler();
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLeftCollapsed(true);
        setRightCollapsed(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastActive > 5000 && !isDraggingVolume && !isTypingRoom) {
        if (!leftPinned) setLeftCollapsed(true);
        if (!rightPinned) setRightCollapsed(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lastActive, leftPinned, rightPinned, isDraggingVolume, isTypingRoom]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimerSeconds((prev) => {
        if (!timerRunning || prev <= 0) return prev;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    localStorage.setItem('rest-room-volume', String(volume));
    const vol = volume / 100;
    [audioARef.current, audioBRef.current].forEach((a) => {
      a.loop = true;
      a.preload = 'auto';
      a.volume = vol;
    });
  }, [volume]);

  const markActive = () => setLastActive(Date.now());

  const applyVolume = (audio: HTMLAudioElement, vol: number) => {
    try {
      audio.volume = vol;
    } catch {
      // ignore
    }
  };

  const fadeDuration = 1800;

  const crossfadeToScene = async (nextIndex: number) => {
    if (nextIndex === sceneIndex) return;
    setSceneIndex(nextIndex);
    setShowScenePicker(false);
    setBgFading(true);
    setNextBg(SCENES[nextIndex].image);
    setTimeout(() => {
      setCurrentBg(SCENES[nextIndex].image);
      setBgFading(false);
      setNextBg(null);
    }, 700);

    const targetVol = volume / 100;
    standbyAudio.src = SCENES[nextIndex].audio;
    standbyAudio.loop = true;
    standbyAudio.preload = 'auto';
    standbyAudio.currentTime = 0;
    applyVolume(standbyAudio, 0);

    if (!isPlaying || !hasInteracted) {
      activeAudio.pause();
      setActiveAudioKey((k) => (k === 'a' ? 'b' : 'a'));
      return;
    }

    try {
      await standbyAudio.play();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / fadeDuration, 1);
        applyVolume(activeAudio, targetVol * (1 - t));
        applyVolume(standbyAudio, targetVol * t);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          activeAudio.pause();
          setActiveAudioKey((k) => (k === 'a' ? 'b' : 'a'));
        }
      };
      requestAnimationFrame(tick);
    } catch (err) {
      console.warn('播放受限或失败，请点击播放', err);
      setPlayHint('点击播放开始音乐');
      setIsPlaying(false);
    }
  };

  const handlePlayPause = async () => {
    markActive();
    if (isPlaying) {
      activeAudio.pause();
      standbyAudio.pause();
      setIsPlaying(false);
      return;
    }
    setHasInteracted(true);
    activeAudio.src = SCENES[sceneIndex].audio;
    activeAudio.loop = true;
    activeAudio.preload = 'auto';
    applyVolume(activeAudio, volume / 100);
    try {
      await activeAudio.play();
      setIsPlaying(true);
      setPlayHint('');
    } catch (err) {
      console.warn('播放被阻止', err);
      setPlayHint('点击播放开始音乐');
      setIsPlaying(false);
    }
  };

  const toggleLeft = () => {
    setLeftCollapsed((v) => !v);
    markActive();
  };
  const toggleRight = () => {
    setRightCollapsed((v) => !v);
    markActive();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  const startTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setTimerRunning(true);
    markActive();
  };

  const sceneThumbs = useMemo(
    () =>
      SCENES.map((sc) => (
        <button
          key={sc.id}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all ${
            sceneIndex === sc.id - 1 ? 'bg-white/30 text-white border border-white/40' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          onClick={() => crossfadeToScene(sc.id - 1)}
        >
          <div
            className="w-10 h-10 rounded-lg bg-center bg-cover border border-white/30"
            style={{ backgroundImage: `url(${sc.image})` }}
          />
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">{sc.name}</p>
            <p className="text-[11px] opacity-70">点击切换场景</p>
          </div>
        </button>
      )),
    [sceneIndex]
  );

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      onMouseMove={markActive}
      onTouchStart={markActive}
    >
      {/* Background layers */}
      <div
        className="absolute inset-0 bg-center bg-cover rest-kenburns"
        style={{ backgroundImage: `url(${currentBg})` }}
      />
      {nextBg && (
        <div
          className={`absolute inset-0 bg-center bg-cover rest-kenburns transition-opacity duration-700 ${bgFading ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${nextBg})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-black/20 mix-blend-normal rest-glow" />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <p className="uppercase tracking-[0.4em] text-sm text-white/70 mb-3">Rest · Focus</p>
          <h1 className="text-4xl md:text-5xl font-semibold drop-shadow-lg mb-3">冥想自习室</h1>
          <p className="text-base text-white/80">在静谧的呼吸中保持专注，背景音乐与场景随心切换</p>
          {playHint && <p className="text-xs text-white/70 mt-2">{playHint}</p>}
        </div>
      </div>

      {/* Left: meditation control */}
      <div
        className="fixed bottom-6 left-6"
        onMouseEnter={() => {
          if (!isMobile) setLeftCollapsed(false);
          markActive();
        }}
        onMouseLeave={() => {
          if (!leftPinned && !isMobile) setLeftCollapsed(true);
        }}
      >
        {leftCollapsed ? (
          <button
            className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center hover:bg-white/25 transition-all"
            onClick={toggleLeft}
          >
            <Music2 className="w-5 h-5" />
          </button>
        ) : (
          <div className="rest-glass w-[320px] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Music2 className="w-4 h-4" />
                <span className="text-sm">冥想 · {SCENES[sceneIndex].name}</span>
              </div>
              <button
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                onClick={() => setLeftPinned((v) => !v)}
                title={leftPinned ? '取消固定' : '固定面板'}
              >
                {leftPinned ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <button
                className="p-3 rounded-full bg-white/15 hover:bg-white/25 transition"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="flex-1">
                <p className="text-xs text-white/70 mb-1">音量</p>
                <div className="flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-white/70" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      markActive();
                    }}
                    onMouseDown={() => setIsDraggingVolume(true)}
                    onMouseUp={() => setIsDraggingVolume(false)}
                    onTouchStart={() => setIsDraggingVolume(true)}
                    onTouchEnd={() => setIsDraggingVolume(false)}
                    className="flex-1 accent-[#845EF7]"
                  />
                  <Volume2 className="w-4 h-4 text-white/70" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-white/80 flex items-center gap-2">
                <Radio className="w-4 h-4" />
                <span>切换场景</span>
              </div>
              <button
                className="text-xs px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 transition"
                onClick={() => setShowScenePicker((v) => !v)}
              >
                {showScenePicker ? '收起' : '选择'}
              </button>
            </div>
            {showScenePicker && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 rest-scrollbar">
                {sceneThumbs}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: study room */}
      <div
        className="fixed bottom-6 right-6"
        onMouseEnter={() => {
          if (!isMobile) setRightCollapsed(false);
          markActive();
        }}
        onMouseLeave={() => {
          if (!rightPinned && !isMobile) setRightCollapsed(true);
        }}
      >
        {rightCollapsed ? (
          <button
            className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center hover:bg-white/25 transition-all"
            onClick={toggleRight}
          >
            <Timer className="w-5 h-5" />
          </button>
        ) : (
          <div className="rest-glass w-[340px] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">自习室 · {joinedRoom || '独自模式'}</span>
              </div>
              <button
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                onClick={() => setRightPinned((v) => !v)}
                title={rightPinned ? '取消固定' : '固定面板'}
              >
                {rightPinned ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <input
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/25 text-sm outline-none focus:border-white/50"
                placeholder="输入房间号加入（可选）"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  setIsTypingRoom(true);
                  markActive();
                }}
                onFocus={() => setIsTypingRoom(true)}
                onBlur={() => setIsTypingRoom(false)}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const id = roomId.trim();
                  const finalId = id || '独自模式';
                  setJoinedRoom(finalId);
                  setMembers(id ? ['我', '同学A', '同学B'] : ['我']);
                  markActive();
                }}
              >
                {joinedRoom ? '更新' : '加入'}
              </Button>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/80">专注计时器</span>
                <span className="text-xs text-white/70">{formatTimer(timerSeconds)}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => startTimer(25)}>
                  25 min
                </Button>
                <Button size="sm" variant="secondary" onClick={() => startTimer(50)}>
                  50 min
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTimerRunning((v) => !v);
                    markActive();
                  }}
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTimerSeconds(0);
                    setTimerRunning(false);
                  }}
                >
                  <TimerReset className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="rest-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/70">成员</span>
                <span className="text-xs text-white/60">{members.length} 人</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.length ? (
                  members.map((m) => (
                    <div key={m} className="px-3 py-1 rounded-full bg-white/10 text-xs">
                      {m}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-white/60">尚未加入房间</span>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-white/70">想要完整自习室体验？</div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigate?.('study-hub')}
                className="gap-1 text-white hover:bg-white/15"
              >
                前往主页
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Floating hints for mobile toggles */}
      {isMobile && (
        <div className="fixed top-20 right-4 z-20 text-xs text-white/70">
          点击角落圆形按钮展开控制
        </div>
      )}

      {/* Minimal link to background assets note */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-4 text-[11px] text-white/60">
        背景资源路径：/Rest/1..6（图片、音频），可用 jpg/png/webp 与 mp3/ogg/wav
      </div>
    </div>
  );
}
