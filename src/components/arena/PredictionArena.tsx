import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournamentStore } from '@/store/useTournamentStore';
import { cn } from '@/lib/utils';
import { RANK_COLORS, RANK_BG } from '@/models/types';
import { Trophy, Users, Target, Plus, Play, CheckCircle, XCircle } from 'lucide-react';

export function PredictionArena() {
  const { activeTournament, activePlayerId, setActivePlayer, addPlayer, makePlayerPrediction, simulateNextRound, getCurrentRound } = useTournamentStore();
  const [showAddPlayer, setShowAddPlayer] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newAvatar, setNewAvatar] = React.useState('😎');
  const [isSimulating, setIsSimulating] = React.useState(false);

  if (!activeTournament) return null;

  const players = activeTournament.players || [];
  const activePlayer = players.find(p => p.id === activePlayerId);
  const predictions = activeTournament.predictions || [];
  const currentRound = getCurrentRound();
  const totalRounds = Math.max(...activeTournament.matches.map(m => m.round), 0);

  // Current round matches (upcoming, ready to predict)
  const currentRoundMatches = activeTournament.matches.filter(
    m => m.round === currentRound && m.status !== 'completed' && m.team1Id && m.team2Id && !m.team1Id?.startsWith('bye-') && !m.team2Id?.startsWith('bye-')
  );

  // Last completed round predictions for results display
  const lastCompletedRound = currentRound > 1 ? currentRound - 1 : (currentRound === 0 ? totalRounds : 0);
  const lastRoundMatches = activeTournament.matches.filter(
    m => m.round === lastCompletedRound && m.status === 'completed' && m.team1Id && m.team2Id && !m.team1Id?.startsWith('bye-') && !m.team2Id?.startsWith('bye-')
  );

  const avatars = ['😎', '🦊', '🐉', '🎯', '⚡', '🔥', '💀', '🦁', '🐺', '🦅'];

  const handleAddPlayer = () => {
    if (!newName.trim()) return;
    addPlayer(newName.trim(), newAvatar);
    setNewName('');
    setShowAddPlayer(false);
  };

  const handleSimulateRound = async () => {
    setIsSimulating(true);
    await simulateNextRound();
    setIsSimulating(false);
  };

  // Check if active player has predicted all current round matches
  const currentRoundPredictions = currentRoundMatches.map(m =>
    predictions.find(p => p.matchId === m.id && p.playerId === activePlayerId)
  );
  const allPredicted = activePlayer && currentRoundMatches.length > 0 && currentRoundPredictions.every(p => p !== undefined);

  const roundLabel = (r: number) => {
    if (r === totalRounds && totalRounds > 1) return '🏆 Finals';
    if (r === totalRounds - 1 && totalRounds > 2) return '⚔️ Semifinals';
    return `Round ${r}`;
  };

  const sorted = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="glass-panel border border-yellow-500/20 p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-2">
          <Target className="w-4 h-4" /> Prediction Arena
        </h3>
        <button onClick={() => setShowAddPlayer(!showAddPlayer)} className="text-white/50 hover:text-white transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Player Form */}
      <AnimatePresence>
        {showAddPlayer && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-black/40 rounded-lg p-3 space-y-2 border border-white/10">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Player name" className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-yellow-500/50" onKeyDown={e => e.key === 'Enter' && handleAddPlayer()} />
              <div className="flex gap-1 flex-wrap">
                {avatars.map(a => (
                  <button key={a} onClick={() => setNewAvatar(a)} className={cn("w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all", newAvatar === a ? "bg-yellow-500/30 scale-110" : "bg-white/5 hover:bg-white/10")}>{a}</button>
                ))}
              </div>
              <button onClick={handleAddPlayer} className="w-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 py-1.5 rounded-lg text-sm font-semibold hover:bg-yellow-500/30 transition-colors">Join Arena</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Selector */}
      {players.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {players.map(p => (
            <button key={p.id} onClick={() => setActivePlayer(p.id)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border", p.id === activePlayerId ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10")}>
              <span>{p.avatar}</span>
              <span>{p.name}</span>
              <span className={cn("text-[10px]", RANK_COLORS[p.rank])}>{p.points}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Player Stats */}
      {activePlayer && (
        <div className={cn("rounded-lg p-3 border", RANK_BG[activePlayer.rank])}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activePlayer.avatar}</span>
              <div>
                <p className="font-bold text-sm">{activePlayer.name}</p>
                <p className={cn("text-xs font-semibold", RANK_COLORS[activePlayer.rank])}>{activePlayer.rank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-yellow-400">{activePlayer.points}</p>
              <p className="text-[10px] text-white/40">POINTS</p>
            </div>
          </div>
          <div className="flex gap-4 text-[10px] uppercase tracking-wider text-white/50">
            <div><span className="text-white font-bold text-sm">{activePlayer.correctPredictions}/{activePlayer.totalPredictions}</span> Accuracy</div>
            <div><span className="text-orange-400 font-bold text-sm">🔥 {activePlayer.streak}</span> Streak</div>
            <div><span className="text-white/70 font-bold text-sm">{activePlayer.bestStreak}</span> Best</div>
          </div>
          {/* Achievements */}
          {activePlayer.achievements.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {activePlayer.achievements.map(a => (
                <span key={a.id} title={a.name} className="text-lg cursor-help">{a.icon}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Last Round Results */}
      {activePlayer && lastRoundMatches.length > 0 && lastCompletedRound > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-wider text-white/50 font-bold flex items-center gap-1">
            📋 {roundLabel(lastCompletedRound)} Results
          </h4>
          {lastRoundMatches.map(match => {
            const t1 = activeTournament.teams.find(t => t.id === match.team1Id);
            const t2 = activeTournament.teams.find(t => t.id === match.team2Id);
            const pred = predictions.find(p => p.matchId === match.id && p.playerId === activePlayerId);
            const winner = activeTournament.teams.find(t => t.id === match.winnerId);
            if (!t1 || !t2) return null;
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-lg p-2 border text-xs",
                  pred?.isCorrect ? "bg-green-500/10 border-green-500/30" : pred ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/60">M{match.matchNumber}</span>
                  <span className="font-semibold text-white">
                    🏆 {winner?.name}
                    <span className="text-white/40 ml-1">({match.score1}-{match.score2})</span>
                  </span>
                  {pred ? (
                    pred.isCorrect ? (
                      <span className="flex items-center gap-1 text-green-400 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> +{pred.pointsAwarded}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 font-bold">
                        <XCircle className="w-3.5 h-3.5" /> Wrong
                      </span>
                    )
                  ) : (
                    <span className="text-white/30">No pick</span>
                  )}
                </div>
                {pred && !pred.isCorrect && (
                  <div className="text-[10px] text-red-400/60 mt-0.5">
                    You picked: {activeTournament.teams.find(t => t.id === pred.predictedWinnerId)?.name}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Current Round Predictions */}
      {activePlayer && currentRoundMatches.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-wider text-white/50 font-bold flex items-center gap-1">
            🎯 Predict — {roundLabel(currentRound)}
          </h4>
          {currentRoundMatches.map(match => {
            const t1 = activeTournament.teams.find(t => t.id === match.team1Id);
            const t2 = activeTournament.teams.find(t => t.id === match.team2Id);
            const pred = predictions.find(p => p.matchId === match.id && p.playerId === activePlayerId);
            if (!t1 || !t2) return null;
            return (
              <div key={match.id} className="bg-black/40 rounded-lg p-2 border border-white/5">
                <div className="text-[9px] text-white/40 mb-1">Match {match.matchNumber} • {roundLabel(currentRound)}</div>
                <div className="flex gap-1">
                  <button onClick={() => makePlayerPrediction(match.id, t1.id)} className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all border", pred?.predictedWinnerId === t1.id ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10")}>
                    {t1.name}
                  </button>
                  <span className="flex items-center text-[10px] text-white/30 px-1">VS</span>
                  <button onClick={() => makePlayerPrediction(match.id, t2.id)} className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all border", pred?.predictedWinnerId === t2.id ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10")}>
                    {t2.name}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Lock In & Simulate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!allPredicted || isSimulating}
            onClick={handleSimulateRound}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border",
              allPredicted && !isSimulating
                ? "bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-400 border-green-500/40 hover:from-green-500/40 hover:to-emerald-500/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                : "bg-white/5 text-white/30 border-white/10 cursor-not-allowed"
            )}
          >
            {isSimulating ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {allPredicted ? `🔒 Lock In & Simulate ${roundLabel(currentRound)}` : `Pick all matches to continue`}
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* Tournament finished message */}
      {currentRound === 0 && activeTournament.status === 'in_progress' && activePlayer && (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm text-white/60 font-semibold">Tournament Complete!</p>
          <p className="text-xs text-white/30">Check the results dashboard →</p>
        </div>
      )}

      {/* Leaderboard */}
      {sorted.length > 1 && (
        <div className="space-y-1">
          <h4 className="text-[10px] uppercase tracking-wider text-white/50 font-bold flex items-center gap-1"><Trophy className="w-3 h-3" /> Leaderboard</h4>
          {sorted.map((p, i) => (
            <div key={p.id} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs", i === 0 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-white/5")}>
              <span className="w-4 text-white/40 font-bold">{i + 1}</span>
              <span>{p.avatar}</span>
              <span className="flex-1 font-medium">{p.name}</span>
              <span className={cn("text-[10px] font-bold", RANK_COLORS[p.rank])}>{p.rank}</span>
              <span className="font-bold text-yellow-400">{p.points}</span>
            </div>
          ))}
        </div>
      )}

      {players.length === 0 && (
        <div className="text-center py-6 text-white/30 text-sm">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Add players to start predicting!</p>
        </div>
      )}
    </div>
  );
}
