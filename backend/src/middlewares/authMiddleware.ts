import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../errors/customErrors';
import { EmployeeRepository } from '../modules/employees/repository';
import '../types'; // load Express namespace extension

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const decoded = verifyAccessToken(token);

    // Every "who did this" column in the database (allocatedBy, reportedBy,
    // bookedBy, createdBy, etc.) is a foreign key to Employee.id — NOT User.id.
    // Resolve it once, here, so every controller downstream can safely use
    // req.user.employeeId instead of the wrong req.user.userId.
    const employee = await EmployeeRepository.findByUserId(decoded.userId);

    req.user = { ...decoded, employeeId: employee?.id };
    next();
  } catch (error: any) {
    next(new UnauthorizedError(error.message || 'Authentication failed'));
  }
}

export default authMiddleware;