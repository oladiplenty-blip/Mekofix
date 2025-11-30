/// <reference types="express" />
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { CustomError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const getNearbyMechanics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lat, lng, radius = 10, specialization } = req.query;

    if (!lat || !lng) {
      throw new CustomError('Latitude and longitude are required', 400);
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string) || 10;

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      throw new CustomError('Invalid coordinates or radius', 400);
    }

    // Get all verified mechanics
    const { data: mechanics, error: mechanicsError } = await supabaseAdmin
      .from('mechanic_profiles')
      .select(`
        id,
        user_id,
        rating,
        total_jobs,
        is_available,
        profile_photo_url,
        users!inner (
          id,
          full_name,
          profile_picture_url,
          location_lat,
          location_lng
        )
      `)
      .eq('verification_status', 'approved')
      .eq('is_available', true);

    if (mechanicsError) {
      throw new CustomError('Failed to fetch mechanics', 500);
    }

    if (!mechanics || mechanics.length === 0) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    // Get specializations for each mechanic
    const mechanicIds = mechanics.map((m) => m.id);
    const { data: specializations, error: specError } = await supabaseAdmin
      .from('mechanic_specializations')
      .select('mechanic_id, specialization')
      .in('mechanic_id', mechanicIds);

    if (specError) {
      console.error('Error fetching specializations:', specError);
    }

    // Create a map of mechanic_id -> specializations
    const specMap = new Map<string, string[]>();
    specializations?.forEach((spec) => {
      const existing = specMap.get(spec.mechanic_id) || [];
      specMap.set(spec.mechanic_id, [...existing, spec.specialization]);
    });

    // Filter by distance and specialization, calculate distances
    const mechanicsWithDistance = mechanics
      .map((mechanic) => {
        const user = mechanic.users as any;
        if (!user?.location_lat || !user?.location_lng) {
          return null;
        }

        const distance = calculateDistance(
          latitude,
          longitude,
          user.location_lat,
          user.location_lng
        );

        const mechanicSpecs = specMap.get(mechanic.id) || [];

        // Filter by specialization if provided
        if (specialization) {
          const searchSpec = (specialization as string).toLowerCase();
          const hasSpecialization = mechanicSpecs.some(
            (s) => s.toLowerCase() === searchSpec
          );
          if (!hasSpecialization) {
            return null;
          }
        }

        // Filter by radius
        if (distance > radiusKm) {
          return null;
        }

        return {
          id: mechanic.id,
          name: user.full_name,
          profile_photo: mechanic.profile_photo_url || user.profile_picture_url || null,
          rating: mechanic.rating || 0,
          total_jobs: mechanic.total_jobs || 0,
          specializations: mechanicSpecs,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          is_available: mechanic.is_available,
          latitude: user.location_lat,
          longitude: user.location_lng,
        };
      })
      .filter((m) => m !== null)
      .sort((a, b) => (a?.distance || 0) - (b?.distance || 0)); // Sort by distance

    res.json({
      success: true,
      data: mechanicsWithDistance,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('service_categories')
      .select('id, name, description, icon_url')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new CustomError('Failed to fetch categories', 500);
    }

    res.json({
      success: true,
      data: categories || [],
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    // Get current availability status
    const { data: mechanicProfile, error: fetchError } = await supabaseAdmin
      .from('mechanic_profiles')
      .select('is_available, user_id')
      .eq('user_id', userId)
      .single();

    if (fetchError || !mechanicProfile) {
      throw new CustomError('Mechanic profile not found', 404);
    }

    // Toggle availability
    const newAvailability = !mechanicProfile.is_available;

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('mechanic_profiles')
      .update({ is_available: newAvailability })
      .eq('user_id', userId)
      .select('is_available')
      .single();

    if (updateError) {
      throw new CustomError('Failed to update availability', 500);
    }

    res.json({
      success: true,
      data: {
        is_available: updatedProfile.is_available,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMechanicStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    // Get mechanic profile
    const { data: mechanicProfile, error: profileError } = await supabaseAdmin
      .from('mechanic_profiles')
      .select('wallet_balance, rating, total_jobs, user_id, is_available')
      .eq('user_id', userId)
      .single();

    if (profileError || !mechanicProfile) {
      throw new CustomError('Mechanic profile not found', 404);
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's completed jobs
    const { data: todayJobs, error: jobsError } = await supabaseAdmin
      .from('service_requests')
      .select('id, total_cost, labor_cost')
      .eq('mechanic_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', today.toISOString())
      .lt('completed_at', tomorrow.toISOString());

    if (jobsError) {
      console.error('Error fetching today jobs:', jobsError);
    }

    // Calculate today's earnings (from completed jobs)
    const todayEarnings = (todayJobs || []).reduce((sum, job) => {
      // Earnings = labor_cost - 10% commission
      const laborCost = job.labor_cost || 0;
      const commission = laborCost * 0.1;
      return sum + (laborCost - commission);
    }, 0);

    const todayJobsCount = (todayJobs || []).length;

    res.json({
      success: true,
      data: {
        today_earnings: Math.round(todayEarnings * 100) / 100,
        today_jobs: todayJobsCount,
        total_jobs: mechanicProfile.total_jobs || 0,
        rating: mechanicProfile.rating || 0,
        wallet_balance: mechanicProfile.wallet_balance || 0,
        is_available: mechanicProfile.is_available || false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMechanicLocation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { lat, lng } = req.body;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    if (!lat || !lng) {
      throw new CustomError('Latitude and longitude are required', 400);
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new CustomError('Invalid coordinates', 400);
    }

    // Update user location
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        location_lat: latitude,
        location_lng: longitude,
      })
      .eq('id', userId);

    if (updateError) {
      throw new CustomError('Failed to update location', 500);
    }

    res.json({
      success: true,
      data: {
        location_lat: latitude,
        location_lng: longitude,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const acceptServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    // Check mechanic is available
    const { data: mechanicProfile, error: profileError } = await supabaseAdmin
      .from('mechanic_profiles')
      .select('is_available, user_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !mechanicProfile) {
      throw new CustomError('Mechanic profile not found', 404);
    }

    if (!mechanicProfile.is_available) {
      throw new CustomError('Mechanic is not available', 400);
    }

    // Get service request
    const { data: serviceRequest, error: fetchError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !serviceRequest) {
      throw new CustomError('Service request not found', 404);
    }

    // Verify request is assigned to this mechanic
    if (serviceRequest.mechanic_id !== userId) {
      throw new CustomError('Service request not assigned to this mechanic', 403);
    }

    // Verify request is pending
    if (serviceRequest.status !== 'pending') {
      throw new CustomError('Service request is not pending', 400);
    }

    // Update status to accepted
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('service_requests')
      .update({ status: 'accepted' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new CustomError('Failed to accept service request', 500);
    }

    // Send notification to customer
    await supabaseAdmin.from('notifications').insert({
      user_id: serviceRequest.customer_id,
      title: 'Service Request Accepted',
      body: 'A mechanic has accepted your service request',
      type: 'service_request',
      reference_id: id,
    });

    res.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const declineServiceRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    // Get service request
    const { data: serviceRequest, error: fetchError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !serviceRequest) {
      throw new CustomError('Service request not found', 404);
    }

    // Verify request is assigned to this mechanic
    if (serviceRequest.mechanic_id !== userId) {
      throw new CustomError('Service request not assigned to this mechanic', 403);
    }

    // Verify request is pending
    if (serviceRequest.status !== 'pending') {
      throw new CustomError('Service request is not pending', 400);
    }

    // Update status to cancelled (or we could set mechanic_id to null to reassign)
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('service_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new CustomError('Failed to decline service request', 500);
    }

    res.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const markArrived = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    // Get service request
    const { data: serviceRequest, error: fetchError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !serviceRequest) {
      throw new CustomError('Service request not found', 404);
    }

    // Verify request is assigned to this mechanic
    if (serviceRequest.mechanic_id !== userId) {
      throw new CustomError('Service request not assigned to this mechanic', 403);
    }

    // Verify request is accepted
    if (serviceRequest.status !== 'accepted') {
      throw new CustomError('Service request must be accepted first', 400);
    }

    // Update status to in_progress and set arrived_at
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('service_requests')
      .update({
        status: 'in_progress',
        arrived_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new CustomError('Failed to mark as arrived', 500);
    }

    // Send notification to customer
    await supabaseAdmin.from('notifications').insert({
      user_id: serviceRequest.customer_id,
      title: 'Mechanic Arrived',
      body: 'The mechanic has arrived at your location',
      type: 'service_request',
      reference_id: id,
    });

    res.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const completeServiceRequestMechanic = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new CustomError('Unauthorized', 401);
    }

    // Get service request
    const { data: serviceRequest, error: fetchError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !serviceRequest) {
      throw new CustomError('Service request not found', 404);
    }

    // Verify request is assigned to this mechanic
    if (serviceRequest.mechanic_id !== userId) {
      throw new CustomError('Service request not assigned to this mechanic', 403);
    }

    // Verify request is in_progress
    if (serviceRequest.status !== 'in_progress') {
      throw new CustomError('Service request must be in progress', 400);
    }

    // Set mechanic_confirmed = true
    const updateData: any = {
      mechanic_confirmed: true,
    };

    // If customer already confirmed, finalize (set status to completed)
    if (serviceRequest.customer_confirmed) {
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

    // If both confirmed, process commission and send notification
    if (updateData.status === 'completed' && serviceRequest.labor_cost) {
      // Check if commission has already been processed (prevent double processing)
      const { data: existingTransaction } = await supabaseAdmin
        .from('wallet_transactions')
        .select('id')
        .eq('reference_id', id)
        .eq('reference_type', 'service_request')
        .eq('transaction_type', 'commission_deduction')
        .single();

      if (!existingTransaction) {
        const laborCost = parseFloat(serviceRequest.labor_cost as string) || 0;
        const commission = laborCost * 0.15; // 15% commission on labor
        const mechanicEarnings = laborCost - commission;

        // Get mechanic profile
        const { data: mechanicProfile, error: mechanicError } = await supabaseAdmin
          .from('mechanic_profiles')
          .select('wallet_balance, user_id')
          .eq('user_id', userId)
          .single();

        if (!mechanicError && mechanicProfile) {
          // Add earnings (labor_cost - commission) to wallet
          const currentBalance = mechanicProfile.wallet_balance || 0;
          const newBalance = currentBalance + mechanicEarnings;

          await supabaseAdmin
            .from('mechanic_profiles')
            .update({ wallet_balance: newBalance })
            .eq('user_id', userId);

          // Create wallet transaction for commission deduction
          await supabaseAdmin.from('wallet_transactions').insert({
            user_id: userId,
            amount: -commission, // Negative amount for deduction
            transaction_type: 'commission_deduction',
            description: `Commission deduction (15%) for service request ${id}`,
            reference_id: id,
            reference_type: 'service_request',
          });
        }
      }

      // Send notification to customer
      await supabaseAdmin.from('notifications').insert({
        user_id: serviceRequest.customer_id,
        title: 'Service Completed',
        body: 'Your service request has been completed',
        type: 'service_request',
        reference_id: id,
      });
    }

    res.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};
