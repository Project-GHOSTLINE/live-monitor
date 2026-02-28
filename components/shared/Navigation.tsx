'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const isMonitor = pathname?.startsWith('/monitor');
  const isScenarios = pathname?.startsWith('/scenarios');

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              WW3 Monitor
            </Link>

            <div className="flex gap-4">
              <Link
                href="/monitor"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isMonitor
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Live Monitor
              </Link>

              <Link
                href="/scenarios"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isScenarios
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Scenarios
              </Link>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Real-time analysis powered by AI
          </div>
        </div>
      </div>
    </nav>
  );
}
