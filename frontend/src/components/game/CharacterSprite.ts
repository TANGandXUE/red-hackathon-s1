import type Phaser from 'phaser';

export class CharacterSprite {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private speechBubble: Phaser.GameObjects.Container | null = null;
  private idleTween: Phaser.Tweens.Tween | null = null;
  private glowGraphics: Phaser.GameObjects.Graphics | null = null;

  public readonly id: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    name: string,
    id?: string,
  ) {
    this.scene = scene;
    this.id = id ?? textureKey;

    // Create container for all sub-objects
    this.container = scene.add.container(x, y);

    // Avatar sprite — scale down to 40x40 pixel-art style
    this.sprite = scene.add.image(0, 0, textureKey);
    this.sprite.setDisplaySize(40, 40);

    // Pixel-art frame border
    const frame = scene.add.graphics();
    frame.lineStyle(2, 0x6b4e37, 1);
    frame.strokeRect(-21, -21, 42, 42);

    // Name label below
    this.nameText = scene.add.text(0, 28, name, {
      fontSize: '10px',
      fontFamily: '"VT323", monospace',
      color: '#E2E8F0',
      align: 'center',
    });
    this.nameText.setOrigin(0.5, 0);

    this.container.add([frame, this.sprite, this.nameText]);
  }

  /** Start idle float animation */
  startIdle(): void {
    if (this.idleTween) return;
    this.idleTween = this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Stop idle animation */
  stopIdle(): void {
    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
    }
  }

  /** Show speech bubble + glow effect */
  speak(text?: string): void {
    this.stopSpeaking();

    // Glow effect
    this.glowGraphics = this.scene.add.graphics();
    this.glowGraphics.fillStyle(0x7c3aed, 0.3);
    this.glowGraphics.fillCircle(0, 0, 28);
    this.container.addAt(this.glowGraphics, 0);

    // Pulse the glow
    this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: { from: 0.3, to: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Speech bubble
    const bubbleText = text ?? '...';
    const displayText = bubbleText.length > 20
      ? bubbleText.slice(0, 18) + '...'
      : bubbleText;

    this.speechBubble = this.scene.add.container(0, -40);

    const textObj = this.scene.add.text(0, 0, displayText, {
      fontSize: '9px',
      fontFamily: '"VT323", monospace',
      color: '#E2E8F0',
      align: 'center',
      wordWrap: { width: 80 },
    });
    textObj.setOrigin(0.5, 0.5);

    const padding = 6;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(
      -textObj.width / 2 - padding,
      -textObj.height / 2 - padding,
      textObj.width + padding * 2,
      textObj.height + padding * 2,
      4,
    );
    // Small triangle pointer
    bg.fillTriangle(
      -4, textObj.height / 2 + padding,
      4, textObj.height / 2 + padding,
      0, textObj.height / 2 + padding + 6,
    );

    this.speechBubble.add([bg, textObj]);
    this.container.add(this.speechBubble);

    // Bubble pop-in animation
    this.speechBubble.setScale(0);
    this.scene.tweens.add({
      targets: this.speechBubble,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  /** Hide speech bubble and glow */
  stopSpeaking(): void {
    if (this.speechBubble) {
      this.speechBubble.destroy();
      this.speechBubble = null;
    }
    if (this.glowGraphics) {
      this.glowGraphics.destroy();
      this.glowGraphics = null;
    }
  }

  /** Move to a new position with tween */
  moveTo(x: number, y: number, duration = 800): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container,
        x,
        y,
        duration,
        ease: 'Power2',
        onComplete: () => resolve(),
      });
    });
  }

  /** Toggle highlight effect (for active table) */
  highlight(on: boolean): void {
    if (on) {
      this.sprite.setTint(0xc4b5fd);
    } else {
      this.sprite.clearTint();
    }
  }

  /** Set visibility */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /** Get current position */
  getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  /** Set position directly */
  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  /** Destroy all game objects */
  destroy(): void {
    this.stopIdle();
    this.stopSpeaking();
    this.container.destroy();
  }
}
