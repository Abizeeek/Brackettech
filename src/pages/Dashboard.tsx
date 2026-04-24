import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Trophy, Calendar, ChevronRight } from 'lucide-react';
import { useTournamentStore } from '@/store/useTournamentStore';

export function Dashboard() {
  const { tournaments } = useTournamentStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-white/60 mt-2 text-lg">Welcome back. Here are your tournaments.</p>
        </div>
        <Link 
          to="/create" 
          className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Tournament</span>
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-12 text-center flex flex-col items-center justify-center mt-12 border-dashed border-2 border-white/10"
        >
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-10 h-10 text-white/40" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">No Tournaments Yet</h3>
          <p className="text-white/50 max-w-md mx-auto mb-8">
            You haven't created any tournaments. Click the button below to setup your first bracket.
          </p>
          <Link 
            to="/create" 
            className="flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Tournament</span>
          </Link>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={tournament.id}
              className="glass-panel p-6 group hover:border-white/30 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium uppercase tracking-wider text-white/70">
                  {tournament.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-2xl font-semibold mb-2 group-hover:text-white transition-colors">{tournament.name}</h3>
              <div className="flex items-center text-white/50 text-sm mb-6 space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(tournament.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="px-2 py-0.5 bg-white/5 rounded-md">{tournament.teams.length} Teams</span>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <span className="text-white/40 text-sm">{tournament.format.replace('_', ' ')}</span>
                <Link to={`/tournament/${tournament.id}`} className="flex items-center space-x-1 text-white hover:text-gray-300 transition-colors">
                  <span className="font-medium">View</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
