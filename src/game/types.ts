// 월하탄막 ~ Moonlit Barrage Types

export type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Lunatic';

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'CLEARED';

export type BulletKind = 'SMALL' | 'RICE' | 'KNIFE' | 'PELLET' | 'LARGE';

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  angle: number;
  accel?: number;
  maxSpeed?: number;
  angularVelocity?: number;
  kind: BulletKind;
  color: string;
  glowColor?: string;
  hitRadius: number; // Small hitbox
  drawRadius: number; // Visual radius
  isEnemy: boolean;
  grazed?: boolean;
  tag?: string;
  lifeTime: number;
  onUpdate?: (bullet: Bullet, frame: number, player: PlayerEntity) => void;
}

export type EnemyKind = 'SQUAD_FAIRY' | 'CROSSING_FAIRY' | 'BIG_FAIRY' | 'MID_BOSS' | 'BOSS';

export interface EnemyDrop {
  type: ItemKind;
  count?: number;
}

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  name?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX?: number;
  targetY?: number;
  radius: number;
  hp: number;
  maxHp: number;
  frame: number;
  drops: EnemyDrop[];
  hitFlashTimer: number;
  action: (enemy: EnemyEntity, frame: number, ctx: GameContext) => void;
}

export type ItemKind = 'SMALL_POWER' | 'BIG_POWER' | 'POINT' | 'FULL_POWER' | 'BOMB' | 'ONE_UP' | 'SCORE_FRAGMENT';

export interface ItemEntity {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  vy: number;
  autoCollect: boolean;
}

export type CharacterId = 'LYNN' | 'MIYA' | 'KAEDE';

export interface CharacterInfo {
  id: CharacterId;
  name: string;
  title: string;
  avatarColor: string;
  speedText: string;
  shotDesc: string;
  bombName: string;
  bombDesc: string;
}

export interface PlayerOption {
  x: number;
  y: number;
}

export interface PlayerEntity {
  characterId: CharacterId;
  x: number;
  y: number;
  speed: number; // 4.6
  focusSpeed: number; // 2.0
  hitRadius: number; // 2.2px
  grazeRadius: number; // bullet drawRadius + 16px
  lives: number; // starts with 2 in reserve (3 total)
  bombs: number; // starts with 3
  power: number; // 0 ~ 128
  invincibleTimer: number;
  deathGraceTimer: number; // 9-frame deathbomb window
  isDead: boolean;
  shootCooldown: number;
  options: PlayerOption[];
}

export interface BossPhase {
  id: number;
  name: string;
  isSpell: boolean;
  spellName?: string;
  maxHp: number;
  timeLimitSec: number;
  bonusScore: number;
  onInit?: (boss: BossEntity, ctx: GameContext) => void;
  onUpdate: (boss: BossEntity, frame: number, ctx: GameContext) => void;
  onClearDrops: EnemyDrop[];
}

export interface BossEntity {
  name: string;
  title: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  hp: number;
  maxHp: number;
  phases: BossPhase[];
  currentPhaseIndex: number;
  phaseTimerSec: number;
  phaseFrame: number;
  invincibleTimer: number;
  hitFlashTimer: number;
  spellBonusFailed: boolean;
  spellBonusCurrent: number;
  defeated: boolean;
}

export interface ParticleEffect {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface FloatingBanner {
  id: number;
  text: string;
  subText?: string;
  color: string;
  y: number;
  alpha: number;
  timer: number;
  maxTimer: number;
  isSpell?: boolean;
}

export interface GameContext {
  difficulty: Difficulty;
  diffMultiplier: {
    bulletCount: number;
    bulletSpeed: number;
    aimedCount: number;
  };
  player: PlayerEntity;
  spawnBullet: (b: Omit<Bullet, 'id'>) => Bullet;
  spawnItem: (x: number, y: number, kind: ItemKind, autoCollect?: boolean) => void;
  addScore: (pts: number) => void;
  addGraze: () => void;
  triggerScreenShake: (duration: number, magnitude: number) => void;
  isPracticeBoss: boolean;
}
