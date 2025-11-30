import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { CustomError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export const getCustomerVehicles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    const { data: vehicles, error } = await supabaseAdmin
      .from('customer_vehicles')
      .select('*')
      .eq('customer_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new CustomError('Failed to fetch vehicles', 500);
    }

    res.json({
      success: true,
      data: vehicles || [],
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomerProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    const { full_name, email, phone, gender } = req.body;

    if (!full_name || !email || !phone || !gender) {
      throw new CustomError('Missing required fields: full_name, email, phone, gender', 400);
    }

    // Normalize inputs
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedFullName = full_name.trim();
    const trimmedGender = gender.trim();

    // Check if email or phone is already taken by another user
    const { data: existingUserByEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .neq('id', userId)
      .maybeSingle();

    const { data: existingUserByPhone } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', trimmedPhone)
      .neq('id', userId)
      .maybeSingle();

    if (existingUserByEmail) {
      throw new CustomError('Email is already taken by another user', 409);
    }

    if (existingUserByPhone) {
      throw new CustomError('Phone number is already taken by another user', 409);
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        full_name: trimmedFullName,
        email: trimmedEmail,
        phone: trimmedPhone,
        gender: trimmedGender,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, email, phone, full_name, user_type, profile_picture_url, is_verified, is_active, gender')
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw new CustomError('Failed to update profile', 500);
    }

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

