/**
 * Achievements System Hook
 * 
 * Tracks and unlocks achievements for all games
 */

import { useState, useCallback, useEffect } from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  category: 'snake' | 'tictactoe' | 'snakeladders' | 'uno' | 'general';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // General Achievements
  { id: 'first_game', title: 'First Steps', description: 'Play your first game', icon: '🎮', category: 'general', rarity: 'common', xpReward: 10 },
  { id: 'play_10', title: 'Getting Started', description: 'Play 10 games', icon: '🏃', category: 'general', rarity: 'common', xpReward: 25 },
  { id: 'play_50', title: 'Dedicated Gamer', description: 'Play 50 games', icon: '🎯', category: 'general', rarity: 'rare', xpReward: 100 },
  { id: 'play_100', title: 'Arcade Legend', description: 'Play 100 games', icon: '🏆', category: 'general', rarity: 'epic', xpReward: 250 },
  { id: 'first_win', title: 'Taste of Victory', description: 'Win your first game', icon: '✨', category: 'general', rarity: 'common', xpReward: 15 },
  { id: 'win_streak_3', title: 'On Fire!', description: 'Win 3 games in a row', icon: '🔥', category: 'general', rarity: 'rare', xpReward: 50 },
  { id: 'win_streak_5', title: 'Unstoppable', description: 'Win 5 games in a row', icon: '⚡', category: 'general', rarity: 'epic', xpReward: 100 },
  { id: 'win_streak_10', title: 'God Mode', description: 'Win 10 games in a row', icon: '👑', category: 'general', rarity: 'legendary', xpReward: 500 },

  // Snake Achievements
  { id: 'snake_50', title: 'Slithering', description: 'Score 50 in Snake', icon: '🐍', category: 'snake', rarity: 'common', xpReward: 20 },
  { id: 'snake_100', title: 'Snake Charmer', description: 'Score 100 in Snake', icon: '🐍', category: 'snake', rarity: 'rare', xpReward: 50 },
  { id: 'snake_200', title: 'Python Master', description: 'Score 200 in Snake', icon: '🐍', category: 'snake', rarity: 'epic', xpReward: 150 },
  { id: 'snake_500', title: 'Anaconda King', description: 'Score 500 in Snake', icon: '🐍', category: 'snake', rarity: 'legendary', xpReward: 500 },
  { id: 'snake_no_walls', title: 'Edge Walker', description: 'Play Snake for 2 minutes without hitting walls', icon: '🧱', category: 'snake', rarity: 'epic', xpReward: 100 },

  // Tic-Tac-Toe Achievements
  { id: 'ttt_first_win', title: 'X Marks Victory', description: 'Win your first Tic-Tac-Toe game', icon: '❌', category: 'tictactoe', rarity: 'common', xpReward: 15 },
  { id: 'ttt_5_wins', title: 'Strategic Mind', description: 'Win 5 Tic-Tac-Toe games', icon: '🧠', category: 'tictactoe', rarity: 'rare', xpReward: 50 },
  { id: 'ttt_perfect', title: 'Flawless Victory', description: 'Win Tic-Tac-Toe in 3 moves', icon: '💯', category: 'tictactoe', rarity: 'epic', xpReward: 100 },
  { id: 'ttt_20_wins', title: 'Grandmaster', description: 'Win 20 Tic-Tac-Toe games', icon: '🎖️', category: 'tictactoe', rarity: 'legendary', xpReward: 300 },

  // Snake & Ladders Achievements
  { id: 'sl_first_win', title: 'Lucky Roller', description: 'Win your first Snake & Ladders game', icon: '🎲', category: 'snakeladders', rarity: 'common', xpReward: 20 },
  { id: 'sl_ladder_3', title: 'Climber', description: 'Hit 3 ladders in one game', icon: '🪜', category: 'snakeladders', rarity: 'rare', xpReward: 40 },
  { id: 'sl_no_snakes', title: 'Snake Dodger', description: 'Win without hitting any snakes', icon: '🛡️', category: 'snakeladders', rarity: 'epic', xpReward: 150 },
  { id: 'sl_comeback', title: 'Comeback King', description: 'Win after being 50+ spaces behind', icon: '👑', category: 'snakeladders', rarity: 'legendary', xpReward: 300 },

  // UNO Achievements
  { id: 'uno_first_win', title: 'UNO!', description: 'Win your first UNO game', icon: '🃏', category: 'uno', rarity: 'common', xpReward: 20 },
  { id: 'uno_plus4', title: 'Friendship Ender', description: 'Play a Draw 4 card', icon: '💔', category: 'uno', rarity: 'common', xpReward: 10 },
  { id: 'uno_reverse', title: 'No U', description: 'Win with a Reverse card', icon: '🔄', category: 'uno', rarity: 'rare', xpReward: 50 },
  { id: 'uno_domination', title: 'Card Shark', description: 'Win 10 UNO games', icon: '🦈', category: 'uno', rarity: 'epic', xpReward: 200 },
  { id: 'uno_speedrun', title: 'Speed Demon', description: 'Win UNO in under 2 minutes', icon: '⚡', category: 'uno', rarity: 'legendary', xpReward: 400 },
];

const STORAGE_KEY = 'linera-achievements';

interface AchievementStats {
  totalGames: number;
  totalWins: number;
  currentWinStreak: number;
  bestWinStreak: number;
  snakeHighScore: number;
  tttWins: number;
  slWins: number;
  unoWins: number;
}

interface UseAchievementsReturn {
  achievements: Achievement[];
  stats: AchievementStats;
  recentUnlock: Achievement | null;
  checkAndUnlock: (achievementId: string) => boolean;
  trackGamePlayed: (game: string, won: boolean, extraData?: Record<string, any>) => Achievement[];
  clearRecentUnlock: () => void;
  getProgress: () => { unlocked: number; total: number; percentage: number };
}

export function useAchievements(): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats>({
    totalGames: 0,
    totalWins: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    snakeHighScore: 0,
    tttWins: 0,
    slWins: 0,
    unoWins: 0,
  });
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);

  // Load from storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { achievements: savedAchievements, stats: savedStats } = JSON.parse(stored);
      
      // Merge with all achievements to ensure new ones are added
      const merged = ALL_ACHIEVEMENTS.map(a => {
        const saved = savedAchievements?.find((s: Achievement) => s.id === a.id);
        return saved ? { ...a, unlocked: saved.unlocked, unlockedAt: saved.unlockedAt } : { ...a, unlocked: false };
      });
      
      setAchievements(merged);
      if (savedStats) setStats(savedStats);
    } else {
      setAchievements(ALL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: false })));
    }
  }, []);

  // Save to storage
  const saveToStorage = useCallback((newAchievements: Achievement[], newStats: AchievementStats) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ achievements: newAchievements, stats: newStats }));
  }, []);

  // Unlock achievement
  const checkAndUnlock = useCallback((achievementId: string): boolean => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return false;

    const updated = achievements.map(a => 
      a.id === achievementId ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
    );
    
    setAchievements(updated);
    setRecentUnlock({ ...achievement, unlocked: true, unlockedAt: Date.now() });
    saveToStorage(updated, stats);
    
    return true;
  }, [achievements, stats, saveToStorage]);

  // Track game and check for achievements
  const trackGamePlayed = useCallback((game: string, won: boolean, extraData?: Record<string, any>): Achievement[] => {
    const newUnlocks: Achievement[] = [];
    const newStats = { ...stats };

    // Update stats
    newStats.totalGames++;
    if (won) {
      newStats.totalWins++;
      newStats.currentWinStreak++;
      if (newStats.currentWinStreak > newStats.bestWinStreak) {
        newStats.bestWinStreak = newStats.currentWinStreak;
      }
    } else {
      newStats.currentWinStreak = 0;
    }

    // Game-specific stats
    if (game === 'snake' && extraData?.score) {
      if (extraData.score > newStats.snakeHighScore) {
        newStats.snakeHighScore = extraData.score;
      }
    }
    if (game === 'tictactoe' && won) newStats.tttWins++;
    if (game === 'snakeladders' && won) newStats.slWins++;
    if (game === 'uno' && won) newStats.unoWins++;

    setStats(newStats);

    // Check achievements
    const checkAchievements = [
      // General
      { id: 'first_game', condition: newStats.totalGames >= 1 },
      { id: 'play_10', condition: newStats.totalGames >= 10 },
      { id: 'play_50', condition: newStats.totalGames >= 50 },
      { id: 'play_100', condition: newStats.totalGames >= 100 },
      { id: 'first_win', condition: newStats.totalWins >= 1 },
      { id: 'win_streak_3', condition: newStats.currentWinStreak >= 3 },
      { id: 'win_streak_5', condition: newStats.currentWinStreak >= 5 },
      { id: 'win_streak_10', condition: newStats.currentWinStreak >= 10 },
      
      // Snake
      { id: 'snake_50', condition: newStats.snakeHighScore >= 50 },
      { id: 'snake_100', condition: newStats.snakeHighScore >= 100 },
      { id: 'snake_200', condition: newStats.snakeHighScore >= 200 },
      { id: 'snake_500', condition: newStats.snakeHighScore >= 500 },
      
      // TTT
      { id: 'ttt_first_win', condition: newStats.tttWins >= 1 },
      { id: 'ttt_5_wins', condition: newStats.tttWins >= 5 },
      { id: 'ttt_20_wins', condition: newStats.tttWins >= 20 },
      
      // Snake & Ladders
      { id: 'sl_first_win', condition: newStats.slWins >= 1 },
      
      // UNO
      { id: 'uno_first_win', condition: newStats.unoWins >= 1 },
      { id: 'uno_domination', condition: newStats.unoWins >= 10 },
    ];

    // Special condition achievements from extraData
    if (extraData?.perfectTTT) checkAchievements.push({ id: 'ttt_perfect', condition: true });
    if (extraData?.playedPlus4) checkAchievements.push({ id: 'uno_plus4', condition: true });
    if (extraData?.wonWithReverse) checkAchievements.push({ id: 'uno_reverse', condition: true });
    if (extraData?.noSnakesHit) checkAchievements.push({ id: 'sl_no_snakes', condition: true });

    // Process unlocks
    let updatedAchievements = [...achievements];
    checkAchievements.forEach(({ id, condition }) => {
      if (condition) {
        const achievement = updatedAchievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
          updatedAchievements = updatedAchievements.map(a => 
            a.id === id ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
          );
          newUnlocks.push({ ...achievement, unlocked: true, unlockedAt: Date.now() });
        }
      }
    });

    if (newUnlocks.length > 0) {
      setAchievements(updatedAchievements);
      setRecentUnlock(newUnlocks[newUnlocks.length - 1]);
    }

    saveToStorage(updatedAchievements, newStats);
    return newUnlocks;
  }, [achievements, stats, saveToStorage]);

  const clearRecentUnlock = useCallback(() => {
    setRecentUnlock(null);
  }, []);

  const getProgress = useCallback(() => {
    const unlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;
    return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
  }, [achievements]);

  return {
    achievements,
    stats,
    recentUnlock,
    checkAndUnlock,
    trackGamePlayed,
    clearRecentUnlock,
    getProgress,
  };
}

export default useAchievements;
