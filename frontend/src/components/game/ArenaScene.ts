import Phaser from 'phaser';
import { CharacterSprite } from './CharacterSprite';

/** Layout constants */
const CANVAS_W = 800;
const CANVAS_H = 600;

// Team seats: 5 members centered horizontally, upper area
const TEAM_Y = 200;
const TEAM_START_X = 240;
const TEAM_SPACING = 80;

// Judge seats: 6 judges centered horizontally, lower area
const JUDGE_Y = 400;
const JUDGE_START_X = 150;
const JUDGE_SPACING = 100;

export class ArenaScene extends Phaser.Scene {
  private teamCharacters: CharacterSprite[] = [];
  private judgeCharacters: CharacterSprite[] = [];
  private allCharacters: Map<string, CharacterSprite> = new Map();
  private phaseText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ArenaScene' });
  }

  preload(): void {
    // Avatars should already be loaded from TavernScene,
    // but load them here too in case ArenaScene starts directly
    for (let i = 1; i <= 20; i++) {
      if (!this.textures.exists(`oc-${i}`)) {
        this.load.image(`oc-${i}`, `/avatars/oc-${i}.jpeg`);
      }
    }
  }

  create(): void {
    this.drawBackground();
    this.createPhaseIndicator();
    this.createSectionLabels();
  }

  /** Draw arena background */
  private drawBackground(): void {
    const bg = this.add.graphics();

    // Dark background
    bg.fillStyle(0x0f0f23, 1);
    bg.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stage floor area
    bg.fillStyle(0x4a3728, 0.2);
    bg.fillRect(80, 140, 640, 140);

    // Stage border
    bg.lineStyle(2, 0x7c3aed, 0.4);
    bg.strokeRect(80, 140, 640, 140);

    // Judge panel area
    bg.fillStyle(0x1a1a2e, 0.4);
    bg.fillRect(60, 340, 680, 120);

    // Judge panel border
    bg.lineStyle(2, 0x6b4e37, 0.6);
    bg.strokeRect(60, 340, 680, 120);
  }

  /** Phase indicator */
  private createPhaseIndicator(): void {
    this.phaseText = this.add.text(16, 12, 'Phase 3: 答辩', {
      fontSize: '14px',
      fontFamily: '"VT323", monospace',
      color: '#7C3AED',
    });
  }

  /** Section labels */
  private createSectionLabels(): void {
    this.add.text(CANVAS_W / 2, 150, '选手席', {
      fontSize: '12px',
      fontFamily: '"VT323", monospace',
      color: '#E2E8F0',
    }).setOrigin(0.5, 0).setAlpha(0.5);

    this.add.text(CANVAS_W / 2, 350, '评委席', {
      fontSize: '12px',
      fontFamily: '"VT323", monospace',
      color: '#E2E8F0',
    }).setOrigin(0.5, 0).setAlpha(0.5);
  }

  /** Place team characters with walk-in animation */
  setTeam(
    members: { id: string; name: string; textureKey: string; isLeader?: boolean }[],
  ): void {
    // Clear existing team
    this.teamCharacters.forEach((c) => {
      this.allCharacters.delete(c.id);
      c.destroy();
    });
    this.teamCharacters = [];

    members.forEach((member, idx) => {
      const targetX = TEAM_START_X + idx * TEAM_SPACING;
      const targetY = TEAM_Y;

      // Start off-screen left
      const character = new CharacterSprite(
        this,
        -60,
        targetY,
        member.textureKey,
        member.name,
        member.id,
      );

      // Leader is slightly highlighted
      if (member.isLeader) {
        character.highlight(true);
      }

      // Walk-in animation with staggered delay
      character.moveTo(targetX, targetY, 600 + idx * 150).then(() => {
        character.startIdle();
      });

      this.teamCharacters.push(character);
      this.allCharacters.set(member.id, character);
    });
  }

  /** Place judge characters */
  setJudges(
    judges: { id: string; name: string; avatarUrl: string }[],
  ): void {
    // Clear existing judges
    this.judgeCharacters.forEach((c) => {
      this.allCharacters.delete(c.id);
      c.destroy();
    });
    this.judgeCharacters = [];

    judges.forEach((judge, idx) => {
      // Use avatarUrl as texture key, or fallback to a loaded oc texture
      let textureKey = judge.avatarUrl;

      // If the texture doesn't exist, try to load it or use placeholder
      if (!this.textures.exists(textureKey)) {
        // Use a fallback — reuse an oc avatar as placeholder
        textureKey = `oc-${(idx % 20) + 1}`;
      }

      const x = JUDGE_START_X + idx * JUDGE_SPACING;
      const character = new CharacterSprite(
        this,
        x,
        JUDGE_Y,
        textureKey,
        judge.name,
        judge.id,
      );
      character.startIdle();

      this.judgeCharacters.push(character);
      this.allCharacters.set(judge.id, character);
    });
  }

  /** Show speech bubble on any character (team or judge) */
  showSpeechBubble(id: string, text?: string): void {
    this.hideSpeechBubble();
    const character = this.allCharacters.get(id);
    if (character) {
      character.speak(text);
    }
  }

  /** Hide all speech bubbles */
  hideSpeechBubble(): void {
    this.allCharacters.forEach((c) => c.stopSpeaking());
  }

  /** Show floating score animation above a judge */
  showScore(judgeId: string, score: number): void {
    const character = this.allCharacters.get(judgeId);
    if (!character) return;

    const pos = character.getPosition();

    // Score text that floats up and fades out
    const scoreText = this.add.text(pos.x, pos.y - 50, `${score}`, {
      fontSize: '24px',
      fontFamily: '"VT323", monospace',
      color: '#FBBF24',
      stroke: '#0F0F23',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    // Float up and fade
    this.tweens.add({
      targets: scoreText,
      y: pos.y - 100,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        scoreText.destroy();
      },
    });

    // Scale pop effect
    scoreText.setScale(0.5);
    this.tweens.add({
      targets: scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
    });
  }

  /** Clean up on scene shutdown */
  shutdown(): void {
    this.allCharacters.forEach((c) => c.destroy());
    this.allCharacters.clear();
    this.teamCharacters = [];
    this.judgeCharacters = [];
  }
}
