import Phaser from 'phaser';
import { CharacterSprite } from './CharacterSprite';

/** Table positions (center x,y) for 4 groups */
const TABLE_POSITIONS = [
  { x: 220, y: 260 },
  { x: 580, y: 260 },
  { x: 220, y: 440 },
  { x: 580, y: 440 },
];

const TABLE_WIDTH = 130;
const TABLE_HEIGHT = 70;

/** Seat offsets (relative to table center) for up to 5 characters */
const SEAT_OFFSETS = [
  { x: -50, y: -60 },
  { x: 0, y: -65 },
  { x: 50, y: -60 },
  { x: -30, y: 55 },
  { x: 30, y: 55 },
];

export class TavernScene extends Phaser.Scene {
  private characters: Map<string, CharacterSprite> = new Map();
  private tableGraphics: Phaser.GameObjects.Graphics[] = [];
  private tableGlowGraphics: Map<number, Phaser.GameObjects.Graphics> = new Map();
  private phaseText!: Phaser.GameObjects.Text;
  private activeGroupId = -1;

  constructor() {
    super({ key: 'TavernScene' });
  }

  preload(): void {
    // Load character avatars
    for (let i = 1; i <= 20; i++) {
      this.load.image(`oc-${i}`, `/avatars/oc-${i}.jpeg`);
    }
    // Load tavern background
    this.load.image('tavern-bg', '/game/tavern-bg.png');
  }

  create(): void {
    // Background image (replaces programmatic drawing)
    this.add.image(400, 300, 'tavern-bg');

    // Draw group banners on the wall
    this.drawBanner(140, 0, 0x7c3aed, 'G1');
    this.drawBanner(330, 0, 0x3b82f6, 'G2');
    this.drawBanner(470, 0, 0x10b981, 'G3');
    this.drawBanner(660, 0, 0xf43f5e, 'G4');

    this.drawTables();
    this.placeCharacters();
    this.createPhaseIndicator();
  }

  private drawBanner(x: number, y: number, color: number, label: string): void {
    const g = this.add.graphics();
    // Banner ribbon
    g.fillStyle(color, 0.85);
    g.fillRect(x - 14, y + 8, 28, 38);
    g.fillTriangle(x - 14, y + 46, x + 14, y + 46, x, y + 56);
    // Border
    g.lineStyle(1, 0xffffff, 0.2);
    g.strokeRect(x - 14, y + 8, 28, 38);
    // Label
    this.add
      .text(x, y + 25, label, {
        fontSize: '10px',
        fontFamily: '"VT323", monospace',
        color: '#FFFFFF',
      })
      .setOrigin(0.5, 0.5)
      .setAlpha(0.9);
    // Pin
    g.fillStyle(0x8b6914, 1);
    g.fillCircle(x, y + 10, 3);
  }

  private drawTables(): void {
    for (let i = 0; i < 4; i++) {
      const pos = TABLE_POSITIONS[i];
      const tableGfx = this.add.graphics();

      // Shadow
      tableGfx.fillStyle(0x000000, 0.35);
      tableGfx.fillEllipse(pos.x, pos.y + TABLE_HEIGHT / 2 + 10, TABLE_WIDTH + 24, 18);

      // Table surface — dark rich wood
      tableGfx.fillStyle(0x5c3d1e, 1);
      tableGfx.fillRect(pos.x - TABLE_WIDTH / 2, pos.y - TABLE_HEIGHT / 2, TABLE_WIDTH, TABLE_HEIGHT);

      // Wood grain lines
      tableGfx.fillStyle(0x4a3015, 0.5);
      for (let g = 0; g < 4; g++) {
        tableGfx.fillRect(pos.x - TABLE_WIDTH / 2 + 8 + g * 30, pos.y - TABLE_HEIGHT / 2 + 4, 2, TABLE_HEIGHT - 8);
      }

      // Top highlight
      tableGfx.fillStyle(0x7a5a30, 0.4);
      tableGfx.fillRect(pos.x - TABLE_WIDTH / 2 + 2, pos.y - TABLE_HEIGHT / 2 + 2, TABLE_WIDTH - 4, 5);

      // Border
      tableGfx.lineStyle(2, 0x3a2810, 1);
      tableGfx.strokeRect(pos.x - TABLE_WIDTH / 2, pos.y - TABLE_HEIGHT / 2, TABLE_WIDTH, TABLE_HEIGHT);

      // Group label
      this.add
        .text(pos.x, pos.y, `G${i + 1}`, {
          fontSize: '14px',
          fontFamily: '"VT323", monospace',
          color: '#D4A017',
          stroke: '#0d0a18',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 0.5)
        .setAlpha(0.7);

      this.tableGraphics.push(tableGfx);
    }
  }

  private placeCharacters(): void {
    for (let tableIdx = 0; tableIdx < 4; tableIdx++) {
      const tablePos = TABLE_POSITIONS[tableIdx];
      for (let seatIdx = 0; seatIdx < 5; seatIdx++) {
        const charIndex = tableIdx * 5 + seatIdx + 1;
        if (charIndex > 20) break;

        const offset = SEAT_OFFSETS[seatIdx];
        const x = tablePos.x + offset.x;
        const y = tablePos.y + offset.y;
        const textureKey = `oc-${charIndex}`;
        const agentId = `oc-${charIndex}`;

        const character = new CharacterSprite(this, x, y, textureKey, `OC-${charIndex}`, agentId);
        // Stagger idle animation
        this.time.delayedCall(seatIdx * 350 + tableIdx * 200, () => {
          character.startIdle();
        });
        this.characters.set(agentId, character);
      }
    }
  }

  private createPhaseIndicator(): void {
    this.phaseText = this.add.text(16, 14, 'Phase 0: 准备', {
      fontSize: '14px',
      fontFamily: '"VT323", monospace',
      color: '#A78BFA',
      stroke: '#0d0a18',
      strokeThickness: 2,
    });
  }

  setPhaseIndicator(phase: number): void {
    const labels: Record<number, string> = {
      0: 'Phase 0: 准备',
      1: 'Phase 1: 讨论',
      2: 'Phase 2: 开发',
      3: 'Phase 3: 答辩',
    };
    if (this.phaseText) {
      this.phaseText.setText(labels[phase] ?? `Phase ${phase}`);
    }
  }

  highlightTable(groupId: number): void {
    if (this.activeGroupId >= 0) {
      const oldGlow = this.tableGlowGraphics.get(this.activeGroupId);
      if (oldGlow) {
        oldGlow.destroy();
        this.tableGlowGraphics.delete(this.activeGroupId);
      }
      this.getGroupCharacters(this.activeGroupId).forEach((c) => c.highlight(false));
    }

    this.activeGroupId = groupId;

    const tableIndex = groupId - 1;
    if (tableIndex < 0 || tableIndex >= 4) return;

    const pos = TABLE_POSITIONS[tableIndex];
    const glow = this.add.graphics();

    // Soft outer glow
    glow.fillStyle(0x7c3aed, 0.1);
    glow.fillRoundedRect(
      pos.x - TABLE_WIDTH / 2 - 24,
      pos.y - TABLE_HEIGHT / 2 - 24,
      TABLE_WIDTH + 48,
      TABLE_HEIGHT + 48,
      10,
    );
    // Sharp inner border
    glow.lineStyle(2, 0xa78bfa, 0.9);
    glow.strokeRoundedRect(
      pos.x - TABLE_WIDTH / 2 - 10,
      pos.y - TABLE_HEIGHT / 2 - 10,
      TABLE_WIDTH + 20,
      TABLE_HEIGHT + 20,
      6,
    );

    this.tableGlowGraphics.set(groupId, glow);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.5, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.getGroupCharacters(groupId).forEach((c) => c.highlight(true));
  }

  private getGroupCharacters(groupId: number): CharacterSprite[] {
    const chars: CharacterSprite[] = [];
    const startIdx = (groupId - 1) * 5 + 1;
    for (let i = startIdx; i < startIdx + 5 && i <= 20; i++) {
      const c = this.characters.get(`oc-${i}`);
      if (c) chars.push(c);
    }
    return chars;
  }

  showSpeechBubble(agentId: string, text?: string): void {
    this.hideSpeechBubble();
    const character = this.characters.get(agentId);
    if (character) {
      character.speak(text);
    }
  }

  hideSpeechBubble(): void {
    this.characters.forEach((c) => c.stopSpeaking());
  }

  shutdown(): void {
    this.characters.forEach((c) => c.destroy());
    this.characters.clear();
    this.tableGlowGraphics.forEach((g) => g.destroy());
    this.tableGlowGraphics.clear();
  }
}
