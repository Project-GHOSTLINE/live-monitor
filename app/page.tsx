import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          Live Situation Monitor
        </h1>

        <p className="text-2xl text-slate-300 mb-8">
          Real-time Middle East news aggregation from reputable sources
        </p>

        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
          Aggregated updates from BBC, Reuters, Al Jazeera, UN, and more. Auto-translated to English.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/monitor"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-lg transition-colors"
          >
            Open Live Monitor →
          </Link>
          <Link
            href="/scenarios"
            className="inline-block px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-lg transition-colors"
          >
            View Scenarios →
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-400 mb-2">12</div>
            <div className="text-slate-400">Reputable Sources</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-400 mb-2">Auto</div>
            <div className="text-slate-400">Translation</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-400 mb-2">Live</div>
            <div className="text-slate-400">Updates</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-orange-400 mb-2">8</div>
            <div className="text-slate-400">Scenario Analysis</div>
          </div>
        </div>

        <div className="mt-16 text-sm text-slate-500">
          Aggregated info from public sources. Verify with original sources.
        </div>
      </div>
    </div>
  );
}
