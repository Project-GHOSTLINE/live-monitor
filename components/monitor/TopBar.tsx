'use client';

interface TopBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export function TopBar({ search, onSearchChange, filters, onFiltersChange }: TopBarProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-slate-900">Live Situation Monitor</h1>

          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
            LIVE
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-64 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Time Range Filter */}
          <select
            value={filters.time_range}
            onChange={e =>
              onFiltersChange({ ...filters, time_range: e.target.value })
            }
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>
    </header>
  );
}
