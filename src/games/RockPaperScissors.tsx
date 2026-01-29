import { useState } from "react";
import { GameProps, getPityBonus } from "./types";

type Choice = "rock" | "paper" | "scissors";
type RoundResult = "win" | "lose" | "draw";

interface RoundHistory {
  playerChoice: Choice;
  computerChoice: Choice;
  result: RoundResult;
}

const CHOICES: Choice[] = ["rock", "paper", "scissors"];

const CHOICE_EMOJI: Record<Choice, string> = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
};

// What beats what
const LOSING_CHOICE: Record<Choice, Choice> = {
  rock: "scissors",     // If player picks rock, computer picking scissors = player wins
  paper: "rock",        // If player picks paper, computer picking rock = player wins
  scissors: "paper",    // If player picks scissors, computer picking paper = player wins
};

function determineWinner(player: Choice, computer: Choice): RoundResult {
  if (player === computer) return "draw";
  
  if (
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper")
  ) {
    return "win";
  }
  
  return "lose";
}

export function RockPaperScissors({ onWin, onLose, lossStreak }: GameProps) {
  const [rounds, setRounds] = useState<RoundHistory[]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentComputer, setCurrentComputer] = useState<Choice | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const playerWins = rounds.filter(r => r.result === "win").length;
  const computerWins = rounds.filter(r => r.result === "lose").length;
  
  // Pity system: increase chance computer picks the losing choice
  const pityBonus = getPityBonus(lossStreak);

  const play = (playerChoice: Choice) => {
    if (playing || gameOver) return;
    
    setPlaying(true);
    setCurrentComputer(null);
    
    // Animate computer choice
    let animationCount = 0;
    const animationInterval = setInterval(() => {
      setCurrentComputer(CHOICES[animationCount % 3]);
      animationCount++;
      
      if (animationCount > 8) {
        clearInterval(animationInterval);
        
        // Make final choice with pity system
        // Base: 33% each. With pity, bias towards the losing choice
        let computerChoice: Choice;
        const roll = Math.random();
        
        if (roll < pityBonus) {
          // Pity activated: computer picks the choice that loses to player
          computerChoice = LOSING_CHOICE[playerChoice];
        } else {
          // Normal random choice
          computerChoice = CHOICES[Math.floor(Math.random() * 3)];
        }
        
        setCurrentComputer(computerChoice);
        
        const result = determineWinner(playerChoice, computerChoice);
        const newRounds = [...rounds, { playerChoice, computerChoice, result }];
        setRounds(newRounds);
        
        const newPlayerWins = newRounds.filter(r => r.result === "win").length;
        const newComputerWins = newRounds.filter(r => r.result === "lose").length;
        
        // Best of 3: need 2 wins
        if (newPlayerWins >= 2) {
          setGameOver(true);
          setTimeout(onWin, 1200);
        } else if (newComputerWins >= 2) {
          setGameOver(true);
          setTimeout(onLose, 1200);
        }
        
        setPlaying(false);
      }
    }, 100);
  };

  const lastRound = rounds[rounds.length - 1];

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
        Rock Paper Scissors
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Win 2 rounds to dismiss
      </p>
      
      {/* Score display */}
      <div className="flex justify-center gap-8 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{playerWins}</div>
          <div className="text-xs text-gray-500">You</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{computerWins}</div>
          <div className="text-xs text-gray-500">Computer</div>
        </div>
      </div>
      
      {/* Battle display */}
      <div className="flex justify-center items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-4xl">
          {lastRound && !playing ? CHOICE_EMOJI[lastRound.playerChoice] : "❓"}
        </div>
        <div className="text-xl font-bold text-purple-400">VS</div>
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center text-4xl">
          {playing && currentComputer ? CHOICE_EMOJI[currentComputer] : 
           lastRound && !playing ? CHOICE_EMOJI[lastRound.computerChoice] : "❓"}
        </div>
      </div>
      
      {/* Round result */}
      {lastRound && !playing && (
        <p className={`text-base font-semibold mb-4 ${
          lastRound.result === "win" ? "text-green-400" :
          lastRound.result === "lose" ? "text-red-400" : "text-amber-400"
        }`}>
          {lastRound.result === "win" ? "You won this round!" :
           lastRound.result === "lose" ? "Computer won this round!" : "Draw! Play again!"}
        </p>
      )}
      
      {/* Game result */}
      {gameOver && (
        <p className={`text-xl font-bold mb-4 ${playerWins >= 2 
          ? "bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent" 
          : "text-red-400"}`}>
          {playerWins >= 2 ? "You Win the Game!" : "Computer Wins... Try Again!"}
        </p>
      )}
      
      {/* Choice buttons */}
      {!gameOver && (
        <div className="flex justify-center gap-3">
          {CHOICES.map((choice) => (
            <button
              key={choice}
              onClick={() => play(choice)}
              disabled={playing}
              className={`w-16 h-16 rounded-xl text-3xl transition-all border-2
                ${playing 
                  ? "bg-gray-800 border-gray-700 cursor-not-allowed opacity-50" 
                  : "bg-gray-800/80 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/20 border-purple-500/30 hover:border-purple-400"
                }`}
            >
              {CHOICE_EMOJI[choice]}
            </button>
          ))}
        </div>
      )}
      
      {/* Round history */}
      {rounds.length > 0 && (
        <div className="mt-4 flex justify-center gap-2">
          {rounds.map((r, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border ${
                r.result === "win" 
                  ? "bg-green-500/20 text-green-400 border-green-500/30" 
                  : r.result === "lose"
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }`}
            >
              {r.result === "win" ? "W" : r.result === "lose" ? "L" : "D"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
