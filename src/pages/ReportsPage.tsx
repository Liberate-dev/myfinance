import { type FC, useState, useEffect, useCallback } from 'react';
import { get } from '../lib/api';
import { ReportChart } from '../components/ReportChart';
import { ExportButton } from '../components/ExportButton';
import { useToast } from '../components/Toast';

interface DailyBreakdown {
  date: string;
  income: number;
  expense: number;
}

interface MonthlyReport {
  user_id: number;
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  balance: number;
  income_by_category: { category: string; total: number }[];
  expense_by_category: { category: string; total: number }[];
  top_expenses: { category: string; total: number; percentage: number }[];
  daily_breakdown: DailyBreakdown[];
}

interface MonthlySummary {
  month: number;
  income: number;
  expense: number;
  balance: number;
}

interface YearlyReport {
  user_id: number;
  year: number;
  total_income: number;
  total_expense: number;
  balance: number;
  monthly_summary: MonthlySummary[];
  expense_by_category: { category: string; total: number }[];
}

type ReportType = 'monthly' | 'yearly';

const TrendUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ReportsPage: FC = () => {
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  const currentMonth = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;

  const fetchMonthlyReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await get<{ report: MonthlyReport; period: { monthName: string } }>(
        `/reports/monthly?year=${selectedYear}&month=${selectedMonth}`
      );
      setMonthlyReport(data.report);
    } catch (err) {
      console.error('Failed to fetch monthly report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  const fetchYearlyReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await get<{ report: YearlyReport }>(`/reports/yearly?year=${selectedYear}`);
      setYearlyReport(data.report);
    } catch (err) {
      console.error('Failed to fetch yearly report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (reportType === 'monthly') {
      fetchMonthlyReport();
    } else {
      fetchYearlyReport();
    }
  }, [reportType, fetchMonthlyReport, fetchYearlyReport]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">REPORTS</h1>
          <p className="text-text-muted font-mono text-sm mt-1">Analyze financial data</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-terminal-light p-1 border border-terminal-border">
            <button
              onClick={() => setReportType('monthly')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                reportType === 'monthly' ? 'bg-finance-green/10 border border-finance-green/30 text-finance-green' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setReportType('yearly')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                reportType === 'yearly' ? 'bg-finance-green/10 border border-finance-green/30 text-finance-green' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Yearly
            </button>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input w-auto"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {reportType === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input w-auto"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index + 1}>{name}</option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-2">
            <ExportButton type="income" month={reportType === 'monthly' ? currentMonth : undefined} label="Income" onSuccess={() => success('Income exported')} onError={(msg) => error(msg)} />
            <ExportButton type="expense" month={reportType === 'monthly' ? currentMonth : undefined} label="Expenses" onSuccess={() => success('Expenses exported')} onError={(msg) => error(msg)} />
            <ExportButton type="all" month={reportType === 'monthly' ? currentMonth : undefined} label="All" onSuccess={() => success('Data exported')} onError={(msg) => error(msg)} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 w-24 mb-2" />
                <div className="h-8 w-32" />
              </div>
            ))}
          </div>
          <div className="card animate-pulse h-80" />
        </div>
      ) : reportType === 'monthly' && monthlyReport ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-finance-green/10 border border-finance-green/30">
                  <TrendUpIcon />
                </div>
                <div>
                  <p className="section-header">Total Income</p>
                  <p className="money text-xl font-bold text-finance-green">{formatCurrency(monthlyReport.total_income)}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-finance-red/10 border border-finance-red/30">
                  <TrendDownIcon />
                </div>
                <div>
                  <p className="section-header">Total Expenses</p>
                  <p className="money text-xl font-bold text-finance-red">{formatCurrency(monthlyReport.total_expense)}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className={`p-3 ${monthlyReport.balance >= 0 ? 'bg-finance-green/10 border border-finance-green/30' : 'bg-finance-red/10 border border-finance-red/30'}`}>
                  <WalletIcon />
                </div>
                <div>
                  <p className="section-header">Balance</p>
                  <p className={`money text-xl font-bold ${monthlyReport.balance >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                    {formatCurrency(monthlyReport.balance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
              {monthNames[selectedMonth - 1]} {selectedYear} - Daily Trends
            </h2>
            {monthlyReport.daily_breakdown.length > 0 ? (
              <ReportChart type="daily" data={monthlyReport.daily_breakdown} />
            ) : (
              <div className="h-80 flex items-center justify-center text-text-muted font-mono text-sm">
                NO DATA AVAILABLE FOR THIS PERIOD
              </div>
            )}
          </div>

          {/* Top Expenses & Income */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">Top Expenses</h2>
              {monthlyReport.top_expenses.length > 0 ? (
                <div className="space-y-4">
                  {monthlyReport.top_expenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-mono text-text-primary">{expense.category}</span>
                          <span className="font-mono text-text-muted">{expense.percentage}%</span>
                        </div>
                        <div className="h-2 bg-terminal-light border border-terminal-border overflow-hidden">
                          <div className="h-full bg-finance-red transition-all" style={{ width: `${expense.percentage}%` }} />
                        </div>
                      </div>
                      <span className="ml-4 text-sm font-bold money text-finance-red">
                        {formatCurrency(expense.total)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted font-mono text-sm">No expenses this month</p>
              )}
            </div>

            <div className="card">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">Income by Category</h2>
              {monthlyReport.income_by_category.length > 0 ? (
                <div className="space-y-3">
                  {monthlyReport.income_by_category.map((income, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-terminal-border last:border-0">
                      <span className="font-mono text-text-primary">{income.category}</span>
                      <span className="font-bold money text-finance-green">{formatCurrency(income.total)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted font-mono text-sm">No income this month</p>
              )}
            </div>
          </div>
        </div>
      ) : reportType === 'yearly' && yearlyReport ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-finance-green/10 border border-finance-green/30">
                  <TrendUpIcon />
                </div>
                <div>
                  <p className="section-header">Total Income</p>
                  <p className="money text-xl font-bold text-finance-green">{formatCurrency(yearlyReport.total_income)}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-finance-red/10 border border-finance-red/30">
                  <TrendDownIcon />
                </div>
                <div>
                  <p className="section-header">Total Expenses</p>
                  <p className="money text-xl font-bold text-finance-red">{formatCurrency(yearlyReport.total_expense)}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className={`p-3 ${yearlyReport.balance >= 0 ? 'bg-finance-green/10 border border-finance-green/30' : 'bg-finance-red/10 border border-finance-red/30'}`}>
                  <WalletIcon />
                </div>
                <div>
                  <p className="section-header">Balance</p>
                  <p className={`money text-xl font-bold ${yearlyReport.balance >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                    {formatCurrency(yearlyReport.balance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
              {selectedYear} - Monthly Trends
            </h2>
            {yearlyReport.monthly_summary.length > 0 ? (
              <ReportChart type="monthly" data={yearlyReport.monthly_summary} />
            ) : (
              <div className="h-80 flex items-center justify-center text-text-muted font-mono text-sm">
                NO DATA AVAILABLE FOR THIS YEAR
              </div>
            )}
          </div>

          {/* Expense by Category */}
          <div className="card">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">Expenses by Category</h2>
            {yearlyReport.expense_by_category.length > 0 ? (
              <div className="space-y-3">
                {yearlyReport.expense_by_category.map((expense, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-terminal-border last:border-0">
                    <span className="font-mono text-text-primary">{expense.category}</span>
                    <span className="font-bold money text-finance-red">{formatCurrency(expense.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted font-mono text-sm">No expenses this year</p>
            )}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 border border-terminal-border flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-text-primary mb-2 font-display">NO REPORT DATA</h3>
          <p className="text-text-muted font-mono text-sm">Record income and expenses to see reports</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;