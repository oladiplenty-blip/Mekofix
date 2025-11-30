/// <reference types="express" />
import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { CustomError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export const createServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mechanic_id, vehicle_id, category_id, problem_description, location } = req.body;
    const customer_id = req.user?.id;

    if (!customer_id) {
      throw new CustomError('Unauthorized', 401);
    }

    if (!mechanic_id || !vehicle_id || !category_id || !problem_description || !location) {
      throw new CustomError('Missing required fields', 400);
    }

    // Verify mechanic exists and is available
    const { data: mechanicProfile, error: mechanicError } = await supabaseAdmin
      .from('mechanic_profiles')
      .select('user_id, is_available, verification_status')
      .eq('user_id', mechanic_id)
      .single();

    if (mechanicError || !mechanicProfile) {
      throw new CustomError('Mechanic not found', 404);
    }

    if (mechanicProfile.verification_status !== 'approved') {
      throw new CustomError('Mechanic is not verified', 400);
    }

    if (!mechanicProfile.is_available) {
      throw new CustomError('Mechanic is not available', 400);
    }

    // Verify vehicle belongs to customer
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('customer_vehicles')
      .select('id, customer_id')
      .eq('id', vehicle_id)
      .eq('customer_id', customer_id)
      .single();

    if (vehicleError || !vehicle) {
      throw new CustomError('Vehicle not found', 404);
    }

    // Create service request
    const { data: serviceRequest, error: createError } = await supabaseAdmin
      .from('service_requests')
      .insert({
        customer_id,
        mechanic_id,
        vehicle_id,
        category_id,
        problem_description,
        customer_location_lat: location.lat,
        customer_location_lng: location.lng,
        customer_location_address: location.address || null,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      throw new CustomError('Failed to create service request', 500);
    }

    // Create notification for mechanic
    await supabaseAdmin.from('notifications').insert({
      user_id: mechanic_id,
      title: 'New Service Request',
      body: `You have a new service request from a customer`,
      type: 'service_request',
      reference_id: serviceRequest.id,
    });

    res.status(201).json({
      success: true,
      data: serviceRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const getServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    const { data: serviceRequest, error } = await supabaseAdmin
      .from('service_requests')
      .select(`
        *,
        mechanic:users!service_requests_mechanic_id_fkey (
          id,
          full_name,
          profile_picture_url,
          phone
        ),
        customer:users!service_requests_customer_id_fkey (
          id,
          full_name,
          profile_picture_url,
          phone
        ),
        vehicle:customer_vehicles (
          id,
          car_name,
          car_model,
          car_year
        ),
        category:service_categories (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error || !serviceRequest) {
      throw new CustomError('Service request not found', 404);
    }

    // Verify user has access (customer or mechanic)
    if (
      serviceRequest.customer_id !== userId &&
      serviceRequest.mechanic_id !== userId
    ) {
      throw new CustomError('Unauthorized', 403);
    }

    res.json({
      success: true,
      data: serviceRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    // Get current request
    const { data: serviceRequest, error: fetchError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !serviceRequest) {
      throw new CustomError('Service request not found', 404);
    }

    // Verify user is the customer
    if (serviceRequest.customer_id !== userId) {
      throw new CustomError('Only the customer can cancel this request', 403);
    }

    // Only allow cancellation if pending or accepted
    if (
      serviceRequest.status !== 'pending' &&
      serviceRequest.status !== 'accepted'
    ) {
      throw new CustomError(
        'Cannot cancel request in current status',
        400
      );
    }

    // Update status
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('service_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new CustomError('Failed to cancel service request', 500);
    }

    // Create notification for mechanic
    await supabaseAdmin.from('notifications').insert({
      user_id: serviceRequest.mechanic_id,
      title: 'Service Request Cancelled',
      body: 'A service request has been cancelled by the customer',
      type: 'service_request',
      reference_id: serviceRequest.id,
    });

    res.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const completeServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { material_cost, labor_cost, rating, review } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    if (!material_cost || !labor_cost || !rating) {
      throw new CustomError('Missing required fields', 400);
    }

    const materialCost = parseFloat(material_cost);
    const laborCost = parseFloat(labor_cost);
    const customerRating = parseInt(rating);

    if (isNaN(materialCost) || isNaN(laborCost) || isNaN(customerRating)) {
      throw new CustomError('Invalid cost or rating values', 400);
    }

    if (customerRating < 1 || customerRating > 5) {
      throw new CustomError('Rating must be between 1 and 5', 400);
    }

    // Get current request
    const { data: serviceRequest, error: fetchError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !serviceRequest) {
      throw new CustomError('Service request not found', 404);
    }

    // Verify user is the customer
    if (serviceRequest.customer_id !== userId) {
      throw new CustomError('Only the customer can complete this request', 403);
    }

    // Only allow completion if in_progress
    if (serviceRequest.status !== 'in_progress') {
      throw new CustomError('Service request is not in progress', 400);
    }

    const totalCost = materialCost + laborCost;
    const commission = laborCost * 0.15; // 15% commission on labor
    const mechanicEarnings = laborCost - commission;

    // Update service request
    const updateData: any = {
      material_cost: materialCost,
      labor_cost: laborCost,
      total_cost: totalCost,
      customer_rating: customerRating,
      customer_review: review || null,
      customer_confirmed: true,
    };

    // If mechanic also confirmed, mark as completed
    if (serviceRequest.mechanic_confirmed) {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('service_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new CustomError('Failed to complete service request', 500);
    }

    // Process commission deduction and wallet update when job is completed
    if (updateData.status === 'completed') {
      // Check if commission has already been processed (prevent double processing)
      const { data: existingTransaction } = await supabaseAdmin
        .from('wallet_transactions')
        .select('id')
        .eq('reference_id', id)
        .eq('reference_type', 'service_request')
        .eq('transaction_type', 'commission_deduction')
        .single();

      if (!existingTransaction) {
        const { data: mechanicProfile, error: mechanicError } = await supabaseAdmin
          .from('mechanic_profiles')
          .select('wallet_balance, user_id')
          .eq('user_id', serviceRequest.mechanic_id)
          .single();

        if (!mechanicError && mechanicProfile) {
          // Add earnings (labor_cost - commission) to wallet
          const currentBalance = mechanicProfile.wallet_balance || 0;
          const newBalance = currentBalance + mechanicEarnings;

          await supabaseAdmin
            .from('mechanic_profiles')
            .update({ wallet_balance: newBalance })
            .eq('user_id', serviceRequest.mechanic_id);

          // Create wallet transaction for commission deduction
          await supabaseAdmin.from('wallet_transactions').insert({
            user_id: serviceRequest.mechanic_id,
            amount: -commission, // Negative amount for deduction
            transaction_type: 'commission_deduction',
            description: `Commission deduction (15%) for service request ${id}`,
            reference_id: id,
            reference_type: 'service_request',
          });
        }
      }
    }

    // Update mechanic's average rating
    const { data: allRatings, error: ratingsError } = await supabaseAdmin
      .from('service_requests')
      .select('customer_rating')
      .eq('mechanic_id', serviceRequest.mechanic_id)
      .not('customer_rating', 'is', null);

    if (!ratingsError && allRatings && allRatings.length > 0) {
      const totalRating = allRatings.reduce(
        (sum, r) => sum + (r.customer_rating || 0),
        0
      );
      const averageRating = totalRating / allRatings.length;

      await supabaseAdmin
        .from('mechanic_profiles')
        .update({ rating: Math.round(averageRating * 10) / 10 })
        .eq('user_id', serviceRequest.mechanic_id);
    }

    res.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerServiceRequests = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    const { data: serviceRequests, error } = await supabaseAdmin
      .from('service_requests')
      .select(`
        *,
        mechanic:users!service_requests_mechanic_id_fkey (
          id,
          full_name,
          profile_picture_url
        ),
        vehicle:customer_vehicles (
          id,
          car_name,
          car_model,
          car_year
        ),
        category:service_categories (
          id,
          name
        )
      `)
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new CustomError('Failed to fetch service requests', 500);
    }

    res.json({
      success: true,
      data: serviceRequests || [],
    });
  } catch (error) {
    next(error);
  }
};

