'use client';

import { useEffect, useRef, useCallback } from 'react';
import type Phaser from 'phaser';
import type { TavernScene } from './TavernScene';
import type { ArenaScene } from './ArenaScene';

export interface GameCanvasProps {
  currentPhase: number;
  activeGroupId: number;
  speakingAgentId: string | null;
  speakingText?: string;
}

export function GameCanvas({
  currentPhase,
  activeGroupId,
  speakingAgentId,
  speakingText,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const scenesReadyRef = useRef(false);

  // Helper to get scene instances
  const getTavernScene = useCallback((): TavernScene | null => {
    if (!gameRef.current || !scenesReadyRef.current) return null;
    return gameRef.current.scene.getScene('TavernScene') as TavernScene | null;
  }, []);

  const getArenaScene = useCallback((): ArenaScene | null => {
    if (!gameRef.current || !scenesReadyRef.current) return null;
    return gameRef.current.scene.getScene('ArenaScene') as ArenaScene | null;
  }, []);

  // Initialize Phaser (browser-only dynamic import)
  useEffect(() => {
    if (!containerRef.current) return;

    let game: Phaser.Game | null = null;
    let destroyed = false;

    const init = async () => {
      // Dynamic import — Phaser requires DOM
      const PhaserModule = await import('phaser');
      const { TavernScene: TavernSceneClass } = await import('./TavernScene');
      const { ArenaScene: ArenaSceneClass } = await import('./ArenaScene');

      if (destroyed) return;

      const config: Phaser.Types.Core.GameConfig = {
        type: PhaserModule.AUTO,
        width: 800,
        height: 600,
        parent: containerRef.current!,
        backgroundColor: '#0F0F23',
        pixelArt: true,
        scene: [TavernSceneClass, ArenaSceneClass],
        scale: {
          mode: PhaserModule.Scale.FIT,
          autoCenter: PhaserModule.Scale.CENTER_BOTH,
        },
        render: {
          antialias: false,
          roundPixels: true,
        },
      };

      game = new PhaserModule.Game(config);
      gameRef.current = game;

      // Wait for first scene to be ready
      game.events.once('ready', () => {
        if (!destroyed) {
          scenesReadyRef.current = true;
        }
      });
    };

    init();

    return () => {
      destroyed = true;
      scenesReadyRef.current = false;
      if (game) {
        game.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // React to phase changes
  useEffect(() => {
    if (!gameRef.current || !scenesReadyRef.current) return;

    const tavern = getTavernScene();
    const arena = getArenaScene();

    if (currentPhase < 3) {
      // Show tavern, hide arena
      if (tavern && !gameRef.current.scene.isActive('TavernScene')) {
        gameRef.current.scene.start('TavernScene');
      }
      if (arena && gameRef.current.scene.isActive('ArenaScene')) {
        gameRef.current.scene.stop('ArenaScene');
      }
      tavern?.setPhaseIndicator(currentPhase);
    } else {
      // Show arena, hide tavern
      if (tavern && gameRef.current.scene.isActive('TavernScene')) {
        gameRef.current.scene.stop('TavernScene');
      }
      if (arena && !gameRef.current.scene.isActive('ArenaScene')) {
        gameRef.current.scene.start('ArenaScene');
      }
    }
  }, [currentPhase, getTavernScene, getArenaScene]);

  // React to active group changes
  useEffect(() => {
    const tavern = getTavernScene();
    if (tavern && currentPhase < 3) {
      tavern.highlightTable(activeGroupId);
    }
  }, [activeGroupId, currentPhase, getTavernScene]);

  // React to speaking agent changes
  useEffect(() => {
    const tavern = getTavernScene();
    const arena = getArenaScene();

    if (currentPhase < 3 && tavern) {
      if (speakingAgentId) {
        tavern.showSpeechBubble(speakingAgentId, speakingText);
      } else {
        tavern.hideSpeechBubble();
      }
    } else if (currentPhase >= 3 && arena) {
      if (speakingAgentId) {
        arena.showSpeechBubble(speakingAgentId, speakingText);
      } else {
        arena.hideSpeechBubble();
      }
    }
  }, [speakingAgentId, speakingText, currentPhase, getTavernScene, getArenaScene]);

  return (
    <div
      ref={containerRef}
      className="w-full aspect-[4/3] max-w-[800px] mx-auto rounded-lg overflow-hidden border border-[#4A3728]/50"
    />
  );
}
