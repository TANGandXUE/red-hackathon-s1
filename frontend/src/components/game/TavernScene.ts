import Phaser from 'phaser';
import { CharacterSprite } from './CharacterSprite';

/** Table positions (center x,y) for 4 groups */
const TABLE_POSITIONS = [
  { x: 220, y: 220 }, // Table 1 — top-left
  { x: 580, y: 220 }, // Table 2 — top-right
  { x: 220, y: 420 }, // Table 3 — bottom-left
  { x: 580, y: 420 }, // Table 4 — bottom-right
];

const TABLE_WIDTH = 120;
const TABLE_HEIGHT = 60;

/** Seat offsets (relative to table center) for 5 characters */
const SEAT_OFFSETS = [
  { x: -40, y: -50 },  // top-left
  { x: 0, y: -50 },    // top-center
  { x: 40, y: -50 },   // top-right
  { x: -25, y: 50 },   // bottom-left
  { x: 25, y: 50 },    // bottom-right
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
    // Load all 20 character avatars
    for (let i = 1; i <= 20; i++) {
      this.load.image(`oc-${i}`, `/avatars/oc-${i}.jpeg`);
    }
  }

  create(): void {
    this.drawBackground();
    this.drawTables();
    this.placeCharacters();
    this.createPhaseIndicator();
  }

  /** Draw the dark tavern background */
  private drawBackground(): void {
    const bg = this.add.graphics();

    // Dark floor
    bg.fillStyle(0x0f0f23, 1);
    bg.fillRect(0, 0, 800, 600);

    // Wooden floor planks
    bg.fillStyle(0x4a3728, 0.3);
    for (let y = 0; y < 600; y += 40) {
      bg.fillRect(0, y, 800, 2);
    }

    // Wall at top
    bg.fillStyle(0x6b4e37, 0.6);
    bg.fillRect(0, 0, 800, 60);
    bg.fillStyle(0x4a3728, 0.8);
    bg.fillRect(0, 58, 800, 4);

    // Title text
    this.add.text(400, 30, 'TAVERN', {
      fontSize: '20px',
      fontFamily: '"VT323", monospace',
      color: '#7C3AED',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // Ambient corner shadows
    bg.fillStyle(0x000000, 0.2);
    bg.fillRect(0, 0, 40, 600);
    bg.fillRect(760, 0, 40, 600);
  }

  /** Draw 4 tables */
  private drawTables(): void {
    for (let i = 0; i < 4; i++) {
      const pos = TABLE_POSITIONS[i];
      const tableGfx = this.add.graphics();

      // Table surface
      tableGfx.fillStyle(0x6b4e37, 1);
      tableGfx.fillRect(
        pos.x - TABLE_WIDTH / 2,
        pos.y - TABLE_HEIGHT / 2,
        TABLE_WIDTH,
        TABLE_HEIGHT,
      );

      // Table border (pixel style)
      tableGfx.lineStyle(2, 0x4a3728, 1);
      tableGfx.strokeRect(
        pos.x - TABLE_WIDTH / 2,
        pos.y - TABLE_HEIGHT / 2,
        TABLE_WIDTH,
        TABLE_HEIGHT,
      );

      // Table number
      this.add.text(pos.x, pos.y, `G${i + 1}`, {
        fontSize: '12px',
        fontFamily: '"VT323", monospace',
        color: '#E2E8F0',
        align: 'center',
      }).setOrigin(0.5, 0.5).setAlpha(0.5);

      this.tableGraphics.push(tableGfx);
    }
  }

  /** Place 5 characters around each table (20 total) */
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

        const character = new CharacterSprite(
          this,
          x,
          y,
          textureKey,
          `OC-${charIndex}`,
          agentId,
        );
        character.startIdle();
        this.characters.set(agentId, character);
      }
    }
  }

  /** Create phase indicator in top-left */
  private createPhaseIndicator(): void {
    this.phaseText = this.add.text(16, 12, 'Phase 0: 准备', {
      fontSize: '14px',
      fontFamily: '"VT323", monospace',
      color: '#7C3AED',
    });
  }

  /** Update phase indicator text */
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

  /** Highlight the active table with a glow */
  highlightTable(groupId: number): void {
    // Remove old glow
    if (this.activeGroupId >= 0) {
      const oldGlow = this.tableGlowGraphics.get(this.activeGroupId);
      if (oldGlow) {
        oldGlow.destroy();
        this.tableGlowGraphics.delete(this.activeGroupId);
      }
      // Un-highlight old group characters
      this.getGroupCharacters(this.activeGroupId).forEach((c) =>
        c.highlight(false),
      );
    }

    this.activeGroupId = groupId;

    const tableIndex = groupId - 1;
    if (tableIndex < 0 || tableIndex >= 4) return;

    const pos = TABLE_POSITIONS[tableIndex];
    const glow = this.add.graphics();

    // Purple glow around table
    glow.fillStyle(0x7c3aed, 0.15);
    glow.fillRoundedRect(
      pos.x - TABLE_WIDTH / 2 - 10,
      pos.y - TABLE_HEIGHT / 2 - 10,
      TABLE_WIDTH + 20,
      TABLE_HEIGHT + 20,
      6,
    );

    // Glow border
    glow.lineStyle(2, 0x7c3aed, 0.6);
    glow.strokeRoundedRect(
      pos.x - TABLE_WIDTH / 2 - 10,
      pos.y - TABLE_HEIGHT / 2 - 10,
      TABLE_WIDTH + 20,
      TABLE_HEIGHT + 20,
      6,
    );

    this.tableGlowGraphics.set(groupId, glow);

    // Pulse animation
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.6, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Highlight group characters
    this.getGroupCharacters(groupId).forEach((c) => c.highlight(true));
  }

  /** Get characters belonging to a group (table) */
  private getGroupCharacters(groupId: number): CharacterSprite[] {
    const chars: CharacterSprite[] = [];
    const startIdx = (groupId - 1) * 5 + 1;
    for (let i = startIdx; i < startIdx + 5 && i <= 20; i++) {
      const c = this.characters.get(`oc-${i}`);
      if (c) chars.push(c);
    }
    return chars;
  }

  /** Show speech bubble on a character */
  showSpeechBubble(agentId: string, text?: string): void {
    this.hideSpeechBubble();
    const character = this.characters.get(agentId);
    if (character) {
      character.speak(text);
    }
  }

  /** Hide all speech bubbles */
  hideSpeechBubble(): void {
    this.characters.forEach((c) => c.stopSpeaking());
  }

  /** Clean up on scene shutdown */
  shutdown(): void {
    this.characters.forEach((c) => c.destroy());
    this.characters.clear();
    this.tableGlowGraphics.forEach((g) => g.destroy());
    this.tableGlowGraphics.clear();
  }
}
