import React, { useState } from 'react';
import { Crosshair, Bomb, Zap, Pause, Play, Volume2, VolumeX } from 'lucide-react';

interface TouchControlsProps {
  onMove: (dx: number, dy: number) => void;
  onShotPress: (pressed: boolean) => void;
  onBomb: () => void;
  focusMode: boolean;
  onToggleFocus: () => void;
  onPause: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  bombsLeft: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onShotPress,
  onBomb,
  focusMode,
  onToggleFocus,
  onPause,
  soundOn,
  onToggleSound,
  bombsLeft,
}) => {
  const [activeDir, setActiveDir] = useState<string | null>(null);

  const handlePad = (dir: string, dx: number, dy: number) => {
    setActiveDir(dir);
    onMove(dx, dy);
  };

  const handleRelease = () => {
    setActiveDir(null);
    onMove(0, 0);
  };

  return (
    <div className="w-full max-w-[640px] flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-b-xl select-none touch-none text-white font-pixel">
      {/* 8-Directional Pad */}
      <div className="grid grid-cols-3 gap-1 w-28 h-28 p-1 bg-slate-950 rounded-lg border border-slate-700">
        <button
          type="button"
          className={`rounded bg-slate-800 text-[9px] active:bg-blue-600 ${activeDir === 'UL' ? 'bg-blue-600' : ''}`}
          onTouchStart={() => handlePad('UL', -1, -1)}
          onTouchEnd={handleRelease}
          onMouseDown={() => handlePad('UL', -1, -1)}
          onMouseUp={handleRelease}
        >
          ↖
        </button>
        <button
          type="button"
          className={`rounded bg-slate-800 text-xs font-bold active:bg-blue-600 ${activeDir === 'U' ? 'bg-blue-600' : ''}`}
          onTouchStart={() => handlePad('U', 0, -1)}
          onTouchEnd={handleRelease}
          onMouseDown={() => handlePad('U', 0, -1)}
          onMouseUp={handleRelease}
        >
          ▲
        </button>
        <button
          type="button"
          className={`rounded bg-slate-800 text-[9px] active:bg-blue-600 ${activeDir === 'UR' ? 'bg-blue-600' : ''}`}
          onTouchStart={() => handlePad('UR', 1, -1)}
          onTouchEnd={handleRelease}
          onMouseDown={() => handlePad('UR', 1, -1)}
          onMouseUp={handleRelease}
        >
          ↗
        </button>

        <button
          type="button"
          className={`rounded bg-slate-800 text-xs font-bold active:bg-blue-600 ${activeDir === 'L' ? 'bg-blue-600' : ''}`}
          onTouchStart={() => handlePad('L', -1, 0)}
          onTouchEnd={handleRelease}
          onMouseDown={() => handlePad('L', -1, 0)}
          onMouseUp={handleRelease}
        >
          ◀
        </button>
        <div className="flex items-center justify-center text-[8px] text-slate-600">●</div>
        <button
          type="button"
          className={`rounded bg-slate-800 text-xs font-bold active:bg-blue-600 ${activeDir === 'R' ? 'bg-blue-600' : ''}`}
          onTouchStart={() => handlePad('R', 1, 0)}
          onTouchEnd={handleRelease}
          onMouseDown={() => handlePad('R', 1, 0)}
          onMouseUp={handleRelease}
        >
          ▶
        </button>

        <button
          type="button"
          className={`rounded bg-slate-800 text-[9px] active:bg-blue-600 ${activeDir === 'DL' ? 'bg-blue-600' : ''}`}
          onTouchStart={() => handlePad('DL', -1, 1)}
          onTouchEnd={handleRelease}
          onMouseDown={() => handlePad('DL', -1, 1)}
          onMouseUp={handleRelease}
        >
          ↙
        </button>
        <button
          type="button"
          className={`rounded bg-slate-800 text-xs font-bold active:bg-blue-600 ${activeDir === 'D' ? 'bg-blue-600' : ''}`}
          onTouchStart={() => handlePad('D', 0, 1)}
          onTouchEnd={handleRelease}
          onMouseDown={() => handlePad('D', 0, 1)}
          onMouseUp={handleRelease}
        >
          ▼
        </button>
        <button
          type="button"
          className={`rounded bg-slate-800 text-[9px] active:bg-blue-600 ${activeDir === 'DR' ? 'bg-blue-600' : ''}`}
          onTouchStart={() => handlePad('DR', 1, 1)}
          onTouchEnd={handleRelease}
          onMouseDown={() => handlePad('DR', 1, 1)}
          onMouseUp={handleRelease}
        >
          ↘
        </button>
      </div>

      {/* Middle Utility buttons: Sound, Pause */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onToggleSound}
          className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
          title="사운드 온/오프 [M]"
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
        <button
          type="button"
          onClick={onPause}
          className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
          title="일시정지 [ESC/P]"
        >
          <Pause className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons: Shift (Focus), Z (Shot), X (Bomb / Deathbomb) */}
      <div className="flex items-center gap-2">
        {/* Focus Mode (Shift) */}
        <button
          type="button"
          onClick={onToggleFocus}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all ${
            focusMode
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/50'
              : 'bg-slate-800 border-slate-600 text-slate-400'
          }`}
          title="저속 모드 / 판정점 표시 [Shift]"
        >
          <Crosshair className="w-4 h-4 mb-0.5" />
          <span className="text-[7px]">SLOW</span>
          <span className="text-[6px] text-slate-400">[SHIFT]</span>
        </button>

        {/* Shot Button [Z] */}
        <button
          type="button"
          onMouseDown={() => onShotPress(true)}
          onMouseUp={() => onShotPress(false)}
          onTouchStart={() => onShotPress(true)}
          onTouchEnd={() => onShotPress(false)}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-blue-600 hover:bg-blue-500 border-2 border-blue-400 text-white shadow-md active:scale-95"
          title="사격 [Z]"
        >
          <Zap className="w-4 h-4 mb-0.5 fill-white" />
          <span className="text-[8px]">SHOT</span>
          <span className="text-[6px] text-blue-200">[Z]</span>
        </button>

        {/* Super Bomb Button [X] */}
        <button
          type="button"
          onClick={onBomb}
          disabled={bombsLeft <= 0}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 transition-all shadow-lg active:scale-90 ${
            bombsLeft > 0
              ? 'bg-gradient-to-br from-rose-600 to-amber-600 border-amber-300 text-white animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-600 opacity-40'
          }`}
          title="봄 / 데스봄 발동 [X]"
        >
          <Bomb className="w-5 h-5 mb-0.5 text-amber-200" />
          <span className="text-[8px]">BOMB</span>
          <span className="text-[6px] text-amber-200">[X]</span>
        </button>
      </div>
    </div>
  );
};
