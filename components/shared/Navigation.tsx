'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const isMonitor = pathname?.startsWith('/monitor');
  const isScenarios = pathname?.startsWith('/scenarios');
  const isCommandCenter = pathname?.startsWith('/command-center');

  return (
    <nav className="bg-black border-b-2 border-green-500">
      <div className="max-w-[2000px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-green-400 font-mono tracking-wider glow-text">
              ◈ WW3 MONITOR ◈
            </Link>

            <div className="flex gap-2">
              <Link
                href="/command-center"
                className={`px-4 py-2 text-sm font-mono font-bold tracking-wider transition-all ${
                  isCommandCenter
                    ? 'bg-green-600 text-black'
                    : 'bg-black text-green-400 border border-green-900/40 hover:bg-green-900/20'
                }`}
              >
                ⬢ COMMAND CENTER
              </Link>

              <Link
                href="/monitor"
                className={`px-4 py-2 text-sm font-mono font-bold tracking-wider transition-all ${
                  isMonitor
                    ? 'bg-blue-600 text-black'
                    : 'bg-black text-blue-400 border border-blue-900/40 hover:bg-blue-900/20'
                }`}
              >
                LIVE FEED
              </Link>

              <Link
                href="/scenarios"
                className={`px-4 py-2 text-sm font-mono font-bold tracking-wider transition-all ${
                  isScenarios
                    ? 'bg-purple-600 text-black'
                    : 'bg-black text-purple-400 border border-purple-900/40 hover:bg-purple-900/20'
                }`}
              >
                SCENARIOS
              </Link>
            </div>
          </div>

          <div className="text-xs text-green-500/60 font-mono tracking-wider">
            TACTICAL AI ANALYSIS SYSTEM
          </div>
        </div>
      </div>

      <style jsx global>{`
        .glow-text {
          text-shadow: 0 0 10px currentColor;
        }
      `}</style>
    </nav>
  );
}
