import { Router } from 'express';
import {
  registerMechanic,
  login,
  registerCustomer,
  verifyOTP,
  resendOTP,
  forgotPassword,
} from '../controllers/authController';

const router = Router();

// Customer registration
router.post('/register/customer', registerCustomer);

// Mechanic registration
router.post('/register/mechanic', registerMechanic);

// Login
router.post('/login', login);

// OTP verification
router.post('/verify-otp', verifyOTP);

// Resend OTP
router.post('/resend-otp', resendOTP);

// Forgot password
router.post('/forgot-password', forgotPassword);

export default router;

