import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { sendSuccess } from '../../utils/responseFormatter';
import { BadRequestError } from '../../errors/customErrors';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AuthService.register({
        email: req.body.email,
        passwordHash: req.body.password, // Plain text passed to service for hashing
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        employeeCode: req.body.employeeCode,
      });

      sendSuccess(res, data, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress = req.ip || undefined;
      const userAgent = req.headers['user-agent'];

      const data = await AuthService.login(req.body.email, req.body.password, ipAddress, userAgent);

      // ✅ FIXED: Configured for cross-domain usage between Render and GitHub Pages
      res.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: true,        // Enforces HTTPS (required for sameSite: 'none')
        sameSite: 'none',    // Allows cookie sharing across different domains
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendSuccess(res, data, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new BadRequestError('Refresh token required');
      }

      await AuthService.logout(refreshToken);
      
      // ✅ FIXED: Matching cookie configuration so the browser knows which cookie to delete
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      });
      
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.requestPasswordReset(req.body.email);
      sendSuccess(res, null, 'If the email exists, a password reset link has been sent');
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resetPassword(req.body.token, req.body.password);
      sendSuccess(res, null, 'Password has been reset successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async promote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user?.userId;
      if (!adminUserId) {
        throw new BadRequestError('Admin identity missing');
      }

      const userRole = await AuthService.promoteUser(req.body.userId, req.body.roleName, adminUserId);
      sendSuccess(res, userRole, `User role promoted to ${req.body.roleName} successfully`);
    } catch (error) {
      next(error);
    }
  }
}
export default AuthController;
