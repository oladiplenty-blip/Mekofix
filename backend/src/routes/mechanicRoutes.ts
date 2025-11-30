import { Router } from 'express';
import {
  getNearbyMechanics,
  getCategories,
  toggleAvailability,
  getMechanicStats,
  updateMechanicLocation,
  acceptServiceRequest,
  declineServiceRequest,
  markArrived,
  completeServiceRequestMechanic,
} from '../controllers/mechanicController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get nearby mechanics
router.get('/nearby', getNearbyMechanics);

// Get service categories
router.get('/categories', getCategories);

// Toggle mechanic availability (requires authentication)
router.put('/availability', authenticate, toggleAvailability);

// Get mechanic stats (requires authentication)
router.get('/stats', authenticate, getMechanicStats);

// Update mechanic location (requires authentication)
router.put('/location', authenticate, updateMechanicLocation);

// Service request actions (requires authentication)
router.put('/requests/:id/accept', authenticate, acceptServiceRequest);
router.put('/requests/:id/decline', authenticate, declineServiceRequest);
router.put('/requests/:id/arrived', authenticate, markArrived);
router.put('/requests/:id/complete', authenticate, completeServiceRequestMechanic);

export default router;

