import { Router } from 'express';
import { getCustomerVehicles, updateCustomerProfile } from '../controllers/customerController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get customer vehicles (requires authentication)
router.get('/vehicles', authenticate, getCustomerVehicles);

// Update customer profile (requires authentication)
router.put('/profile', authenticate, updateCustomerProfile);

export default router;

