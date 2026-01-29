import { useState, useEffect } from "react";
import { GameProps, getPityBonus } from "./types";

type Cell = "X" | "O" | null;
type Board = Cell[];

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];

function checkWinner(board: Board): Cell {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isBoardFull(board: Board): boolean {
  return board.every(cell => cell !== null);
}

function getAvailableMoves(board: Board): number[] {
  return board.map((cell, i) => cell === null ? i : -1).filter(i => i !== -1);
}

// Minimax algorithm for optimal play
function minimax(board: Board, isMaximizing: boolean, depth: number): number {
  const winner = checkWinner(board);
  
  if (winner === "O") return 10 - depth; // AI wins
  if (winner === "X") return depth - 10; // Player wins
  if (isBoardFull(board)) return 0; // Draw
  
  const moves = getAvailableMoves(board);
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of moves) {
      board[move] = "O";
      bestScore = Math.max(bestScore, minimax(board, false, depth + 1));
      board[move] = null;
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const move of moves) {
      board[move] = "X";
      bestScore = Math.min(bestScore, minimax(board, true, depth + 1));
      board[move] = null;
    }
    return bestScore;
  }
}

function getBestMove(board: Board): number {
  const moves = getAvailableMoves(board);
  let bestScore = -Infinity;
  let bestMove = moves[0];
  
  for (const move of moves) {
    board[move] = "O";
    const score = minimax(board, false, 0);
    board[move] = null;
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
}

/**
 * Get AI move with adjustable optimality based on pity bonus
 * Base: 70% optimal (already fairly beatable)
 * With max pity bonus: 30% optimal (very easy)
 */
function getAIMove(board: Board, pityBonus: number): number {
  const moves = getAvailableMoves(board);
  
  // Base optimal chance: 70%, reduced by pity bonus (up to 40%)
  // At 0 losses: 70% optimal
  // At 4+ losses: 30% optimal
  const optimalChance = Math.max(0.3, 0.7 - pityBonus);
  
  if (Math.random() < optimalChance) {
    return getBestMove([...board]);
  } else {
    // Random move (suboptimal)
    return moves[Math.floor(Math.random() * moves.length)];
  }
}

export function TicTacToe({ onWin, onLose, lossStreak }: GameProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Cell>(null);
  const [winningCombo, setWinningCombo] = useState<number[] | null>(null);
  
  const pityBonus = getPityBonus(lossStreak);

  // AI move
  useEffect(() => {
    if (!isPlayerTurn && !gameOver) {
      const timer = setTimeout(() => {
        const move = getAIMove(board, pityBonus);
        const newBoard = [...board];
        newBoard[move] = "O";
        setBoard(newBoard);
        
        const gameWinner = checkWinner(newBoard);
        if (gameWinner) {
          setWinner(gameWinner);
          setGameOver(true);
          setWinningCombo(findWinningCombo(newBoard, gameWinner));
          setTimeout(onLose, 1200);
        } else if (isBoardFull(newBoard)) {
          setGameOver(true);
          setTimeout(onLose, 1200); // Draw counts as loss
        } else {
          setIsPlayerTurn(true);
        }
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, board, gameOver, onLose, pityBonus]);

  const findWinningCombo = (board: Board, player: Cell): number[] | null => {
    for (const combo of WINNING_COMBOS) {
      if (combo.every(i => board[i] === player)) {
        return combo;
      }
    }
    return null;
  };

  const handleCellClick = (index: number) => {
    if (!isPlayerTurn || board[index] || gameOver) return;
    
    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    
    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setGameOver(true);
      setWinningCombo(findWinningCombo(newBoard, gameWinner));
      setTimeout(onWin, 1200);
    } else if (isBoardFull(newBoard)) {
      setGameOver(true);
      setTimeout(onLose, 1200); // Draw counts as loss
    } else {
      setIsPlayerTurn(false);
    }
  };

  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
        Tic-Tac-Toe
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Beat the AI to dismiss (you are X)
      </p>
      
      {/* Status */}
      <div className="mb-4">
        {gameOver ? (
          <p className={`text-lg font-bold ${
            winner === "X" 
              ? "bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent" 
              : winner === "O" ? "text-red-400" : "text-amber-400"
          }`}>
            {winner === "X" ? "You Win!" : 
             winner === "O" ? "AI Wins! Try Again..." : "Draw! Try Again..."}
          </p>
        ) : (
          <p className={`text-sm font-medium ${
            isPlayerTurn ? "text-blue-400" : "text-orange-400"
          }`}>
            {isPlayerTurn ? "Your turn (X)" : "AI thinking..."}
          </p>
        )}
      </div>
      
      {/* Board */}
      <div className="inline-grid grid-cols-3 gap-2 p-3 bg-gray-800/50 rounded-xl border border-purple-500/20">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={!isPlayerTurn || !!cell || gameOver}
            className={`w-16 h-16 rounded-lg text-3xl font-bold transition-all border
              ${winningCombo?.includes(index) 
                ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-500/50" 
                : "bg-gray-800/80 border-purple-500/20"}
              ${!cell && isPlayerTurn && !gameOver 
                ? "hover:bg-purple-500/20 hover:border-purple-400 cursor-pointer" 
                : "cursor-default"}
              ${cell === "X" ? "text-blue-400" : "text-red-400"}
            `}
          >
            {cell}
          </button>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500">
        <span><span className="text-blue-400 font-bold">X</span> = You</span>
        <span><span className="text-red-400 font-bold">O</span> = AI</span>
      </div>
    </div>
  );
}
