import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament } from '@/models/types';
import { cn } from '@/lib/utils';
import { Flame, AlertTriangle, Newspaper } from 'lucide-react';

interface HypeMeterProps {
  tournament: Tournament;
}

export function HypeMeter({ tournament }: HypeMeterProps) {
  const completedNonBye = tournament.matches.filter(m => m.status === 'completed' && m.team1Id && m.team2Id && !m.team1Id.startsWith('bye-') && !m.team2Id?.startsWith('bye-'));
  const headlines = tournament.resultHeadlines || [];

  // Calculate hype level
  let upsetCount = 0;
  let closeMatchCount = 0;
  completedNonBye.forEach(match => {
    const t1 = tournament.teams.find(t => t.id === match.team1Id);
    const t2 = tournament.teams.find(t => t.id === match.team2Id);
    if (t1 && t2) {
      const p1 = (t1.stats.winRate || 50) + ((t1.momentum ?? 50) - 50) * 0.2;
      const p2 = (t2.stats.winRate || 50) + ((t2.momentum ?? 50) - 50) * 0.2;
      const tot = p1 + p2;
      const prob1 = tot === 0 ? 0.5 : p1 / tot;
      if ((match.winnerId === t1.id && prob1 < 0.4) || (match.winnerId === t2.id && (1 - prob1) < 0.4)) upsetCount++;
      if (Math.abs(prob1 - 0.5) < 0.1) closeMatchCount++;
    }
  });

  const hypeLevel = Math.min(100, (upsetCount * 25) + (closeMatchCount * 15) + (completedNonBye.length * 5));
  const hypeLabel = hypeLevel >= 80 ? 'EXPLOSIVE' : hypeLevel >= 50 ? 'INTENSE' : hypeLevel >= 25 ? 'BUILDING' : 'CALM';
  const hypeColor = hypeLevel >= 80 ? 'text-red-400' : hypeLevel >= 50 ? 'text-orange-400' : hypeLevel >= 25 ? 'text-yellow-400' : 'text-white/40';

  if (completedNonBye.length === 0 && headlines.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Hype Level Bar */}
      <div className="glass-panel border border-white/10 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold flex items-center gap-1">
            <Flame className="w-3 h-3" /> Tournament Hype
          </span>
          <span className={cn("text-xs font-bold", hypeColor)}>{hypeLabel}</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hypeLevel}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn("h-full rounded-full", hypeLevel >= 80 ? "bg-gradient-to-r from-orange-500 to-red-500" : hypeLevel >= 50 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gradient-to-r from-white/20 to-yellow-500/50")}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-white/30">
          <span>{upsetCount} upsets</span>
          <span>{closeMatchCount} close matches</span>
        </div>
      </div>

      {/* Headlines Ticker */}
      {headlines.length > 0 && (
        <div className="glass-panel border border-white/10 p-3">
          <div className="flex items-center gap-1 mb-2">
            <Newspaper className="w-3 h-3 text-white/50" />
            <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Headlines</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            <AnimatePresence>
              {headlines.slice(0, 6).map((hl, i) => (
                <motion.p
                  key={`${hl}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn("text-xs", i === 0 ? "text-white font-semibold" : "text-white/50")}
                >
                  {i === 0 ? '📢 ' : '• '}{hl}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Upset Alert */}
      {upsetCount > 0 && (
        <div className="glass-panel border border-red-500/20 bg-red-500/5 p-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="text-xs text-red-400 font-semibold">{upsetCount} upset{upsetCount > 1 ? 's' : ''} so far!</span>
        </div>
      )}
    </div>
  );
}
