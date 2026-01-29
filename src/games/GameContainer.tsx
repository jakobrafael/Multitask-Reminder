import { useState, useCallback } from "react";
import { HeadsOrTails } from "./HeadsOrTails";
import { RockPaperScissors } from "./RockPaperScissors";
import { TicTacToe } from "./TicTacToe";
import { GameType, getRandomGame } from "./types";

interface GameContainerProps {
  onWin: () => void;
}

export function GameContainer({ onWin }: GameContainerProps) {
  const [currentGame, setCurrentGame] = useState<GameType>(getRandomGame);
  const [gameKey, setGameKey] = useState(0);
  const [lossStreak, setLossStreak] = useState(0);

  const handleLose = useCallback(() => {
    // Increment loss streak and pick a new random game
    setTimeout(() => {
      setLossStreak(prev => prev + 1);
      setCurrentGame(getRandomGame());
      setGameKey(k => k + 1);
    }, 500);
  }, []);

  const handleWin = useCallback(() => {
    // Reset loss streak on win
    setLossStreak(0);
    onWin();
  }, [onWin]);

  const renderGame = () => {
    const props = { onWin: handleWin, onLose: handleLose, lossStreak };
    
    switch (currentGame) {
      case "heads-or-tails":
        return <HeadsOrTails key={gameKey} {...props} />;
      case "rock-paper-scissors":
        return <RockPaperScissors key={gameKey} {...props} />;
      case "tic-tac-toe":
        return <TicTacToe key={gameKey} {...props} />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl">
      <div className="text-xs text-center mb-4 flex items-center justify-center gap-2">
        <span className="text-gray-400">Win to dismiss</span>
        {lossStreak > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 font-medium">
            Luck +{Math.min(lossStreak * 10, 40)}%
          </span>
        )}
      </div>
      {renderGame()}
    </div>
  );
}
