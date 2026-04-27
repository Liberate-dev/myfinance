import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { ReportModel } from '../models/Report.js';
import { AuthRequest } from '../middleware/auth.js';

export const getMonthlyReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const now = new Date();

  const year = parseInt(req.query.year as string) || now.getFullYear();
  const month = parseInt(req.query.month as string) || now.getMonth() + 1;

  if (month < 1 || month > 12) {
    res.status(400).json({ error: 'Invalid month' });
    return;
  }

  const report = ReportModel.getMonthlyReport(userId, year, month);

  res.json({
    report,
    period: {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  });
});

export const getYearlyReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const now = new Date();

  const year = parseInt(req.query.year as string) || now.getFullYear();

  const report = ReportModel.getYearlyReport(userId, year);

  res.json({
    report,
    period: {
      year
    }
  });
});
