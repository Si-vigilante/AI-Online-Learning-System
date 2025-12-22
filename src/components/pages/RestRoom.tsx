import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Music2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Radio,
  Users,
  Timer,
  TimerReset,
  ChevronRight
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
    const num = stored ? Number(stored) : 1;
    return Number.isFinite(num) ? Math.min(Math.max(num, 0), 100) : 1;
  });
  const audioARef = useRef<HTMLAudioElement>(new Audio(SCENES[0].audio));
  const [playHint, setPlayHint] = useState('点击播放开始音乐');

  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [rightPinned, setRightPinned] = useState(false);
  const [lastActive, setLastActive] = useState(Date.now());
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isTypingRoom, setIsTypingRoom] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showScenePicker, setShowScenePicker] = useState(true);

  const [roomId, setRoomId] = useState('');
  const [joinedRoom, setJoinedRoom] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [switcherCollapsed, setSwitcherCollapsed] = useState(false);
  const [musicCollapsed, setMusicCollapsed] = useState(false);

  const [positions, setPositions] = useState({
    switcher: { x: 0, y: 0 },
    music: { x: 0, y: 0 },
    room: { x: 0, y: 0 }
  });
  const dragState = useRef<{
    key: 'switcher' | 'music' | 'room' | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ key: null, startX: 0, startY: 0, originX: 0, originY: 0 });

  const overlayRoot = typeof document !== 'undefined' ? document.getElementById('overlay-root') || document.body : null;
  const activeAudio = audioARef.current;
  const scenePlayTimer = useRef<number | null>(null);

  const logDebug = (...args: any[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[RestRoom]', ...args);
    }
  };

  useEffect(() => {
    const resizeHandler = () => setIsMobile(window.innerWidth < 1024);
    resizeHandler();
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  const clearSceneTimer = () => {
    if (scenePlayTimer.current) {
      clearTimeout(scenePlayTimer.current);
      scenePlayTimer.current = null;
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRightCollapsed(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    return () => {
      try {
        audioARef.current.pause();
        audioBRef.current.pause();
      } catch {
        // ignore
      }
      setIsPlaying(false);
      clearSceneTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastActive > 15000 && !isDraggingVolume && !isTypingRoom) {
        if (!rightPinned) setRightCollapsed(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lastActive, rightPinned, isDraggingVolume, isTypingRoom]);

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
    const vol = volume / 100;
    audioARef.current.loop = true;
    audioARef.current.preload = 'auto';
    audioARef.current.volume = vol;
    logDebug('volume-init', { volume: vol, src: activeAudio.src });
    const tryAutoPlay = async () => {
      activeAudio.src = SCENES[sceneIndex].audio;
      activeAudio.loop = true;
      applyVolume(activeAudio, vol);
      try {
        await activeAudio.play();
        setIsPlaying(true);
        setHasInteracted(true);
        setPlayHint('');
        logDebug('autoplay-success', { volume: vol, src: activeAudio.src });
      } catch (err) {
        console.warn('自动播放被拦截，等待用户点击', err);
        setIsPlaying(false);
        setPlayHint('点击播放开始音乐');
      }
    };
    tryAutoPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('rest-room-volume', String(volume));
    const vol = volume / 100;
    audioARef.current.loop = true;
    audioARef.current.preload = 'auto';
    audioARef.current.volume = vol;
    logDebug('volume-change', { volume: vol, src: activeAudio.src, paused: activeAudio.paused });
  }, [volume, activeAudio]);

  const markActive = () => setLastActive(Date.now());

  const applyVolume = (audio: HTMLAudioElement, vol: number) => {
    try {
      audio.volume = vol;
    } catch {
      // ignore
    }
  };

  const fadeDuration = 1800;

  const crossfadeToScene = (nextIndex: number) => {
    if (nextIndex === sceneIndex) return;
    logDebug('scene-switch', { nextIndex, current: sceneIndex });
    clearSceneTimer();
    setIsPlaying(false);
    activeAudio.pause();
    activeAudio.currentTime = 0;

    setSceneIndex(nextIndex);
    setShowScenePicker(false);
    setBgFading(true);
    setNextBg(SCENES[nextIndex].image);
    setTimeout(() => {
      setCurrentBg(SCENES[nextIndex].image);
      setBgFading(false);
      setNextBg(null);
    }, 700);

    // 延迟 3 秒后播放对应音乐
    scenePlayTimer.current = window.setTimeout(() => {
      const targetVol = volume / 100;
      activeAudio.src = SCENES[nextIndex].audio;
      activeAudio.loop = true;
      activeAudio.preload = 'auto';
      activeAudio.currentTime = 0;
      applyVolume(activeAudio, targetVol);
      activeAudio
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasInteracted(true);
          setPlayHint('');
          logDebug('scene-delay-play', { index: nextIndex, volume: targetVol, src: activeAudio.src });
        })
        .catch((err) => {
          console.warn('播放受限或失败，请点击播放', err);
          setPlayHint('点击播放开始音乐');
          setIsPlaying(false);
        });
    }, 3000);
  };

  const handlePlayPause = async () => {
    markActive();
    if (isPlaying) {
      activeAudio.pause();
      standbyAudio.pause();
      logDebug('pause', { src: activeAudio.src, volume: activeAudio.volume });
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
      logDebug('play', { src: activeAudio.src, volume: activeAudio.volume, paused: activeAudio.paused });
      setIsPlaying(true);
      setPlayHint('');
    } catch (err) {
      console.warn('播放被阻止', err);
      setPlayHint('点击播放开始音乐');
      setIsPlaying(false);
    }
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

  const handlePrevScene = () => {
    markActive();
    const next = (sceneIndex - 1 + SCENES.length) % SCENES.length;
    crossfadeToScene(next);
  };

  const handleNextScene = () => {
    markActive();
    const next = (sceneIndex + 1) % SCENES.length;
    crossfadeToScene(next);
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

  const startDrag = (key: 'switcher' | 'music' | 'room', clientX: number, clientY: number) => {
    dragState.current = {
      key,
      startX: clientX,
      startY: clientY,
      originX: positions[key].x,
      originY: positions[key].y
    };
    const move = (e: MouseEvent | TouchEvent) => {
      const point = 'touches' in e ? e.touches[0] : e;
      const dx = point.clientX - dragState.current.startX;
      const dy = point.clientY - dragState.current.startY;
      const k = dragState.current.key;
      if (!k) return;
      setPositions((prev) => ({
        ...prev,
        [k]: { x: dragState.current.originX + dx, y: dragState.current.originY + dy }
      }));
    };
    const up = () => {
      dragState.current.key = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move);
    document.addEventListener('touchend', up);
  };

  const controls =
    overlayRoot &&
    createPortal(
      <div
        data-testid="rest-controls"
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 2147483647 }}
      >
        <div
          className="fixed pointer-events-auto"
          style={{
            bottom: `calc(40px + ${positions.switcher.y}px)`,
            left: '50%',
            transform: `translate(calc(-50% + ${positions.switcher.x}px), 0)`
          }}
        >
          <div className="rest-glass px-4 py-3 rounded-full flex items-center gap-3 shadow-lg bg-black/70 text-white">
            <button
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
              onMouseDown={(e) => startDrag('switcher', e.clientX, e.clientY)}
              onTouchStart={(e) => startDrag('switcher', e.touches[0].clientX, e.touches[0].clientY)}
            >
              拖动
            </button>
            <Button size="sm" variant="secondary" onClick={handlePrevScene}>
              上一幕
            </Button>
            <div className="text-sm min-w-[160px] text-center">
              {SCENES[sceneIndex].name} · 音乐与背景同步切换
            </div>
            <Button size="sm" variant="secondary" onClick={handleNextScene}>
              下一幕
            </Button>
            <button
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
              onClick={() => setSwitcherCollapsed((v) => !v)}
            >
              {switcherCollapsed ? '展开' : '收起'}
            </button>
          </div>
        </div>

        {!switcherCollapsed && (
          <div
            className="fixed pointer-events-auto"
            style={{
              bottom: `calc(40px + ${positions.music.y}px)`,
              left: `calc(16px + ${positions.music.x}px)`
            }}
          >
            <div className="rest-glass w-[320px] p-4 shadow-2xl bg-black/70 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music2 className="w-4 h-4" />
                  <span className="text-sm">冥想 · {SCENES[sceneIndex].name}</span>
                </div>
                <button
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
                  onMouseDown={(e) => startDrag('music', e.clientX, e.clientY)}
                  onTouchStart={(e) => startDrag('music', e.touches[0].clientX, e.touches[0].clientY)}
                >
                  拖动
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <button
                  className="p-3 rounded-full bg-white/90 text-[#4C6EF5] hover:bg-white transition shadow"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <div className="flex-1">
                  <p className="text-xs text-white/90 mb-1">音量</p>
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-white/80" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setVolume(val);
                        markActive();
                        logDebug('volume-change', { val, active: activeAudio.src, paused: activeAudio.paused });
                      }}
                      onMouseDown={() => setIsDraggingVolume(true)}
                      onMouseUp={() => setIsDraggingVolume(false)}
                      onTouchStart={() => setIsDraggingVolume(true)}
                      onTouchEnd={() => setIsDraggingVolume(false)}
                      className="flex-1 accent-[#845EF7]"
                    />
                    <Volume2 className="w-4 h-4 text-white/80" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-white/80 flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  <span>切换场景</span>
                </div>
                <button
                  className="text-xs px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition"
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
          </div>
        )}

        <div
          className="fixed pointer-events-auto"
          style={{
            bottom: `calc(24px + ${positions.room.y}px)`,
            right: `calc(24px + ${positions.room.x}px)`
          }}
        >
          {rightCollapsed ? (
            <button
              className="w-14 h-14 rounded-full bg-white/80 text-[#4C6EF5] border border-white/60 shadow-lg flex items-center justify-center hover:bg-white transition-all"
              onClick={() => setRightCollapsed(false)}
            >
              <Timer className="w-5 h-5" />
            </button>
          ) : (
            <div className="rest-glass w-[340px] p-4 z-50 shadow-2xl bg-black/70 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">自习室 · {joinedRoom || '独自模式'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
                    onMouseDown={(e) => startDrag('room', e.clientX, e.clientY)}
                    onTouchStart={(e) => startDrag('room', e.touches[0].clientX, e.touches[0].clientY)}
                  >
                    拖动
                  </button>
                  <button
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                    onClick={() => setRightPinned((v) => !v)}
                    title={rightPinned ? '取消固定' : '固定面板'}
                  >
                    {rightPinned ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>
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

              <div className="flex justify-end mt-2">
                <Button size="sm" variant="ghost" onClick={() => setRightCollapsed(true)}>
                  最小化
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>,
      overlayRoot
    );

  return (
    <div
      className="relative overflow-hidden text-white"
      style={{ minHeight: 'calc(100vh - 88px)', zIndex: 0 }}
      onMouseMove={markActive}
      onTouchStart={markActive}
    >
      <div
        className="absolute inset-0 rest-kenburns"
        style={{
          pointerEvents: 'none',
          backgroundImage: `url(${currentBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      {nextBg && (
        <div
          className={`absolute inset-0 rest-kenburns transition-opacity duration-700 ${bgFading ? 'opacity-100' : 'opacity-0'}`}
          style={{
            pointerEvents: 'none',
            backgroundImage: `url(${nextBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-black/20 mix-blend-normal rest-glow pointer-events-none" />

      <div className="relative z-10 min-h-screen flex items-center justify-center pointer-events-none">
        <div className="text-center px-6">
          <p className="uppercase tracking-[0.4em] text-sm text-white/70 mb-3">Rest · Focus</p>
          <h1 className="text-4xl md:text-5xl font-semibold drop-shadow-lg mb-3">冥想自习室</h1>
          <p className="text-base text-white/80">在静谧的呼吸中保持专注，背景音乐与场景随心切换</p>
          {playHint && <p className="text-xs text-white/70 mt-2">{playHint}</p>}
        </div>
      </div>

      {isMobile && (
        <div className="fixed top-20 right-4 z-20 text-xs text-white/70 pointer-events-none">
          控件固定在底部与左下角
        </div>
      )}

      {controls}
    </div>
  );
}
