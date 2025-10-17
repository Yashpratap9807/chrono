
import { Era, HazardType, LevelConfig } from '../types';

export const ERAS: Era[] = [
  {
    name: 'Prehistoric Peril',
    startLevel: 1,
    endLevel: 1000,
    theme: {
      background: 'from-sky-300 to-emerald-400',
      bird: 'bg-yellow-400 border-yellow-600',
      obstacleColor: 'bg-green-600 border-green-800',
    },
  },
  {
    name: 'Industrial Revolution',
    startLevel: 1001,
    endLevel: 2000,
    theme: {
      background: 'from-slate-500 to-slate-700',
      bird: 'bg-gray-300 border-gray-500',
      obstacleColor: 'bg-orange-900 border-stone-950',
    },
    hazard: HazardType.MovingPistons,
  },
  {
    name: 'The Digital Age',
    startLevel: 2001,
    endLevel: 3000,
    theme: {
      background: 'from-black to-blue-900',
      bird: 'bg-cyan-300 border-cyan-500',
      obstacleColor: 'bg-indigo-700 border-indigo-900',
      glitchColor: 'bg-fuchsia-500',
    },
    hazard: HazardType.Glitching,
  },
  {
    name: 'Cyberpunk Future',
    startLevel: 3001,
    endLevel: 4000,
    theme: {
      background: 'from-purple-900 to-black',
      bird: 'bg-pink-400 border-pink-600',
      obstacleColor: 'bg-gray-800 border-gray-950',
      laserColor: 'bg-red-500',
    },
    hazard: HazardType.LaserGrids,
  },
  {
    name: 'Cosmic Void',
    startLevel: 4001,
    endLevel: 10000, // Extend last era to 10000
    theme: {
      background: 'from-indigo-900 to-black',
      bird: 'bg-white border-gray-300',
      obstacleColor: 'bg-purple-500 border-purple-700',
    },
    hazard: HazardType.ShiftingGravity,
  },
];

const getActiveHazards = (level: number): HazardType[] => {
  return ERAS.filter(era => era.hazard !== undefined && level >= era.startLevel).map(era => era.hazard!);
};

export const getLevelConfig = (level: number): LevelConfig => {
  const era = ERAS.find(e => level >= e.startLevel && level <= e.endLevel) || ERAS[ERAS.length - 1];
  
  // Base values
  const baseSpeed = 3;
  const baseGap = 200;
  const baseSpacing = 400;

  // Difficulty scaling factors
  const speedScale = Math.min(5, level * 0.002);
  const gapScale = Math.max(110, baseGap - level * 0.02);
  const spacingScale = Math.max(300, baseSpacing - level * 0.01);
  const obstacleCount = 10 + Math.floor(level / 50);

  return {
    level,
    era,
    speed: baseSpeed + speedScale,
    gapSize: gapScale,
    obstacleSpacing: spacingScale,
    obstacleCount,
    hazards: getActiveHazards(level),
  };
};
