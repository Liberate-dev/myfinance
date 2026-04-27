import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { IncomeModel } from '../models/Income.js';
import { ExpenseModel } from '../models/Expense.js';

interface Transaction {
  date: string;
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

const generateCSV = (transactions: Transaction[]): string => {
  const headers = ['Date', 'Category', 'Description', 'Amount', 'Type'];
  const rows = transactions.map(t => [
    t.date,
    t.category,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.amount.toString(),
    t.type
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

export const exportCSV = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const type = req.query.type as string || 'all';
  const month = req.query.month as string;

  let transactions: Transaction[] = [];

  if (month) {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const endDate = `${year}-${monthNum}-${lastDay.toString().padStart(2, '0')}`;

    if (type === 'income' || type === 'all') {
      const incomes = IncomeModel.findByUserIdAndDateRange(userId, startDate, endDate);
      transactions.push(...incomes.map(i => ({
        date: i.date,
        category: i.source,
        description: i.description,
        amount: i.amount,
        type: 'income' as const
      })));
    }

    if (type === 'expense' || type === 'all') {
      const expenses = ExpenseModel.findByUserIdAndDateRange(userId, startDate, endDate);
      transactions.push(...expenses.map(e => ({
        date: e.date,
        category: e.category,
        description: e.description,
        amount: e.amount,
        type: 'expense' as const
      })));
    }
  } else {
    if (type === 'income' || type === 'all') {
      const incomes = IncomeModel.findByUserId(userId);
      transactions.push(...incomes.map(i => ({
        date: i.date,
        category: i.source,
        description: i.description,
        amount: i.amount,
        type: 'income' as const
      })));
    }

    if (type === 'expense' || type === 'all') {
      const expenses = ExpenseModel.findByUserId(userId);
      transactions.push(...expenses.map(e => ({
        date: e.date,
        category: e.category,
        description: e.description,
        amount: e.amount,
        type: 'expense' as const
      })));
    }
  }

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const csv = generateCSV(transactions);
  const filename = `transactions_${type}_${month || 'all'}_${Date.now()}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

export const exportAllData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const incomes = IncomeModel.findByUserId(userId);
  const expenses = ExpenseModel.findByUserId(userId);

  const allTransactions: Transaction[] = [
    ...incomes.map(i => ({
      date: i.date,
      category: i.source,
      description: i.description,
      amount: i.amount,
      type: 'income' as const
    })),
    ...expenses.map(e => ({
      date: e.date,
      category: e.category,
      description: e.description,
      amount: e.amount,
      type: 'expense' as const
    }))
  ];

  allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const csv = generateCSV(allTransactions);
  const filename = `all_data_${Date.now()}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});