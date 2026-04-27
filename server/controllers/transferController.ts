import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import { z } from 'zod';
import { TransferModel } from '../models/Transfer.js';
import { FundModel } from '../models/Fund.js';
import { BalanceHistoryModel } from '../models/BalanceHistory.js';
import { AuthRequest } from '../middleware/auth.js';

const createTransferSchema = z.object({
  from_fund_id: z.number().positive(),
  to_fund_id: z.number().positive(),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().optional()
});

export const createTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = createTransferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { from_fund_id, to_fund_id, amount, note } = parsed.data;
  const userId = req.user!.userId;

  if (from_fund_id === to_fund_id) {
    res.status(400).json({ error: 'Cannot transfer to the same fund' });
    return;
  }

  // Verify both funds belong to user
  const fromFund = FundModel.findById(from_fund_id);
  const toFund = FundModel.findById(to_fund_id);

  if (!fromFund || fromFund.user_id !== userId) {
    res.status(404).json({ error: 'Source fund not found' });
    return;
  }

  if (!toFund || toFund.user_id !== userId) {
    res.status(404).json({ error: 'Destination fund not found' });
    return;
  }

  // Check if sufficient balance
  if (fromFund.balance < amount) {
    res.status(400).json({ error: 'Insufficient balance in source fund' });
    return;
  }

  // Get balances before
  const balanceBeforeFrom = fromFund.balance;
  const balanceBeforeTo = toFund.balance;

  // Create transfer record
  const transfer = TransferModel.create(userId, from_fund_id, to_fund_id, amount, note);

  // Update fund balances
  FundModel.updateBalance(from_fund_id, userId, -amount);
  FundModel.updateBalance(to_fund_id, userId, amount);

  // Record balance history
  BalanceHistoryModel.create(
    userId, from_fund_id, 'transfer_out', amount,
    balanceBeforeFrom, balanceBeforeFrom - amount,
    transfer.id, 'transfer', `Transfer to ${toFund.name}`
  );
  BalanceHistoryModel.create(
    userId, to_fund_id, 'transfer_in', amount,
    balanceBeforeTo, balanceBeforeTo + amount,
    transfer.id, 'transfer', `Transfer from ${fromFund.name}`
  );

  res.status(201).json({
    message: 'Transfer successful',
    transfer,
    from_fund: { ...fromFund, balance: balanceBeforeFrom - amount },
    to_fund: { ...toFund, balance: balanceBeforeTo + amount }
  });
});

export const getTransfers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const transfers = TransferModel.findByUserId(userId);

  res.json({
    transfers,
    count: transfers.length
  });
});

export const deleteTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const transferId = parseInt(idParam, 10);

  if (isNaN(transferId)) {
    res.status(400).json({ error: 'Invalid transfer ID' });
    return;
  }

  const transfer = TransferModel.findById(transferId);
  if (!transfer || transfer.user_id !== userId) {
    res.status(404).json({ error: 'Transfer not found' });
    return;
  }

  // Reverse the transfer
  const fromFund = FundModel.findById(transfer.from_fund_id);
  const toFund = FundModel.findById(transfer.to_fund_id);

  if (fromFund && toFund) {
    FundModel.updateBalance(transfer.from_fund_id, userId, transfer.amount);
    FundModel.updateBalance(transfer.to_fund_id, userId, -transfer.amount);
  }

  const deleted = TransferModel.delete(transferId, userId);

  if (deleted) {
    res.json({ message: 'Transfer reversed successfully' });
  } else {
    res.status(500).json({ error: 'Failed to reverse transfer' });
  }
});
