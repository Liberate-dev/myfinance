import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthRequest } from '../middleware/auth.js';
import { SummaryModel } from '../models/Summary.js';
import { FundModel } from '../models/Fund.js';

export interface Suggestion {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  priority: number;
  action?: string;
}

const generateSuggestions = (summary: ReturnType<typeof SummaryModel.getMonthlySummary>, fundBalance: number): Suggestion[] => {
  const suggestions: Suggestion[] = [];

  if (!summary) {
    return suggestions;
  }

  const { total_income, total_expense } = summary;

  // Rule 1: If expense > income * 0.8 → "Pengeluaran 80%+ dari income. Kurangi non-esensial."
  if (total_income > 0 && total_expense > total_income * 0.8) {
    suggestions.push({
      id: 'expense-high',
      type: 'warning',
      message: `Pengeluaran ${Math.round((total_expense / total_income) * 100)}%+ dari income. Kurangi non-esensial.`,
      priority: 1,
      action: 'Reduce Expenses'
    });
  }

  // Rule 5: If no income and just expense directly to fund → "Tidak ada income bulan ini."
  // This is info if fund balance is still positive (user spending from savings)
  if (total_income === 0 && total_expense > 0 && fundBalance >= 0) {
    suggestions.push({
      id: 'no-income',
      type: 'info',
      message: 'Tidak ada income bulan ini. Sedang gunakan dana yang ada.',
      priority: 3,
      action: 'Add Income'
    });
  }

  // Rule 2: If no income at all and spending → "Tidak ada income. Tambah income atau kurangi expense."
  if (total_income === 0 && total_expense > 0) {
    suggestions.push({
      id: 'no-income-warning',
      type: 'warning',
      message: 'Tidak ada income bulan ini. Prioritas tambah income atau kurangi spending.',
      priority: 2,
      action: 'Add Income'
    });
  }

  // Rule 4: If fund balance is negative → "Balance negatif. Prioritas bayar hutang."
  if (fundBalance < 0) {
    suggestions.push({
      id: 'negative-balance',
      type: 'warning',
      message: 'Balance negatif. Prioritas bayar hutang.',
      priority: 1,
      action: 'Pay Debt'
    });
  }

  // Rule 3: If transport > 15% of income → "Transport 15%+. Consider remote work atau carpool."
  // This requires category breakdown - we check this separately
  if (total_income > 0) {
    const categories = SummaryModel.getTopCategories(summary.user_id, summary.month, summary.year, 10);
    const transportCategory = categories.find(c => c.category.toLowerCase() === 'transport');

    if (transportCategory && transportCategory.percentage > 15) {
      suggestions.push({
        id: 'transport-high',
        type: 'info',
        message: `Transport ${Math.round(transportCategory.percentage)}%+. Consider remote work atau carpool.`,
        priority: 4,
        action: 'Save on Transport'
      });
    }

    // Rule: If food expense > 30% of total expense → "Pengeluaran makan 30%+. Kurangi makan luar."
    const foodCategory = categories.find(c => c.category.toLowerCase() === 'food');

    if (foodCategory && foodCategory.percentage > 30) {
      suggestions.push({
        id: 'food-high',
        type: 'warning',
        message: `Pengeluaran makan ${Math.round(foodCategory.percentage)}%+. Kurangi makan luar.`,
        priority: 2,
        action: 'Reduce Food Expenses'
      });
    }

    // Rule 6: If bills > 40% of income → "Bills 40%+. Review langganan, negotiate rates."
    const billsCategory = categories.find(c => c.category.toLowerCase() === 'bills');

    if (billsCategory && (billsCategory.total / total_income) > 0.4) {
      suggestions.push({
        id: 'bills-high',
        type: 'warning',
        message: `Bills ${Math.round((billsCategory.total / total_income) * 100)}%+. Review langganan, negotiate rates.`,
        priority: 2,
        action: 'Review Bills'
      });
    }
  }

  // Success message if no warnings and healthy fund balance
  const incomeExpenseBalance = total_income - total_expense;
  if (suggestions.length === 0 && fundBalance >= total_income * 0.1 && total_expense <= total_income * 0.8) {
    suggestions.push({
      id: 'good-status',
      type: 'success',
      message: 'Keuangan kamu baik! Pertahankan kebiasaan ini.',
      priority: 5
    });
  }

  // Sort by priority (lower number = higher priority)
  return suggestions.sort((a, b) => a.priority - b.priority);
};

// Get suggestions - GET /api/suggestions
export const getSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const now = new Date();
  const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
  const year = parseInt(req.query.year as string) || now.getFullYear();

  const summary = SummaryModel.getMonthlySummary(userId, month, year);
  const fundBalance = FundModel.getTotalBalance(userId);
  const suggestions = generateSuggestions(summary, fundBalance);

  res.json(suggestions);
});
