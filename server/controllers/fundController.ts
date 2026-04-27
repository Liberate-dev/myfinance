import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { FundModel } from '../models/Fund.js';
import { BalanceHistoryModel } from '../models/BalanceHistory.js';
import { AuthRequest } from '../middleware/auth.js';

const createFundSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  type: z.enum(['cash', 'bank', 'e-wallet']),
  balance: z.number().min(0, 'Balance must be non-negative').default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#3B82F6'),
  icon: z.string().default('💰')
});

const updateFundSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').optional(),
  type: z.enum(['cash', 'bank', 'e-wallet']).optional(),
  balance: z.number().min(0, 'Balance must be non-negative').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  icon: z.string().optional()
});

export const createFund = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = createFundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { name, type, balance, color, icon } = parsed.data;
  const userId = req.user!.userId;

  const fund = FundModel.create(userId, name, type, balance, color, icon);

  // Record initial balance history
  if (balance > 0) {
    BalanceHistoryModel.create(
      userId, fund.id, 'initial', balance,
      0, balance,
      fund.id, 'fund', `Initial balance for ${name}`
    );
  }

  res.status(201).json({
    message: 'Fund created successfully',
    fund
  });
});

export const getFunds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const funds = FundModel.findByUserId(userId);
  const totalBalance = FundModel.getTotalBalance(userId);

  res.json({
    funds,
    totalBalance,
    count: funds.length
  });
});

export const getFundById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const fundId = parseInt(idParam, 10);

  if (isNaN(fundId)) {
    res.status(400).json({ error: 'Invalid fund ID' });
    return;
  }

  const fund = FundModel.findById(fundId);

  if (!fund) {
    res.status(404).json({ error: 'Fund not found' });
    return;
  }

  if (fund.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  res.json({ fund });
});

export const updateFund = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const fundId = parseInt(idParam, 10);

  if (isNaN(fundId)) {
    res.status(400).json({ error: 'Invalid fund ID' });
    return;
  }

  const existingFund = FundModel.findById(fundId);
  if (!existingFund) {
    res.status(404).json({ error: 'Fund not found' });
    return;
  }

  if (existingFund.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const parsed = updateFundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { name, type, balance, color, icon } = parsed.data;
  const updatedFund = FundModel.update(
    fundId,
    userId,
    name ?? existingFund.name,
    type ?? existingFund.type,
    balance ?? existingFund.balance,
    color ?? existingFund.color,
    icon ?? existingFund.icon
  );

  // Record adjustment if balance changed
  if (balance !== undefined && balance !== existingFund.balance) {
    const diff = balance - existingFund.balance;
    BalanceHistoryModel.create(
      userId, fundId, 'adjustment', Math.abs(diff),
      existingFund.balance, balance,
      fundId, 'fund', `Balance adjustment for ${name}`
    );
  }

  res.json({
    message: 'Fund updated successfully',
    fund: updatedFund
  });
});

export const deleteFund = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const fundId = parseInt(idParam, 10);

  if (isNaN(fundId)) {
    res.status(400).json({ error: 'Invalid fund ID' });
    return;
  }

  const existingFund = FundModel.findById(fundId);
  if (!existingFund) {
    res.status(404).json({ error: 'Fund not found' });
    return;
  }

  if (existingFund.user_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Check if fund has balance
  if (existingFund.balance !== 0) {
    res.status(400).json({ error: 'Cannot delete fund with non-zero balance. Transfer or withdraw funds first.' });
    return;
  }

  const deleted = FundModel.delete(fundId, userId);

  if (deleted) {
    res.json({ message: 'Fund deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete fund' });
  }
});
