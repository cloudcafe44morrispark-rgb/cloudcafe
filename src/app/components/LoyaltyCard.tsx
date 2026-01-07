import { motion } from 'motion/react';

interface LoyaltyCardProps {
  currentStamps?: number;
  target?: number;
  pendingReward?: boolean;
}

export function LoyaltyCard({ currentStamps = 0, target = 10, pendingReward = false }: LoyaltyCardProps) {
  // Create an empty array of length 10 to iterate over
  const slots = Array.from({ length: target });

  // Calculate how many more are needed
  const remaining = target - currentStamps;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Container */}
      <div className="bg-gradient-to-br from-[#B88A68] to-[#A67958] p-6 rounded-xl shadow-xl relative overflow-hidden text-white">

        {/* Optional: Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br from-white to-transparent" />

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider">Coffee Rewards</h2>
          <span className="text-sm font-semibold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            {currentStamps} / {target}
          </span>
        </div>

        {/* The Grid: 5 columns, 2 rows = 10 slots */}
        <div className="grid grid-cols-5 gap-4 relative z-10">
          {slots.map((_, index) => {
            const isStamped = index < currentStamps;
            const isLast = index === target - 1;

            return (
              <div key={index} className="flex flex-col items-center justify-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isStamped
                      ? 'border-white bg-white/30 backdrop-blur-sm' // Style for stamped slots
                      : 'border-white/40 border-dashed' // Style for empty slots
                    }
                    ${isLast ? 'border-yellow-300 bg-yellow-400/30' : ''} // Special style for the 10th slot
                  `}
                >
                  {/* Logic: What to render inside the circle? */}
                  {isStamped ? (
                    // 1. The Stamp (with animation)
                    <motion.span
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-2xl"
                    >
                      ☕️
                    </motion.span>
                  ) : isLast ? (
                    // 2. The Final Reward Icon
                    <span className="text-xl opacity-70">🎁</span>
                  ) : (
                    // 3. The Number
                    <span className="text-white/60 font-mono text-sm">
                      {index + 1}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Message */}
        <div className="relative z-10 mt-6 text-center">
          {pendingReward ? (
            <div className="text-yellow-300 font-bold animate-pulse">
              🎉 Free drink unlocked! Redeem now.
            </div>
          ) : remaining === 0 ? (
            <div className="text-yellow-300 font-bold animate-pulse">
              🎉 Card complete! Reward pending.
            </div>
          ) : (
            <p className="text-sm font-medium text-white/90">
              Buy <span className="font-bold">{remaining}</span> more to get your free drink!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}