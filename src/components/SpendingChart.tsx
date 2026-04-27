import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface CategoryData {
  category: string;
  total: number;
  percentage: number;
}

interface SpendingChartProps {
  data: CategoryData[];
  chartType?: 'pie' | 'bar';
}

const COLORS = [
  '#00ff88', // green
  '#4dabf7', // blue
  '#ffd93d', // yellow
  '#ff4757', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-terminal-dark border border-terminal-border p-3">
        <p className="font-mono text-sm text-text-primary font-semibold">{data.name}</p>
        <p className="font-mono text-xs text-finance-green mt-1">
          {formatCurrency(data.value)}
        </p>
        <p className="font-mono text-xs text-text-muted mt-1">
          {data.percentage}% of total
        </p>
      </div>
    );
  }
  return null;
};

export const SpendingChart = ({ data, chartType = 'pie' }: SpendingChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-terminal-light border border-terminal-border">
        <div className="w-16 h-16 mb-4 border border-terminal-border flex items-center justify-center">
          <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          </svg>
        </div>
        <p className="text-text-muted font-mono text-sm">NO DATA AVAILABLE</p>
        <p className="text-text-muted font-mono text-xs mt-1">Add expenses to see breakdown</p>
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.category,
    value: item.total,
    percentage: item.percentage,
    fill: COLORS[index % COLORS.length],
  }));

  if (chartType === 'bar') {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <XAxis
              type="number"
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fontSize: 11, fill: '#666666', fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: '#333333' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={70}
              tick={{ fontSize: 11, fill: '#a0a0a0', fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(51, 51, 51, 0.5)' }} />
            <Bar dataKey="value" radius={[0, 2, 2, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              animationDuration={600}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-terminal-light border border-terminal-border hover:border-finance-green/50 transition-colors">
            <div
              className="w-3 h-3 flex-shrink-0"
              style={{ backgroundColor: entry.fill }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-text-primary truncate">
                {entry.name}
              </p>
              <p className="text-xs font-mono text-text-muted">
                {formatCurrency(entry.value)} ({entry.percentage}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingChart;
