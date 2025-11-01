import { motion, useScroll, useTransform } from 'motion/react';
import { useState, useEffect } from 'react';
import { Search, Menu, User } from 'lucide-react';

export function Navbar() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();
  
  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', updateVisibility);
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const opacity = useTransform(scrollY, [50, 150], [0, 1]);
  const y = useTransform(scrollY, [50, 150], [-50, 0]);

  return (
    <motion.nav
      style={{ opacity, y }}
      className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
            >
              <span className="text-white text-sm font-bold">T</span>
            </motion.div>
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              TravelAI
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex-1 max-w-md mx-8"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                placeholder="Search destinations..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm"
            >
              <Menu className="w-5 h-5 text-white/80" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm"
            >
              <User className="w-5 h-5 text-white/80" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}