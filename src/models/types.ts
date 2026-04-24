// ============================================================
// BRACKKETECH V3 — PREDICTION ARENA DATA MODELS
// ============================================================

export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'group_knockout';
export type MatchStatus = 'upcoming' | 'live' | 'completed';
export type TournamentMode = 'Classic' | 'Competitive' | 'Chaos' | 'Drama';
export type PlayerRank = 'Rookie' | 'Analyst' | 'Strategist' | 'Oracle' | 'Chaos King';
export type EventCardEffect = 'underdog_boost' | 'sudden_death' | 'crowd_pressure' | 'momentum_surge' | 'wildcard' | 'revenge';

// --- Achievements ---
export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
}

// --- Event / Twist Cards ---
export interface EventCard {
  id: string;
  name: string;
  icon: string;
  description: string;
  effect: EventCardEffect;
  magnitude: number; // 1-3
}

// --- Player (local multiplayer) ---
export interface Player {
  id: string;
  name: string;
  avatar: string; // emoji
  points: number;
  streak: number;
  bestStreak: number;
  correctPredictions: number;
  totalPredictions: number;
  rank: PlayerRank;
  achievements: Achievement[];
}

// --- Prediction ---
export interface Prediction {
  matchId: string;
  playerId: string;
  predictedWinnerId: string;
  pointsAwarded?: number;
  isCorrect?: boolean;
  lockedIn?: boolean;
}

// --- Team ---
export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  captain?: string;
  seed?: number;
  momentum: number; // 0-100, default 50
  stats: {
    wins: number;
    losses: number;
    matchesPlayed: number;
    winRate: number;
  };
}

// --- Match ---
export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  team1Id: string | null;
  team2Id: string | null;
  score1: number;
  score2: number;
  status: MatchStatus;
  winnerId: string | null;
  nextMatchId?: string;
  activeEventCard?: EventCard | null;
  audiencePoll?: { team1Votes: number; team2Votes: number };
}

// --- Tournament ---
export interface Tournament {
  id: string;
  name: string;
  gameType: string;
  format: TournamentFormat;
  status: 'draft' | 'in_progress' | 'completed';
  teams: Team[];
  matches: Match[];
  predictions: Prediction[];
  players: Player[];
  activeEventCards: EventCard[];
  resultHeadlines: string[];
  settings: {
    bestOf: number;
    thirdPlaceMatch: boolean;
    randomizeSeeding: boolean;
    mode: TournamentMode;
  };
  createdAt: string;
}

// --- Rank thresholds ---
export function calculateRank(points: number): PlayerRank {
  if (points >= 2000) return 'Chaos King';
  if (points >= 1200) return 'Oracle';
  if (points >= 600) return 'Strategist';
  if (points >= 200) return 'Analyst';
  return 'Rookie';
}

export const RANK_COLORS: Record<PlayerRank, string> = {
  'Rookie': 'text-gray-400',
  'Analyst': 'text-blue-400',
  'Strategist': 'text-purple-400',
  'Oracle': 'text-yellow-400',
  'Chaos King': 'text-red-400',
};

export const RANK_BG: Record<PlayerRank, string> = {
  'Rookie': 'bg-gray-500/20 border-gray-500/30',
  'Analyst': 'bg-blue-500/20 border-blue-500/30',
  'Strategist': 'bg-purple-500/20 border-purple-500/30',
  'Oracle': 'bg-yellow-500/20 border-yellow-500/30',
  'Chaos King': 'bg-red-500/20 border-red-500/30',
};

// --- Default Event Cards ---
export const EVENT_CARD_DECK: EventCard[] = [
  { id: 'ec-1', name: 'Underdog Boost', icon: '🐴', description: 'Underdog gets +15% win chance', effect: 'underdog_boost', magnitude: 2 },
  { id: 'ec-2', name: 'Sudden Death', icon: '💀', description: 'Match intensity maxed — first to score wins', effect: 'sudden_death', magnitude: 3 },
  { id: 'ec-3', name: 'Crowd Pressure', icon: '📣', description: 'Audience poll influences outcome by 10%', effect: 'crowd_pressure', magnitude: 1 },
  { id: 'ec-4', name: 'Momentum Surge', icon: '⚡', description: 'Underdog gains +30 momentum instantly', effect: 'momentum_surge', magnitude: 2 },
  { id: 'ec-5', name: 'Wildcard', icon: '🃏', description: 'Random stat shuffle for both teams', effect: 'wildcard', magnitude: 3 },
  { id: 'ec-6', name: 'Revenge Match', icon: '🔥', description: 'Previously defeated team gets +20% boost', effect: 'revenge', magnitude: 2 },
];

// --- Achievement definitions ---
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'a-first', name: 'First Blood', icon: '🩸', description: 'Make your first prediction' },
  { id: 'a-streak3', name: 'Hot Streak', icon: '🔥', description: 'Get 3 correct predictions in a row' },
  { id: 'a-streak5', name: 'On Fire', icon: '💥', description: 'Get 5 correct predictions in a row' },
  { id: 'a-upset', name: 'Chaos Reader', icon: '🔮', description: 'Successfully predict an upset' },
  { id: 'a-perfect', name: 'Perfect Bracket', icon: '👑', description: 'Get every prediction correct in a tournament' },
  { id: 'a-finals', name: 'Grand Finale', icon: '🏆', description: 'Correctly predict the finals winner' },
  { id: 'a-analyst', name: 'Rising Analyst', icon: '📊', description: 'Reach Analyst rank' },
  { id: 'a-oracle', name: 'The Oracle', icon: '🧿', description: 'Reach Oracle rank' },
  { id: 'a-king', name: 'Chaos King', icon: '👹', description: 'Reach Chaos King rank' },
];
