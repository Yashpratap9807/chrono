
import React, { useState, useEffect, useCallback } from 'react';
import Game from './components/Game';
import { GameState } from './types';
import * as C from './constants';
import { getLevelConfig } from './game/config';

const STORAGE_KEY = 'chronoBirdHighestLevel';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MainMenu);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(1);

  useEffect(() => {
    try {
      const savedLevel = localStorage.getItem(STORAGE_KEY);
      if (savedLevel) {
        const level = parseInt(savedLevel, 10);
        setHighestLevel(level);
        setCurrentLevel(level);
      }
    } catch (error) {
      console.error("Failed to load from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, highestLevel.toString());
    } catch (error) {
      console.error("Failed to save to localStorage", error);
    }
  }, [highestLevel]);

  const startGame = useCallback(() => {
    setCurrentLevel(highestLevel);
    setGameState(GameState.Playing);
  }, [highestLevel]);

  const restartFromCheckpoint = useCallback(() => {
    const checkpoint = Math.floor((currentLevel - 1) / C.CHECKPOINT_INTERVAL) * C.CHECKPOINT_INTERVAL + 1;
    setCurrentLevel(checkpoint);
    setGameState(GameState.Playing);
  }, [currentLevel]);
  
  const handleGameOver = useCallback(() => {
    setGameState(GameState.GameOver);
  }, []);

  const handleLevelComplete = useCallback(() => {
    setGameState(GameState.LevelComplete);
    if (currentLevel + 1 > highestLevel) {
      setHighestLevel(currentLevel + 1);
    }
  }, [currentLevel, highestLevel]);

  const goToNextLevel = useCallback(() => {
    setCurrentLevel(prev => prev + 1);
    setGameState(GameState.Playing);
  }, []);

  const renderContent = () => {
    const levelConfig = getLevelConfig(currentLevel);
    const { theme } = levelConfig.era;
    const checkpoint = Math.floor((currentLevel - 1) / C.CHECKPOINT_INTERVAL) * C.CHECKPOINT_INTERVAL + 1;


    switch (gameState) {
      case GameState.MainMenu:
        return (
          <div className={`w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-800 to-black text-white text-center`}>
            <h1 className="text-7xl font-bold mb-4" style={{textShadow: '3px 3px 0 #4a00e0'}}>Chrono-Bird</h1>
            <p className="text-xl mb-8 max-w-2xl">You are a creature unstuck in time. Flap through 10,000 portals of history to get back home.</p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-2xl font-bold transition-transform transform hover:scale-105"
            >
              {highestLevel > 1 ? `Continue from Level ${highestLevel}` : 'Start Journey'}
            </button>
          </div>
        );
      case GameState.GameOver:
        return (
          <div className={`w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b ${theme.background} text-white text-center`}>
            <h2 className="text-6xl font-bold mb-2" style={{textShadow: '3px 3px 6px rgba(0,0,0,0.7)'}}>Time Paradox!</h2>
            <p className="text-2xl mb-6">You were lost in level {currentLevel}.</p>
            <button
              onClick={restartFromCheckpoint}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-2xl font-bold transition-transform transform hover:scale-105"
            >
              Retry from Checkpoint (Level {checkpoint})
            </button>
          </div>
        );
      case GameState.LevelComplete:
         return (
          <div className={`w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b ${theme.background} text-white text-center`}>
            <h2 className="text-6xl font-bold mb-2" style={{textShadow: '3px 3px 6px rgba(0,0,0,0.7)'}}>Portal Cleared!</h2>
            <p className="text-2xl mb-6">You have cleared level {currentLevel}.</p>
            {currentLevel % C.CHECKPOINT_INTERVAL === 0 && (
              <p className="text-xl mb-4 text-yellow-300 font-bold">Checkpoint Reached! Your progress is saved.</p>
            )}
            <button
              onClick={goToNextLevel}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-2xl font-bold transition-transform transform hover:scale-105"
            >
              Enter Level {currentLevel + 1}
            </button>
          </div>
        );
      case GameState.Playing:
        return (
          <Game
            key={currentLevel}
            level={currentLevel}
            onGameOver={handleGameOver}
            onLevelComplete={handleLevelComplete}
          />
        );
    }
  };

  return (
    <div className="bg-gray-900 flex items-center justify-center w-screen h-screen">
      <div style={{ width: C.GAME_WIDTH, height: C.GAME_HEIGHT }} className="bg-black shadow-2xl rounded-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
