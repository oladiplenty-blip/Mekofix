import { Router } from 'express';
import healthRouter from './health';
import mechanicRouter from './mechanicRoutes';
import serviceRequestRouter from './serviceRequestRoutes';
import authRouter from './authRoutes';
import walletRouter from './walletRoutes';
import customerRouter from './customerRoutes';

const router = Router();

// Health check route
router.use('/health', healthRouter);

// Auth routes
router.use('/auth', authRouter);

// Customer routes
router.use('/customer', customerRouter);

// Mechanic routes (includes /nearby and /categories)
router.use('/mechanics', mechanicRouter);

// Service request routes
router.use('/service-requests', serviceRequestRouter);

// Wallet routes (for mechanics)
router.use('/mechanic', walletRouter);

// Categories route (also available via /mechanics/categories)
router.use('/categories', mechanicRouter);

// TODO: Add other route modules here
// router.use('/api/customer', customerRouter);
// router.use('/api/vendor', vendorRouter);
// router.use('/api/marketplace', marketplaceRouter);
// router.use('/api/admin', adminRouter);

export default router;

