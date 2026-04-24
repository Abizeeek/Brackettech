import * as React from 'react';
import { Match, Tournament } from '@/models/types';
import { useTournamentStore } from '@/store/useTournamentStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  tournament: Tournament;
}

export function MatchCard({ match, tournament }: MatchCardProps) {
  const { updateMatchScore } = useTournamentStore();
  const team1 = tournament.teams.find(t => t.id === match.team1Id);
  const team2 = tournament.teams.find(t => t.id === match.team2Id);
  const totalRounds = Math.max(...tournament.matches.map(m => m.round));
  const isFinal = match.round === totalRounds && totalRounds > 1;
  const isSemiFinal = match.round === totalRounds - 1 && totalRounds > 2;

  // --- Probability engine ---
  let t1Prob = 50, t2Prob = 50, upsetChance = 0;
  let isHype = false, isUpset = false, isDarkHorse = false, isLastStand = true;

  if (team1 && team2 && !team1.id.startsWith('bye-') && !team2.id.startsWith('bye-')) {
    const p1 = (team1.stats.winRate || 50) + ((team1.momentum ?? 50) - 50) * 0.2;
    const p2 = (team2.stats.winRate || 50) + ((team2.momentum ?? 50) - 50) * 0.2;
    // Event card boost
    let boost1 = 0, boost2 = 0;
    if (match.activeEventCard?.effect === 'underdog_boost') {
      if (p1 < p2) boost1 = 15; else boost2 = 15;
    }
    const adj1 = p1 + boost1, adj2 = p2 + boost2;
    const tot = adj1 + adj2;
    t1Prob = Math.round((tot === 0 ? 0.5 : adj1 / tot) * 100);
    t2Prob = 100 - t1Prob;
    upsetChance = Math.min(t1Prob, t2Prob);
    if (Math.abs(t1Prob - t2Prob) <= 8) isHype = true;
    // Dark Horse: lower-prob team has high momentum
    const underdog = t1Prob < t2Prob ? team1 : team2;
    if ((underdog.momentum ?? 50) >= 70 && Math.abs(t1Prob - t2Prob) > 10) isDarkHorse = true;
    if (match.status === 'completed') {
      if (match.winnerId === team1.id && t1Prob <= 40) isUpset = true;
      if (match.winnerId === team2.id && t2Prob <= 40) isUpset = true;
    }
  }

  // Risk level
  const probGap = Math.abs(t1Prob - t2Prob);
  const riskLevel = probGap <= 12 ? 'Volatile' : probGap <= 25 ? 'Risky' : 'Safe';
  const riskColor = riskLevel === 'Volatile' ? 'text-red-400' : riskLevel === 'Risky' ? 'text-orange-400' : 'text-green-400';

  // Animation for teams
  const getVariant = (teamId: string | null) => {
    if (match.status !== 'completed' || !teamId) return {};
    if (match.winnerId === teamId) return { scale: 1.03, opacity: 1 };
    return { scale: 0.95, opacity: 0.15, y: 14, rotate: -2, filter: 'blur(3px) grayscale(100%)' };
  };

  const handleSetWinner = (id: string) => {
    if (match.status === 'completed') return;
    updateMatchScore(match.id, match.score1, match.score2, id);
  };

  const handleScore = (num: 1 | 2, val: number) => {
    if (match.status === 'completed') return;
    updateMatchScore(match.id, num === 1 ? val : match.score1, num === 2 ? val : match.score2, match.winnerId);
  };

  // Audience poll bar
  const poll = match.audiencePoll;
  const pollTotal = poll ? poll.team1Votes + poll.team2Votes : 0;
  const pollPct1 = pollTotal > 0 ? Math.round((poll!.team1Votes / pollTotal) * 100) : 50;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, rotate: isHype && match.status !== 'completed' ? [0, -0.3, 0.3, 0] : 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "w-72 glass-panel overflow-hidden border border-white/10 relative",
        match.status === 'completed' && "opacity-80 hover:opacity-100",
        match.status === 'live' && "border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]",
        isHype && match.status !== 'completed' && "border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]",
        isUpset && "border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.4)]",
        isFinal && match.status !== 'completed' && "border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
      )}
    >
      {/* Header with badges */}
      <div className="bg-white/5 px-3 py-1.5 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">M{match.matchNumber}</span>
          {isHype && match.status !== 'completed' && <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-bold">🔥 MUST WATCH</span>}
          {isDarkHorse && match.status !== 'completed' && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">🐴 DARK HORSE</span>}
          {isFinal && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">👑 FINALS</span>}
          {isSemiFinal && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">⚔️ SEMIS</span>}
          {isLastStand && match.status !== 'completed' && match.round > 1 && <span className="text-[9px] bg-red-500/10 text-red-400/70 px-1.5 py-0.5 rounded-full font-bold">💀 ELIM</span>}
          {isUpset && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[9px] bg-red-500/30 text-red-400 px-1.5 py-0.5 rounded-full font-bold">🚨 UPSET</motion.span>}
          {match.activeEventCard && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">{match.activeEventCard.icon}</span>}
        </div>
        <span className={cn("text-[10px] font-bold uppercase", riskColor)}>{match.status === 'completed' ? 'DONE' : riskLevel}</span>
      </div>

      {/* Win probability bar */}
      {team1 && team2 && !team1.id.startsWith('bye-') && !team2.id.startsWith('bye-') && match.status !== 'completed' && (
        <div className="px-3 py-1.5 border-b border-white/5">
          <div className="flex justify-between text-[9px] text-white/40 mb-0.5">
            <span>{t1Prob}%</span>
            <span className="text-white/20">WIN PROBABILITY</span>
            <span>{t2Prob}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
            <div style={{ width: `${t1Prob}%` }} className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-l-full" />
            <div style={{ width: `${t2Prob}%` }} className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-r-full" />
          </div>
          <div className="flex justify-between mt-1 text-[8px] text-white/30">
            <span>Mom: {Math.round(team1.momentum ?? 50)}</span>
            {upsetChance > 15 && <span className="text-red-400">{upsetChance}% upset</span>}
            <span>Mom: {Math.round(team2.momentum ?? 50)}</span>
          </div>
        </div>
      )}

      {/* Teams */}
      <div className="flex flex-col bg-black/30">
        {[{ team: team1, id: match.team1Id, score: match.score1, num: 1 as const },
          { team: team2, id: match.team2Id, score: match.score2, num: 2 as const }].map(({ team, id, score, num }) => (
          <motion.div
            key={num}
            animate={getVariant(id)}
            transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
            className={cn(
              "flex items-center p-2 cursor-pointer hover:bg-white/5 transition-colors",
              num === 1 && "border-b border-white/5",
              match.winnerId === id && match.status === 'completed' && "bg-white/10",
              id?.startsWith('bye-') && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => team && !id?.startsWith('bye-') && handleSetWinner(team.id)}
          >
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center mr-2 shrink-0">
              {team ? <span className="text-xs font-bold">{team.name[0]}</span> : <Shield className="w-3 h-3 text-white/30" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium truncate text-sm block">
                {team ? team.name : (id?.startsWith('bye-') ? <span className="text-white/40 font-bold tracking-widest">BYE</span> : <span className="text-white/30 italic">TBD</span>)}
              </span>
            </div>
            {team && (
              <input type="number" value={score} onChange={e => handleScore(num, parseInt(e.target.value) || 0)} onClick={e => e.stopPropagation()} className="w-8 h-6 bg-black/40 rounded text-center text-xs border border-white/10 focus:border-white/40 focus:outline-none ml-1" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Audience poll */}
      {poll && pollTotal > 0 && match.status !== 'completed' && (
        <div className="px-3 py-1 border-t border-white/5">
          <div className="flex justify-between text-[8px] text-white/30 mb-0.5">
            <span>AUDIENCE: {pollPct1}%</span>
            <span>{100 - pollPct1}%</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
            <div style={{ width: `${pollPct1}%` }} className="h-full bg-blue-500/50" />
            <div style={{ width: `${100 - pollPct1}%` }} className="h-full bg-red-500/50" />
          </div>
        </div>
      )}

      {/* Prediction results strip */}
      {match.status === 'completed' && tournament.players && tournament.players.length > 0 && (() => {
        const matchPreds = (tournament.predictions || []).filter(p => p.matchId === match.id && p.pointsAwarded !== undefined);
        if (matchPreds.length === 0) return null;
        return (
          <div className="px-3 py-1.5 border-t border-white/5 bg-black/20">
            <div className="flex items-center gap-0.5 flex-wrap">
              <span className="text-[8px] text-white/30 uppercase tracking-wider mr-1">Picks:</span>
              {matchPreds.map(pred => {
                const player = tournament.players.find(p => p.id === pred.playerId);
                if (!player) return null;
                return (
                  <span
                    key={pred.playerId}
                    title={`${player.name}: ${pred.isCorrect ? '✅ Correct' : '❌ Wrong'} ${pred.isCorrect ? `(+${pred.pointsAwarded})` : ''}`}
                    className={cn(
                      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold",
                      pred.isCorrect ? "bg-green-500/15 text-green-400" : "bg-red-500/10 text-red-400/60"
                    )}
                  >
                    {player.avatar}
                    {pred.isCorrect ? '✓' : '✗'}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Undo */}
      {match.status === 'completed' && (
        <button onClick={() => updateMatchScore(match.id, match.score1, match.score2, null)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 bg-black/80 px-2 py-1 rounded text-xs backdrop-blur-md border border-white/20 transition-opacity z-20">Undo</button>
      )}
    </motion.div>
  );
}
