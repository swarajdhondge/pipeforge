import { type FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  message?: string;
  subMessage?: string;
}

// Simple confetti particle
interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
}

const COLORS = ['#6B4C9A', '#4A90D9', '#F5A623', '#10B981', '#EF4444', '#8B5CF6'];

const generateParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    delay: Math.random() * 0.5,
  }));
};

export const Celebration: FC<CelebrationProps> = ({
  isVisible,
  onComplete,
  message = '🎉 Congratulations!',
  subMessage = 'You created your first pipe!',
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setParticles(generateParticles(50));
      setShowMessage(true);

      // Auto-dismiss after animation
      const timer = setTimeout(() => {
        setShowMessage(false);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      setParticles([]);
      setShowMessage(false);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {/* Confetti particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            animationDelay: `${particle.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}

      {/* Celebration message */}
      {showMessage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-bounceIn pointer-events-auto">
            <div className="text-5xl mb-4">{message.includes('🎉') ? '' : '🎉'}</div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              {message}
            </h2>
            <p className="text-neutral-600 mb-4">{subMessage}</p>
            <button
              onClick={() => {
                setShowMessage(false);
                onComplete?.();
              }}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

// Hook to manage first pipe celebration
const FIRST_PIPE_CELEBRATED_KEY = 'pipe_forge_first_pipe_celebrated';

export const useFirstPipeCelebration = () => {
  const [showCelebration, setShowCelebration] = useState(false);

  const triggerCelebration = () => {
    const hasCelebrated = localStorage.getItem(FIRST_PIPE_CELEBRATED_KEY);
    if (!hasCelebrated) {
      setShowCelebration(true);
      localStorage.setItem(FIRST_PIPE_CELEBRATED_KEY, 'true');
    }
  };

  const closeCelebration = () => {
    setShowCelebration(false);
  };

  const resetCelebration = () => {
    localStorage.removeItem(FIRST_PIPE_CELEBRATED_KEY);
  };

  return { showCelebration, triggerCelebration, closeCelebration, resetCelebration };
};
