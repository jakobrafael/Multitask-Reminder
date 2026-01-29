export interface GameProps {
  onWin: () => void;
  onLose: () => void;
  /** Number of consecutive losses across all games - used for pity system */
  lossStreak: number;
}

export type GameType = "heads-or-tails" | "rock-paper-scissors" | "tic-tac-toe";

export function getRandomGame(): GameType {
  const games: GameType[] = ["heads-or-tails", "rock-paper-scissors", "tic-tac-toe"];
  return games[Math.floor(Math.random() * games.length)];
}

/**
 * Calculate pity bonus based on loss streak
 * Returns a value between 0 and 0.4 (max 40% bonus)
 * Each loss adds 10% bonus, capped at 4 losses
 */
export function getPityBonus(lossStreak: number): number {
  return Math.min(lossStreak * 0.1, 0.4);
}
