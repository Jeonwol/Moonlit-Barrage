import React from 'react';
import { Play, RotateCcw, Crosshair, Zap, Bomb, Sparkles, Trophy, Award, Clock, Flame } from 'lucide-react';
import { CharacterId, CharacterInfo, Difficulty, GameState } from '../game/types';

export const CHARACTERS: CharacterInfo[] = [
  {
    id: 'LYNN',
    name: '린 (Lynn)',
    title: '별빛의 마도사',
    avatarColor: '#0d9488',
    speedText: '보통 (4.6 / 저속 2.0)',
    shotDesc: '별빛 침탄 + 유도 스타 탈리스만',
    bombName: '성광「마스터 노바」',
    bombDesc: '정면 광범위 고출력 광선 빔! 전방 탄막을 소거하며 적을 관통 파괴',
  },
  {
    id: 'MIYA',
    name: '미야 (Miya)',
    title: '시간의 무녀',
    avatarColor: '#6366f1',
    speedText: '고속 (4.8 / 저속 2.1)',
    shotDesc: '고속 은빛 비도 + 직진 집중 단검',
    bombName: '시부「크로노스 스피어」',
    bombDesc: '전체 탄막 소거 + 5초간 적과 적 탄막이 70% 초저속(슬로우)으로 감속!',
  },
  {
    id: 'KAEDE',
    name: '카에데 (Kaede)',
    title: '홍련의 결계사',
    avatarColor: '#dc2626',
    speedText: '균형 (4.5 / 저속 1.9)',
    shotDesc: '홍련 부적 3방향 확산 + 음양옥',
    bombName: '봉마부「홍련의 결계」',
    bombDesc: '8개의 거대 결계가 팽창하여 화면 전체 탄막 소거 및 전방위 타격',
  },
];

interface MoonlitModalsProps {
  state: GameState;
  difficulty: Difficulty;
  character: CharacterId;
  score: number;
  hiScore: number;
  graze: number;
  points: number;
  lives: number;
  bombs: number;
  onSelectDifficulty: (d: Difficulty) => void;
  onSelectCharacter: (c: CharacterId) => void;
  onStartGame: (isPractice: boolean) => void;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export const MoonlitModals: React.FC<MoonlitModalsProps> = ({
  state,
  difficulty,
  character,
  score,
  hiScore,
  graze,
  points,
  lives,
  bombs,
  onSelectDifficulty,
  onSelectCharacter,
  onStartGame,
  onResume,
  onRestart,
  onReturnTitle,
}) => {
  if (state === 'PLAYING') return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm select-none text-white font-pixel overflow-y-auto">
      {/* Title / Start Screen */}
      {state === 'TITLE' && (
        <div className="w-full max-w-lg bg-slate-900 border-2 border-indigo-500/80 rounded-xl p-4 sm:p-5 text-center shadow-2xl cabinet-glow my-auto">
          <div className="text-[10px] text-cyan-400 mb-1 tracking-widest">
            동방프로젝트 EoSD 스타일 탄막 슈팅
          </div>
          <h1 className="text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-pink-400 to-amber-300 font-extrabold mb-1">
            월하탄막
          </h1>
          <div className="text-[9px] text-slate-400 mb-3 tracking-wider">
            ~ Moonlit Barrage ~
          </div>

          {/* Difficulty Selector */}
          <div className="mb-3">
            <div className="text-[9px] text-slate-400 mb-1.5 text-left">1. 난이도 선택 (DIFFICULTY)</div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Easy', 'Normal', 'Hard', 'Lunatic'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onSelectDifficulty(d)}
                  className={`py-1.5 rounded border text-[8px] font-bold transition-all ${
                    difficulty === d
                      ? 'bg-blue-600 border-blue-400 text-white ring-2 ring-blue-400/50 shadow-md scale-105'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Character Selector (캐릭터 선택) */}
          <div className="mb-3">
            <div className="text-[9px] text-slate-400 mb-1.5 text-left">2. 캐릭터 선택 (CHARACTER SELECT)</div>
            <div className="grid grid-cols-3 gap-2">
              {CHARACTERS.map((char) => {
                const isSelected = character === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => onSelectCharacter(char.id)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 ring-2 ring-cyan-500/50 shadow-lg scale-105'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Character Avatar Icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-1.5 shadow-inner border border-white/20"
                      style={{ backgroundColor: char.avatarColor }}
                    >
                      {char.id === 'LYNN' && <Sparkles className="w-5 h-5 text-amber-200" />}
                      {char.id === 'MIYA' && <Clock className="w-5 h-5 text-indigo-200" />}
                      {char.id === 'KAEDE' && <Flame className="w-5 h-5 text-amber-300" />}
                    </div>

                    <div className="text-[9px] font-bold text-white text-center leading-tight mb-0.5">
                      {char.name}
                    </div>
                    <div className="text-[7px] text-slate-400 text-center mb-1">
                      {char.title}
                    </div>

                    {/* Bomb Badge */}
                    <div className="w-full bg-slate-900/90 rounded p-1 border border-slate-800 text-[6.5px] leading-tight text-slate-300">
                      <div className="text-amber-400 font-bold truncate">★ {char.bombName}</div>
                      <div className="text-slate-400 line-clamp-2 mt-0.5">{char.bombDesc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Key Bindings */}
          <div className="bg-slate-950/90 rounded-lg p-2.5 text-left border border-slate-800 text-[7.5px] space-y-1 mb-3 leading-relaxed">
            <div className="flex gap-2">
              <span className="text-amber-300 font-bold shrink-0">Z:</span>
              <span className="text-slate-300">사격 (4프레임 연사)</span>
            </div>
            <div className="flex gap-2">
              <span className="text-rose-400 font-bold shrink-0">X:</span>
              <span className="text-slate-300">봄 & 데스봄 (피격 후 9프레임 내 누르면 생환)</span>
            </div>
            <div className="flex gap-2">
              <span className="text-cyan-300 font-bold shrink-0">Shift:</span>
              <span className="text-slate-300">저속 모드 + 코어 피격 판정점(2.2px) 표시 + 옵션 집중</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onStartGame(false)}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg border border-blue-400 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Play className="w-4 h-4 fill-white" />
              게임 시작 (GAME START)
            </button>

            <button
              type="button"
              onClick={() => onStartGame(true)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-600 shadow active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-[9px]"
            >
              <Crosshair className="w-3.5 h-3.5 text-rose-400" />
              보스 연습 모드 (BOSS PRACTICE)
            </button>
          </div>
        </div>
      )}

      {/* Pause Screen */}
      {state === 'PAUSED' && (
        <div className="w-full max-w-xs bg-slate-900 border-2 border-amber-500 rounded-xl p-5 text-center shadow-2xl">
          <h2 className="text-lg text-amber-400 font-bold mb-4 animate-pulse">일시 정지 (PAUSE)</h2>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded border border-blue-400 text-xs flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              계속하기 (Resume)
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 text-xs flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              처음부터 (Restart)
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 text-xs flex items-center justify-center gap-2 text-slate-400 hover:text-white"
            >
              타이틀로 (Title)
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {state === 'GAMEOVER' && (
        <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500 rounded-xl p-5 text-center shadow-2xl">
          <div className="text-rose-500 text-[10px] tracking-widest mb-1">ALL LIVES LOST</div>
          <h2 className="text-xl text-rose-400 font-bold mb-4 animate-pulse">GAME OVER</h2>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-[9px] space-y-2 mb-4 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">FINAL SCORE:</span>
              <span className="text-amber-400 font-bold">{score.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">HIGH SCORE ({difficulty}):</span>
              <span className="text-cyan-400 font-bold">{hiScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">TOTAL GRAZE:</span>
              <span className="text-emerald-400 font-bold">{graze}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">POINT ITEMS:</span>
              <span className="text-blue-400 font-bold">{points}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-lg border border-rose-400 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              다시 도전 (CONTINUE)
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 text-[10px]"
            >
              타이틀로 (TITLE)
            </button>
          </div>
        </div>
      )}

      {/* Stage Clear Tally Screen */}
      {state === 'CLEARED' && (
        <div className="w-full max-w-sm bg-slate-900 border-2 border-emerald-500 rounded-xl p-5 text-center shadow-2xl">
          <div className="text-emerald-400 text-[10px] tracking-widest mb-1 flex items-center justify-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            ALL BOSS PHASES CLEARED
          </div>
          <h2 className="text-xl text-emerald-300 font-bold mb-4 animate-pulse">STAGE CLEAR!!</h2>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-[9px] space-y-2 mb-4 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">잔여 잔기 보너스:</span>
              <span className="text-rose-400 font-bold">{lives} × 3,000,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">잔여 봄 보너스:</span>
              <span className="text-emerald-400 font-bold">{bombs} × 1,000,000</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1.5">
              <span className="text-slate-300">최종 점수:</span>
              <span className="text-amber-400 font-bold text-xs">{score.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg border border-emerald-400 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Award className="w-4 h-4" />
            타이틀로 돌아가기 (RETURN TO TITLE)
          </button>
        </div>
      )}
    </div>
  );
};
