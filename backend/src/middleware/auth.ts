import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { CustomError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    user_type: string;
    email?: string;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, env.jwt.secret) as {
        id: string;
        user_type: string;
        email?: string;
      };

      req.user = {
        id: decoded.id,
        user_type: decoded.user_type,
        email: decoded.email,
      };

      next();
    } catch (error) {
      throw new CustomError('Invalid or expired token', 401);
    }
  } catch (error) {
    next(error);
  }
};

