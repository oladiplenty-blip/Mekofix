import { Router } from 'express';
import {
  createServiceRequest,
  getServiceRequest,
  cancelServiceRequest,
  completeServiceRequest,
  getCustomerServiceRequests,
} from '../controllers/serviceRequestController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get customer's service requests (history)
router.get('/', getCustomerServiceRequests);

// Create service request
router.post('/', createServiceRequest);

// Get service request details
router.get('/:id', getServiceRequest);

// Cancel service request
router.put('/:id/cancel', cancelServiceRequest);

// Complete service request
router.put('/:id/complete', completeServiceRequest);

export default router;

