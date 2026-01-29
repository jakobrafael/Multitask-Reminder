import { useState } from "react";
import { GameProps, getPityBonus } from "./types";

type CoinSide = "heads" | "tails";

interface FlipResult {
  guess: CoinSide;
  actual: CoinSide;
  correct: boolean;
}

export function HeadsOrTails({ onWin, onLose, lossStreak }: GameProps) {
  const [results, setResults] = useState<FlipResult[]>([]);
  const [flipping, setFlipping] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const wins = results.filter(r => r.correct).length;
  const losses = results.filter(r => !r.correct).length;
  const round = results.length + 1;
  
  // Pity system: base 50% chance + pity bonus (up to 40%)
  const pityBonus = getPityBonus(lossStreak);
  const winChance = 0.5 + pityBonus;

  const flipCoin = (guess: CoinSide) => {
    if (flipping || gameOver) return;
    
    setFlipping(true);
    
    // Simulate flip animation delay
    setTimeout(() => {
      // With pity system: bias the coin towards the player's guess
      // Base: 50% chance. With max pity: 90% chance of guessing correctly
      const playerWins = Math.random() < winChance;
      const actual: CoinSide = playerWins ? guess : (guess === "heads" ? "tails" : "heads");
      const correct = guess === actual;
      
      const newResults = [...results, { guess, actual, correct }];
      setResults(newResults);
      
      const newWins = newResults.filter(r => r.correct).length;
      const newLosses = newResults.filter(r => !r.correct).length;
      
      // Check if game is decided (best of 3: need 2 to win)
      if (newWins >= 2) {
        setGameOver(true);
        setTimeout(onWin, 1000);
      } else if (newLosses >= 2) {
        setGameOver(true);
        setTimeout(onLose, 1000);
      }
      
      setFlipping(false);
    }, 800);
  };

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
        Heads or Tails
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Guess correctly 2 out of 3 times to dismiss
      </p>
      
      {/* Score display */}
      <div className="flex justify-center gap-8 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{wins}</div>
          <div className="text-xs text-gray-500">Correct</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{losses}</div>
          <div className="text-xs text-gray-500">Wrong</div>
        </div>
      </div>
      
      {/* Coin display */}
      <div className="mb-6">
        <div className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center text-3xl font-bold
          ${flipping 
            ? "animate-spin border-purple-400 bg-gradient-to-br from-purple-500/20 to-pink-500/20" 
            : "border-purple-500/30 bg-gray-800/50"}
          transition-all duration-200`}
        >
          <span className={flipping ? "text-purple-300" : "text-white"}>
            {flipping ? "?" : results.length > 0 ? (
              results[results.length - 1].actual === "heads" ? "H" : "T"
            ) : "?"}
          </span>
        </div>
        
        {results.length > 0 && !flipping && (
          <p className={`mt-3 text-sm font-medium ${
            results[results.length - 1].correct ? "text-green-400" : "text-red-400"
          }`}>
            {results[results.length - 1].correct ? "Correct!" : "Wrong!"}
            {" "}- It was {results[results.length - 1].actual}
          </p>
        )}
      </div>
      
      {/* Round indicator */}
      {!gameOver && (
        <p className="text-sm text-gray-500 mb-4">Round {Math.min(round, 3)} of 3</p>
      )}
      
      {/* Game result */}
      {gameOver && (
        <p className={`text-xl font-bold mb-4 ${wins >= 2 
          ? "bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent" 
          : "text-red-400"}`}>
          {wins >= 2 ? "You Win!" : "Try Again..."}
        </p>
      )}
      
      {/* Buttons */}
      {!gameOver && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => flipCoin("heads")}
            disabled={flipping}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none"
          >
            Heads
          </button>
          <button
            onClick={() => flipCoin("tails")}
            disabled={flipping}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:shadow-none"
          >
            Tails
          </button>
        </div>
      )}
      
      {/* Results history */}
      {results.length > 0 && (
        <div className="mt-4 flex justify-center gap-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border ${
                r.correct 
                  ? "bg-green-500/20 text-green-400 border-green-500/30" 
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}
            >
              {r.actual === "heads" ? "H" : "T"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
