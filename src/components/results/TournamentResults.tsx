import * as React from 'react';
import { motion } from 'framer-motion';
import { Tournament } from '@/models/types';
import { cn } from '@/lib/utils';
import { RANK_COLORS } from '@/models/types';
import { Trophy, BarChart3, Target, Award, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface Props { tournament: Tournament; }

export function TournamentResults({ tournament }: Props) {
  const navigate = useNavigate();
  const totalRounds = Math.max(...tournament.matches.map(m => m.round));
  const finalMatch = tournament.matches.find(m => m.round === totalRounds);
  const champion = tournament.teams.find(t => t.id === finalMatch?.winnerId);

  // Score data for bar chart
  const realMatches = tournament.matches.filter(m => m.status === 'completed' && m.team1Id && m.team2Id && !m.team1Id.startsWith('bye-') && !m.team2Id?.startsWith('bye-'));
  const scoreData = realMatches.map(m => {
    const t1 = tournament.teams.find(t => t.id === m.team1Id);
    const t2 = tournament.teams.find(t => t.id === m.team2Id);
    return { name: `M${m.matchNumber}`, team1: t1?.name || '?', team2: t2?.name || '?', score1: m.score1, score2: m.score2, round: m.round, winner: tournament.teams.find(t => t.id === m.winnerId)?.name || '?' };
  });

  // Player accuracy data
  const players = tournament.players || [];
  const playerData = players.map(p => {
    const pct = p.totalPredictions > 0 ? Math.round((p.correctPredictions / p.totalPredictions) * 100) : 0;
    return { name: p.name, avatar: p.avatar, accuracy: pct, correct: p.correctPredictions, total: p.totalPredictions, points: p.points, streak: p.bestStreak, rank: p.rank };
  }).sort((a, b) => b.points - a.points);

  // Radar data per round
  const radarData = Array.from({ length: totalRounds }, (_, i) => {
    const round = i + 1;
    const roundMatches = tournament.matches.filter(m => m.round === round && m.status === 'completed');
    const entry: Record<string, string | number> = { round: round === totalRounds ? 'Finals' : round === totalRounds - 1 ? 'Semis' : `R${round}` };
    players.forEach(p => {
      const preds = (tournament.predictions || []).filter(pr => pr.playerId === p.id && roundMatches.some(m => m.id === pr.matchId));
      const correct = preds.filter(pr => pr.isCorrect).length;
      entry[p.name] = preds.length > 0 ? Math.round((correct / preds.length) * 100) : 0;
    });
    return entry;
  });

  const COLORS = ['#facc15', '#818cf8', '#f472b6', '#34d399', '#fb923c', '#38bdf8', '#a78bfa', '#f87171'];

  const sorted = [...players].sort((a, b) => b.points - a.points);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="w-full space-y-6 pb-12">
      {/* Champion Banner */}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }} className="glass-panel border border-yellow-500/40 shadow-[0_0_60px_rgba(234,179,8,0.2)] p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-7xl mb-4">🏆</motion.div>
        <h2 className="text-white/50 text-sm font-bold uppercase tracking-[0.3em] mb-2">Tournament Champion</h2>
        <p className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">{champion?.name || 'Unknown'}</p>
        {finalMatch && <p className="text-white/40 text-sm mt-2">Final Score: {finalMatch.score1} — {finalMatch.score2}</p>}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Score Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel border border-white/10 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4" /> Match Scores</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} barGap={2}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#fff' }} labelFormatter={(v) => { const m = scoreData.find(d => d.name === v); return m ? `${m.team1} vs ${m.team2} (Round ${m.round})` : v; }} />
                <Bar dataKey="score1" name="Team 1" radius={[4, 4, 0, 0]}>{scoreData.map((_, i) => <Cell key={i} fill="#60a5fa" />)}</Bar>
                <Bar dataKey="score2" name="Team 2" radius={[4, 4, 0, 0]}>{scoreData.map((_, i) => <Cell key={i} fill="#f472b6" />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Prediction Accuracy Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel border border-white/10 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 flex items-center gap-2 mb-4"><Target className="w-4 h-4" /> Prediction Accuracy</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={playerData} layout="vertical" barSize={20}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#fff' }} formatter={(v: number, _n: string, p: { payload: typeof playerData[0] }) => [`${v}% (${p.payload.correct}/${p.payload.total})`, 'Accuracy']} />
                <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>{playerData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Radar: Per-Round Accuracy */}
      {players.length > 0 && players.length <= 6 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel border border-white/10 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 flex items-center gap-2 mb-4">📈 Accuracy per Round</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="round" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                {players.map((p, i) => (
                  <Radar key={p.id} name={p.name} dataKey={p.name} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Final Leaderboard */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-panel border border-white/10 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 flex items-center gap-2 mb-4"><Award className="w-4 h-4" /> Final Leaderboard</h3>
        {sorted.length > 0 ? (
          <div className="space-y-2">
            {sorted.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
                className={cn("flex items-center gap-3 p-3 rounded-xl border", i === 0 ? "bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]" : i === 1 ? "bg-white/5 border-white/15" : "bg-white/[0.03] border-white/5")}
              >
                <span className="text-lg w-8 text-center font-black" style={{ color: i === 0 ? '#facc15' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span className="text-2xl">{p.avatar}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{p.name}</p>
                  <p className={cn("text-[10px] font-semibold", RANK_COLORS[p.rank])}>{p.rank}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="font-black text-yellow-400">{p.points} pts</p>
                  <p className="text-[10px] text-white/40">{p.correct}/{p.total} correct • 🔥{p.streak} best</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-sm text-center py-4">No players participated</p>
        )}
      </motion.div>

      {/* Match Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="glass-panel border border-white/10 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-4">📜 Match Timeline</h3>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {realMatches.map(m => {
            const t1 = tournament.teams.find(t => t.id === m.team1Id);
            const t2 = tournament.teams.find(t => t.id === m.team2Id);
            const winner = tournament.teams.find(t => t.id === m.winnerId);
            const t1p = (t1?.stats.winRate || 50); const t2p = (t2?.stats.winRate || 50);
            const isUpset = (m.winnerId === t1?.id && t1p < t2p * 0.7) || (m.winnerId === t2?.id && t2p < t1p * 0.7);
            return (
              <div key={m.id} className="flex items-center gap-2 text-xs bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                <span className="text-white/30 w-8">R{m.round}</span>
                <span className="text-white/50 flex-1">{t1?.name} vs {t2?.name}</span>
                <span className="text-white/40">{m.score1}–{m.score2}</span>
                <span className="font-bold text-white">{winner?.name}</span>
                {isUpset && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">UPSET</span>}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Play Again */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="text-center">
        <button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30 px-8 py-3 rounded-xl font-bold hover:from-yellow-500/30 hover:to-amber-500/30 transition-all inline-flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
          Play Again <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
