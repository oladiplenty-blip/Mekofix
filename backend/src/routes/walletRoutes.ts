import { Router } from 'express';
import { getWallet, withdrawFromWallet } from '../controllers/walletController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get wallet balance and transactions (requires authentication)
router.get('/wallet', authenticate, getWallet);

// Withdraw from wallet (requires authentication)
router.post('/wallet/withdraw', authenticate, withdrawFromWallet);

export default router;

