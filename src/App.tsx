import React, { useEffect, useRef, useState } from 'react';
import { MoonlitEngine } from './game/engine';
import { CharacterId, Difficulty, GameState } from './game/types';
import { MoonlitModals } from './components/MoonlitModals';
import { TouchControls } from './components/TouchControls';
import { soundManager } from './game/audio';
import { Volume2, VolumeX, Music, Tv, Maximize2, Pause, Sparkles } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MoonlitEngine | null>(null);

  // Synced Reactive State
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [difficulty, setDifficulty] = useState<Difficulty>('Normal');
  const [character, setCharacter] = useState<CharacterId>('LYNN');
  const [score, setScore] = useState<number>(0);
  const [hiScore, setHiScore] = useState<number>(3000000);
  const [graze, setGraze] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [lives, setLives] = useState<number>(2); // 2 in reserve = 3 lives
  const [bombs, setBombs] = useState<number>(3);
  const [power, setPower] = useState<number>(0);
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // Settings
  const [scanlines, setScanlines] = useState<boolean>(true);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [bgmOn, setBgmOn] = useState<boolean>(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new MoonlitEngine(canvasRef.current, {
      onScoreUpdate: (s, hs, grz, pts) => {
        setScore(s);
        setHiScore(hs);
        setGraze(grz);
        setPoints(pts);
      },
      onPlayerUpdate: (l, b, p) => {
        setLives(l);
        setBombs(b);
        setPower(p);
      },
      onStateChange: (state) => {
        setGameState(state);
      },
    });

    engineRef.current = engine;
    engine.setDifficulty(difficulty);

    return () => {
      engine.stop();
    };
  }, []);

  const handleSelectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    if (engineRef.current) {
      engineRef.current.setDifficulty(d);
      setHiScore(engineRef.current.hiScores[d]);
    }
  };

  const handleSelectCharacter = (c: CharacterId) => {
    setCharacter(c);
    if (engineRef.current) {
      engineRef.current.setCharacter(c);
    }
  };

  const handleStartGame = (isPractice: boolean = false) => {
    engineRef.current?.start(isPractice);
  };

  const handleResume = () => {
    engineRef.current?.togglePause();
  };

  const handleRestart = () => {
    engineRef.current?.start(engineRef.current.isPracticeBoss);
  };

  const handleReturnTitle = () => {
    if (engineRef.current) {
      engineRef.current.state = 'TITLE';
      engineRef.current.stop();
      setGameState('TITLE');
    }
  };

  const handleMove = (dx: number, dy: number) => {
    if (engineRef.current) {
      engineRef.current.touchMove = { x: dx, y: dy };
    }
  };

  const handleShotPress = (pressed: boolean) => {
    if (engineRef.current) {
      engineRef.current.virtualShot = pressed;
    }
  };

  const handleBomb = () => {
    engineRef.current?.triggerBombOrDeathbomb();
  };

  const handleToggleFocus = () => {
    const next = !focusMode;
    setFocusMode(next);
    if (engineRef.current) {
      engineRef.current.virtualFocus = next;
    }
  };

  const toggleSound = () => {
    const next = soundManager.toggleSFX();
    setSoundOn(next);
  };

  const toggleBgm = () => {
    const next = soundManager.toggleBGM();
    setBgmOn(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#060711] text-slate-100 flex flex-col items-center justify-center p-1 sm:p-4 select-none overflow-x-hidden font-pixel">
      {/* Top Arcade / Touhou Window Frame */}
      <div className="w-full max-w-[640px] flex items-center justify-between py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-t-xl text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] text-cyan-300 font-bold tracking-wider">
            月下彈幕 ~ Moonlit Barrage
          </span>
          <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            EoSD STYLE
          </span>
        </div>

        {/* Setting Toggles */}
        <div className="flex items-center gap-2">
          {/* Scanlines Filter */}
          <button
            type="button"
            onClick={() => setScanlines(!scanlines)}
            className={`p-1.5 rounded border transition-colors ${
              scanlines ? 'bg-cyan-950/90 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="CRT 스캔라인 필터 On/Off"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          {/* BGM Toggle */}
          <button
            type="button"
            onClick={toggleBgm}
            className={`p-1.5 rounded border transition-colors ${
              bgmOn ? 'bg-purple-950/90 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="BGM 온/오프"
          >
            <Music className="w-3.5 h-3.5" />
          </button>

          {/* SFX Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-1.5 rounded border transition-colors ${
              soundOn ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="효과음 온/오프 [M]"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Pause */}
          {gameState === 'PLAYING' && (
            <button
              type="button"
              onClick={() => engineRef.current?.togglePause()}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
              title="일시정지 [ESC/P]"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400"
            title="전체화면"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Container (Exact 640x480 EoSD resolution) */}
      <div className="relative w-full max-w-[640px] bg-black border-x border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center">
        <div className={`relative w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center ${scanlines ? 'crt-screen' : ''}`}>
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-full object-contain pixel-art block"
          />

          {/* Menus & Modals */}
          <MoonlitModals
            state={gameState}
            difficulty={difficulty}
            character={character}
            score={score}
            hiScore={hiScore}
            graze={graze}
            points={points}
            lives={lives}
            bombs={bombs}
            onSelectDifficulty={handleSelectDifficulty}
            onSelectCharacter={handleSelectCharacter}
            onStartGame={handleStartGame}
            onResume={handleResume}
            onRestart={handleRestart}
            onReturnTitle={handleReturnTitle}
          />
        </div>

        {/* On-Screen Touch / Mouse Controls */}
        <TouchControls
          onMove={handleMove}
          onShotPress={handleShotPress}
          onBomb={handleBomb}
          focusMode={focusMode}
          onToggleFocus={handleToggleFocus}
          onPause={() => engineRef.current?.togglePause()}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          bombsLeft={bombs}
        />
      </div>

      {/* Keyboard Guide Footer */}
      <div className="w-full max-w-[640px] mt-2 px-2 text-[8px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1 leading-normal">
        <div>
          <span className="text-amber-400 font-bold">방향키</span>: 이동 |{' '}
          <span className="text-cyan-400 font-bold">Shift</span>: 저속+코어판정(2.2px) |{' '}
          <span className="text-blue-400 font-bold">Z</span>: 사격 |{' '}
          <span className="text-rose-400 font-bold">X</span>: 봄&데스봄(9F 유예)
        </div>
        <div className="text-slate-500">
          ESC: 일시정지 | M: 사운드
        </div>
      </div>
    </div>
  );
}
