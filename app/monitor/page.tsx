'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FeedList } from '@/components/monitor/FeedList';
import { TopBar } from '@/components/monitor/TopBar';
import { StatsPanel } from '@/components/monitor/StatsPanel';

export default function MonitorPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    source_type: '',
    reliability: '',
    tags: '',
    time_range: '24h' as '1h' | '6h' | '24h' | '7d' | 'all',
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <TopBar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Feed */}
        <main className="flex-1 overflow-auto">
          <FeedList search={search} filters={filters} />
        </main>

        {/* Right Sidebar - Stats */}
        <aside className="hidden lg:block w-80 border-l border-slate-200 bg-white overflow-auto">
          <StatsPanel stats={stats} />
        </aside>
      </div>
    </div>
  );
}
