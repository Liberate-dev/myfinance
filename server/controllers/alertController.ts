import asyncHandler from 'express-async-handler';
import { Response } from 'express';
import { z } from 'zod';
import { AlertModel } from '../models/Alert.js';
import { FundModel } from '../models/Fund.js';
import { AuthRequest } from '../middleware/auth.js';

const createAlertSchema = z.object({
  fund_id: z.number().positive(),
  type: z.enum(['low_balance', 'budget_exceeded']),
  threshold: z.number().min(0)
});

const updateAlertSchema = z.object({
  threshold: z.number().min(0).optional(),
  is_active: z.boolean().optional()
});

export const createAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = createAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { fund_id, type, threshold } = parsed.data;
  const userId = req.user!.userId;

  // Verify fund belongs to user
  const fund = FundModel.findById(fund_id);
  if (!fund || fund.user_id !== userId) {
    res.status(404).json({ error: 'Fund not found' });
    return;
  }

  // Check if alert already exists for this fund and type
  const existingAlerts = AlertModel.findActiveByType(userId, type);
  const fundAlert = existingAlerts.find(a => a.fund_id === fund_id);
  if (fundAlert) {
    res.status(400).json({ error: 'Alert already exists for this fund and type' });
    return;
  }

  const alert = AlertModel.create(userId, fund_id, type, threshold);

  res.status(201).json({
    message: 'Alert created',
    alert
  });
});

export const getAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const alerts = AlertModel.findByUserId(userId);

  // Enrich with fund data
  const alertsWithFunds = alerts.map(alert => {
    const fund = FundModel.findById(alert.fund_id);
    return {
      ...alert,
      fund: fund ? { id: fund.id, name: fund.name, balance: fund.balance } : null
    };
  });

  res.json({
    alerts: alertsWithFunds,
    count: alerts.length
  });
});

export const updateAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const alertId = parseInt(idParam, 10);

  if (isNaN(alertId)) {
    res.status(400).json({ error: 'Invalid alert ID' });
    return;
  }

  const existing = AlertModel.findById(alertId);
  if (!existing || existing.user_id !== userId) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  const parsed = updateAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { threshold, is_active } = parsed.data;

  if (threshold !== undefined) {
    AlertModel.updateThreshold(alertId, userId, threshold);
  }
  if (is_active !== undefined) {
    AlertModel.toggleActive(alertId, userId, is_active);
  }

  const updated = AlertModel.findById(alertId);
  res.json({
    message: 'Alert updated',
    alert: updated
  });
});

export const deleteAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const alertId = parseInt(idParam, 10);

  if (isNaN(alertId)) {
    res.status(400).json({ error: 'Invalid alert ID' });
    return;
  }

  const deleted = AlertModel.delete(alertId, userId);

  if (deleted) {
    res.json({ message: 'Alert deleted' });
  } else {
    res.status(404).json({ error: 'Alert not found' });
  }
});

// Check for triggered alerts
export const checkAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const triggeredAlerts = AlertModel.checkLowBalanceAlerts(userId);

  // Enrich with fund data
  const alertsWithFunds = triggeredAlerts.map(alert => {
    const fund = FundModel.findById(alert.fund_id);
    return {
      ...alert,
      fund: fund ? { id: fund.id, name: fund.name, balance: fund.balance, threshold: alert.threshold } : null
    };
  });

  res.json({
    triggered: alertsWithFunds,
    count: alertsWithFunds.length
  });
});
