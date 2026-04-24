import { useParams, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '@/store/useTournamentStore';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Play, Trophy, ArrowLeft, Trash2, Settings } from 'lucide-react';
import { BracketView } from '@/components/bracket/BracketView';

export function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, setActiveTournament, activeTournament, addTeam, removeTeam, generateBracket } = useTournamentStore();
  
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamWinRate, setNewTeamWinRate] = useState(50);

  useEffect(() => {
    if (id) {
      setActiveTournament(id);
    }
  }, [id, setActiveTournament]);

  if (!activeTournament) {
    return <div>Loading or not found...</div>;
  }

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    addTeam({
      name: newTeamName,
      stats: { winRate: newTeamWinRate, wins: 0, losses: 0, matchesPlayed: 0 }
    });
    setNewTeamName('');
    setNewTeamWinRate(50);
  };

  const handleStart = () => {
    if (activeTournament.teams.length < 2) {
      alert("Need at least 2 teams!");
      return;
    }
    generateBracket();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/dashboard')} className="flex items-center text-white/50 hover:text-white mb-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold tracking-tight flex items-center space-x-3">
            <span>{activeTournament.name}</span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium uppercase tracking-wider text-white/70 align-middle">
              {activeTournament.status.replace('_', ' ')}
            </span>
          </h1>
          <p className="text-white/60 mt-2 text-lg">{activeTournament.gameType} • {activeTournament.format.replace('_', ' ')}</p>
        </div>
        
        {activeTournament.status === 'draft' && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => useTournamentStore.getState().shuffleSeeding()}
              className="flex items-center space-x-2 bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition-colors"
              title="Chaos Mode: Randomize Seeds"
            >
              <span>Chaos Mode 😈</span>
            </button>
            <button 
              onClick={handleStart}
              disabled={activeTournament.teams.length < 2}
              className="flex items-center space-x-2 bg-green-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-5 h-5" />
              <span>Start Tournament</span>
            </button>
          </div>
        )}
      </div>

      {/* Draft Mode - Team Management */}
      {activeTournament.status === 'draft' && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center"><Users className="w-5 h-5 mr-2"/> Add Team</h3>
              <form onSubmit={handleAddTeam} className="space-y-4">
                <div>
                  <label className="text-sm text-white/70">Team Name</label>
                  <input 
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-white/30 text-white"
                    placeholder="Team Name"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 flex justify-between">
                    <span>Power/Win Rate</span>
                    <span>{newTeamWinRate}%</span>
                  </label>
                  <input 
                    type="range"
                    min="0" max="100"
                    value={newTeamWinRate}
                    onChange={(e) => setNewTeamWinRate(parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
                <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors">
                  Add Team
                </button>
              </form>
            </motion.div>
          </div>

          <div className="md:col-span-2">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold flex items-center">
                  Roster <span className="ml-2 text-sm bg-white/10 px-2 py-0.5 rounded-full">{activeTournament.teams.length}</span>
                </h3>
              </div>
              
              {activeTournament.teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-white/40">
                  <Users className="w-12 h-12 mb-2 opacity-50" />
                  <p>No teams added yet.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeTournament.teams.map((team, i) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={team.id} 
                      className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                          <span className="font-bold text-sm">{team.name.substring(0,2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{team.name}</p>
                          <p className="text-xs text-white/50">Power: {team.stats.winRate}%</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeTeam(team.id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}

      {/* In Progress Mode - Bracket View */}
      {activeTournament.status !== 'draft' && (
        <BracketView tournament={activeTournament} />
      )}
    </div>
  );
}
