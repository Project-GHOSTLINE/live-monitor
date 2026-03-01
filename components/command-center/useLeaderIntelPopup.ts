'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PopupPlacement {
  x: number;
  y: number;
  side: 'left' | 'right';
  placement: 'top' | 'bottom';
}

interface PopupSize {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

/**
 * Computes optimal popup placement relative to anchor element
 * @param anchorRect - DOMRect of the anchor element
 * @param popupSize - Width and height of the popup
 * @param viewport - Current viewport dimensions and scroll position
 * @returns Placement coordinates and preferred side
 */
export function computePopupPlacement(
  anchorRect: DOMRect,
  popupSize: PopupSize,
  viewport: Viewport
): PopupPlacement {
  const PADDING = 12; // Minimum padding from viewport edges
  const GAP = 8; // Gap between anchor and popup

  // Calculate available space on each side
  const spaceRight = viewport.width - (anchorRect.right + GAP);
  const spaceLeft = anchorRect.left - GAP;
  const spaceTop = anchorRect.top;
  const spaceBottom = viewport.height - anchorRect.bottom;

  // Determine horizontal side (prefer right, flip to left if overflow)
  let side: 'left' | 'right' = 'right';
  let x: number;

  if (spaceRight >= popupSize.width + PADDING) {
    // Place on right
    side = 'right';
    x = anchorRect.right + GAP;
  } else if (spaceLeft >= popupSize.width + PADDING) {
    // Flip to left
    side = 'left';
    x = anchorRect.left - GAP - popupSize.width;
  } else {
    // Not enough space on either side, place on side with more room
    if (spaceRight > spaceLeft) {
      side = 'right';
      x = Math.min(anchorRect.right + GAP, viewport.width - popupSize.width - PADDING);
    } else {
      side = 'left';
      x = Math.max(PADDING, anchorRect.left - GAP - popupSize.width);
    }
  }

  // Ensure x stays within bounds with 12px padding
  x = Math.max(PADDING, Math.min(x, viewport.width - popupSize.width - PADDING));

  // Vertical positioning with auto-flip to top when anchor is in bottom half
  const viewportMidpoint = viewport.height / 2;
  let placement: 'top' | 'bottom' = 'bottom'; // Default to bottom (align to top of anchor)
  let y: number;

  // Auto-flip to TOP placement if anchor is in bottom half of viewport
  if (anchorRect.top > viewportMidpoint) {
    // Place ABOVE anchor
    placement = 'top';
    y = anchorRect.top - GAP - popupSize.height;
  } else {
    // Place BELOW anchor (align to top of anchor)
    placement = 'bottom';
    y = anchorRect.top;
  }

  // Ensure y stays within bounds with 12px padding from all edges
  y = Math.max(PADDING, Math.min(y, viewport.height - popupSize.height - PADDING));

  return { x, y, side, placement };
}

interface UseLeaderIntelPopupReturn {
  hoveredLeaderId: string | null;
  placement: PopupPlacement | null;
  isOpen: boolean;
  handleHoverStart: (leaderId: string, anchorElement: HTMLElement) => void;
  handleHoverEnd: () => void;
  setPopupSize: (size: PopupSize) => void;
}

const HOVER_DEBOUNCE_MS = 120;

export function useLeaderIntelPopup(): UseLeaderIntelPopupReturn {
  const [hoveredLeaderId, setHoveredLeaderId] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [popupSize, setPopupSize] = useState<PopupSize>({ width: 380, height: 520 });
  const [placement, setPlacement] = useState<PopupPlacement | null>(null);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const anchorElementRef = useRef<HTMLElement | null>(null);

  // Recompute placement on window resize or scroll
  useEffect(() => {
    if (!anchorRect) return;

    const handleResizeOrScroll = () => {
      // Recompute placement with fresh viewport data
      if (anchorRect) {
        const viewport: Viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
        };
        const newPlacement = computePopupPlacement(anchorRect, popupSize, viewport);
        setPlacement(newPlacement);
      }
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [anchorRect, popupSize]); // Only reattach listeners when anchorRect/popupSize change

  // Compute initial placement when anchorRect changes
  useEffect(() => {
    if (!anchorRect) {
      setPlacement(null);
      return;
    }

    const viewport: Viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };

    const newPlacement = computePopupPlacement(anchorRect, popupSize, viewport);
    setPlacement(newPlacement);
  }, [anchorRect, popupSize]);

  const handleHoverStart = useCallback((leaderId: string, anchorElement: HTMLElement) => {
    // Clear any pending hover end
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Debounce hover start
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredLeaderId(leaderId);
      anchorElementRef.current = anchorElement;
      setAnchorRect(anchorElement.getBoundingClientRect());
    }, HOVER_DEBOUNCE_MS);
  }, []);

  const handleHoverEnd = useCallback(() => {
    // Clear any pending hover start
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Debounce hover end
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredLeaderId(null);
      setAnchorRect(null);
      anchorElementRef.current = null;
    }, HOVER_DEBOUNCE_MS);
  }, []);

  const isOpen = Boolean(hoveredLeaderId);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    hoveredLeaderId,
    placement,
    isOpen,
    handleHoverStart,
    handleHoverEnd,
    setPopupSize,
  };
}
