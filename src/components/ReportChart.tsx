import { type FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyBreakdown {
  date: string;
  income: number;
  expense: number;
}

interface MonthlySummary {
  month: number;
  income: number;
  expense: number;
  balance: number;
}

interface ReportChartProps {
  type: 'daily' | 'monthly';
  data: DailyBreakdown[] | MonthlySummary[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatShortCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ReportChart: FC<ReportChartProps> = ({ type, data }) => {
  const formatXAxis = (value: string | number) => {
    if (type === 'daily') {
      const date = new Date(value);
      return date.getDate().toString();
    } else {
      return monthNames[Number(value) - 1];
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = type === 'daily' ? new Date(label).toLocaleDateString('id-ID') : `Month ${label}`;
      return (
        <div className="bg-terminal-dark border border-terminal-border p-3">
          <p className="font-mono text-sm text-text-primary font-semibold mb-2">{date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-mono text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (type === 'daily') {
    const dailyData = data as DailyBreakdown[];
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#666666"
              fontSize={12}
              fontFamily="JetBrains Mono"
            />
            <YAxis
              tickFormatter={formatShortCurrency}
              stroke="#666666"
              fontSize={12}
              fontFamily="JetBrains Mono"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#00ff88"
              strokeWidth={2}
              dot={{ fill: '#00ff88', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Expense"
              stroke="#ff4757"
              strokeWidth={2}
              dot={{ fill: '#ff4757', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const monthlyData = data as MonthlySummary[];
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
          <XAxis
            dataKey="month"
            tickFormatter={formatXAxis}
            stroke="#666666"
            fontSize={12}
            fontFamily="JetBrains Mono"
          />
          <YAxis
            tickFormatter={formatShortCurrency}
            stroke="#666666"
            fontSize={12}
            fontFamily="JetBrains Mono"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#00ff88"
            strokeWidth={2}
            dot={{ fill: '#00ff88', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="#ff4757"
            strokeWidth={2}
            dot={{ fill: '#ff4757', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Balance"
            stroke="#4dabf7"
            strokeWidth={2}
            dot={{ fill: '#4dabf7', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReportChart;