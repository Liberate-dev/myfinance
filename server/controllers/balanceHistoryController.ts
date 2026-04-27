import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import { BalanceHistoryModel } from '../models/BalanceHistory.js';
import { AuthRequest } from '../middleware/auth.js';

export const getBalanceHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const limit = parseInt(req.query.limit as string) || 100;
  const history = BalanceHistoryModel.findByUserId(userId, limit);

  res.json({
    history,
    count: history.length
  });
});

export const getFundBalanceHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.fundId) ? req.params.fundId[0] : req.params.fundId;
  const fundId = parseInt(idParam, 10);
  const limit = parseInt(req.query.limit as string) || 50;

  if (isNaN(fundId)) {
    res.status(400).json({ error: 'Invalid fund ID' });
    return;
  }

  const history = BalanceHistoryModel.findByFundId(fundId, limit);

  res.json({
    history,
    count: history.length
  });
});
