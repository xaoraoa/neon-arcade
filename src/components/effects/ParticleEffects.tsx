/**
 * Particle Effects Component
 * 
 * Celebratory particles for wins, achievements, etc.
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'confetti' | 'star' | 'circle';
}

interface ParticleExplosionProps {
  isActive: boolean;
  type?: 'confetti' | 'firework' | 'achievement';
  duration?: number;
  particleCount?: number;
  colors?: string[];
  originX?: number;
  originY?: number;
}

const DEFAULT_COLORS = ['#00f5ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

export function ParticleExplosion({
  isActive,
  type = 'confetti',
  duration = 2000,
  particleCount = 50,
  colors = DEFAULT_COLORS,
  originX = 50,
  originY = 50,
}: ParticleExplosionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
      const angle = (Math.random() * Math.PI * 2);
      const speed = type === 'firework' ? 10 + Math.random() * 15 : 3 + Math.random() * 8;
      
      return {
        id: i,
        x: (originX / 100) * canvas.width,
        y: (originY / 100) * canvas.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'confetti' ? 5 : 0),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: type === 'achievement' ? 8 + Math.random() * 8 : 4 + Math.random() * 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        type: type === 'achievement' ? 'star' : Math.random() > 0.5 ? 'confetti' : 'circle',
      };
    });

    const gravity = type === 'firework' ? 0.3 : 0.15;
    const friction = 0.99;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fadeProgress = Math.max(0, 1 - elapsed / duration);

      particlesRef.current.forEach(particle => {
        // Update physics
        particle.vy += gravity;
        particle.vx *= friction;
        particle.vy *= friction;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = fadeProgress;
        ctx.fillStyle = particle.color;

        if (particle.type === 'star') {
          // Draw star
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = i % 2 === 0 ? particle.size : particle.size / 2;
            if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
            else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
          }
          ctx.closePath();
          ctx.fill();
        } else if (particle.type === 'confetti') {
          // Draw rectangle
          ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        } else {
          // Draw circle
          ctx.beginPath();
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, type, duration, particleCount, colors, originX, originY]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

// Achievement Notification Component
interface AchievementNotificationProps {
  achievement: {
    title: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xpReward: number;
  } | null;
  onClose: () => void;
}

const rarityColors = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-yellow-500 to-orange-500',
};

const rarityGlow = {
  common: 'shadow-gray-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-yellow-500/50',
};

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <>
          <ParticleExplosion
            isActive={true}
            type="achievement"
            duration={2500}
            particleCount={40}
            originX={50}
            originY={30}
          />
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.8 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className={`
                relative px-6 py-4 rounded-xl bg-gradient-to-r ${rarityColors[achievement.rarity]}
                shadow-lg ${rarityGlow[achievement.rarity]} shadow-2xl
                border border-white/20 backdrop-blur-sm
              `}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-white/10 animate-pulse" />
              
              <div className="relative flex items-center gap-4">
                <div className="text-4xl animate-bounce">{achievement.icon}</div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/70">Achievement Unlocked!</p>
                  <h3 className="font-bold text-white text-lg">{achievement.title}</h3>
                  <p className="text-sm text-white/80">{achievement.description}</p>
                  <p className="text-xs text-yellow-300 mt-1">+{achievement.xpReward} XP</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Win Celebration Component
interface WinCelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function WinCelebration({ isActive, onComplete }: WinCelebrationProps) {
  useEffect(() => {
    if (isActive && onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <>
          <ParticleExplosion
            isActive={true}
            type="confetti"
            duration={3000}
            particleCount={100}
            originX={50}
            originY={40}
          />
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="text-8xl"
            >
              🏆
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ParticleExplosion;
