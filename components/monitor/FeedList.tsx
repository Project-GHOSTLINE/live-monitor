'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { FeedCard } from './FeedCard';
import { FeedItem } from '@/types/feed';

interface FeedListProps {
  search: string;
  filters: any;
}

export function FeedList({ search, filters }: FeedListProps) {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ['items', search, filters],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        offset: pageParam.toString(),
        limit: '20',
        ...(search && { search }),
        ...(filters.source_type && { source_type: filters.source_type }),
        ...(filters.reliability && { reliability: filters.reliability }),
        ...(filters.tags && { tags: filters.tags }),
        ...(filters.time_range && { time_range: filters.time_range }),
      });

      const res = await fetch(`/api/items?${params}`);
      if (!res.ok) throw new Error('Failed to fetch items');
      return res.json();
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length * 20 : undefined;
    },
    initialPageParam: 0,
  });

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading news...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Error loading news</p>
          <p className="text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  const items = data?.pages.flatMap(page => page.items) ?? [];

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-600">
          <p className="text-xl font-semibold mb-2">No news found</p>
          <p className="text-sm">Try adjusting your filters or search</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {items.map((item: FeedItem) => (
        <FeedCard key={item.id} item={item} />
      ))}

      {/* Load more trigger */}
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
