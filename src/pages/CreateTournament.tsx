import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight } from 'lucide-react';
import { useTournamentStore } from '@/store/useTournamentStore';

const formSchema = z.object({
  name: z.string().min(3, 'Tournament name is required'),
  gameType: z.string().min(1, 'Game/Sport type is required'),
  format: z.enum(['single_elimination', 'double_elimination', 'round_robin']),
  settings: z.object({
    bestOf: z.number().min(1).max(7),
    thirdPlaceMatch: z.boolean(),
    randomizeSeeding: z.boolean()
  })
});

type FormValues = z.infer<typeof formSchema>;

export function CreateTournament() {
  const navigate = useNavigate();
  const { createTournament } = useTournamentStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      format: 'single_elimination',
      settings: {
        bestOf: 1,
        thirdPlaceMatch: false,
        randomizeSeeding: false
      }
    }
  });

  const onSubmit = (data: FormValues) => {
    createTournament(data);
    navigate('/dashboard'); // Then they can click into the tournament to add teams
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Create Tournament</h1>
        <p className="text-white/60 mt-2 text-lg">Set up the basic rules for your new tournament.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Basic Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Basic Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Tournament Name</label>
                <input 
                  {...register('name')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-white placeholder:text-white/30"
                  placeholder="e.g. Summer Championship 2026"
                />
                {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Game / Sport</label>
                <input 
                  {...register('gameType')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-white placeholder:text-white/30"
                  placeholder="e.g. Valorant, Chess, Soccer"
                />
                {errors.gameType && <p className="text-red-400 text-sm">{errors.gameType.message}</p>}
              </div>
            </div>
          </div>

          {/* Format Settings */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Format</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Bracket Style</label>
              <select 
                {...register('format')}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-white appearance-none"
              >
                <option value="single_elimination">Single Elimination</option>
                <option value="double_elimination">Double Elimination</option>
                <option value="round_robin">Round Robin</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Best of (Matches per round)</label>
                <input 
                  type="number"
                  {...register('settings.bestOf', { valueAsNumber: true })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-white"
                  min="1" max="7"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-white text-black px-6 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              <span>Continue to Teams</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
