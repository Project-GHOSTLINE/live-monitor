'use client';

interface StatsPanelProps {
  stats?: any;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  if (!stats) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded mb-4"></div>
          <div className="h-4 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 bg-slate-200 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Dashboard Stats</h3>

      {/* Total Items */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-blue-600">{stats.total_items}</div>
        <div className="text-sm text-slate-600">Total News Items</div>
      </div>

      {/* By Source Type */}
      {stats.items_by_source_type && (
        <div className="mb-6">
          <h4 className="font-semibold text-slate-900 mb-2">By Source Type</h4>
          <div className="space-y-2">
            {Object.entries(stats.items_by_source_type).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-slate-600 capitalize">{type}</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      {stats.recent_logs && stats.recent_logs.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-900 mb-2">Recent Ingestions</h4>
          <div className="space-y-2">
            {stats.recent_logs.slice(0, 5).map((log: any) => (
              <div key={log.id} className="text-xs p-2 bg-slate-50 rounded">
                <div className="font-medium text-slate-900">{log.source_name}</div>
                <div className="text-slate-600">
                  {log.items_new} new • {log.items_duplicate} dup
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
