import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { CustomError } from '../middleware/errorHandler';
import { uploadFile } from '../services/storageService';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendOTPEmail } from '../services/emailService';

// Auth controller exports: registerMechanic, login, registerCustomer, verifyOTP, resendOTP, forgotPassword

interface MechanicSignupRequest extends Request {
  body: {
    // Step 1: Basic Info
    full_name: string;
    email: string;
    phone: string;
    password: string;
    gender: string;

    // Step 2: Address & Documents
    home_address: string;
    work_address: string;
    utility_bill?: {
      uri: string;
      type: string;
      name: string;
    };
    id_type: string;
    id_document?: {
      uri: string;
      type: string;
      name: string;
    };
    profile_photo?: {
      uri: string;
      type: string;
      name: string;
    };

    // Step 3: Guarantors
    guarantor1_name: string;
    guarantor1_phone: string;
    guarantor1_address: string;
    guarantor1_relationship: string;
    guarantor2_name: string;
    guarantor2_phone: string;
    guarantor2_address: string;
    guarantor2_relationship: string;

    // Step 4: Specializations
    specializations: string[];
  };
}

export const registerMechanic = async (
  req: MechanicSignupRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      full_name,
      email,
      phone,
      password,
      gender,
      home_address,
      work_address,
      utility_bill,
      id_type,
      id_document,
      profile_photo,
      guarantor1_name,
      guarantor1_phone,
      guarantor1_address,
      guarantor1_relationship,
      guarantor2_name,
      guarantor2_phone,
      guarantor2_address,
      guarantor2_relationship,
      specializations,
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !phone || !password || !gender) {
      throw new CustomError('Missing required fields: full_name, email, phone, password, gender', 400);
    }

    if (!home_address || !work_address || !id_type) {
      throw new CustomError('Missing required fields: home_address, work_address, id_type', 400);
    }

    if (!utility_bill || !id_document || !profile_photo) {
      throw new CustomError('Missing required documents: utility_bill, id_document, profile_photo', 400);
    }

    if (!guarantor1_name || !guarantor1_phone || !guarantor1_address || !guarantor1_relationship) {
      throw new CustomError('Missing required guarantor 1 information', 400);
    }

    if (!guarantor2_name || !guarantor2_phone || !guarantor2_address || !guarantor2_relationship) {
      throw new CustomError('Missing required guarantor 2 information', 400);
    }

    if (!specializations || specializations.length === 0) {
      throw new CustomError('At least one specialization is required', 400);
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .single();

    if (existingUser) {
      throw new CustomError('User with this email or phone already exists', 409);
    }

    // Upload files to Supabase Storage
    let utilityBillUrl: string | null = null;
    let idDocumentUrl: string | null = null;
    let profilePhotoUrl: string | null = null;

    try {
      // Upload utility bill
      if (utility_bill) {
        utilityBillUrl = await uploadFile({
          file: utility_bill,
          bucket: 'mechanic-documents',
          folder: 'utility-bills',
        });
      }

      // Upload ID document
      if (id_document) {
        idDocumentUrl = await uploadFile({
          file: id_document,
          bucket: 'mechanic-documents',
          folder: 'id-documents',
        });
      }

      // Upload profile photo
      if (profile_photo) {
        profilePhotoUrl = await uploadFile({
          file: profile_photo,
          bucket: 'mechanic-documents',
          folder: 'profile-photos',
        });
      }
    } catch (uploadError: any) {
      throw new CustomError(`File upload failed: ${uploadError.message}`, 500);
    }

    // Create user account
    // Note: Supabase Auth requires either email or phone, not both
    const createUserOptions: any = {
      email,
      password,
      email_confirm: false, // Will be confirmed after verification
      user_metadata: {
        full_name,
        user_type: 'mechanic',
      },
    };

    // Only add phone if provided
    if (phone) {
      createUserOptions.phone = phone;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(createUserOptions);

    if (authError) {
      console.error('Supabase Auth Error:', JSON.stringify(authError, null, 2));
      throw new CustomError(
        `Failed to create user: ${authError.message || JSON.stringify(authError) || 'Unknown error'}`,
        500
      );
    }

    if (!authData || !authData.user) {
      console.error('No user data returned from Supabase Auth');
      throw new CustomError('Failed to create user: No user data returned', 500);
    }

    const userId = authData.user.id;

    // Create user record in users table
    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      phone,
      full_name,
      user_type: 'mechanic',
      gender,
      is_verified: false,
      is_active: false, // Inactive until approved
    });

    if (userError) {
      // Rollback: delete auth user if user creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new CustomError(`Failed to create user record: ${userError.message}`, 500);
    }

    // Create mechanic profile
    const { data: mechanicProfile, error: profileError } = await supabaseAdmin
      .from('mechanic_profiles')
      .insert({
        user_id: userId,
        home_address,
        work_address,
        utility_bill_url: utilityBillUrl,
        id_type,
        id_document_url: idDocumentUrl,
        profile_photo_url: profilePhotoUrl,
        verification_status: 'pending',
        background_check_status: 'pending',
        is_available: false, // Not available until approved
      })
      .select()
      .single();

    if (profileError || !mechanicProfile) {
      // Rollback: delete user
      await supabaseAdmin.from('users').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new CustomError(`Failed to create mechanic profile: ${profileError?.message || 'Unknown error'}`, 500);
    }

    const mechanicId = mechanicProfile.id;

    // Create guarantors
    const guarantors = [
      {
        mechanic_id: mechanicId,
        guarantor_name: guarantor1_name,
        guarantor_phone: guarantor1_phone,
        guarantor_address: guarantor1_address,
        guarantor_relationship: guarantor1_relationship,
      },
      {
        mechanic_id: mechanicId,
        guarantor_name: guarantor2_name,
        guarantor_phone: guarantor2_phone,
        guarantor_address: guarantor2_address,
        guarantor_relationship: guarantor2_relationship,
      },
    ];

    const { error: guarantorsError } = await supabaseAdmin
      .from('mechanic_guarantors')
      .insert(guarantors);

    if (guarantorsError) {
      // Rollback: delete mechanic profile and user
      await supabaseAdmin.from('mechanic_profiles').delete().eq('id', mechanicId);
      await supabaseAdmin.from('users').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new CustomError(`Failed to create guarantors: ${guarantorsError.message}`, 500);
    }

    // Create specializations
    const specializationRecords = specializations.map((spec) => ({
      mechanic_id: mechanicId,
      specialization: spec,
    }));

    const { error: specializationsError } = await supabaseAdmin
      .from('mechanic_specializations')
      .insert(specializationRecords);

    if (specializationsError) {
      // Rollback: delete guarantors, mechanic profile, and user
      await supabaseAdmin.from('mechanic_guarantors').delete().eq('mechanic_id', mechanicId);
      await supabaseAdmin.from('mechanic_profiles').delete().eq('id', mechanicId);
      await supabaseAdmin.from('users').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new CustomError(`Failed to create specializations: ${specializationsError.message}`, 500);
    }

    res.status(201).json({
      success: true,
      data: {
        message: 'Mechanic registration submitted successfully. Your application is under review.',
        user_id: userId,
        mechanic_id: mechanicId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone, password } = req.body;

    if (!password || (!email && !phone)) {
      throw new CustomError('Email or phone and password are required', 400);
    }

    // Find user by email or phone
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(email ? `email.eq.${email}` : `phone.eq.${phone}`)
      .single();

    if (userError || !user) {
      throw new CustomError('Invalid credentials', 401);
    }

    // Verify password
    // Check if user has password_hash in users table (for custom auth)
    if (user.password_hash) {
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        throw new CustomError('Invalid credentials', 401);
      }
    } else {
      // If no password_hash, try to verify with Supabase Auth
      // Note: Supabase Auth stores passwords separately, so we need to check via auth.users
      // For now, we'll assume if password_hash doesn't exist, we can't verify
      // In production, you should use Supabase Auth's admin API to verify
      throw new CustomError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        user_type: user.user_type,
        email: user.email,
      },
      env.jwt.secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          user_type: user.user_type,
          profile_picture_url: user.profile_picture_url,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { full_name, email, phone, password, gender, car_name, car_model, car_year } = req.body;

    if (!full_name || !email || !phone || !password || !gender) {
      throw new CustomError('Missing required fields', 400);
    }

    // Check if user already exists (check email and phone separately)
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    
    const { data: existingUserByEmail, error: emailCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .maybeSingle();

    const { data: existingUserByPhone, error: phoneCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', trimmedPhone)
      .maybeSingle();

    if (emailCheckError || phoneCheckError) {
      console.error('Error checking existing users:', { emailCheckError, phoneCheckError });
      // Continue anyway - the unique constraint will catch duplicates
    }

    if (existingUserByEmail || existingUserByPhone) {
      throw new CustomError('User with this email or phone already exists', 409);
    }

    // Hash password using bcrypt
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);

    // Create user record directly in database (not using Supabase Auth)
    // Database will generate UUID via DEFAULT uuid_generate_v4()
    let userId: string | undefined;

    try {
      // Prepare user data (use already trimmed values)
      // Note: id is NOT included - database will generate it via DEFAULT uuid_generate_v4()
      const userData: any = {
        email: trimmedEmail,
        phone: trimmedPhone,
        password_hash,
        full_name: full_name.trim(),
        user_type: 'customer',
        gender: gender.trim(),
        is_verified: false,
        is_active: true,
      };

      console.log('=== ATTEMPTING USER INSERT ===');
      console.log('User data (password hidden):', { ...userData, password_hash: '[HIDDEN]' });
      console.log('Data types:', {
        email: typeof userData.email,
        phone: typeof userData.phone,
        password_hash: typeof userData.password_hash,
        full_name: typeof userData.full_name,
        user_type: typeof userData.user_type,
        gender: typeof userData.gender,
        is_verified: typeof userData.is_verified,
        is_active: typeof userData.is_active,
      });

      // Perform the insert
      const insertResult = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select('id')
        .single();

      // Check for errors - Supabase returns { data, error } structure
      if (insertResult.error) {
        const userError = insertResult.error;
        
        // Log the complete error object to see its structure
        console.error('=== DATABASE INSERT ERROR ===');
        console.error('Error type:', typeof userError);
        console.error('Error constructor:', userError?.constructor?.name);
        console.error('Error keys:', Object.keys(userError || {}));
        console.error('Error message:', userError?.message);
        console.error('Error details:', userError?.details);
        console.error('Error hint:', userError?.hint);
        console.error('Error code:', userError?.code);
        console.error('Full error object:', userError);
        console.error('Stringified error:', JSON.stringify(userError, Object.getOwnPropertyNames(userError)));
        console.error('Insert data attempted:', JSON.stringify(userData, null, 2));
        
        // Try to get all properties including non-enumerable ones
        const errorProps: any = {};
        for (const key in userError) {
          errorProps[key] = (userError as any)[key];
        }
        console.error('All error properties:', errorProps);
        
        // Check if it's a PostgREST error
        const pgError = userError as any;
        if (pgError?.code) {
          console.error('PostgreSQL error code:', pgError.code);
        }
        if (pgError?.error_code) {
          console.error('Error code (alt):', pgError.error_code);
        }
        if (pgError?.statusCode) {
          console.error('HTTP status code:', pgError.statusCode);
        }
        if (pgError?.status) {
          console.error('HTTP status:', pgError.status);
        }
        
        console.error('============================');
        
        // Build comprehensive error message - check all possible properties
        let errorMessage = 'Failed to create user record: ';
        
        // Try to extract meaningful error information from all possible properties
        const errorText = 
          userError?.message ||
          userError?.details ||
          userError?.hint ||
          userError?.code ||
          (typeof userError === 'string' ? userError : null);
        
        // If we have error text and it's not empty
        if (errorText && errorText.trim() !== '') {
          errorMessage += errorText;
        } else {
          // Try to stringify the whole error object
          const errorStr = JSON.stringify(userError);
          if (errorStr && errorStr !== '{}' && errorStr !== '""' && errorStr !== '{"message":""}') {
            errorMessage += errorStr;
          } else {
            // Last resort - check if it's a constraint violation or other common issues
            // Check for common PostgreSQL error codes
            const pgErrorCode = (userError as any)?.code || (userError as any)?.error_code;
            if (pgErrorCode) {
              let pgErrorMsg = '';
              switch (pgErrorCode) {
                case '23505': // unique_violation
                  pgErrorMsg = 'Duplicate entry - email or phone already exists';
                  break;
                case '23502': // not_null_violation
                  pgErrorMsg = 'Missing required field';
                  break;
                case '23503': // foreign_key_violation
                  pgErrorMsg = 'Foreign key constraint violation';
                  break;
                case '23514': // check_violation
                  pgErrorMsg = 'Check constraint violation (e.g., invalid user_type or gender value)';
                  break;
                default:
                  pgErrorMsg = `PostgreSQL error code: ${pgErrorCode}`;
              }
              errorMessage += pgErrorMsg;
            } else {
              // Check if error has any other properties we can use
              const errorObj = userError as any;
              const allProps = Object.getOwnPropertyNames(errorObj);
              if (allProps.length > 0) {
                errorMessage += `Database error. Properties: ${allProps.join(', ')}. Check server console for full details.`;
              } else {
                errorMessage += 'Database error occurred. Possible causes: missing required fields, constraint violation (duplicate email/phone), data type mismatch, or RLS policy blocking insert. Check server console for details.';
              }
            }
          }
        }
        
        throw new CustomError(errorMessage, 500);
      }

      const newUser = insertResult.data;

      if (!newUser || !newUser.id) {
        console.error('=== NO USER DATA RETURNED ===');
        console.error('Response data:', newUser);
        console.error('Response error:', insertResult.error);
        console.error('Full response:', JSON.stringify(insertResult, null, 2));
        console.error('============================');
        throw new CustomError('Failed to create user record: No user data returned from database. This might indicate a database constraint violation, RLS policy issue, or the insert succeeded but no data was returned. Check server console for details.', 500);
      }

      userId = newUser.id;
      console.log('✅ User created successfully with ID:', userId);

      // Create customer profile
      const { error: profileError } = await supabaseAdmin
        .from('customer_profiles')
        .insert({
          user_id: userId,
        });

      if (profileError) {
        console.error('Customer Profile Error:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
          fullError: JSON.stringify(profileError, null, 2),
        });
        throw new CustomError(
          `Failed to create customer profile: ${profileError.message || profileError.details || profileError.hint || 'Unknown error'}`,
          500
        );
      }

      console.log('Customer profile created successfully');

      // Create vehicle if provided
      if (car_name) {
        const { error: vehicleError } = await supabaseAdmin.from('customer_vehicles').insert({
          customer_id: userId,
          car_name: car_name.trim(),
          car_model: car_model ? car_model.trim() : null,
          car_year: car_year || null,
          is_primary: true,
        });

        if (vehicleError) {
          console.error('Vehicle creation error (non-fatal):', vehicleError);
          // Don't throw - vehicle is optional
        } else {
          console.log('Vehicle created successfully');
        }
      }

      // Generate OTP for verification
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

      const { error: otpError } = await supabaseAdmin.from('verification_codes').insert({
        user_id: userId,
        code,
        type: 'signup',
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

      if (otpError) {
        console.error('OTP creation error (non-fatal):', otpError);
        // Don't throw - OTP can be resent later
      } else {
        console.log('OTP created successfully');
        
        // Send OTP via email
        try {
          await sendOTPEmail(trimmedEmail, code, 'signup');
        } catch (emailError) {
          console.error('Failed to send OTP email (non-fatal):', emailError);
          // Don't throw - OTP is still valid and can be resent
        }
      }

      res.status(201).json({
        success: true,
        data: {
          message: 'Customer registration successful. Please verify your email/phone.',
          user_id: userId,
        },
      });
    } catch (dbError: any) {
      // If we have a userId, clean up
      if (userId) {
        try {
          await supabaseAdmin.from('users').delete().eq('id', userId);
        } catch (cleanupError) {
          console.error('Error cleaning up user:', cleanupError);
        }
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone, code } = req.body;

    if (!code || (!email && !phone)) {
      throw new CustomError('Code and email or phone are required', 400);
    }

    // Normalize inputs
    const trimmedCode = code.toString().trim();
    const trimmedEmail = email ? email.trim().toLowerCase() : null;
    const trimmedPhone = phone ? phone.trim() : null;

    console.log('=== OTP VERIFICATION ATTEMPT ===');
    console.log('Email:', trimmedEmail);
    console.log('Phone:', trimmedPhone);
    console.log('Code:', trimmedCode);
    console.log('Code type:', typeof trimmedCode, 'Length:', trimmedCode.length);

    // Find user
    const userQuery = trimmedEmail 
      ? supabaseAdmin.from('users').select('id, email, phone').eq('email', trimmedEmail)
      : supabaseAdmin.from('users').select('id, email, phone').eq('phone', trimmedPhone);
    
    const { data: user, error: userError } = await userQuery.single();

    if (userError || !user) {
      console.error('User lookup error:', userError);
      throw new CustomError('User not found', 404);
    }

    console.log('User found:', user.id);

    // Find verification code - check all codes for this user first (for debugging)
    const { data: allCodes } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'signup')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('All verification codes for user:', allCodes?.length || 0);
    if (allCodes && allCodes.length > 0) {
      console.log('Recent codes:', allCodes.map(c => ({
        code: c.code,
        is_used: c.is_used,
        expires_at: c.expires_at,
        created_at: c.created_at,
        now: new Date().toISOString(),
        is_expired: new Date(c.expires_at) < new Date(),
      })));
    }

    // Find verification code - exact match
    const { data: verificationCode, error: codeError } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', trimmedCode)
      .eq('is_used', false)
      .eq('type', 'signup')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (codeError) {
      console.error('Verification code query error:', codeError);
      console.error('Error details:', JSON.stringify(codeError, null, 2));
    }

    if (!verificationCode) {
      // Try without expiration check to see if code exists but is expired
      const { data: expiredCode } = await supabaseAdmin
        .from('verification_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('code', trimmedCode)
        .eq('type', 'signup')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (expiredCode) {
        const isExpired = new Date(expiredCode.expires_at) < new Date();
        const isUsed = expiredCode.is_used;
        console.error('Code found but:', { isExpired, isUsed, expires_at: expiredCode.expires_at });
        throw new CustomError(
          isExpired 
            ? 'Verification code has expired. Please request a new code.'
            : isUsed
            ? 'Verification code has already been used. Please request a new code.'
            : 'Invalid verification code',
          400
        );
      }
      
      console.error('No matching verification code found');
      throw new CustomError('Invalid or expired verification code', 400);
    }

    console.log('Verification code found and valid:', verificationCode.id);

    // Mark code as used
    await supabaseAdmin
      .from('verification_codes')
      .update({ is_used: true })
      .eq('id', verificationCode.id);

    // Get full user data
    const { data: fullUser, error: fullUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fullUserError || !fullUser) {
      throw new CustomError('User not found', 404);
    }

    // Update user as verified
    await supabaseAdmin
      .from('users')
      .update({ is_verified: true, is_active: true })
      .eq('id', user.id);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: fullUser.id,
        user_type: fullUser.user_type,
        email: fullUser.email,
      },
      env.jwt.secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: fullUser.id,
          email: fullUser.email || '',
          phone: fullUser.phone || '',
          full_name: fullUser.full_name || '',
          user_type: fullUser.user_type,
          profile_picture_url: fullUser.profile_picture_url || null,
          is_verified: fullUser.is_verified || true, // Should be true after verification
          is_active: fullUser.is_active !== undefined ? fullUser.is_active : true,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      throw new CustomError('Email or phone is required', 400);
    }

    // Find user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, phone')
      .or(email ? `email.eq.${email}` : `phone.eq.${phone}`)
      .single();

    if (userError || !user) {
      throw new CustomError('User not found', 404);
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Save verification code
    await supabaseAdmin.from('verification_codes').insert({
      user_id: user.id,
      code,
      type: 'signup',
      expires_at: expiresAt.toISOString(),
      is_used: false,
    });

    // Send OTP via email
    try {
      if (user.email) {
        await sendOTPEmail(user.email, code, 'signup');
      } else {
        console.log(`OTP for user ${user.id}: ${code}`); // Fallback if no email
      }
    } catch (emailError) {
      console.error('Failed to send OTP email (non-fatal):', emailError);
      console.log(`OTP for user ${user.id}: ${code}`); // Fallback logging
    }

    res.json({
      success: true,
      message: 'Verification code sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new CustomError('Email is required', 400);
    }

    // Find user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Don't reveal if user exists for security
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
      });
      return;
    }

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Save verification code
    await supabaseAdmin.from('verification_codes').insert({
      user_id: user.id,
      code: resetCode,
      type: 'password_reset',
      expires_at: expiresAt.toISOString(),
      is_used: false,
    });

    // Send reset code via Email
    try {
      await sendOTPEmail(user.email, resetCode, 'password_reset');
    } catch (emailError) {
      console.error('Failed to send password reset email (non-fatal):', emailError);
      console.log(`Password reset code for user ${user.id}: ${resetCode}`); // Fallback logging
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

