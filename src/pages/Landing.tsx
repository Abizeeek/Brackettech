import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, Zap, BarChart3, Users } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-white/30">
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-24 lg:px-8 flex flex-col items-center text-center">
        {/* Glow effect behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 backdrop-blur-md"
        >
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-medium tracking-wide">Brackketech V2 is now live</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 leading-[1.1]"
        >
          The Ultimate <br className="hidden md:block" /> Tournament Engine.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl text-white/50 max-w-2xl mb-12 font-light"
        >
          Build, manage, and visualize your esports and sports tournaments with a beautiful, cinematic, Apple-inspired interface.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link 
            to="/dashboard" 
            className="flex items-center justify-center space-x-2 bg-white text-black px-8 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
          >
            <span>Launch App</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
          <a 
            href="#features" 
            className="flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 px-8 py-4 rounded-2xl font-semibold transition-colors"
          >
            Explore Features
          </a>
        </motion.div>
      </div>

      {/* Feature Grid */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-24 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: "Cinematic Brackets",
              description: "Watch your tournament unfold with perfectly smooth, animated bracket progression and automatic seeding."
            },
            {
              icon: Users,
              title: "Team Management",
              description: "Organize teams, manage logos, and adjust win-rate stats with a few taps. Export rosters anytime."
            },
            {
              icon: BarChart3,
              title: "Advanced Analytics",
              description: "Get real-time insights on team performance, win distributions, and match history out of the box."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel p-8"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
