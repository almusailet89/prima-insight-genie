import React from 'react';

// Simplified chart components to replace the complex recharts implementation
// This avoids TypeScript conflicts while maintaining functionality

interface ChartContainerProps {
  config?: Record<string, any>;
  className?: string;
  children: React.ReactNode;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  className?: string;
}

interface ChartLegendContentProps {
  payload?: any[];
  hideIcon?: boolean;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ 
  children, 
  className = "",
  config = {} 
}) => {
  return (
    <div className={`chart-container ${className}`} data-chart-config={JSON.stringify(config)}>
      {children}
    </div>
  );
};

export const ChartTooltip = ({ children, ...props }: any) => {
  return <div className="chart-tooltip" {...props}>{children}</div>;
};

export const ChartTooltipContent: React.FC<ChartTooltipContentProps> = ({
  active,
  payload,
  label,
  hideLabel = false,
  hideIndicator = false,
  className = ""
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={`bg-background border rounded-lg shadow-md p-3 ${className}`}>
      {!hideLabel && label && (
        <p className="font-medium text-sm mb-2">{label}</p>
      )}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          {!hideIndicator && (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
          )}
          <span className="font-medium">{entry.name}:</span>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const ChartLegend = ({ children, ...props }: any) => {
  return <div className="chart-legend" {...props}>{children}</div>;
};

export const ChartLegendContent: React.FC<ChartLegendContentProps> = ({
  payload,
  hideIcon = false,
  className = ""
}) => {
  if (!payload?.length) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-4 pt-3 ${className}`}>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          {!hideIcon && (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
          )}
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// Chart configuration context
const ChartContext = React.createContext<{ config: Record<string, any> }>({
  config: {}
});

export const useChart = () => {
  const context = React.useContext(ChartContext);
  return context || { config: {} };
};

export const ChartProvider: React.FC<{ config: Record<string, any>; children: React.ReactNode }> = ({
  config,
  children
}) => {
  return (
    <ChartContext.Provider value={{ config }}>
      {children}
    </ChartContext.Provider>
  );
};