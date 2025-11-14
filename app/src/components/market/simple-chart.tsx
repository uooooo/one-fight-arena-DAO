"use client";

import { useMemo } from "react";

interface ChartDataPoint {
  time: string;
  yes: number;
  no: number;
}

interface SimpleChartProps {
  data: ChartDataPoint[];
  selectedTimeframe: "1H" | "6H" | "1D" | "1W" | "1M" | "ALL";
}

export function SimpleChart({ data, selectedTimeframe }: SimpleChartProps) {
  const chartData = useMemo(() => {
    // Filter data based on timeframe (simplified - in real app, filter by actual time)
    return data.slice(-20); // Show last 20 points
  }, [data, selectedTimeframe]);

  const maxValue = 100;
  const minValue = 0;
  const chartHeight = 200;
  const chartWidth = 100; // percentage

  // Generate SVG path for YES line
  const yesPath = useMemo(() => {
    if (chartData.length === 0) return "";
    const points = chartData.map((point, index) => {
      const x = chartData.length === 1 ? 0 : (index / (chartData.length - 1)) * 100;
      const y = 100 - ((point.yes - minValue) / (maxValue - minValue)) * 100;
      return `${x},${y}`;
    });
    return chartData.length === 1 ? `M ${points[0]}` : `M ${points.join(" L ")}`;
  }, [chartData, minValue, maxValue]);

  // Generate SVG path for NO line
  const noPath = useMemo(() => {
    if (chartData.length === 0) return "";
    const points = chartData.map((point, index) => {
      const x = chartData.length === 1 ? 0 : (index / (chartData.length - 1)) * 100;
      const y = 100 - ((point.no - minValue) / (maxValue - minValue)) * 100;
      return `${x},${y}`;
    });
    return chartData.length === 1 ? `M ${points[0]}` : `M ${points.join(" L ")}`;
  }, [chartData, minValue, maxValue]);

  return (
    <div className="w-full h-[200px] relative">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-border opacity-20"
          />
        ))}

        {/* YES line */}
        <path
          d={yesPath}
          fill="none"
          stroke="rgb(249, 203, 0)"
          strokeWidth="1.5"
          className="drop-shadow-sm"
        />
        
        {/* NO line */}
        <path
          d={noPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-muted-foreground drop-shadow-sm"
        />
      </svg>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground px-1">
        <span>100%</span>
        <span>50%</span>
        <span>0%</span>
      </div>
    </div>
  );
}

