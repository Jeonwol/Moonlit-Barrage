// Procedural Canvas Sprites for 월하탄막 ~ Moonlit Barrage

import { Bullet, BossEntity, EnemyEntity, ItemEntity, PlayerEntity } from './types';

export class SpriteRenderer {
  // 1. Moonlit Frost Lake Background
  public static drawBackground(
    ctx: CanvasRenderingContext2D,
    playX: number,
    playY: number,
    playW: number,
    playH: number,
    frame: number,
    isRedMoon: boolean = false
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(playX, playY, playW, playH);
    ctx.clip();

    // Deep Night Sky / Lake Gradient
    const skyGrad = ctx.createLinearGradient(playX, playY, playX, playY + playH);
    if (isRedMoon) {
      skyGrad.addColorStop(0, '#1a050f');
      skyGrad.addColorStop(0.4, '#2d0818');
      skyGrad.addColorStop(0.7, '#150616');
      skyGrad.addColorStop(1, '#08010c');
    } else {
      skyGrad.addColorStop(0, '#040816');
      skyGrad.addColorStop(0.35, '#0a162e');
      skyGrad.addColorStop(0.65, '#071b2f');
      skyGrad.addColorStop(1, '#05111e');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(playX, playY, playW, playH);

    // Distant Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = playX + ((i * 73 + frame * 0.2) % playW);
      const sy = playY + ((i * 47) % (playH * 0.5));
      const s = (i % 3 === 0) ? 2 : 1;
      ctx.globalAlpha = 0.2 + (Math.sin(frame * 0.05 + i) * 0.3 + 0.5) * 0.5;
      ctx.fillRect(sx, sy, s, s);
    }
    ctx.globalAlpha = 1.0;

    // Red Moon or Pale Moon in the background
    const moonX = playX + playW * 0.72;
    const moonY = playY + 110;
    const moonR = isRedMoon ? 48 : 36;

    // Moon Glow
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 2.2);
    moonGlow.addColorStop(0, isRedMoon ? 'rgba(239, 68, 68, 0.45)' : 'rgba(186, 230, 253, 0.35)');
    moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Moon Disc
    ctx.fillStyle = isRedMoon ? '#dc2626' : '#e0f2fe';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Frost Lake Water Surface & Ripple Lines
    const waterY = playY + playH * 0.55;
    const waterGrad = ctx.createLinearGradient(playX, waterY, playX, playY + playH);
    waterGrad.addColorStop(0, isRedMoon ? 'rgba(80, 10, 25, 0.6)' : 'rgba(12, 40, 75, 0.6)');
    waterGrad.addColorStop(1, isRedMoon ? 'rgba(30, 5, 15, 0.95)' : 'rgba(4, 15, 30, 0.95)');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(playX, waterY, playW, playY + playH - waterY);

    // Lake ripples
    ctx.strokeStyle = isRedMoon ? 'rgba(248, 113, 113, 0.2)' : 'rgba(147, 197, 253, 0.2)';
    ctx.lineWidth = 1;
    for (let r = 0; r < 7; r++) {
      const ry = waterY + 20 + r * 28 + (frame * 0.4 % 28);
      ctx.beginPath();
      ctx.moveTo(playX, ry);
      ctx.bezierCurveTo(
        playX + playW * 0.33, ry - 3 + Math.sin(frame * 0.05 + r) * 3,
        playX + playW * 0.66, ry + 3 + Math.cos(frame * 0.05 + r) * 3,
        playX + playW, ry
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  // 2. Item Recovery Line (PoC) at 112px from play area top
  public static drawItemCollectLine(
    ctx: CanvasRenderingContext2D,
    playX: number,
    pocY: number,
    playW: number,
    playerY: number,
    isMaxPower: boolean
  ) {
    const isNear = playerY < pocY + 70;
    if (!isNear && !isMaxPower) return;

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isMaxPower ? 'rgba(251, 191, 36, 0.7)' : 'rgba(147, 197, 253, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playX, pocY);
    ctx.lineTo(playX + playW, pocY);
    ctx.stroke();

    ctx.fillStyle = isMaxPower ? '#f59e0b' : 'rgba(147, 197, 253, 0.6)';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('ITEM GET LINE', playX + playW - 6, pocY - 4);
    ctx.restore();
  }

  // 3. Player Character: Teal hair, Navy cape, Star hairpin
  public static drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: PlayerEntity,
    focusMode: boolean,
    frame: number
  ) {
    if (player.invincibleTimer > 0 && Math.floor(frame / 4) % 2 === 0) {
      return; // invincibility flicker
    }

    ctx.save();
    ctx.translate(Math.round(player.x), Math.round(player.y));

    // Flapping Navy Cape (behind character)
    const capeSway = Math.sin(frame * 0.15) * 3;
    ctx.fillStyle = '#1e293b'; // dark navy
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.lineTo(10, -2);
    ctx.lineTo(12 + capeSway, 18);
    ctx.lineTo(-12 + capeSway, 18);
    ctx.closePath();
    ctx.fill();

    // Dress / Robe
    if (player.characterId === 'MIYA') {
      // Miya: Deep violet/navy priestess robe
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(6, -2);
      ctx.lineTo(9, 14);
      ctx.lineTo(-9, 14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e0e7ff';
      ctx.fillRect(-2, 0, 4, 8);
    } else if (player.characterId === 'KAEDE') {
      // Kaede: Red and white shrine maiden robe
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-7, -2);
      ctx.lineTo(7, -2);
      ctx.lineTo(9, 14);
      ctx.lineTo(-9, 14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -1, 6, 8);
    } else {
      // Lynn: White with navy accents
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(6, -2);
      ctx.lineTo(8, 14);
      ctx.lineTo(-8, 14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-3, 0, 6, 8);
    }

    // Head / Face
    ctx.fillStyle = '#fde68a'; // skin
    ctx.beginPath();
    ctx.arc(0, -7, 6, 0, Math.PI * 2);
    ctx.fill();

    // Hair by Character
    if (player.characterId === 'MIYA') {
      // Miya: Silver Hair (은발) with Red Ribbon
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, -9, 7.5, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.fillRect(-8, -8, 3, 13);
      ctx.fillRect(5, -8, 3, 13);

      // Red Butterfly Ribbon
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, -13, 8, 3);
      ctx.fillRect(-6, -15, 3, 3);
      ctx.fillRect(3, -15, 3, 3);
    } else if (player.characterId === 'KAEDE') {
      // Kaede: Crimson Bob Hair (붉은 단발)
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(0, -9, 7.5, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.fillRect(-8, -8, 3, 9);
      ctx.fillRect(5, -8, 3, 9);

      // Gold Hair Comb
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-3, -13, 6, 2);
    } else {
      // Lynn: Teal Hair (청록 머리) with Star Hairpin
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.arc(0, -9, 7.5, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.fillRect(-7, -8, 3, 10);
      ctx.fillRect(4, -8, 3, 10);

      // Star Hairpin
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(5, -11, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4.5, -11.5, 1, 1);
    }

    // Options (Drones)
    if (player.options && player.options.length > 0) {
      player.options.forEach((opt, idx) => {
        const ox = opt.x - player.x;
        const oy = opt.y - player.y;

        // Outer glow
        ctx.fillStyle = focusMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(236, 72, 153, 0.4)';
        ctx.beginPath();
        ctx.arc(ox, oy, 7 + Math.sin(frame * 0.2 + idx) * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = focusMode ? '#38bdf8' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ox, oy, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Core Hitbox & Graze Circle in Focus Mode (Shift)
    if (focusMode) {
      // Outer Graze Circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Touhou Core Hitbox Dot (Red with white center, radius 2.2px)
      ctx.fillStyle = '#ff0033';
      ctx.beginPath();
      ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 4. Fairies (Minions)
  public static drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyEntity, frame: number) {
    ctx.save();
    ctx.translate(Math.round(enemy.x), Math.round(enemy.y));

    const isHit = enemy.hitFlashTimer > 0;
    const flap = Math.sin(frame * 0.25) * 4;

    if (enemy.kind === 'SQUAD_FAIRY') {
      // Squad fairy (Pink/Red wings)
      ctx.fillStyle = isHit ? '#ffffff' : 'rgba(244, 63, 94, 0.7)';
      // Wings
      ctx.beginPath();
      ctx.ellipse(-8, -2, 7, 10 + flap, -0.4, 0, Math.PI * 2);
      ctx.ellipse(8, -2, 7, 10 + flap, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = isHit ? '#ffffff' : '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      // Face
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -3, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.kind === 'CROSSING_FAIRY') {
      // Crossing fairy (Cyan/Green water sprite)
      ctx.fillStyle = isHit ? '#ffffff' : 'rgba(6, 182, 212, 0.7)';
      ctx.beginPath();
      ctx.ellipse(-9, -2, 8, 9 - flap, -0.3, 0, Math.PI * 2);
      ctx.ellipse(9, -2, 8, 9 - flap, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isHit ? '#ffffff' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.kind === 'BIG_FAIRY') {
      // Big fairy (Guardian with rotating crystal orbs)
      ctx.fillStyle = isHit ? '#ffffff' : 'rgba(168, 85, 247, 0.6)';
      ctx.beginPath();
      ctx.ellipse(-16, -4, 14, 18 + flap, -0.4, 0, Math.PI * 2);
      ctx.ellipse(16, -4, 14, 18 + flap, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = isHit ? '#ffffff' : '#7c3aed';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Flanking Crystal orbs
      const ox = Math.cos(frame * 0.08) * 18;
      const oy = Math.sin(frame * 0.08) * 18;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.arc(-ox, -oy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 5. Boss Characters (Mid-boss Noah & Boss Shizuku Meira)
  public static drawBoss(ctx: CanvasRenderingContext2D, boss: BossEntity, frame: number) {
    ctx.save();
    ctx.translate(Math.round(boss.x), Math.round(boss.y));

    const isHit = boss.hitFlashTimer > 0;
    const isSpell = boss.phases[boss.currentPhaseIndex]?.isSpell;

    // Spellcard Magic Rune Circle (회전 마법진)
    if (isSpell) {
      ctx.save();
      ctx.rotate(frame * 0.015);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();

      // Hexagram / 6-pointed star
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 36, Math.sin(a) * 36);
        ctx.lineTo(Math.cos(a + Math.PI * 0.66) * 36, Math.sin(a + Math.PI * 0.66) * 36);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (boss.name === '노아') {
      // Noah (Mid-boss: Forest shade fairy)
      // Shimmering emerald wings
      const wingFlap = Math.sin(frame * 0.2) * 5;
      ctx.fillStyle = isHit ? '#ffffff' : 'rgba(16, 185, 129, 0.7)';
      ctx.beginPath();
      ctx.ellipse(-14, -6, 11, 20 + wingFlap, -0.4, 0, Math.PI * 2);
      ctx.ellipse(14, -6, 11, 20 + wingFlap, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Green dress
      ctx.fillStyle = isHit ? '#ffffff' : '#059669';
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(7, 0);
      ctx.lineTo(10, 16);
      ctx.lineTo(-10, 16);
      ctx.closePath();
      ctx.fill();

      // Blonde/gold hair
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, -8, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Shizuku Meira (Boss: Frost Crystal Sorceress)
      // Floating Ice Crystal shards
      for (let i = 0; i < 4; i++) {
        const ang = (frame * 0.04) + (i * Math.PI) / 2;
        const cx = Math.cos(ang) * 26;
        const cy = Math.sin(ang) * 16;
        ctx.fillStyle = 'rgba(186, 230, 253, 0.8)';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx + 4, cy);
        ctx.lineTo(cx, cy + 6);
        ctx.lineTo(cx - 4, cy);
        ctx.closePath();
        ctx.fill();
      }

      // Silver/Ice-blue twin hair
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.arc(0, -9, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-11, -7, 4, 16);
      ctx.fillRect(7, -7, 4, 16);

      // Frost violet / indigo robes
      ctx.fillStyle = isHit ? '#ffffff' : '#4f46e5';
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.lineTo(13, 20);
      ctx.lineTo(-13, 20);
      ctx.closePath();
      ctx.fill();

      // White crystal brooch
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 6. Bullets
  public static drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet) {
    ctx.save();
    ctx.translate(Math.round(bullet.x), Math.round(bullet.y));

    if (!bullet.isEnemy) {
      // Player shot: Sleek vertical needle or homing talisman
      if (bullet.tag === 'homing') {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-2, -7, 4, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -5, 2, 10);
      }
      ctx.restore();
      return;
    }

    // Rotate towards movement angle for directional bullets
    if (bullet.kind === 'RICE' || bullet.kind === 'KNIFE') {
      ctx.rotate(bullet.angle);
    }

    if (bullet.kind === 'RICE') {
      // Rice bullet (쌀알탄)
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (bullet.kind === 'KNIFE') {
      // Knife bullet (나이프탄)
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(3.5, 3);
      ctx.lineTo(0, 6);
      ctx.lineTo(-3.5, 3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(1.8, 2);
      ctx.lineTo(0, 4);
      ctx.lineTo(-1.8, 2);
      ctx.closePath();
      ctx.fill();
    } else if (bullet.kind === 'LARGE') {
      // Large heavy bullet (큰 탄)
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Pellet / Small round bullet (구슬탄, 작은 탄)
      const r = bullet.drawRadius;
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.2, r - 2.5), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 7. Items
  public static drawItem(ctx: CanvasRenderingContext2D, item: ItemEntity) {
    ctx.save();
    ctx.translate(Math.round(item.x), Math.round(item.y));

    if (item.kind === 'SCORE_FRAGMENT') {
      // Small yellow spark
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-2, -2, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
      return;
    }

    let bg = '#ef4444';
    let text = 'P';
    let size = 14;

    if (item.kind === 'SMALL_POWER') {
      bg = '#ef4444';
      text = 'P';
      size = 12;
    } else if (item.kind === 'BIG_POWER') {
      bg = '#dc2626';
      text = 'P';
      size = 16;
    } else if (item.kind === 'POINT') {
      bg = '#2563eb';
      text = '点';
      size = 14;
    } else if (item.kind === 'FULL_POWER') {
      bg = '#f59e0b';
      text = 'F';
      size = 15;
    } else if (item.kind === 'BOMB') {
      bg = '#10b981';
      text = 'B';
      size = 15;
    } else if (item.kind === 'ONE_UP') {
      bg = '#ec4899';
      text = '1UP';
      size = 16;
    }

    const half = size / 2;
    // Outer border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-half - 1, -half - 1, size + 2, size + 2);

    // Inner background
    ctx.fillStyle = bg;
    ctx.fillRect(-half, -half, size, size);

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = (item.kind === 'ONE_UP') ? '7px sans-serif' : '9px "Press Start 2P", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1);

    ctx.restore();
  }

  // 8. Right Sidebar Information Panel (Touhou EoSD Layout)
  public static drawSidebar(
    ctx: CanvasRenderingContext2D,
    sideX: number,
    sideY: number,
    sideW: number,
    sideH: number,
    stats: {
      difficulty: string;
      hiScore: number;
      score: number;
      lives: number;
      bombs: number;
      power: number;
      graze: number;
      points: number;
      soundOn: boolean;
    }
  ) {
    ctx.save();
    // Background frame
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sideX, sideY, sideW, sideH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(sideX, sideY, sideW, sideH);

    const padScore = (s: number) => s.toString().padStart(9, '0');
    let curY = sideY + 28;
    const labelX = sideX + 16;
    const valX = sideX + sideW - 16;

    // Title Logo
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('月下彈幕', sideX + sideW / 2, curY);
    curY += 14;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('MOONLIT BARRAGE', sideX + sideW / 2, curY);
    curY += 24;

    // Difficulty
    ctx.textAlign = 'left';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('難易度', labelX, curY);
    ctx.textAlign = 'right';
    let diffColor = '#38bdf8';
    if (stats.difficulty === 'Normal') diffColor = '#10b981';
    if (stats.difficulty === 'Hard') diffColor = '#f59e0b';
    if (stats.difficulty === 'Lunatic') diffColor = '#ef4444';
    ctx.fillStyle = diffColor;
    ctx.fillText(stats.difficulty, valX, curY);
    curY += 24;

    // HiScore
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('HiScore', labelX, curY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(padScore(stats.hiScore), valX, curY);
    curY += 20;

    // Score
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Score', labelX, curY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(padScore(stats.score), valX, curY);
    curY += 28;

    // Player (Pink Stars for lives)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Player', labelX, curY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f43f5e';
    const lifeStars = '★ '.repeat(Math.max(0, stats.lives));
    ctx.fillText(lifeStars || '—', valX, curY);
    curY += 22;

    // Bomb (Green Stars for bombs)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Bomb', labelX, curY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#10b981';
    const bombStars = '★ '.repeat(Math.max(0, stats.bombs));
    ctx.fillText(bombStars || '—', valX, curY);
    curY += 26;

    // Power (Number + Gauge Bar, turns to MAX when 128)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Power', labelX, curY);
    ctx.textAlign = 'right';
    if (stats.power >= 128) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('MAX', valX, curY);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${stats.power}/128`, valX, curY);
    }
    curY += 8;

    // Power Gauge
    const barW = sideW - 32;
    const barH = 5;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(labelX, curY, barW, barH);
    const fillW = Math.min(barW, (stats.power / 128) * barW);
    ctx.fillStyle = stats.power >= 128 ? '#f59e0b' : '#38bdf8';
    ctx.fillRect(labelX, curY, fillW, barH);
    curY += 22;

    // Graze
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Graze', labelX, curY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(stats.graze.toString(), valX, curY);
    curY += 22;

    // Point Items
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Point', labelX, curY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#60a5fa';
    ctx.fillText(stats.points.toString(), valX, curY);
    curY += 34;

    // Key guide in footer of sidebar
    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('Z: SHOT  / X: BOMB', labelX, sideY + sideH - 30);
    ctx.fillText('SHIFT: SLOW FOCUS', labelX, sideY + sideH - 18);
    ctx.fillText('ESC: PAUSE', labelX, sideY + sideH - 8);

    ctx.restore();
  }

  // 9. Boss Top HUD & Bottom "ENEMY" Marker
  public static drawBossTopHUD(
    ctx: CanvasRenderingContext2D,
    playX: number,
    playY: number,
    playW: number,
    boss: BossEntity
  ) {
    ctx.save();
    const phase = boss.phases[boss.currentPhaseIndex];
    if (!phase) return;

    // Boss Name & Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${boss.title} ${boss.name}`, playX + 12, playY + 16);

    // Remaining Spellcard Stars (e.g. ★ ★ ★)
    const remainingSpells = boss.phases.slice(boss.currentPhaseIndex + 1).filter((p) => p.isSpell).length;
    if (remainingSpells > 0) {
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'left';
      ctx.fillText('★ '.repeat(remainingSpells), playX + 12, playY + 28);
    }

    // Timer (Turns red if <= 10s)
    const timeLeft = Math.max(0, Math.ceil(boss.phaseTimerSec));
    ctx.fillStyle = timeLeft <= 10 ? '#ef4444' : '#f8fafc';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(timeLeft.toString().padStart(2, '0'), playX + playW - 12, playY + 20);

    // Boss HP Bar (Green for normal, Pink for spellcard)
    const hpBarW = playW - 24;
    const hpBarH = 4;
    const hpBarX = playX + 12;
    const hpBarY = playY + 34;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);

    const fillRatio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
    ctx.fillStyle = phase.isSpell ? '#f43f5e' : '#10b981';
    ctx.fillRect(hpBarX, hpBarY, hpBarW * fillRatio, hpBarH);

    // Bottom "ENEMY" Tracking Marker
    const bottomY = playY + 448 - 6;
    ctx.fillStyle = '#ef4444';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▼ ENEMY', Math.max(playX + 30, Math.min(playX + playW - 30, boss.x)), bottomY);

    ctx.restore();
  }

  // 10. Distinct Character Bomb Visual Effects
  public static drawBombEffect(
    ctx: CanvasRenderingContext2D,
    playX: number,
    playY: number,
    playW: number,
    playH: number,
    player: PlayerEntity,
    bombTimer: number,
    timeSlowTimer: number,
    frame: number
  ) {
    // 1. Lynn: Master Nova (Massive Frontal Laser Beam)
    if (player.characterId === 'LYNN' && bombTimer > 0) {
      const beamW = 110;
      const beamX = player.x - beamW / 2;
      const alpha = Math.min(1.0, bombTimer / 60);

      ctx.save();
      // Outer Beam Corona
      const beamGrad = ctx.createLinearGradient(beamX, 0, beamX + beamW, 0);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      beamGrad.addColorStop(0.2, `rgba(56, 189, 248, ${0.5 * alpha})`);
      beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.9 * alpha})`);
      beamGrad.addColorStop(0.8, `rgba(56, 189, 248, ${0.5 * alpha})`);
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = beamGrad;
      ctx.fillRect(beamX, playY, beamW, player.y - playY);

      // Inner Laser Core
      ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * alpha})`;
      ctx.fillRect(player.x - 20, playY, 40, player.y - playY);

      // Beam Base Aura & Energy Rings
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.7 * alpha})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const ry = player.y - 10 - ((frame * 6 + i * 50) % (player.y - playY));
        ctx.beginPath();
        ctx.ellipse(player.x, ry, 36, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Miya: Chronos Sphere (Time Dilation Slow Motion Indicator)
    if (timeSlowTimer > 0) {
      const slowAlpha = Math.min(0.35, timeSlowTimer / 120);
      ctx.save();
      // Mystical Violet/Blue Time Field Overlay
      ctx.fillStyle = `rgba(99, 102, 241, ${slowAlpha})`;
      ctx.fillRect(playX, playY, playW, playH);

      // Rotating Clock Motif in Play Area Center
      const clockX = playX + playW / 2;
      const clockY = playY + playH / 2;
      const clockR = 75;

      ctx.strokeStyle = `rgba(224, 231, 255, ${slowAlpha * 1.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(clockX, clockY, clockR, 0, Math.PI * 2);
      ctx.stroke();

      // Clock tick marks
      for (let i = 0; i < 12; i++) {
        const ang = (i * Math.PI) / 6;
        const x1 = clockX + Math.cos(ang) * (clockR - 8);
        const y1 = clockY + Math.sin(ang) * (clockR - 8);
        const x2 = clockX + Math.cos(ang) * clockR;
        const y2 = clockY + Math.sin(ang) * clockR;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Rotating clock hands
      const secAng = (frame * 0.05);
      const minAng = (frame * 0.01);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(clockX, clockY);
      ctx.lineTo(clockX + Math.cos(secAng) * (clockR * 0.7), clockY + Math.sin(secAng) * (clockR * 0.7));
      ctx.stroke();

      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(clockX, clockY);
      ctx.lineTo(clockX + Math.cos(minAng) * (clockR * 0.45), clockY + Math.sin(minAng) * (clockR * 0.45));
      ctx.stroke();

      // Slow-motion banner indicator
      ctx.fillStyle = '#a5b4fc';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`CHRONO SLOW [${Math.ceil(timeSlowTimer / 60)}s]`, clockX, playY + playH - 30);
      ctx.restore();
    }

    // 3. Kaede: Crimson Barrier (Expanding Sacred Talisman Seals)
    if (player.characterId === 'KAEDE' && bombTimer > 0) {
      const radius = Math.min(220, (200 - bombTimer) * 3);
      const alpha = Math.min(1.0, bombTimer / 80);
      ctx.save();
      ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 8 Talisman discs orbiting
      for (let i = 0; i < 8; i++) {
        const ang = frame * 0.08 + (i * Math.PI) / 4;
        const tx = player.x + Math.cos(ang) * radius;
        const ty = player.y + Math.sin(ang) * radius;
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx.fillRect(tx - 6, ty - 9, 12, 18);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(tx - 3, ty - 6, 6, 12);
      }
      ctx.restore();
    }
  }
}
