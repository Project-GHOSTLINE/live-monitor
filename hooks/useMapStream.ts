'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapEvent } from '@/lib/signals/signalTypes';

/**
 * React hook for consuming SSE map-stream endpoint
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Event queue management (last 300 actions)
 * - Connection state tracking
 * - Error handling and recovery
 * - Memory-efficient circular buffer
 *
 * @param scope - 'middle-east' | 'global'
 * @param options - Configuration options
 * @returns Connection state and event queue
 */

export interface MapStreamState {
  events: MapEvent[];
  isConnected: boolean;
  isReconnecting: boolean;
  lastPing: number | null;
  error: string | null;
  connectionAttempts: number;
}

export interface MapStreamOptions {
  maxEvents?: number; // Default: 300
  autoConnect?: boolean; // Default: true
  reconnectDelay?: number; // Default: 1000ms
  maxReconnectDelay?: number; // Default: 30000ms
  reconnectBackoffMultiplier?: number; // Default: 1.5
}

const DEFAULT_OPTIONS: Required<MapStreamOptions> = {
  maxEvents: 300,
  autoConnect: true,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectBackoffMultiplier: 1.5,
};

export function useMapStream(
  scope: 'middle-east' | 'global' = 'global',
  options: MapStreamOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<MapStreamState>({
    events: [],
    isConnected: false,
    isReconnecting: false,
    lastPing: null,
    error: null,
    connectionAttempts: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentDelayRef = useRef<number>(opts.reconnectDelay);
  const mountedRef = useRef<boolean>(true);

  // Add event to circular buffer
  const addEvent = useCallback((event: MapEvent) => {
    setState(prev => {
      const newEvents = [...prev.events, event];

      // Keep only last N events (circular buffer)
      if (newEvents.length > opts.maxEvents) {
        newEvents.shift(); // Remove oldest
      }

      return {
        ...prev,
        events: newEvents,
      };
    });
  }, [opts.maxEvents]);

  // Update connection state
  const updateState = useCallback((updates: Partial<MapStreamState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const since = Math.floor(Date.now() / 1000);
      const url = `/api/map-stream?scope=${scope}&since=${since}`;

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      updateState({
        isReconnecting: false,
        connectionAttempts: state.connectionAttempts + 1,
      });

      // Handle connection open
      eventSource.addEventListener('open', () => {
        if (!mountedRef.current) return;

        updateState({
          isConnected: true,
          isReconnecting: false,
          error: null,
        });

        // Reset reconnection delay on successful connection
        currentDelayRef.current = opts.reconnectDelay;
      });

      // Handle connection established
      eventSource.addEventListener('connected', (e: MessageEvent) => {
        if (!mountedRef.current) return;

        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Connected:', data);
        } catch (error) {
          console.error('[SSE] Failed to parse connected event:', error);
        }
      });

      // Handle ping events
      eventSource.addEventListener('ping', (e: MessageEvent) => {
        if (!mountedRef.current) return;

        try {
          const data = JSON.parse(e.data);
          updateState({
            lastPing: data.timestamp,
          });
        } catch (error) {
          console.error('[SSE] Failed to parse ping:', error);
        }
      });

      // Handle map events
      eventSource.addEventListener('map-event', (e: MessageEvent) => {
        if (!mountedRef.current) return;

        try {
          const mapEvent: MapEvent = JSON.parse(e.data);
          addEvent(mapEvent);
        } catch (error) {
          console.error('[SSE] Failed to parse map event:', error);
        }
      });

      // Handle errors from server
      eventSource.addEventListener('error-event', (e: MessageEvent) => {
        if (!mountedRef.current) return;

        try {
          const errorData = JSON.parse(e.data);
          console.error('[SSE] Server error:', errorData);
          updateState({
            error: errorData.error || 'Server error',
          });
        } catch (error) {
          console.error('[SSE] Failed to parse error event:', error);
        }
      });

      // Handle connection errors
      eventSource.onerror = (error) => {
        if (!mountedRef.current) return;

        console.error('[SSE] Connection error:', error);

        updateState({
          isConnected: false,
          isReconnecting: true,
          error: 'Connection lost',
        });

        // Close current connection
        eventSource.close();
        eventSourceRef.current = null;

        // Schedule reconnection with exponential backoff
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        const delay = Math.min(
          currentDelayRef.current,
          opts.maxReconnectDelay
        );

        console.log(`[SSE] Reconnecting in ${delay}ms...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            currentDelayRef.current = Math.min(
              currentDelayRef.current * opts.reconnectBackoffMultiplier,
              opts.maxReconnectDelay
            );
            connect();
          }
        }, delay);
      };
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      updateState({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  }, [scope, opts, addEvent, updateState, state.connectionAttempts]);

  // Disconnect from SSE endpoint
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    updateState({
      isConnected: false,
      isReconnecting: false,
    });
  }, [updateState]);

  // Clear all events
  const clearEvents = useCallback(() => {
    setState(prev => ({
      ...prev,
      events: [],
    }));
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    mountedRef.current = true;

    if (opts.autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [scope, opts.autoConnect]); // Reconnect if scope changes

  return {
    ...state,
    connect,
    disconnect,
    clearEvents,
  };
}
