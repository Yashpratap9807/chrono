
export enum GameState {
  MainMenu,
  Playing,
  GameOver,
  LevelComplete,
}

export enum HazardType {
  MovingPistons,
  Glitching,
  LaserGrids,
  ShiftingGravity,
}

export interface Era {
  name: string;
  startLevel: number;
  endLevel: number;
  theme: {
    background: string;
    bird: string;
    obstacleColor: string;
    laserColor?: string;
    glitchColor?: string;
  };
  hazard?: HazardType;
}

export interface LevelConfig {
  level: number;
  era: Era;
  speed: number;
  gapSize: number;
  obstacleSpacing: number;
  obstacleCount: number;
  hazards: HazardType[];
}

export interface BirdState {
  y: number;
  velocity: number;
}

export interface ObstacleState {
  id: number;
  x: number;
  gapY: number;
  // For Moving Pistons
  movingUp?: boolean;
  // For Glitching
  isGlitching?: boolean;
  isTangible?: boolean;
  // For Lasers
  isLaserOn?: boolean;
}
