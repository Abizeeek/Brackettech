import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTournamentStore } from '@/store/useTournamentStore';
import { Search, Trophy, Shuffle } from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { tournaments } = useTournamentStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredTournaments = tournaments.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl glass border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          <div className="flex items-center px-4 py-3 border-b border-white/10">
            <Search className="w-5 h-5 text-white/50 mr-3" />
            <input
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/40 text-lg"
              placeholder="Search tournaments or run commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex space-x-1">
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-white/50">ESC</kbd>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {query.toLowerCase() === 'chaos' && (
              <div className="px-2 py-3 hover:bg-red-500/20 rounded-xl cursor-pointer flex items-center text-red-400 group transition-colors">
                <Shuffle className="w-5 h-5 mr-3 group-hover:animate-spin" />
                <span className="font-semibold">Unleash Chaos Mode</span>
              </div>
            )}
            
            <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Tournaments
            </div>
            
            {filteredTournaments.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/40">No tournaments found</div>
            ) : (
              filteredTournaments.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    navigate(`/tournament/${t.id}`);
                    setIsOpen(false);
                  }}
                  className="px-3 py-3 hover:bg-white/10 rounded-xl cursor-pointer flex items-center group transition-colors"
                >
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center mr-3 group-hover:bg-white/20">
                    <Trophy className="w-4 h-4 text-white/70" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{t.name}</div>
                    <div className="text-white/40 text-xs">{t.gameType} • {t.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
