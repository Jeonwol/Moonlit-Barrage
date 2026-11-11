// Core Engine for 월하탄막 ~ Moonlit Barrage

import {
  BossEntity,
  BossPhase,
  Bullet,
  CharacterId,
  Difficulty,
  EnemyEntity,
  FloatingBanner,
  GameContext,
  GameState,
  ItemEntity,
  ItemKind,
  ParticleEffect,
  PlayerEntity,
} from './types';
import { SpriteRenderer } from './sprites';
import { soundManager } from './audio';

export interface EngineCallbacks {
  onScoreUpdate: (score: number, hiScore: number, graze: number, points: number) => void;
  onPlayerUpdate: (lives: number, bombs: number, power: number) => void;
  onStateChange: (state: GameState) => void;
  onBossUpdate?: (boss: BossEntity | null) => void;
}

export class MoonlitEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedStep = 1000 / 60; // 60fps fixed timestep

  // Play Area Coordinates (Matches EoSD 640x480 resolution)
  public readonly screenW = 640;
  public readonly screenH = 480;
  public readonly playX = 32;
  public readonly playY = 16;
  public readonly playW = 384;
  public readonly playH = 448;
  public readonly pocY = 16 + 112; // 128px (112px from play top)

  // Game State
  public state: GameState = 'TITLE';
  public difficulty: Difficulty = 'Normal';
  public isPracticeBoss: boolean = false;
  public score: number = 0;
  public hiScores: Record<Difficulty, number> = {
    Easy: 1000000,
    Normal: 3000000,
    Hard: 5000000,
    Lunatic: 10000000,
  };
  public grazeCount: number = 0;
  public pointItemCount: number = 0;
  public stageFrame: number = 0;
  public stageClockPaused: boolean = false;
  public extendsAwarded: number = 0;

  // Entities
  public player: PlayerEntity;
  public bullets: Bullet[] = [];
  public enemies: EnemyEntity[] = [];
  public items: ItemEntity[] = [];
  public boss: BossEntity | null = null;
  public particles: ParticleEffect[] = [];
  public banners: FloatingBanner[] = [];

  // Character & Bomb Special States
  public selectedCharacter: CharacterId = 'LYNN';
  public bombActiveTimer: number = 0;
  public timeSlowTimer: number = 0; // For Miya's Chronos bomb

  // Screen shake
  public shakeDuration: number = 0;
  public shakeMagnitude: number = 0;

  // Input State
  public keys: Record<string, boolean> = {};
  public touchMove: { x: number; y: number } = { x: 0, y: 0 };
  public virtualShot: boolean = false;
  public virtualBomb: boolean = false;
  public virtualFocus: boolean = false;

  private callbacks: EngineCallbacks;
  private nextId = 1;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D canvas context');
    this.ctx = context;
    this.callbacks = callbacks;

    // Load High Scores
    try {
      const saved = localStorage.getItem('moonlit_barrage_hiscores');
      if (saved) {
        this.hiScores = { ...this.hiScores, ...JSON.parse(saved) };
      }
    } catch {}

    this.player = this.createDefaultPlayer();
    this.setupInputs();
  }

  public setCharacter(charId: CharacterId) {
    this.selectedCharacter = charId;
    this.player.characterId = charId;
  }

  private createDefaultPlayer(): PlayerEntity {
    return {
      characterId: this.selectedCharacter,
      x: this.playX + this.playW / 2,
      y: this.playY + this.playH - 48,
      speed: 4.6,
      focusSpeed: 2.0,
      hitRadius: 2.2, // Authentic Touhou 2.2px core hitbox
      grazeRadius: 20,
      lives: 2, // 2 reserves = 3 lives total
      bombs: 3,
      power: 0, // 0 ~ 128
      invincibleTimer: 120,
      deathGraceTimer: 0,
      isDead: false,
      shootCooldown: 0,
      options: [],
    };
  }

  public setDifficulty(d: Difficulty) {
    this.difficulty = d;
  }

  private getDiffMultipliers() {
    switch (this.difficulty) {
      case 'Easy':
        return { bulletCount: 0.55, bulletSpeed: 0.82, aimedCount: 1 };
      case 'Normal':
        return { bulletCount: 1.0, bulletSpeed: 1.0, aimedCount: 3 };
      case 'Hard':
        return { bulletCount: 1.45, bulletSpeed: 1.12, aimedCount: 5 };
      case 'Lunatic':
        return { bulletCount: 1.9, bulletSpeed: 1.24, aimedCount: 7 };
    }
  }

  private setupInputs() {
    const onKeyDown = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      // Z / Enter = Shot or Menu Confirm
      // X = Bomb or Deathbomb!
      if (e.code === 'KeyX') {
        e.preventDefault();
        this.triggerBombOrDeathbomb();
      }

      // Esc or P = Pause
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        this.togglePause();
      }

      // M = Toggle sound
      if (e.code === 'KeyM') {
        e.preventDefault();
        soundManager.toggleSFX();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  public start(isPractice: boolean = false) {
    this.state = 'PLAYING';
    this.isPracticeBoss = isPractice;
    this.score = 0;
    this.grazeCount = 0;
    this.pointItemCount = 0;
    this.stageFrame = 0;
    this.stageClockPaused = false;
    this.extendsAwarded = 0;
    this.bombActiveTimer = 0;

    this.player = this.createDefaultPlayer();
    if (isPractice) {
      this.player.power = 128; // Full power for practice
    }
    this.bullets = [];
    this.enemies = [];
    this.items = [];
    this.boss = null;
    this.particles = [];
    this.banners = [];

    soundManager.startBGM();
    this.callbacks.onStateChange('PLAYING');
    this.syncStats();

    if (isPractice) {
      // Jump directly to Boss Shizuku Meira
      this.spawnBossShizuku();
    } else {
      // Stage 1 Start Banner
      this.addBanner('STAGE 1', '달빛 내린 서리 호수', '#e0f2fe', 160);
    }

    if (!this.animId) {
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this.loop);
    }
  }

  public togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.callbacks.onStateChange('PAUSED');
      soundManager.stopBGM();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.callbacks.onStateChange('PLAYING');
      soundManager.startBGM();
    }
  }

  public stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    soundManager.stopBGM();
  }

  // --- Fixed 60fps Loop ---
  private loop = (time: number) => {
    const elapsed = time - this.lastTime;
    this.lastTime = time;
    this.accumulator += Math.min(elapsed, 100);

    soundManager.onNewFrame();

    while (this.accumulator >= this.fixedStep) {
      if (this.state === 'PLAYING') {
        this.stepFixedFrame();
      }
      this.accumulator -= this.fixedStep;
    }

    this.render();
    this.animId = requestAnimationFrame(this.loop);
  };

  // --- Step 1 Frame of 60FPS Logic ---
  private stepFixedFrame() {
    // 1. Stage Timeline Clock (pauses if boss is active)
    if (!this.stageClockPaused && !this.boss) {
      this.stageFrame++;
      this.checkStageTimeline();
    }

    // 2. Player Updates (Movement, Shot, Focus, Deathbomb grace)
    this.updatePlayer();

    // 3. Bomb Effects
    this.updateBomb();

    // 4. Boss & Enemies
    this.updateBoss();
    this.updateEnemies();

    // 5. Bullets & Collisions
    this.updateBullets();

    // 6. Items & Collection
    this.updateItems();

    // 7. Particles & Banners
    this.updateParticlesAndBanners();

    // 8. Screen shake decay & Time slow decay
    if (this.shakeDuration > 0) this.shakeDuration--;
    if (this.timeSlowTimer > 0) this.timeSlowTimer--;
  }

  // --- Player Update ---
  private updatePlayer() {
    const p = this.player;

    if (p.invincibleTimer > 0) p.invincibleTimer--;

    // Deathbomb 9-Frame Grace Timer
    if (p.deathGraceTimer > 0) {
      p.deathGraceTimer--;
      if (p.deathGraceTimer === 0) {
        // Grace period expired without bomb -> Actual death!
        this.executePlayerDeath();
        return;
      }
    }

    // Determine Focus Mode (Shift key or virtual focus toggle)
    const focus = this.keys['shift'] || this.keys['shiftleft'] || this.keys['shiftright'] || this.virtualFocus;

    // 8-Directional Movement with Diagonal Normalization (x0.7071)
    let mx = 0;
    let my = 0;
    if (this.keys['arrowleft'] || this.keys['keya']) mx -= 1;
    if (this.keys['arrowright'] || this.keys['keyd']) mx += 1;
    if (this.keys['arrowup'] || this.keys['keyw']) my -= 1;
    if (this.keys['arrowdown'] || this.keys['keys']) my += 1;

    mx += this.touchMove.x;
    my += this.touchMove.y;

    const len = Math.hypot(mx, my);
    if (len > 0.05) {
      const normX = mx / Math.max(1, len);
      const normY = my / Math.max(1, len);
      const spd = focus ? p.focusSpeed : p.speed;
      p.x += normX * spd;
      p.y += normY * spd;
    }

    // Clamp Player in Play Area
    const pad = 12;
    p.x = Math.max(this.playX + pad, Math.min(this.playX + this.playW - pad, p.x));
    p.y = Math.max(this.playY + pad, Math.min(this.playY + this.playH - pad, p.y));

    // Update Player Options Positions based on Power & Focus Mode
    this.updatePlayerOptions(focus);

    // Shooting (Z key or auto-fire, every 4 frames)
    const wantsShoot = this.keys['keyz'] || this.keys['z'] || this.virtualShot || true; // Continuous fire when held
    if (p.shootCooldown > 0) {
      p.shootCooldown--;
    } else if (wantsShoot) {
      this.firePlayerShot(focus);
      p.shootCooldown = 4; // 4-frame firing cadence
    }
  }

  private updatePlayerOptions(focus: boolean) {
    const p = this.player;
    const power = p.power;

    let optCount = 0;
    if (power >= 8 && power < 48) optCount = 2;
    else if (power >= 48) optCount = 4;

    const opts: { x: number; y: number }[] = [];
    if (optCount === 2) {
      const dx = focus ? 12 : 24;
      const dy = focus ? -16 : -8;
      opts.push({ x: p.x - dx, y: p.y + dy });
      opts.push({ x: p.x + dx, y: p.y + dy });
    } else if (optCount === 4) {
      const dx1 = focus ? 10 : 22;
      const dx2 = focus ? 18 : 38;
      const dy = focus ? -18 : -10;
      opts.push({ x: p.x - dx1, y: p.y + dy });
      opts.push({ x: p.x + dx1, y: p.y + dy });
      opts.push({ x: p.x - dx2, y: p.y + dy + 4 });
      opts.push({ x: p.x + dx2, y: p.y + dy + 4 });
    }
    p.options = opts;
  }

  private firePlayerShot(focus: boolean) {
    const p = this.player;
    soundManager.playShot();

    // Main Shot: 2 bullets (dx ±7), dmg 2.6, speed 15
    this.bullets.push({
      id: this.nextId++,
      x: p.x - 7,
      y: p.y - 12,
      vx: 0,
      vy: -15,
      speed: 15,
      angle: -Math.PI / 2,
      kind: 'PELLET',
      color: '#38bdf8',
      hitRadius: 4,
      drawRadius: 5,
      isEnemy: false,
      lifeTime: 0,
    });
    this.bullets.push({
      id: this.nextId++,
      x: p.x + 7,
      y: p.y - 12,
      vx: 0,
      vy: -15,
      speed: 15,
      angle: -Math.PI / 2,
      kind: 'PELLET',
      color: '#38bdf8',
      hitRadius: 4,
      drawRadius: 5,
      isEnemy: false,
      lifeTime: 0,
    });

    // Option Shots
    if (p.options.length > 0) {
      let optDmg = 1.03;
      if (p.power >= 16 && p.power < 48) optDmg = 1.2;
      else if (p.power >= 48 && p.power < 128) optDmg = 1.6;
      else if (p.power >= 128) optDmg = 1.94;

      // Find nearest target (Boss priority)
      let target: { x: number; y: number } | null = null;
      if (this.boss && this.boss.hp > 0) {
        target = { x: this.boss.x, y: this.boss.y };
      } else if (this.enemies.length > 0) {
        target = { x: this.enemies[0].x, y: this.enemies[0].y };
      }

      p.options.forEach((opt, idx) => {
        let vx = 0;
        let vy = -14;
        let angle = -Math.PI / 2;

        if (!focus) {
          // Spread in fan & homing towards target (max 0.12 rad/frame)
          const spreadAng = (idx - (p.options.length - 1) / 2) * 0.15;
          angle = -Math.PI / 2 + spreadAng;
          vx = Math.cos(angle) * 14;
          vy = Math.sin(angle) * 14;
        }

        this.bullets.push({
          id: this.nextId++,
          x: opt.x,
          y: opt.y - 6,
          vx,
          vy,
          speed: 14,
          angle,
          kind: 'PELLET',
          color: focus ? '#38bdf8' : '#f43f5e',
          hitRadius: 3.5,
          drawRadius: 4.5,
          isEnemy: false,
          tag: focus ? undefined : 'homing',
          lifeTime: 0,
          onUpdate: (b) => {
            if (!focus && target) {
              const toAng = Math.atan2(target.y - b.y, target.x - b.x);
              const curAng = Math.atan2(b.vy, b.vx);
              const diff = toAng - curAng;
              const turn = Math.sign(Math.sin(diff)) * 0.12;
              const newAng = curAng + turn;
              b.vx = Math.cos(newAng) * b.speed;
              b.vy = Math.sin(newAng) * b.speed;
            }
          },
        });
      });
    }
  }

  // --- Bomb & Deathbomb ---
  public triggerBombOrDeathbomb() {
    const p = this.player;
    if (p.bombs <= 0) return;
    if (this.bombActiveTimer > 0) return;

    p.bombs--;
    p.deathGraceTimer = 0; // Death cancelled!
    this.bombActiveTimer = 200; // 200 frames total invincibility
    p.invincibleTimer = 200;

    // Character-Specific Bomb Triggers
    if (p.characterId === 'MIYA') {
      // Miya: Chronos Sphere (Time Dilation Slow Motion)
      soundManager.playTimeSlow();
      soundManager.playBomb();
      this.timeSlowTimer = 300; // 5 full seconds of slow motion for enemies & bullets

      // Immediately clear all existing bullets into score fragments
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (b.isEnemy) {
          this.spawnItem(b.x, b.y, 'SCORE_FRAGMENT', true);
          this.bullets.splice(i, 1);
        }
      }
      this.addBanner('시부「크로노스 스피어」', 'TIME DILATION [SLOW MOTION]', '#a5b4fc', 120);
    } else if (p.characterId === 'KAEDE') {
      // Kaede: Crimson Barrier
      soundManager.playBarrier();
      soundManager.playBomb();

      // Clear all bullets into score fragments
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (b.isEnemy) {
          this.spawnItem(b.x, b.y, 'SCORE_FRAGMENT', true);
          this.bullets.splice(i, 1);
        }
      }
      this.addBanner('봉마부「홍련의 결계」', 'CRIMSON BARRIER', '#ef4444', 90);
    } else {
      // Lynn: Master Nova (Massive Frontal Penetrating Beam)
      soundManager.playLaserBeam();
      soundManager.playBomb();

      // Clear immediate nearby bullets around Lynn for safe firing
      this.bullets = this.bullets.filter((b) => {
        if (!b.isEnemy) return true;
        const d = Math.hypot(b.x - p.x, b.y - p.y);
        return d > 70;
      });
      this.addBanner('성광「마스터 노바」', 'HYPER BEAM CANNON', '#38bdf8', 90);
    }

    this.triggerScreenShake(24, 9);

    // If used during a spellcard, spellcard bonus is failed
    if (this.boss && this.boss.phases[this.boss.currentPhaseIndex]?.isSpell) {
      this.boss.spellBonusFailed = true;
      this.addBanner('BONUS FAILED...', '', '#ef4444', 60);
    }

    this.syncStats();
  }

  private updateBomb() {
    if (this.bombActiveTimer <= 0) return;
    this.bombActiveTimer--;

    const p = this.player;

    if (p.characterId === 'LYNN') {
      // Lynn: Frontal wide beam (width 110px) continuously obliterates bullets and lasers enemies!
      const beamW = 110;
      const leftX = p.x - beamW / 2;
      const rightX = p.x + beamW / 2;

      // Vaporize bullets inside beam
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (b.isEnemy && b.x >= leftX && b.x <= rightX && b.y <= p.y) {
          this.spawnItem(b.x, b.y, 'SCORE_FRAGMENT', true);
          this.bullets.splice(i, 1);
        }
      }

      // Continuous piercing beam damage
      this.enemies.forEach((e) => {
        if (e.x >= leftX - 10 && e.x <= rightX + 10 && e.y <= p.y) {
          e.hp -= 8;
          e.hitFlashTimer = 2;
          if (e.hp <= 0) this.destroyEnemy(e);
        }
      });

      if (this.boss && this.boss.invincibleTimer <= 0) {
        if (this.boss.x >= leftX - 20 && this.boss.x <= rightX + 20 && this.boss.y <= p.y) {
          this.boss.hp -= 2.4;
          this.boss.hitFlashTimer = 2;
          if (this.boss.hp <= 0) this.advanceBossPhase();
        }
      }
    } else if (p.characterId === 'MIYA') {
      // Miya: Screen damage during first 140 frames
      if (this.bombActiveTimer >= 60) {
        this.enemies.forEach((e) => {
          e.hp -= 4.5;
          e.hitFlashTimer = 2;
          if (e.hp <= 0) this.destroyEnemy(e);
        });

        if (this.boss && this.boss.invincibleTimer <= 0) {
          this.boss.hp -= 1.1;
          this.boss.hitFlashTimer = 2;
          if (this.boss.hp <= 0) this.advanceBossPhase();
        }
      }
    } else {
      // Kaede: Expanding barrier clears and damages all enemies
      if (this.bombActiveTimer >= 50) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const b = this.bullets[i];
          if (b.isEnemy) {
            this.spawnItem(b.x, b.y, 'SCORE_FRAGMENT', true);
            this.bullets.splice(i, 1);
          }
        }

        this.enemies.forEach((e) => {
          e.hp -= 6.5;
          e.hitFlashTimer = 2;
          if (e.hp <= 0) this.destroyEnemy(e);
        });

        if (this.boss && this.boss.invincibleTimer <= 0) {
          this.boss.hp -= 1.5;
          this.boss.hitFlashTimer = 2;
          if (this.boss.hp <= 0) this.advanceBossPhase();
        }
      }
    }
  }

  private triggerPlayerHit() {
    const p = this.player;
    if (p.invincibleTimer > 0 || p.deathGraceTimer > 0) return;

    // Start 9-Frame Deathbomb Grace Period!
    p.deathGraceTimer = 9;
    soundManager.playPlayerHit();
    this.triggerScreenShake(12, 6);
  }

  private executePlayerDeath() {
    const p = this.player;
    p.lives--;
    p.deathGraceTimer = 0;

    soundManager.playPlayerHit();
    this.triggerScreenShake(25, 10);

    // 1. Clear all bullets
    this.bullets = this.bullets.filter((b) => !b.isEnemy);

    // 2. Power decreases by 16, 5 power items bounce upwards
    p.power = Math.max(0, p.power - 16);
    for (let i = 0; i < 5; i++) {
      const it = this.spawnItem(p.x + (i - 2) * 12, p.y - 10, 'SMALL_POWER');
      if (it) it.vy = -3.5 - Math.random() * 2;
    }

    // 3. Bombs reset to 3, 240 frames invincibility, respawn at bottom center
    p.bombs = 3;
    p.invincibleTimer = 240;
    p.x = this.playX + this.playW / 2;
    p.y = this.playY + this.playH - 48;

    // Spellcard bonus fail
    if (this.boss && this.boss.phases[this.boss.currentPhaseIndex]?.isSpell) {
      this.boss.spellBonusFailed = true;
      this.addBanner('BONUS FAILED...', '', '#ef4444', 60);
    }

    this.syncStats();

    // 4. Game Over if lives < 0
    if (p.lives < 0) {
      this.state = 'GAMEOVER';
      this.callbacks.onStateChange('GAMEOVER');
      soundManager.stopBGM();
    }
  }

  // --- Stage Timeline & Scripting ---
  private checkStageTimeline() {
    const f = this.stageFrame;

    // Squad Fairies (대열 요정)
    if (f >= 100 && f <= 340 && f % 40 === 0) {
      this.spawnSquadFairy(f % 80 === 0 ? 'left' : 'right');
    }

    // Crossing Fairies (횡단 요정)
    if (f >= 420 && f <= 720 && f % 50 === 0) {
      this.spawnCrossingFairy(f % 100 === 0 ? -1 : 1);
    }

    // Big Fairy (큰 요정)
    if (f === 800) {
      this.spawnBigFairy();
    }

    // Squad Wave 2
    if (f >= 1100 && f <= 1380 && f % 35 === 0) {
      this.spawnSquadFairy('both');
    }

    // Warning Siren -> Mid-boss Noah
    if (f === 1500) {
      soundManager.playWarningSiren();
      this.addBanner('WARNING!', '숲그늘의 요정 「노아」 출현', '#fbbf24', 90);
    }
    if (f === 1600) {
      this.spawnMidBossNoah();
    }

    // Post mid-boss waves (f resumed after Noah defeated)
    if (f >= 2000 && f <= 2400 && f % 45 === 0) {
      this.spawnSquadFairy('both');
    }
    if (f === 2500) {
      this.spawnBigFairy();
    }

    // Boss Warning -> Boss Shizuku Meira
    if (f === 2850) {
      soundManager.playWarningSiren();
      this.addBanner('WARNING!', '서리꽃의 수정술사 「시즈쿠 메이라」', '#f43f5e', 100);
    }
    if (f === 2950) {
      this.spawnBossShizuku();
    }
  }

  // Fairy Spawners
  private spawnSquadFairy(side: 'left' | 'right' | 'both') {
    const mult = this.getDiffMultipliers();
    const spawnOne = (x: number) => {
      this.enemies.push({
        id: this.nextId++,
        kind: 'SQUAD_FAIRY',
        x,
        y: this.playY - 20,
        vx: 0,
        vy: 1.8,
        targetY: this.playY + 70 + Math.random() * 50,
        radius: 10,
        hp: 6,
        maxHp: 6,
        frame: 0,
        drops: [{ type: Math.random() > 0.5 ? 'SMALL_POWER' : 'POINT', count: 1 }],
        hitFlashTimer: 0,
        action: (e, frame) => {
          if (frame < 40) {
            e.y += e.vy;
          } else if (frame === 45) {
            // Aimed rice bullet fan
            this.fireAimedSpread(e.x, e.y, mult.aimedCount, 0.45, 2.2 * mult.bulletSpeed, 'RICE', '#ec4899');
          } else if (frame > 75) {
            e.x += (x < this.playX + this.playW / 2 ? -2.2 : 2.2);
            e.y += 0.8;
          }
        },
      });
    };

    if (side === 'left' || side === 'both') spawnOne(this.playX + 80);
    if (side === 'right' || side === 'both') spawnOne(this.playX + this.playW - 80);
  }

  private spawnCrossingFairy(dir: number) {
    const mult = this.getDiffMultipliers();
    const startX = dir === 1 ? this.playX - 10 : this.playX + this.playW + 10;
    this.enemies.push({
      id: this.nextId++,
      kind: 'CROSSING_FAIRY',
      x: startX,
      y: this.playY + 80 + Math.random() * 60,
      vx: dir * 1.8,
      vy: 0,
      radius: 10,
      hp: 5,
      maxHp: 5,
      frame: 0,
      drops: [{ type: 'POINT', count: 1 }],
      hitFlashTimer: 0,
      action: (e, frame) => {
        e.x += e.vx;
        e.y += Math.sin(frame * 0.08) * 1.5;
        if (frame % 48 === 0 && e.x > this.playX + 30 && e.x < this.playX + this.playW - 30) {
          const ringCount = Math.max(1, Math.round(6 * mult.bulletCount));
          this.fireRing(e.x, e.y, ringCount, frame * 0.1, 1.8 * mult.bulletSpeed, 'SMALL', '#06b6d4');
        }
      },
    });
  }

  private spawnBigFairy() {
    const mult = this.getDiffMultipliers();
    this.enemies.push({
      id: this.nextId++,
      kind: 'BIG_FAIRY',
      x: this.playX + this.playW / 2,
      y: this.playY - 30,
      vx: 0,
      vy: 1.2,
      targetY: this.playY + 95,
      radius: 20,
      hp: 90,
      maxHp: 90,
      frame: 0,
      drops: [
        { type: 'BIG_POWER', count: 2 },
        { type: 'POINT', count: 4 },
      ],
      hitFlashTimer: 0,
      action: (e, frame) => {
        if (frame < 50) {
          e.y += e.vy;
        } else if (frame < 300) {
          // 5-second rotating spiral
          if (frame % 8 === 0) {
            const arms = Math.max(1, Math.round(3 * mult.bulletCount));
            this.fireSpiral(e.x, e.y, arms, frame * 0.12, 1.9 * mult.bulletSpeed, 'PELLET', '#fbbf24');
          }
        } else {
          e.y -= 1.5; // Exit upwards
        }
      },
    });
  }

  // --- Mid-Boss Noah (2 Phases) ---
  private spawnMidBossNoah() {
    this.stageClockPaused = true;
    const mult = this.getDiffMultipliers();

    const phases: BossPhase[] = [
      // Phase 1: 통상 (HP 1,100, 30s)
      {
        id: 1,
        name: '통상',
        isSpell: false,
        maxHp: 1100,
        timeLimitSec: 30,
        bonusScore: 0,
        onClearDrops: [
          { type: 'SMALL_POWER', count: 2 },
          { type: 'POINT', count: 2 },
        ],
        onUpdate: (b, frame) => {
          // Counter-rotating rice rings every 14 frames
          if (frame % 14 === 0) {
            const count = Math.max(1, Math.round(10 * mult.bulletCount));
            this.fireRing(b.x, b.y, count, frame * 0.08, 1.8 * mult.bulletSpeed, 'RICE', '#10b981');
            this.fireRing(b.x, b.y, count, -frame * 0.08, 1.8 * mult.bulletSpeed, 'RICE', '#06b6d4');
          }
          // Move every 2 seconds
          if (frame % 120 === 0) {
            b.targetX = this.playX + 80 + Math.random() * (this.playW - 160);
            b.targetY = this.playY + 70 + Math.random() * 50;
          }
        },
      },
      // Phase 2: 요정부「반딧불 원무」 (HP 1,500, 35s, 500,000 bonus)
      {
        id: 2,
        name: '요정부「반딧불 원무」',
        isSpell: true,
        spellName: '요정부「반딧불 원무」',
        maxHp: 1500,
        timeLimitSec: 35,
        bonusScore: 500000,
        onClearDrops: [
          { type: 'BOMB', count: 1 },
          { type: 'POINT', count: 5 },
        ],
        onInit: () => {
          soundManager.playSpellDeclare();
          this.addBanner('요정부「반딧불 원무」', 'BONUS: 500,000', '#fbbf24', 120, true);
        },
        onUpdate: (b, frame) => {
          // Orbiting firefly bullets that accelerate towards player after 50 frames
          if (frame % 18 === 0) {
            const count = Math.max(1, Math.round(4 * mult.bulletCount));
            for (let i = 0; i < count; i++) {
              const ang = frame * 0.15 + (i * Math.PI * 2) / count;
              this.bullets.push({
                id: this.nextId++,
                x: b.x + Math.cos(ang) * 30,
                y: b.y + Math.sin(ang) * 30,
                vx: Math.cos(ang) * 0.5,
                vy: Math.sin(ang) * 0.5,
                speed: 0.5,
                angle: ang,
                kind: 'SMALL',
                color: '#34d399',
                hitRadius: 2.5,
                drawRadius: 4,
                isEnemy: true,
                lifeTime: 0,
                onUpdate: (bullet, bFrame, p) => {
                  if (bFrame === 50) {
                    bullet.color = '#fbbf24'; // turn yellow
                    const toPlayer = Math.atan2(p.y - bullet.y, p.x - bullet.x);
                    bullet.angle = toPlayer;
                    bullet.vx = Math.cos(toPlayer) * 2.8 * mult.bulletSpeed;
                    bullet.vy = Math.sin(toPlayer) * 2.8 * mult.bulletSpeed;
                  }
                },
              });
            }
          }
          // Aimed knife bullets occasionally
          if (frame % 60 === 0) {
            this.fireAimedSpread(b.x, b.y, mult.aimedCount, 0.4, 2.4 * mult.bulletSpeed, 'KNIFE', '#10b981');
          }
        },
      },
    ];

    this.boss = {
      name: '노아',
      title: '숲그늘의 요정',
      x: this.playX + this.playW / 2,
      y: this.playY - 40,
      targetX: this.playX + this.playW / 2,
      targetY: this.playY + 90,
      radius: 18,
      hp: phases[0].maxHp,
      maxHp: phases[0].maxHp,
      phases,
      currentPhaseIndex: 0,
      phaseTimerSec: phases[0].timeLimitSec,
      phaseFrame: 0,
      invincibleTimer: 100,
      hitFlashTimer: 0,
      spellBonusFailed: false,
      spellBonusCurrent: phases[0].bonusScore,
      defeated: false,
    };
  }

  // --- Boss Shizuku Meira (5 Phases) ---
  private spawnBossShizuku() {
    this.stageClockPaused = true;
    const mult = this.getDiffMultipliers();

    const phases: BossPhase[] = [
      // 1. 통상 1 (HP 1,800, 35s)
      {
        id: 1,
        name: '통상 1',
        isSpell: false,
        maxHp: 1800,
        timeLimitSec: 35,
        bonusScore: 0,
        onClearDrops: [
          { type: 'SMALL_POWER', count: 2 },
          { type: 'POINT', count: 2 },
        ],
        onUpdate: (b, frame) => {
          // Every 9 frames rotating 16-bullet ring (red/pink alternate)
          if (frame % 9 === 0) {
            const count = Math.max(1, Math.round(16 * mult.bulletCount));
            const color = (frame % 18 === 0) ? '#ef4444' : '#ec4899';
            this.fireRing(b.x, b.y, count, frame * 0.12, 1.8 * mult.bulletSpeed, 'SMALL', color);
          }
          // Aimed knife fan every 1s
          if (frame % 60 === 0) {
            this.fireAimedSpread(b.x, b.y, mult.aimedCount, 0.5, 2.5 * mult.bulletSpeed, 'KNIFE', '#38bdf8');
          }
          if (frame % 150 === 0) {
            b.targetX = this.playX + 80 + Math.random() * (this.playW - 160);
          }
        },
      },
      // 2. 빙결부「서리꽃 만다라」 (HP 2,400, 45s, 1,000,000 bonus)
      {
        id: 2,
        name: '빙결부「서리꽃 만다라」',
        isSpell: true,
        spellName: '빙결부「서리꽃 만다라」',
        maxHp: 2400,
        timeLimitSec: 45,
        bonusScore: 1000000,
        onClearDrops: [
          { type: 'BIG_POWER', count: 1 },
          { type: 'POINT', count: 5 },
        ],
        onInit: () => {
          soundManager.playSpellDeclare();
          this.addBanner('빙결부「서리꽃 만다라」', 'BONUS: 1,000,000', '#38bdf8', 120, true);
        },
        onUpdate: (b, frame) => {
          // 4s cycle (240 frames):
          const cycleF = frame % 240;
          if (cycleF < 150 && cycleF % 12 === 0) {
            // Dual 5-way spirals
            const arms = Math.max(1, Math.round(5 * mult.bulletCount));
            this.fireSpiral(b.x, b.y, arms, cycleF * 0.15, 2.0 * mult.bulletSpeed, 'PELLET', '#06b6d4', 'frost');
            this.fireSpiral(b.x, b.y, arms, -cycleF * 0.15, 2.0 * mult.bulletSpeed, 'PELLET', '#93c5fd', 'frost');
          } else if (cycleF === 150) {
            // Freeze all bullets white!
            soundManager.playIceFreeze();
            this.bullets.forEach((bullet) => {
              if (bullet.tag === 'frost') {
                bullet.vx = 0;
                bullet.vy = 0;
                bullet.color = '#ffffff';
              }
            });
          } else if (cycleF === 192) {
            // After 0.7s (42 frames), slowly release in random angles
            this.bullets.forEach((bullet) => {
              if (bullet.tag === 'frost') {
                const ang = Math.random() * Math.PI * 2;
                bullet.color = '#67e8f9';
                bullet.angle = ang;
                bullet.vx = Math.cos(ang) * 1.4 * mult.bulletSpeed;
                bullet.vy = Math.sin(ang) * 1.4 * mult.bulletSpeed;
                bullet.tag = undefined;
              }
            });
          }
        },
      },
      // 3. 통상 2 (HP 2,000, 40s)
      {
        id: 3,
        name: '통상 2',
        isSpell: false,
        maxHp: 2000,
        timeLimitSec: 40,
        bonusScore: 0,
        onClearDrops: [
          { type: 'SMALL_POWER', count: 2 },
          { type: 'POINT', count: 2 },
        ],
        onUpdate: (b, frame) => {
          // Fixed targeted burst for 0.6s
          if (frame % 90 < 36 && frame % 6 === 0) {
            this.fireAimedSpread(b.x, b.y, mult.aimedCount, 0.25, 3.2 * mult.bulletSpeed, 'RICE', '#ec4899');
          }
          // Counter-curving 20-bullet rings every 0.75s (45 frames)
          if (frame % 45 === 0) {
            const count = Math.max(1, Math.round(20 * mult.bulletCount));
            this.fireRing(b.x, b.y, count, frame * 0.1, 1.8 * mult.bulletSpeed, 'SMALL', '#3b82f6');
            this.fireRing(b.x, b.y, count, -frame * 0.1, 1.8 * mult.bulletSpeed, 'SMALL', '#60a5fa');
          }
        },
      },
      // 4. 환월부「붉은 달의 회랑」 (HP 2,600, 50s, 1,500,000 bonus)
      {
        id: 4,
        name: '환월부「붉은 달의 회랑」',
        isSpell: true,
        spellName: '환월부「붉은 달의 회랑」',
        maxHp: 2600,
        timeLimitSec: 50,
        bonusScore: 1500000,
        onClearDrops: [
          { type: 'SMALL_POWER', count: 3 },
          { type: 'POINT', count: 5 },
        ],
        onInit: () => {
          soundManager.playSpellDeclare();
          this.addBanner('환월부「붉은 달의 회랑」', 'BONUS: 1,500,000', '#ef4444', 120, true);
        },
        onUpdate: (b, frame) => {
          // Large red bullets waving down
          if (frame % 55 === 0) {
            const spawnX = this.playX + 30 + Math.random() * (this.playW - 60);
            this.bullets.push({
              id: this.nextId++,
              x: spawnX,
              y: this.playY,
              vx: 0,
              vy: 1.2 * mult.bulletSpeed,
              speed: 1.2 * mult.bulletSpeed,
              angle: Math.PI / 2,
              kind: 'LARGE',
              color: '#dc2626',
              hitRadius: 10,
              drawRadius: 13,
              isEnemy: true,
              lifeTime: 0,
              onUpdate: (bullet, bFrame) => {
                bullet.x += Math.sin(bFrame * 0.05) * 1.5;
              },
            });
          }
          // 4-tier aimed knife fan with variable speeds every 1.3s (78 frames)
          if (frame % 78 === 0) {
            const speeds = [2.0, 2.4, 2.8, 3.2];
            speeds.forEach((sp) => {
              this.fireAimedSpread(b.x, b.y, mult.aimedCount, 0.5, sp * mult.bulletSpeed, 'KNIFE', '#f43f5e');
            });
          }
        },
      },
      // 5. 종막「천 개의 등불」 (HP 3,200, 60s, 2,500,000 bonus, Drops 1UP)
      {
        id: 5,
        name: '종막「천 개의 등불」',
        isSpell: true,
        spellName: '종막「천 개의 등불」',
        maxHp: 3200,
        timeLimitSec: 60,
        bonusScore: 2500000,
        onClearDrops: [
          { type: 'ONE_UP', count: 1 },
          { type: 'POINT', count: 8 },
        ],
        onInit: () => {
          soundManager.playSpellDeclare();
          this.addBanner('종막「천 개의 등불」', 'FINAL SPELL - BONUS: 2,500,000', '#f59e0b', 140, true);
        },
        onUpdate: (b, frame) => {
          // Dual accelerating spirals (yellow/purple)
          if (frame % 8 === 0) {
            const arms = Math.max(1, Math.round(4 * mult.bulletCount));
            this.fireSpiral(b.x, b.y, arms, frame * 0.1, 1.9 * mult.bulletSpeed, 'PELLET', '#fbbf24');
            this.fireSpiral(b.x, b.y, arms, -frame * 0.1, 1.9 * mult.bulletSpeed, 'PELLET', '#c084fc');
          }
          // 36-large-bullet ring every 2.5s (150 frames)
          if (frame % 150 === 0) {
            const count = Math.max(1, Math.round(24 * mult.bulletCount));
            this.fireRing(b.x, b.y, count, frame * 0.05, 1.6 * mult.bulletSpeed, 'LARGE', '#f59e0b');
          }
          // When HP < 50%, add aimed rice bullets
          if (b.hp < b.maxHp * 0.5 && frame % 40 === 0) {
            this.fireAimedSpread(b.x, b.y, mult.aimedCount, 0.4, 2.8 * mult.bulletSpeed, 'RICE', '#e11d48');
          }
        },
      },
    ];

    this.boss = {
      name: '시즈쿠 메이라',
      title: '서리꽃의 수정술사',
      x: this.playX + this.playW / 2,
      y: this.playY - 40,
      targetX: this.playX + this.playW / 2,
      targetY: this.playY + 95,
      radius: 20,
      hp: phases[0].maxHp,
      maxHp: phases[0].maxHp,
      phases,
      currentPhaseIndex: 0,
      phaseTimerSec: phases[0].timeLimitSec,
      phaseFrame: 0,
      invincibleTimer: 100,
      hitFlashTimer: 0,
      spellBonusFailed: false,
      spellBonusCurrent: phases[0].bonusScore,
      defeated: false,
    };
  }

  // --- Boss Updates & Phase Transitions ---
  private updateBoss() {
    if (!this.boss) return;
    const b = this.boss;

    if (b.invincibleTimer > 0) b.invincibleTimer--;
    if (b.hitFlashTimer > 0) b.hitFlashTimer--;

    // Smooth position interpolation towards target
    b.x += (b.targetX - b.x) * 0.06;
    b.y += (b.targetY - b.y) * 0.06;

    const phase = b.phases[b.currentPhaseIndex];
    if (!phase) return;

    b.phaseFrame++;
    b.phaseTimerSec -= 1 / 60;

    // Calculate real-time Spell Bonus: Base × (0.4 + 0.6 × remaining ratio)
    if (phase.isSpell && !b.spellBonusFailed) {
      const timeRatio = Math.max(0, b.phaseTimerSec / phase.timeLimitSec);
      b.spellBonusCurrent = Math.floor(phase.bonusScore * (0.4 + 0.6 * timeRatio));
    }

    // Call phase update action
    if (b.invincibleTimer <= 0) {
      phase.onUpdate(b, b.phaseFrame, this.getContext());
    }

    // Phase end check: HP <= 0 or Time Out
    if (b.hp <= 0 || b.phaseTimerSec <= 0) {
      this.advanceBossPhase();
    }
  }

  private advanceBossPhase() {
    if (!this.boss) return;
    const b = this.boss;
    const currentPhase = b.phases[b.currentPhaseIndex];

    // Clear bullets into score fragments
    this.bullets.forEach((bullet) => {
      if (bullet.isEnemy) {
        this.spawnItem(bullet.x, bullet.y, 'SCORE_FRAGMENT', true);
      }
    });
    this.bullets = this.bullets.filter((bullet) => !bullet.isEnemy);

    // Spellcard bonus award if not timed out and not failed
    if (currentPhase.isSpell) {
      if (b.hp <= 0 && !b.spellBonusFailed) {
        soundManager.playSpellBonus();
        this.addScore(b.spellBonusCurrent);
        this.addBanner('SPELL CARD GET!!', `+${b.spellBonusCurrent.toLocaleString()}`, '#fbbf24', 90);
      } else {
        this.addBanner('BONUS FAILED...', '', '#ef4444', 60);
      }
    }

    // Drops on HP clear (none if timed out)
    if (b.hp <= 0) {
      currentPhase.onClearDrops.forEach((drop) => {
        const count = drop.count || 1;
        for (let i = 0; i < count; i++) {
          this.spawnItem(b.x + (i - (count - 1) / 2) * 16, b.y, drop.type);
        }
      });
    }

    // Next phase
    b.currentPhaseIndex++;
    if (b.currentPhaseIndex >= b.phases.length) {
      // Boss Defeated!
      this.destroyBoss(b);
    } else {
      // Setup next phase
      const nextPhase = b.phases[b.currentPhaseIndex];
      b.hp = nextPhase.maxHp;
      b.maxHp = nextPhase.maxHp;
      b.phaseTimerSec = nextPhase.timeLimitSec;
      b.phaseFrame = 0;
      b.invincibleTimer = 60;
      b.spellBonusFailed = false;
      b.spellBonusCurrent = nextPhase.bonusScore;
      if (nextPhase.onInit) nextPhase.onInit(b, this.getContext());
    }
  }

  private destroyBoss(b: BossEntity) {
    soundManager.playEnemyExplode(true);
    this.triggerScreenShake(30, 10);
    this.createExplosion(b.x, b.y, '#f43f5e', 50);

    if (b.name === '노아') {
      // Mid-boss defeated -> resume stage timeline
      this.boss = null;
      this.stageClockPaused = false;
      this.stageFrame = 1950;
    } else {
      // Final Boss Defeated -> Stage Clear!!
      this.boss = null;
      this.stageClear();
    }
  }

  private stageClear() {
    this.state = 'CLEARED';
    soundManager.stopBGM();
    soundManager.playExtend();

    // Stage Clear Bonus: Remaining lives × 3M + Remaining bombs × 1M
    const lifeBonus = Math.max(0, this.player.lives) * 3000000;
    const bombBonus = Math.max(0, this.player.bombs) * 1000000;
    this.addScore(lifeBonus + bombBonus);

    this.callbacks.onStateChange('CLEARED');
  }

  // --- Enemy Updates ---
  private updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.frame++;
      if (e.hitFlashTimer > 0) e.hitFlashTimer--;

      e.action(e, e.frame, this.getContext());

      // Despawn off-screen
      if (
        e.x < this.playX - 60 ||
        e.x > this.playX + this.playW + 60 ||
        e.y > this.playY + this.playH + 60 ||
        e.y < this.playY - 80
      ) {
        if (e.frame > 40) {
          this.enemies.splice(i, 1);
        }
      }
    }
  }

  private destroyEnemy(e: EnemyEntity) {
    const idx = this.enemies.indexOf(e);
    if (idx !== -1) this.enemies.splice(idx, 1);

    const isBig = e.kind === 'BIG_FAIRY';
    soundManager.playEnemyExplode(isBig);
    this.createExplosion(e.x, e.y, isBig ? '#a855f7' : '#f43f5e', isBig ? 30 : 14);

    // Score: Big fairy = 10,000, Small = 1,000
    this.addScore(isBig ? 10000 : 1000);

    // Drops
    e.drops.forEach((d) => {
      const count = d.count || 1;
      for (let i = 0; i < count; i++) {
        this.spawnItem(e.x + (i - (count - 1) / 2) * 14, e.y, d.type);
      }
    });
  }

  // --- Bullets & Collision Detection ---
  private updateBullets() {
    const p = this.player;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.lifeTime++;

      if (b.onUpdate) {
        b.onUpdate(b, b.lifeTime, p);
      }

      const slowMult = (b.isEnemy && this.timeSlowTimer > 0) ? 0.28 : 1.0;
      b.x += b.vx * slowMult;
      b.y += b.vy * slowMult;

      // 1. Player Bullets vs Enemies / Boss
      if (!b.isEnemy) {
        let hit = false;
        // Check Boss
        if (this.boss && this.boss.invincibleTimer <= 0) {
          const dist = Math.hypot(b.x - this.boss.x, b.y - this.boss.y);
          if (dist <= this.boss.radius + b.hitRadius) {
            this.boss.hp -= 2.6;
            this.boss.hitFlashTimer = 2;
            this.addScore(10); // 10 pts per hit
            this.createHitSpark(b.x, b.y);
            hit = true;
          }
        }
        // Check Minions
        if (!hit) {
          for (const e of this.enemies) {
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if (dist <= e.radius + b.hitRadius) {
              e.hp -= 2.6;
              e.hitFlashTimer = 2;
              this.addScore(10);
              this.createHitSpark(b.x, b.y);
              if (e.hp <= 0) this.destroyEnemy(e);
              hit = true;
              break;
            }
          }
        }
        if (hit) {
          this.bullets.splice(i, 1);
          continue;
        }
      } else {
        // 2. Enemy Bullets vs Player: Graze & Core Hit
        const dist = Math.hypot(b.x - p.x, b.y - p.y);

        // Graze Detection (bullet drawRadius + 16px, once per bullet, not counted during invincibility)
        if (!b.grazed && p.invincibleTimer <= 0) {
          if (dist <= b.drawRadius + 16 && dist > b.hitRadius + p.hitRadius) {
            b.grazed = true;
            this.grazeCount++;
            this.addScore(500);
            soundManager.playGraze();
            this.createHitSpark(b.x, b.y);
            this.syncStats();
          }
        }

        // Core Hitbox Detection (2.2px)
        if (p.invincibleTimer <= 0 && p.deathGraceTimer <= 0) {
          if (dist <= b.hitRadius + p.hitRadius) {
            this.triggerPlayerHit();
            this.bullets.splice(i, 1);
            continue;
          }
        }
      }

      // Despawn bounds
      const margin = 24;
      if (
        b.x < this.playX - margin ||
        b.x > this.playX + this.playW + margin ||
        b.y < this.playY - margin ||
        b.y > this.playY + this.playH + margin
      ) {
        this.bullets.splice(i, 1);
      }
    }

    // Direct collision between player and enemies
    if (p.invincibleTimer <= 0 && p.deathGraceTimer <= 0) {
      for (const e of this.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) <= e.radius + p.hitRadius) {
          this.triggerPlayerHit();
          break;
        }
      }
    }
  }

  // --- Item Physics & Recovery Line (PoC) ---
  private updateItems() {
    const p = this.player;
    const isAbovePoc = p.y <= this.pocY;
    const isFullPower = p.power >= 128;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];

      // Auto-collection / PoC Magnet
      if (it.autoCollect || (isFullPower && isAbovePoc)) {
        // Fly directly toward player
        const dx = p.x - it.x;
        const dy = p.y - it.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          it.x += (dx / dist) * 7.5;
          it.y += (dy / dist) * 7.5;
        }
      } else {
        // Normal item gravity: falls at max 2.2 px/frame
        it.vy = Math.min(2.2, it.vy + 0.1);
        it.y += it.vy;

        // Magnet when within 32px of player
        const dist = Math.hypot(it.x - p.x, it.y - p.y);
        if (dist < 40) {
          it.x += (p.x - it.x) * 0.15;
          it.y += (p.y - it.y) * 0.15;
        }
      }

      // Collect when within 24px of player
      if (Math.hypot(it.x - p.x, it.y - p.y) <= 24) {
        this.collectItem(it, isAbovePoc);
        this.items.splice(i, 1);
        continue;
      }

      // Bottom removal
      if (it.y > this.playY + this.playH + 30) {
        this.items.splice(i, 1);
      }
    }
  }

  private collectItem(it: ItemEntity, isAbovePoc: boolean) {
    const p = this.player;
    soundManager.playItem();

    if (it.kind === 'SMALL_POWER') {
      this.addPower(1);
    } else if (it.kind === 'BIG_POWER') {
      this.addPower(8);
    } else if (it.kind === 'FULL_POWER') {
      this.addPower(128);
    } else if (it.kind === 'POINT') {
      this.pointItemCount++;
      // Point: Above PoC or auto-collected = 10,000; scales down to 1,000 at bottom
      const scoreVal = (isAbovePoc || it.autoCollect)
        ? 10000
        : Math.round(1000 + ((this.playY + this.playH - it.y) / this.playH) * 9000);
      this.addScore(scoreVal);
    } else if (it.kind === 'BOMB') {
      p.bombs = Math.min(8, p.bombs + 1);
    } else if (it.kind === 'ONE_UP') {
      p.lives = Math.min(8, p.lives + 1);
      soundManager.playExtend();
      this.addBanner('EXTEND!', '+1 LIFE', '#ec4899', 80);
    } else if (it.kind === 'SCORE_FRAGMENT') {
      this.addScore(200);
    }

    this.syncStats();
  }

  private addPower(amount: number) {
    const p = this.player;
    const oldPower = p.power;
    p.power = Math.min(128, p.power + amount);

    // If already MAX, power item grants 1,000 pts
    if (oldPower >= 128) {
      this.addScore(1000);
      return;
    }

    // Power MAX Transition Event
    if (p.power >= 128 && oldPower < 128) {
      soundManager.playExtend();
      this.addBanner('FULL POWER!!', '', '#f59e0b', 90);

      // Convert all bullets to score fragments & auto-collect all items
      this.bullets.forEach((b) => {
        if (b.isEnemy) {
          this.spawnItem(b.x, b.y, 'SCORE_FRAGMENT', true);
        }
      });
      this.bullets = this.bullets.filter((b) => !b.isEnemy);
      this.items.forEach((it) => (it.autoCollect = true));
    }
  }

  private addScore(pts: number) {
    this.score += pts;

    // Extends at 8M, 20M, 40M
    const thresholds = [8000000, 20000000, 40000000];
    for (let i = 0; i < thresholds.length; i++) {
      if (this.score >= thresholds[i] && this.extendsAwarded <= i) {
        this.extendsAwarded = i + 1;
        this.player.lives = Math.min(8, this.player.lives + 1);
        soundManager.playExtend();
        this.addBanner('EXTEND!', 'SCORE BONUS +1 LIFE', '#ec4899', 90);
      }
    }

    // Update HiScore
    if (this.score > this.hiScores[this.difficulty] && !this.isPracticeBoss) {
      this.hiScores[this.difficulty] = this.score;
      try {
        localStorage.setItem('moonlit_barrage_hiscores', JSON.stringify(this.hiScores));
      } catch {}
    }

    this.syncStats();
  }

  private syncStats() {
    this.callbacks.onScoreUpdate(
      this.score,
      this.hiScores[this.difficulty],
      this.grazeCount,
      this.pointItemCount
    );
    this.callbacks.onPlayerUpdate(this.player.lives, this.player.bombs, this.player.power);
    if (this.callbacks.onBossUpdate) {
      this.callbacks.onBossUpdate(this.boss);
    }
  }

  // --- Bullet Spawning Patterns ---
  public fireAimedSpread(
    originX: number,
    originY: number,
    count: number,
    arcAngle: number,
    speed: number,
    kind: Bullet['kind'],
    color: string
  ) {
    const baseAngle = Math.atan2(this.player.y - originY, this.player.x - originX);
    const startAngle = count === 1 ? baseAngle : baseAngle - arcAngle / 2;
    const step = count > 1 ? arcAngle / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const ang = startAngle + i * step;
      this.bullets.push({
        id: this.nextId++,
        x: originX,
        y: originY,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        speed,
        angle: ang,
        kind,
        color,
        hitRadius: kind === 'LARGE' ? 10 : 2.5,
        drawRadius: kind === 'LARGE' ? 13 : 6,
        isEnemy: true,
        lifeTime: 0,
      });
    }
  }

  public fireRing(
    originX: number,
    originY: number,
    count: number,
    offsetAngle: number,
    speed: number,
    kind: Bullet['kind'],
    color: string
  ) {
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const ang = offsetAngle + i * step;
      this.bullets.push({
        id: this.nextId++,
        x: originX,
        y: originY,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        speed,
        angle: ang,
        kind,
        color,
        hitRadius: kind === 'LARGE' ? 10 : 2.5,
        drawRadius: kind === 'LARGE' ? 13 : 4,
        isEnemy: true,
        lifeTime: 0,
      });
    }
  }

  public fireSpiral(
    originX: number,
    originY: number,
    arms: number,
    currentAngle: number,
    speed: number,
    kind: Bullet['kind'],
    color: string,
    tag?: string
  ) {
    const step = (Math.PI * 2) / arms;
    for (let i = 0; i < arms; i++) {
      const ang = currentAngle + i * step;
      this.bullets.push({
        id: this.nextId++,
        x: originX,
        y: originY,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        speed,
        angle: ang,
        kind,
        color,
        hitRadius: 2.5,
        drawRadius: 5,
        isEnemy: true,
        tag,
        lifeTime: 0,
      });
    }
  }

  public spawnItem(x: number, y: number, kind: ItemKind, autoCollect: boolean = false): ItemEntity | null {
    const it: ItemEntity = {
      id: this.nextId++,
      kind,
      x: Math.max(this.playX + 10, Math.min(this.playX + this.playW - 10, x)),
      y,
      vy: -2.5, // initial upward hop
      autoCollect,
    };
    this.items.push(it);
    return it;
  }

  private addBanner(text: string, subText: string, color: string, duration: number = 90, isSpell: boolean = false) {
    this.banners.push({
      id: this.nextId++,
      text,
      subText,
      color,
      y: isSpell ? this.playY + this.playH - 30 : this.playY + this.playH * 0.45,
      alpha: 1.0,
      timer: 0,
      maxTimer: duration,
      isSpell,
    });
  }

  private updateParticlesAndBanners() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.banners.length - 1; i >= 0; i--) {
      const b = this.banners[i];
      b.timer++;
      if (b.isSpell) {
        // Slide up towards top right
        b.y -= 0.6;
      }
      if (b.timer >= b.maxTimer) {
        b.alpha -= 0.05;
        if (b.alpha <= 0) this.banners.splice(i, 1);
      }
    }
  }

  private triggerScreenShake(duration: number, magnitude: number) {
    this.shakeDuration = duration;
    this.shakeMagnitude = magnitude;
  }

  private createExplosion(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 4;
      this.particles.push({
        id: this.nextId++,
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.3 ? color : '#ffffff',
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
      });
    }
  }

  private createHitSpark(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const ang = Math.random() * Math.PI * 2;
      this.particles.push({
        id: this.nextId++,
        x,
        y,
        vx: Math.cos(ang) * 1.5,
        vy: Math.sin(ang) * 1.5,
        size: 2,
        color: '#ffffff',
        alpha: 0.9,
        decay: 0.1,
      });
    }
  }

  private getContext(): GameContext {
    return {
      difficulty: this.difficulty,
      diffMultiplier: this.getDiffMultipliers(),
      player: this.player,
      spawnBullet: (b) => {
        const fullB: Bullet = { ...b, id: this.nextId++ };
        this.bullets.push(fullB);
        return fullB;
      },
      spawnItem: (x, y, kind, auto) => this.spawnItem(x, y, kind, auto),
      addScore: (pts) => this.addScore(pts),
      addGraze: () => {
        this.grazeCount++;
        this.addScore(500);
      },
      triggerScreenShake: (dur, mag) => this.triggerScreenShake(dur, mag),
      isPracticeBoss: this.isPracticeBoss,
    };
  }

  // --- Render (640x480 EoSD Frame) ---
  public render() {
    const ctx = this.ctx;
    ctx.save();

    // Clear whole screen (Black)
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, this.screenW, this.screenH);

    // Screen Shake within Play Area
    ctx.save();
    if (this.shakeDuration > 0) {
      const sx = (Math.random() - 0.5) * this.shakeMagnitude;
      const sy = (Math.random() - 0.5) * this.shakeMagnitude;
      ctx.translate(sx, sy);
    }

    // 1. Draw Playfield Background (Check if Red Moon in Phase 4)
    const isRedMoon = !!(
      this.boss &&
      this.boss.name === '시즈쿠 메이라' &&
      this.boss.currentPhaseIndex === 3
    );
    SpriteRenderer.drawBackground(
      ctx,
      this.playX,
      this.playY,
      this.playW,
      this.playH,
      this.stageFrame,
      isRedMoon
    );

    // 2. Play Area Clipping Mask for entities
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.playX, this.playY, this.playW, this.playH);
    ctx.clip();

    // PoC (Item Collection Line)
    SpriteRenderer.drawItemCollectLine(
      ctx,
      this.playX,
      this.pocY,
      this.playW,
      this.player.y,
      this.player.power >= 128
    );

    // Items
    for (const it of this.items) {
      SpriteRenderer.drawItem(ctx, it);
    }

    // Enemies
    for (const e of this.enemies) {
      SpriteRenderer.drawEnemy(ctx, e, e.frame);
    }

    // Boss
    if (this.boss) {
      SpriteRenderer.drawBoss(ctx, this.boss, this.stageFrame);
    }

    // Player
    const focus =
      this.keys['shift'] ||
      this.keys['shiftleft'] ||
      this.keys['shiftright'] ||
      this.virtualFocus;
    SpriteRenderer.drawPlayer(ctx, this.player, focus, this.stageFrame);

    // Bullets
    for (const b of this.bullets) {
      SpriteRenderer.drawBullet(ctx, b);
    }

    // Character-Specific Bomb Effects (Master Nova Beam, Chronos Time Slow, Crimson Barrier)
    SpriteRenderer.drawBombEffect(
      ctx,
      this.playX,
      this.playY,
      this.playW,
      this.playH,
      this.player,
      this.bombActiveTimer,
      this.timeSlowTimer,
      this.stageFrame
    );

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    // Banners & Stage / Spellcard Announcements
    for (const b of this.banners) {
      ctx.globalAlpha = b.alpha;
      ctx.fillStyle = b.color;
      ctx.font = b.isSpell ? '10px "Press Start 2P", monospace' : '14px "Press Start 2P", monospace';
      ctx.textAlign = b.isSpell ? 'right' : 'center';
      const bx = b.isSpell ? this.playX + this.playW - 12 : this.playX + this.playW / 2;
      ctx.fillText(b.text, bx, b.y);

      if (b.subText) {
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(b.subText, bx, b.y + 18);
      }
    }
    ctx.globalAlpha = 1.0;

    // Boss Top HP & Name Bar
    if (this.boss) {
      SpriteRenderer.drawBossTopHUD(ctx, this.playX, this.playY, this.playW, this.boss);
    }

    // Off-screen Top Item Indicators (Triangles at top edge for items above y < 16)
    for (const it of this.items) {
      if (it.y < this.playY) {
        ctx.fillStyle = it.kind === 'POINT' ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(it.x - 4, this.playY + 6);
        ctx.lineTo(it.x + 4, this.playY + 6);
        ctx.lineTo(it.x, this.playY + 1);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore(); // end playfield clip
    ctx.restore(); // end shake

    // 3. Play Area Border Frame
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.playX - 1, this.playY - 1, this.playW + 2, this.playH + 2);

    // 4. Right Status Sidebar (Touhou EoSD Style)
    SpriteRenderer.drawSidebar(
      ctx,
      432,
      16,
      184,
      448,
      {
        difficulty: this.difficulty,
        hiScore: this.hiScores[this.difficulty],
        score: this.score,
        lives: this.player.lives,
        bombs: this.player.bombs,
        power: this.player.power,
        graze: this.grazeCount,
        points: this.pointItemCount,
        soundOn: soundManager.sfxEnabled,
      }
    );

    ctx.restore();
  }
}
