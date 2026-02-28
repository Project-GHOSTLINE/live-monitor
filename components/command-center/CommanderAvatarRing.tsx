'use client';

import Image from 'next/image';

interface CommanderAvatarRingProps {
  src?: string;
  alt: string;
  flag: string;
  ringColor?: string;
  glowColor?: string;
  selected?: boolean;
  readiness: number; // 0-100
  stance: 'aggressive' | 'defensive' | 'neutral';
  className?: string;
}

export function CommanderAvatarRing({
  src,
  alt,
  flag,
  ringColor,
  glowColor,
  selected = false,
  readiness,
  stance,
  className = '',
}: CommanderAvatarRingProps) {
  // Dynamic colors based on readiness
  const getRingColor = () => {
    if (ringColor) return ringColor;
    if (readiness >= 90) return 'rgb(239, 68, 68)'; // red-500
    if (readiness >= 75) return 'rgb(251, 146, 60)'; // orange-400
    return 'rgb(234, 179, 8)'; // yellow-500
  };

  const getGlowColor = () => {
    if (glowColor) return glowColor;
    if (selected) return 'rgb(250, 204, 21)'; // yellow-400 for selected
    if (readiness >= 90) return 'rgb(239, 68, 68)';
    if (readiness >= 75) return 'rgb(251, 146, 60)';
    return 'rgb(74, 222, 128)'; // green-400
  };

  const ringColorValue = getRingColor();
  const glowColorValue = getGlowColor();
  const glowIntensity = readiness / 100;

  return (
    <div className={`relative ${className}`}>
      {/* Background glow pulse for aggressive leaders */}
      {stance === 'aggressive' && (
        <div
          className="absolute inset-0 rounded-full blur-2xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${ringColorValue}30 0%, transparent 70%)`,
          }}
        />
      )}

      {/* 3D Commander Portrait Container */}
      <div className={`relative w-32 h-40 md:w-36 md:h-44 transition-all duration-300 ${
        selected ? 'scale-110' : ''
      }`}>
        {/* Deep shadow for 3D effect */}
        <div
          className="absolute inset-0 blur-xl transform translate-y-4 opacity-60"
          style={{
            background: 'linear-gradient(to bottom, black, transparent, black)',
          }}
        />

        {/* Main portrait frame with pentagon clip */}
        <div
          className="relative w-full h-full overflow-hidden shadow-2xl"
          style={{
            clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
            background: 'linear-gradient(to bottom, #1c1917, #000000, #000000)',
          }}
        >
          {/* Commander image or flag fallback */}
          {src ? (
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover object-top scale-125 hover:scale-135 transition-transform duration-300"
              sizes="(max-width: 768px) 128px, 144px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-90">
              {flag}
            </div>
          )}

          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div
              className="w-full h-full animate-scan-lines"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.3) 2px, rgba(0,0,0,.3) 4px)',
              }}
            />
          </div>

          {/* Neon ring glow - intensity scales with readiness */}
          <div
            className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
              selected ? 'animate-pulse-glow' : ''
            }`}
            style={{
              boxShadow: selected
                ? `inset 0 0 20px ${glowColorValue}, inset 0 0 40px ${glowColorValue}80, 0 0 30px ${glowColorValue}60`
                : `inset 0 0 ${10 + glowIntensity * 20}px ${glowColorValue}${Math.floor(glowIntensity * 100).toString(16).padStart(2, '0')}`,
            }}
          />

          {/* Bottom edge glow */}
          <div
            className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent pointer-events-none"
            style={{
              background: `linear-gradient(to top, ${selected ? glowColorValue + '50' : glowColorValue + '30'}, transparent 60%)`,
            }}
          />

          {/* Outer frame border - thicker when selected */}
          <div
            className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
              selected ? 'border-4' : 'border-2'
            }`}
            style={{
              borderColor: ringColorValue,
              clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
              boxShadow: selected
                ? `0 0 20px ${glowColorValue}, 0 0 40px ${glowColorValue}80`
                : 'none',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-lines {
          0% { transform: translateY(0); }
          100% { transform: translateY(8px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-scan-lines {
          animation: scan-lines 0.5s linear infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
