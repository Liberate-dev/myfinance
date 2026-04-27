import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthRequest } from '../middleware/auth.js';
import { SummaryModel } from '../models/Summary.js';
import { FundModel } from '../models/Fund.js';

// Get monthly summary - GET /api/summary
export const getMonthlySummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  // Get current month and year by default
  const now = new Date();
  const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
  const year = parseInt(req.query.year as string) || now.getFullYear();

  const summary = SummaryModel.getMonthlySummary(userId, month, year);
  const totalFundBalance = FundModel.getTotalBalance(userId);

  res.json({
    ...summary,
    fund_balance: totalFundBalance
  });
});

// Get top spending categories - GET /api/summary/categories
export const getTopCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const now = new Date();
  const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
  const year = parseInt(req.query.year as string) || now.getFullYear();
  const limit = parseInt(req.query.limit as string) || 5;

  const categories = SummaryModel.getTopCategories(userId, month, year, limit);

  res.json(categories);
});

// Get recent transactions - GET /api/summary/transactions
export const getRecentTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const limit = parseInt(req.query.limit as string) || 5;

  const transactions = SummaryModel.getRecentTransactions(userId, limit);

  res.json(transactions);
});
