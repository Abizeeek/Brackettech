import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tournament, Team, Match, MatchStatus, Player, Prediction, EventCard, calculateRank, ACHIEVEMENTS } from '../models/types';

interface TournamentState {
  activeTournament: Tournament | null;
  tournaments: Tournament[];
  activePlayerId: string | null;

  createTournament: (data: Partial<Tournament>) => void;
  setActiveTournament: (id: string) => void;
  addTeam: (team: Omit<Team, 'id'>) => void;
  removeTeam: (id: string) => void;
  generateBracket: () => void;
  updateMatchScore: (matchId: string, score1: number, score2: number, winnerId: string | null) => void;
  simulateTournament: (mode?: 'instant' | 'cinematic') => Promise<void>;
  simulateNextRound: () => Promise<void>;
  getCurrentRound: () => number;
  shuffleSeeding: () => void;

  // Player & Prediction
  addPlayer: (name: string, avatar: string) => void;
  setActivePlayer: (id: string) => void;
  makePlayerPrediction: (matchId: string, teamId: string) => void;
  gradePredictions: (matchId: string) => void;
  castAudienceVote: (matchId: string, teamNum: 1 | 2) => void;
  applyEventCard: (matchId: string, card: EventCard) => void;
  addHeadline: (headline: string) => void;
}

function generateHeadline(tournament: Tournament, match: Match): string {
  const winner = tournament.teams.find(t => t.id === match.winnerId);
  const loser = tournament.teams.find(t => t.id === (match.winnerId === match.team1Id ? match.team2Id : match.team1Id));
  if (!winner || !loser) return '';
  const verbs = ['demolishes', 'edges out', 'crushes', 'outlasts', 'stuns', 'defeats', 'eliminates'];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  return `${winner.name} ${verb} ${loser.name}!`;
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      activeTournament: null,
      tournaments: [],
      activePlayerId: null,

      createTournament: (data) => {
        const t: Tournament = {
          id: Date.now().toString(),
          name: data.name || 'New Tournament',
          gameType: data.gameType || 'General',
          format: data.format || 'single_elimination',
          status: 'draft',
          teams: [], matches: [], predictions: [], players: [],
          activeEventCards: [], resultHeadlines: [],
          settings: { bestOf: 1, thirdPlaceMatch: false, randomizeSeeding: false, mode: 'Classic', ...data.settings },
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tournaments: [...s.tournaments, t], activeTournament: t }));
      },

      setActiveTournament: (id) => set((s) => ({ activeTournament: s.tournaments.find(t => t.id === id) || null })),

      addTeam: (teamData) => set((s) => {
        if (!s.activeTournament) return s;
        const newTeam: Team = { ...teamData, id: Date.now().toString(), momentum: 50, stats: teamData.stats || { wins: 0, losses: 0, matchesPlayed: 0, winRate: 0 } };
        const up = { ...s.activeTournament, teams: [...s.activeTournament.teams, newTeam] };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t) };
      }),

      removeTeam: (id) => set((s) => {
        if (!s.activeTournament) return s;
        const up = { ...s.activeTournament, teams: s.activeTournament.teams.filter(t => t.id !== id) };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t) };
      }),

      generateBracket: () => set((s) => {
        if (!s.activeTournament) return s;
        const orig = [...s.activeTournament.teams];
        const n = Math.pow(2, Math.ceil(Math.log2(orig.length || 1)));
        const padded = [...orig];
        while (padded.length < n) padded.push({ id: `bye-${padded.length}`, name: 'BYE', momentum: 0, stats: { wins: 0, losses: 0, matchesPlayed: 0, winRate: 0 } } as Team);
        const matches: Match[] = [];
        const totalRounds = Math.log2(n);
        let mc = 1;
        for (let r = 1; r <= totalRounds; r++) {
          const count = n / Math.pow(2, r);
          for (let i = 0; i < count; i++) {
            const t1 = r === 1 ? padded[i * 2]?.id : null;
            const t2 = r === 1 ? padded[i * 2 + 1]?.id : null;
            const m: Match = { id: `m-${r}-${i}`, tournamentId: s.activeTournament.id, round: r, matchNumber: mc++, team1Id: t1, team2Id: t2, score1: 0, score2: 0, status: 'upcoming', winnerId: null, nextMatchId: r < totalRounds ? `m-${r + 1}-${Math.floor(i / 2)}` : undefined, activeEventCard: null };
            if (r === 1 && (t1?.startsWith('bye-') || t2?.startsWith('bye-'))) { m.status = 'completed'; m.winnerId = t1?.startsWith('bye-') ? t2 : t1; }
            matches.push(m);
          }
        }
        matches.filter(m => m.round === 1 && m.status === 'completed').forEach(m => {
          const nm = matches.find(x => x.id === m.nextMatchId);
          if (nm) { if (!nm.team1Id) nm.team1Id = m.winnerId; else nm.team2Id = m.winnerId; }
        });
        const up: Tournament = { ...s.activeTournament, status: 'in_progress', matches };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t) };
      }),

      updateMatchScore: (matchId, score1, score2, winnerId) => set((s) => {
        if (!s.activeTournament) return s;
        const matches = [...s.activeTournament.matches];
        const mi = matches.findIndex(m => m.id === matchId);
        if (mi === -1) return s;
        const match = matches[mi];
        const oldW = match.winnerId;
        matches[mi] = { ...match, score1, score2, winnerId, status: (winnerId ? 'completed' : 'live') as MatchStatus };

        let teams = [...s.activeTournament.teams];
        if (winnerId && winnerId !== oldW && match.team1Id && match.team2Id && !match.team1Id.startsWith('bye-') && !match.team2Id.startsWith('bye-')) {
          const t1 = teams.find(t => t.id === match.team1Id);
          const t2 = teams.find(t => t.id === match.team2Id);
          if (t1 && t2) {
            const p1 = t1.stats.winRate + (t1.momentum - 50) * 0.2;
            const p2 = t2.stats.winRate + (t2.momentum - 50) * 0.2;
            const tot = p1 + p2;
            const prob1 = tot === 0 ? 0.5 : p1 / tot;
            const isUpset = (winnerId === t1.id && prob1 < 0.4) || (winnerId === t2.id && (1 - prob1) < 0.4);
            teams = teams.map(t => {
              if (t.id === winnerId) return { ...t, momentum: Math.min(100, t.momentum + (isUpset ? 20 : 10)) };
              if (t.id === (winnerId === t1.id ? t2.id : t1.id)) return { ...t, momentum: Math.max(0, t.momentum - (isUpset ? 20 : 10)) };
              return t;
            });
          }
        }

        if (match.nextMatchId && winnerId !== oldW) {
          const ni = matches.findIndex(m => m.id === match.nextMatchId);
          if (ni !== -1) {
            const nm = { ...matches[ni] };
            if (oldW) { if (nm.team1Id === oldW) nm.team1Id = null; else if (nm.team2Id === oldW) nm.team2Id = null; }
            if (winnerId) { if (!nm.team1Id) nm.team1Id = winnerId; else if (!nm.team2Id) nm.team2Id = winnerId; }
            matches[ni] = nm;
          }
        }

        let headlines = [...s.activeTournament.resultHeadlines];
        if (winnerId && winnerId !== oldW) {
          const updatedMatch = matches[mi];
          const tempTournament = { ...s.activeTournament, teams, matches };
          const hl = generateHeadline(tempTournament, updatedMatch);
          if (hl) headlines = [hl, ...headlines].slice(0, 20);
          // Grade predictions
          setTimeout(() => get().gradePredictions(matchId), 50);
        }

        const up = { ...s.activeTournament, matches, teams, resultHeadlines: headlines };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t) };
      }),

      shuffleSeeding: () => set((s) => {
        if (!s.activeTournament || s.activeTournament.status !== 'draft') return s;
        const teams = [...s.activeTournament.teams];
        for (let i = teams.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [teams[i], teams[j]] = [teams[j], teams[i]]; }
        const up = { ...s.activeTournament, teams };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t) };
      }),

      // --- PLAYER & PREDICTION ---
      addPlayer: (name, avatar) => set((s) => {
        if (!s.activeTournament) return s;
        const p: Player = { id: `p-${Date.now()}`, name, avatar, points: 0, streak: 0, bestStreak: 0, correctPredictions: 0, totalPredictions: 0, rank: 'Rookie', achievements: [] };
        const up = { ...s.activeTournament, players: [...s.activeTournament.players, p] };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t), activePlayerId: s.activePlayerId || p.id };
      }),

      setActivePlayer: (id) => set({ activePlayerId: id }),

      makePlayerPrediction: (matchId, teamId) => set((s) => {
        if (!s.activeTournament || !s.activePlayerId) return s;
        const preds = [...s.activeTournament.predictions];
        const ei = preds.findIndex(p => p.matchId === matchId && p.playerId === s.activePlayerId);
        const pred: Prediction = { matchId, playerId: s.activePlayerId!, predictedWinnerId: teamId };
        if (ei >= 0) preds[ei] = pred; else preds.push(pred);

        // Check first prediction achievement
        let players = [...s.activeTournament.players];
        const pi = players.findIndex(p => p.id === s.activePlayerId);
        if (pi >= 0 && !players[pi].achievements.find(a => a.id === 'a-first')) {
          players[pi] = { ...players[pi], achievements: [...players[pi].achievements, { ...ACHIEVEMENTS[0], unlockedAt: new Date().toISOString() }] };
        }

        const up = { ...s.activeTournament, predictions: preds, players };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t) };
      }),

      gradePredictions: (matchId) => set((s) => {
        if (!s.activeTournament) return s;
        const match = s.activeTournament.matches.find(m => m.id === matchId);
        if (!match || !match.winnerId) return s;

        const totalRounds = Math.max(...s.activeTournament.matches.map(m => m.round));
        const isFinal = match.round === totalRounds;
        const preds = [...s.activeTournament.predictions];
        let players = [...s.activeTournament.players];

        // Determine upset
        const t1 = s.activeTournament.teams.find(t => t.id === match.team1Id);
        const t2 = s.activeTournament.teams.find(t => t.id === match.team2Id);
        let wasUpset = false;
        if (t1 && t2 && !t1.id.startsWith('bye-') && !t2.id.startsWith('bye-')) {
          const p1 = (t1.stats.winRate || 50) + ((t1.momentum ?? 50) - 50) * 0.2;
          const p2 = (t2.stats.winRate || 50) + ((t2.momentum ?? 50) - 50) * 0.2;
          const tot = p1 + p2;
          const prob1 = tot === 0 ? 0.5 : p1 / tot;
          wasUpset = (match.winnerId === t1.id && prob1 < 0.4) || (match.winnerId === t2.id && (1 - prob1) < 0.4);
        }

        preds.forEach((pred, i) => {
          if (pred.matchId !== matchId || pred.pointsAwarded !== undefined) return;
          const correct = pred.predictedWinnerId === match.winnerId;
          let pts = 0;
          if (correct) {
            pts = 100;
            if (wasUpset) pts += 50;
            if (isFinal) pts += 200;
          }

          preds[i] = { ...pred, isCorrect: correct, pointsAwarded: pts };

          const pi = players.findIndex(p => p.id === pred.playerId);
          if (pi >= 0) {
            const player = { ...players[pi] };
            player.totalPredictions++;
            if (correct) {
              player.correctPredictions++;
              player.streak++;
              player.bestStreak = Math.max(player.bestStreak, player.streak);
              pts += player.streak * 25; // streak bonus
            } else {
              player.streak = 0;
            }
            player.points += pts;
            player.rank = calculateRank(player.points);

            // Achievements
            const achs = [...player.achievements];
            if (player.streak >= 3 && !achs.find(a => a.id === 'a-streak3')) achs.push({ ...ACHIEVEMENTS[1], unlockedAt: new Date().toISOString() });
            if (player.streak >= 5 && !achs.find(a => a.id === 'a-streak5')) achs.push({ ...ACHIEVEMENTS[2], unlockedAt: new Date().toISOString() });
            if (correct && wasUpset && !achs.find(a => a.id === 'a-upset')) achs.push({ ...ACHIEVEMENTS[3], unlockedAt: new Date().toISOString() });
            if (correct && isFinal && !achs.find(a => a.id === 'a-finals')) achs.push({ ...ACHIEVEMENTS[5], unlockedAt: new Date().toISOString() });
            if (player.rank === 'Analyst' && !achs.find(a => a.id === 'a-analyst')) achs.push({ ...ACHIEVEMENTS[6], unlockedAt: new Date().toISOString() });
            if (player.rank === 'Oracle' && !achs.find(a => a.id === 'a-oracle')) achs.push({ ...ACHIEVEMENTS[7], unlockedAt: new Date().toISOString() });
            if (player.rank === 'Chaos King' && !achs.find(a => a.id === 'a-king')) achs.push({ ...ACHIEVEMENTS[8], unlockedAt: new Date().toISOString() });
            player.achievements = achs;
            players[pi] = player;
          }
        });

        const up = { ...s.activeTournament, predictions: preds, players };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t) };
      }),

      castAudienceVote: (matchId, teamNum) => set((s) => {
        if (!s.activeTournament) return s;
        const matches = [...s.activeTournament.matches];
        const mi = matches.findIndex(m => m.id === matchId);
        if (mi === -1) return s;
        const poll = matches[mi].audiencePoll || { team1Votes: 0, team2Votes: 0 };
        if (teamNum === 1) poll.team1Votes++; else poll.team2Votes++;
        matches[mi] = { ...matches[mi], audiencePoll: poll };
        const up = { ...s.activeTournament, matches };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t) };
      }),

      applyEventCard: (matchId, card) => set((s) => {
        if (!s.activeTournament) return s;
        const matches = [...s.activeTournament.matches];
        const mi = matches.findIndex(m => m.id === matchId);
        if (mi === -1) return s;
        matches[mi] = { ...matches[mi], activeEventCard: card };

        let teams = [...s.activeTournament.teams];
        const match = matches[mi];
        if (card.effect === 'momentum_surge' && match.team1Id && match.team2Id) {
          const t1 = teams.find(t => t.id === match.team1Id);
          const t2 = teams.find(t => t.id === match.team2Id);
          if (t1 && t2) {
            const underdogId = (t1.stats.winRate || 50) < (t2.stats.winRate || 50) ? t1.id : t2.id;
            teams = teams.map(t => t.id === underdogId ? { ...t, momentum: Math.min(100, t.momentum + 30) } : t);
          }
        }

        const up = { ...s.activeTournament, matches, teams };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t) };
      }),

      addHeadline: (headline) => set((s) => {
        if (!s.activeTournament) return s;
        const up = { ...s.activeTournament, resultHeadlines: [headline, ...s.activeTournament.resultHeadlines].slice(0, 20) };
        return { activeTournament: up, tournaments: s.tournaments.map(t => t.id === up.id ? up : t) };
      }),

      simulateTournament: async (mode = 'instant') => {
        let state = get();
        if (!state.activeTournament || state.activeTournament.status !== 'in_progress') return;
        let hasChanges = true;
        while (hasChanges) {
          hasChanges = false;
          const matches = [...state.activeTournament.matches];
          for (const match of matches) {
            if (match.status !== 'completed' && match.team1Id && match.team2Id) {
              const t1 = state.activeTournament!.teams.find(t => t.id === match.team1Id);
              const t2 = state.activeTournament!.teams.find(t => t.id === match.team2Id);
              if (t1 && t2) {
                if (mode === 'cinematic') await new Promise(r => setTimeout(r, 1500));
                let p1 = (t1.stats.winRate || 50) + ((t1.momentum ?? 50) - 50) * 0.2;
                let p2 = (t2.stats.winRate || 50) + ((t2.momentum ?? 50) - 50) * 0.2;
                // Event card effects
                if (match.activeEventCard?.effect === 'underdog_boost') {
                  if (p1 < p2) p1 += 15; else p2 += 15;
                }
                const tot = p1 + p2;
                const prob = tot === 0 ? 0.5 : p1 / tot;
                const winnerId = Math.random() < prob ? t1.id : t2.id;
                const s1 = winnerId === t1.id ? 2 : Math.floor(Math.random() * 2);
                const s2 = winnerId === t2.id ? 2 : Math.floor(Math.random() * 2);
                get().updateMatchScore(match.id, s1, s2, winnerId);
                hasChanges = true;
                state = get();
              }
            }
          }
        }
      },

      simulateNextRound: async () => {
        const state = get();
        if (!state.activeTournament || state.activeTournament.status !== 'in_progress') return;
        const currentRound = get().getCurrentRound();
        if (currentRound === 0) return;

        const roundMatches = state.activeTournament.matches.filter(
          m => m.round === currentRound && m.status !== 'completed' && m.team1Id && m.team2Id
        );

        for (const match of roundMatches) {
          const freshState = get();
          const t1 = freshState.activeTournament!.teams.find(t => t.id === match.team1Id);
          const t2 = freshState.activeTournament!.teams.find(t => t.id === match.team2Id);
          if (t1 && t2) {
            await new Promise(r => setTimeout(r, 800));
            let p1 = (t1.stats.winRate || 50) + ((t1.momentum ?? 50) - 50) * 0.2;
            let p2 = (t2.stats.winRate || 50) + ((t2.momentum ?? 50) - 50) * 0.2;
            if (match.activeEventCard?.effect === 'underdog_boost') {
              if (p1 < p2) p1 += 15; else p2 += 15;
            }
            const tot = p1 + p2;
            const prob = tot === 0 ? 0.5 : p1 / tot;
            const winnerId = Math.random() < prob ? t1.id : t2.id;
            const s1 = winnerId === t1.id ? 2 : Math.floor(Math.random() * 2);
            const s2 = winnerId === t2.id ? 2 : Math.floor(Math.random() * 2);
            get().updateMatchScore(match.id, s1, s2, winnerId);
          }
        }
      },

      getCurrentRound: () => {
        const state = get();
        if (!state.activeTournament) return 0;
        const incompleteRounds = state.activeTournament.matches
          .filter(m => m.status !== 'completed')
          .map(m => m.round);
        if (incompleteRounds.length === 0) return 0;
        return Math.min(...incompleteRounds);
      },
    }),
    { name: 'brackketech-storage' }
  )
);
