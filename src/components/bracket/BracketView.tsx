import * as React from 'react';
import { Tournament } from '@/models/types';
import { MatchCard } from './MatchCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournamentStore } from '@/store/useTournamentStore';
import { PredictionArena } from '@/components/arena/PredictionArena';
import { HypeMeter } from '@/components/hype/HypeMeter';
import { TournamentResults } from '@/components/results/TournamentResults';

interface BracketViewProps { tournament: Tournament; }

export function BracketView({ tournament }: BracketViewProps) {
  const { simulateTournament, getCurrentRound } = useTournamentStore();
  const [showArena, setShowArena] = React.useState(true);
  const [showResults, setShowResults] = React.useState(false);

  const matchesByRound = tournament.matches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {} as Record<number, typeof tournament.matches>);

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const isFinished = tournament.matches.every(m => m.status === 'completed');
  const completedCount = tournament.matches.filter(m => m.status === 'completed').length;
  const currentRound = getCurrentRound();

  // Auto-show results when tournament finishes
  React.useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => setShowResults(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isFinished]);

  // Show results dashboard
  if (showResults && isFinished) {
    return (
      <div className="w-full h-full flex flex-col relative overflow-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setShowResults(false)} className="text-white/40 hover:text-white text-sm transition-colors">
            ← Back to Bracket
          </button>
        </div>
        <TournamentResults tournament={tournament} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <AnimatePresence>
        {isFinished && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-0 bg-black/70 pointer-events-none" />}
      </AnimatePresence>

      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Control bar */}
        {!isFinished && (
          <div className="flex justify-between items-center mb-3 px-6 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowArena(!showArena)} className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-yellow-500/30 transition-colors">
                {showArena ? '🔮 Hide Arena' : '🔮 Prediction Arena'}
              </button>
              {currentRound > 0 && (
                <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">
                  Round {currentRound} of {rounds.length}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => simulateTournament('instant')} className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-500/30 transition-colors">⚡ Auto-Sim All</button>
            </div>
          </div>
        )}

        {/* Finished: show results button */}
        {isFinished && (
          <div className="flex justify-center mb-4 px-6">
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowResults(true)}
              className="bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-400 border border-yellow-500/40 px-6 py-3 rounded-xl font-bold text-sm shadow-[0_0_25px_rgba(234,179,8,0.15)] hover:shadow-[0_0_35px_rgba(234,179,8,0.25)] transition-all"
            >
              📊 View Full Results & Graphs
            </motion.button>
          </div>
        )}

        {/* Main layout: bracket + sidebar */}
        <div className="flex flex-1 min-h-0 gap-4 px-2">
          {/* Bracket */}
          <motion.div key={completedCount} initial={{ rotate: 0 }} animate={{ rotate: [0, -0.1, 0.1, 0] }} transition={{ duration: 0.3 }} className="flex-1 overflow-x-auto overflow-y-auto pb-8">
            <div className="flex gap-14 min-w-max p-6">
              {rounds.map(round => (
                <div key={round} className="flex flex-col relative" style={{ justifyContent: 'space-around' }}>
                  <h3 className="text-center text-white/50 font-semibold tracking-widest uppercase text-xs mb-8 absolute -top-6 w-full">
                    {round === rounds[rounds.length - 1] && rounds.length > 1 ? '🏆 Finals' : round === rounds[rounds.length - 2] && rounds.length > 2 ? '⚔️ Semifinals' : `Round ${round}`}
                  </h3>
                  <div className="flex flex-col justify-around h-full gap-6 relative z-10">
                    {matchesByRound[round].map(match => (
                      <div key={match.id} className="relative">
                        <MatchCard match={match} tournament={tournament} />
                        {round < rounds.length && <div className="absolute top-1/2 -right-14 w-14 h-px bg-white/15 pointer-events-none" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Champion */}
              {isFinished && (
                <div className="flex flex-col justify-center">
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }} className="w-72 glass-panel border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] p-8 text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-white/60 text-sm font-bold uppercase tracking-wider mb-2">Champion</h3>
                    <p className="text-3xl font-bold">
                      {tournament.teams.find(t => t.id === tournament.matches.find(m => m.round === rounds.length)?.winnerId)?.name || '?'}
                    </p>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar: Arena + Hype */}
          <AnimatePresence>
            {showArena && !isFinished && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="shrink-0 overflow-hidden">
                <div className="w-80 space-y-4">
                  <PredictionArena />
                  <HypeMeter tournament={tournament} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
