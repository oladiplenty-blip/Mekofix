/// <reference types="express" />
import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { CustomError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export const getWallet = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    // Get wallet balance from mechanic profile
    const { data: mechanicProfile, error: profileError } = await supabaseAdmin
      .from('mechanic_profiles')
      .select('wallet_balance, user_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !mechanicProfile) {
      throw new CustomError('Mechanic profile not found', 404);
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionsError) {
      throw new CustomError('Failed to fetch transactions', 500);
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error counting transactions:', countError);
    }

    res.json({
      success: true,
      data: {
        balance: mechanicProfile.wallet_balance || 0,
        recent_transactions: transactions || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawFromWallet = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { amount, bank_details } = req.body;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    if (!amount) {
      throw new CustomError('Amount is required', 400);
    }

    const withdrawalAmount = parseFloat(amount as string);

    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      throw new CustomError('Invalid amount', 400);
    }

    // Get current wallet balance
    const { data: mechanicProfile, error: profileError } = await supabaseAdmin
      .from('mechanic_profiles')
      .select('wallet_balance, user_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !mechanicProfile) {
      throw new CustomError('Mechanic profile not found', 404);
    }

    const currentBalance = mechanicProfile.wallet_balance || 0;

    // Check sufficient balance
    if (currentBalance < withdrawalAmount) {
      throw new CustomError('Insufficient balance', 400);
    }

    // Deduct from wallet balance
    const newBalance = currentBalance - withdrawalAmount;

    const { error: updateError } = await supabaseAdmin
      .from('mechanic_profiles')
      .update({ wallet_balance: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      throw new CustomError('Failed to update wallet balance', 500);
    }

    // Create pending withdrawal transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount: -withdrawalAmount, // Negative for withdrawal
        transaction_type: 'withdrawal',
        description: 'Withdrawal request',
        status: 'pending',
        bank_details: bank_details || null,
      })
      .select()
      .single();

    if (transactionError) {
      // Rollback balance update if transaction creation fails
      await supabaseAdmin
        .from('mechanic_profiles')
        .update({ wallet_balance: currentBalance })
        .eq('user_id', userId);

      throw new CustomError('Failed to create withdrawal transaction', 500);
    }

    res.json({
      success: true,
      data: {
        balance: newBalance,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

