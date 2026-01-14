import React from 'react';
import { motion } from 'framer-motion';

// Simple Bar Chart
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
  animated?: boolean;
}

export function BarChart({ data, height = 200, showValues = true, animated = true }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full space-x-2">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center">
              <div className="relative w-full flex justify-center" style={{ height: height - 30 }}>
                {showValues && (
                  <span className="absolute -top-6 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {item.value}
                  </span>
                )}
                <motion.div
                  className={`w-full max-w-[40px] rounded-t-md ${item.color || 'bg-primary-500'}`}
                  initial={animated ? { height: 0 } : { height: `${barHeight}%` }}
                  animate={{ height: `${barHeight}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
              <span className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple Line Chart (using SVG)
interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  showDots?: boolean;
  showArea?: boolean;
}

export function LineChart({ 
  data, 
  height = 200, 
  color = '#3b82f6', 
  showDots = true,
  showArea = true 
}: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const padding = 20;
  const chartWidth = 100;
  const chartHeight = height - padding * 2;
  
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * chartWidth,
    y: chartHeight - ((d.value - minValue) / range) * chartHeight,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`-${padding} -${padding} ${chartWidth + padding * 2} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => (
          <line
            key={percent}
            x1={0}
            y1={(percent / 100) * chartHeight}
            x2={chartWidth}
            y2={(percent / 100) * chartHeight}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeDasharray="4"
          />
        ))}

        {/* Area fill */}
        {showArea && (
          <motion.path
            d={areaD}
            fill={color}
            fillOpacity={0.1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Dots */}
        {showDots && points.map((point, i) => (
          <motion.circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
          />
        ))}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 px-2">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-gray-500 dark:text-gray-400">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Donut/Pie Chart
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
}

export function DonutChart({ data, size = 200, thickness = 30, showLegend = true }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;

  return (
    <div className="flex items-center space-x-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = item.value / total;
            const strokeDasharray = `${percentage * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset * circumference;
            currentOffset += percentage;

            return (
              <motion.circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
            );
          })}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{total}</span>
          <span className="text-xs text-gray-500">Total</span>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center space-x-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.label}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Progress Ring
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({ 
  value, 
  max = 100, 
  size = 120, 
  thickness = 10, 
  color = '#3b82f6',
  label 
}: ProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={thickness}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          {Math.round(percentage)}%
        </span>
        {label && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        )}
      </div>
    </div>
  );
}

// Sparkline (mini chart)
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ data, width = 100, height = 30, color = '#3b82f6' }: SparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill={color}
      />
    </svg>
  );
}
