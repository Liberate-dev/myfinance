import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { run } from '../models/db.js';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

function generateToken(userId: number, email: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId, email }, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { email, password, name } = parsed.data;

  if (UserModel.emailExists(email)) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = UserModel.create(email, hashedPassword, name);
  const token = generateToken(user.id, user.email);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.issues
    });
    return;
  }

  const { email, password } = parsed.data;

  const user = UserModel.findByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = generateToken(user.id, user.email);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new passwords are required' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const user = UserModel.findById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  UserModel.updatePassword(userId, hashedPassword);

  res.json({ message: 'Password changed successfully' });
});

export const clearUserData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  // Delete all user data from all tables
  run('DELETE FROM incomes WHERE user_id = ?', [userId]);
  run('DELETE FROM expenses WHERE user_id = ?', [userId]);
  run('DELETE FROM categories WHERE user_id = ?', [userId]);
  run('DELETE FROM funds WHERE user_id = ?', [userId]);
  run('DELETE FROM budgets WHERE user_id = ?', [userId]);

  res.json({ message: 'All user data cleared successfully' });
});
