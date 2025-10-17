
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLevelConfig } from '../game/config';
import { BirdState, HazardType, LevelConfig, ObstacleState } from '../types';
import * as C from '../constants';

interface GameProps {
  level: number;
  onGameOver: () => void;
  onLevelComplete: () => void;
}

const Game: React.FC<GameProps> = ({ level, onGameOver, onLevelComplete }) => {
  const [levelConfig] = useState<LevelConfig>(() => getLevelConfig(level));
  const [bird, setBird] = useState<BirdState>({ y: C.GAME_HEIGHT / 2, velocity: 0 });
  const [obstacles, setObstacles] = useState<ObstacleState[]>([]);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  
  // FIX: Provide an initial value to useRef to resolve "Expected 1 arguments, but got 0" error.
  const gameLoopRef = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const frameCountRef = useRef(0);

  const generateObstacles = useCallback(() => {
    const newObstacles: ObstacleState[] = [];
    for (let i = 0; i < levelConfig.obstacleCount; i++) {
      const gapY = Math.random() * (C.GAME_HEIGHT - levelConfig.gapSize - 200) + 100;
      newObstacles.push({
        id: i,
        x: C.GAME_WIDTH + i * levelConfig.obstacleSpacing,
        gapY: gapY,
        movingUp: Math.random() > 0.5,
        isTangible: true,
      });
    }
    setObstacles(newObstacles);
  }, [levelConfig]);

  useEffect(() => {
    generateObstacles();
    const startTimeout = setTimeout(() => setIsPaused(false), 1000);
    return () => clearTimeout(startTimeout);
  }, [generateObstacles]);

  const flap = useCallback(() => {
    if (!isPaused) {
      setBird(b => ({ ...b, velocity: C.FLAP_STRENGTH }));
    }
  }, [isPaused]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        flap();
      }
    };
    const handleTouch = () => {
        flap();
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('touchstart', handleTouch);
    if(gameAreaRef.current) {
        gameAreaRef.current.addEventListener('mousedown', handleTouch);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('touchstart', handleTouch);
      if(gameAreaRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        gameAreaRef.current.removeEventListener('mousedown', handleTouch);
      }
    };
  }, [flap]);
  
  const gameLoop = useCallback(() => {
    if (isPaused) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    frameCountRef.current++;

    // Bird physics
    let currentGravity = C.GRAVITY;
    if (levelConfig.hazards.includes(HazardType.ShiftingGravity)) {
        // Simple implementation: gravity shifts every 120 frames
        if (Math.floor(frameCountRef.current / 120) % 2 === 1) {
            currentGravity = C.GRAVITY * 0.6;
        } else {
            currentGravity = C.GRAVITY * 1.4;
        }
    }

    setBird(b => {
      const newVelocity = b.velocity + currentGravity;
      const newY = b.y + newVelocity;
      return { velocity: newVelocity, y: newY };
    });

    // Move & update obstacles
    let passedObstacle = false;
    setObstacles(obs => obs.map(o => {
      const newX = o.x - levelConfig.speed;

      // Hazard: Moving Pistons
      let newGapY = o.gapY;
      if (levelConfig.hazards.includes(HazardType.MovingPistons)) {
        const moveAmount = Math.sin(frameCountRef.current * 0.05 + o.id) * 2;
        newGapY += moveAmount;
      }
      
      // Hazard: Glitching
      let newIsTangible = o.isTangible;
      let newIsGlitching = o.isGlitching;
      if(levelConfig.hazards.includes(HazardType.Glitching)) {
        if(frameCountRef.current % 100 > 80) { // Glitch for 20 frames every 100
          newIsTangible = false;
          newIsGlitching = true;
        } else {
          newIsTangible = true;
          newIsGlitching = false;
        }
      }

      // Hazard: Laser Grids
      let newIsLaserOn = false;
      if (levelConfig.hazards.includes(HazardType.LaserGrids)) {
          if (Math.floor(frameCountRef.current / 60) % 2 === 0) { // On for 1s, off for 1s
              newIsLaserOn = true;
          }
      }

      if (newX < C.BIRD_X_POSITION && o.x >= C.BIRD_X_POSITION) {
        passedObstacle = true;
      }
      return { ...o, x: newX, gapY: newGapY, isTangible: newIsTangible, isGlitching: newIsGlitching, isLaserOn: newIsLaserOn };
    }).filter(o => o.x > -C.OBSTACLE_WIDTH));

    if (passedObstacle) {
      setScore(s => s + 1);
    }
    
    // Collision detection
    const birdY = bird.y;
    if (birdY > C.GAME_HEIGHT - C.BIRD_SIZE || birdY < 0) {
      onGameOver();
      return;
    }

    for (const o of obstacles) {
      const birdRect = { x: C.BIRD_X_POSITION, y: bird.y, width: C.BIRD_SIZE, height: C.BIRD_SIZE };
      
      // Check collision with top and bottom obstacles
      const topObstacleRect = { x: o.x, y: 0, width: C.OBSTACLE_WIDTH, height: o.gapY };
      const bottomObstacleRect = { x: o.x, y: o.gapY + levelConfig.gapSize, width: C.OBSTACLE_WIDTH, height: C.GAME_HEIGHT };
      
      const collides = (rect1: typeof birdRect, rect2: typeof topObstacleRect) => 
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;

      if (o.isTangible && (collides(birdRect, topObstacleRect) || collides(birdRect, bottomObstacleRect))) {
        onGameOver();
        return;
      }

      // Check collision with laser
      if(o.isLaserOn){
        const laserRect = { x: o.x, y: o.gapY, width: C.OBSTACLE_WIDTH, height: levelConfig.gapSize };
        if(collides(birdRect, laserRect)){
          onGameOver();
          return;
        }
      }
    }
    
    if (score >= levelConfig.obstacleCount) {
        onLevelComplete();
        return;
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [bird.y, isPaused, levelConfig, onGameOver, onLevelComplete, obstacles, score]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if(gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop]);

  const { theme } = levelConfig.era;
  const isGravityShifted = levelConfig.hazards.includes(HazardType.ShiftingGravity) && Math.floor(frameCountRef.current / 120) % 2 === 1;

  return (
    <div
      ref={gameAreaRef}
      className={`relative w-full h-full bg-gradient-to-b ${theme.background} overflow-hidden cursor-pointer select-none transition-all duration-500`}
      style={{ filter: isGravityShifted ? 'hue-rotate(60deg)' : 'none' }}
    >
      {/* Bird */}
      <div
        className={`absolute ${theme.bird} border-4 rounded-full transition-transform duration-100`}
        style={{
          width: C.BIRD_SIZE,
          height: C.BIRD_SIZE,
          left: C.BIRD_X_POSITION,
          transform: `translateY(${bird.y}px) rotate(${Math.max(-45, Math.min(90, bird.velocity * 6))}deg)`,
        }}
      />
      {/* Obstacles */}
      {obstacles.map(o => (
        <div key={o.id}>
          <div
            className={`absolute ${theme.obstacleColor} border-4 rounded-lg transition-opacity duration-100 ${o.isGlitching ? theme.glitchColor : ''}`}
            style={{
              left: o.x,
              top: 0,
              width: C.OBSTACLE_WIDTH,
              height: o.gapY,
              opacity: o.isTangible ? 1 : 0.3,
            }}
          />
          <div
            className={`absolute ${theme.obstacleColor} border-4 rounded-lg transition-opacity duration-100 ${o.isGlitching ? theme.glitchColor : ''}`}
            style={{
              left: o.x,
              top: o.gapY + levelConfig.gapSize,
              width: C.OBSTACLE_WIDTH,
              height: C.GAME_HEIGHT - (o.gapY + levelConfig.gapSize),
              opacity: o.isTangible ? 1 : 0.3,
            }}
          />
          {/* Laser */}
          {o.isLaserOn &&
            <div 
              className={`absolute ${theme.laserColor} opacity-70`}
              style={{
                left: o.x + C.OBSTACLE_WIDTH/2 - 2,
                top: o.gapY,
                width: 4,
                height: levelConfig.gapSize,
              }}
            />
          }
        </div>
      ))}

      {/* Score and Level */}
      <div className="absolute top-4 left-4 text-white text-3xl font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
        Level: {level}
      </div>
      <div className="absolute top-4 right-4 text-white text-3xl font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
        Progress: {score} / {levelConfig.obstacleCount}
      </div>
       {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-6xl font-bold animate-pulse" style={{textShadow: '3px 3px 6px rgba(0,0,0,0.7)'}}>
            Get Ready!
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;