'use client';

import { useEffect, useRef } from 'react';
import { ScenarioChangelog } from '@/types/scenario';

interface ProbabilityChartProps {
  changelog: ScenarioChangelog[];
  currentProbability: number;
}

export function ProbabilityChart({ changelog, currentProbability }: ProbabilityChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Filter probability changes
    const probabilityChanges = changelog
      .filter((entry) => entry.change_type === 'probability_increase' || entry.change_type === 'probability_decrease')
      .sort((a, b) => a.timestamp - b.timestamp);

    if (probabilityChanges.length === 0) {
      // Draw empty state
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Pas assez de données historiques', rect.width / 2, rect.height / 2);
      return;
    }

    // Create data points
    const dataPoints = probabilityChanges.map((entry) => ({
      timestamp: entry.timestamp,
      value: entry.new_value as number,
    }));

    // Add current value
    dataPoints.push({
      timestamp: Date.now(),
      value: currentProbability,
    });

    // Chart dimensions
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Find min/max for scaling
    const minTime = dataPoints[0].timestamp;
    const maxTime = dataPoints[dataPoints.length - 1].timestamp;
    const maxValue = 1.0;
    const minValue = 0;

    // Scale functions
    const scaleX = (timestamp: number) => padding + ((timestamp - minTime) / (maxTime - minTime)) * chartWidth;
    const scaleY = (value: number) => rect.height - padding - ((value - minValue) / (maxValue - minValue)) * chartHeight;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = padding + (chartHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const value = (i / 10).toFixed(1);
      const y = scaleY(i / 10);
      ctx.fillText(`${(parseFloat(value) * 100).toFixed(0)}%`, padding - 10, y + 4);
    }

    // Draw line chart
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    dataPoints.forEach((point, index) => {
      const x = scaleX(point.timestamp);
      const y = scaleY(point.value);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    dataPoints.forEach((point) => {
      const x = scaleX(point.timestamp);
      const y = scaleY(point.value);

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw area under curve
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.beginPath();
    dataPoints.forEach((point, index) => {
      const x = scaleX(point.timestamp);
      const y = scaleY(point.value);

      if (index === 0) {
        ctx.moveTo(x, scaleY(0));
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(scaleX(dataPoints[dataPoints.length - 1].timestamp), scaleY(0));
    ctx.closePath();
    ctx.fill();
  }, [changelog, currentProbability]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution de la probabilité</h3>
      <canvas ref={canvasRef} className="w-full h-64" style={{ width: '100%', height: '256px' }} />
    </div>
  );
}
