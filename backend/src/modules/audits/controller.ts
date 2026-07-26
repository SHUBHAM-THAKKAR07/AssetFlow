import { Request, Response, NextFunction } from 'express';
import { AuditService } from './service';
import { sendSuccess } from '../../utils/responseFormatter';
import { BadRequestError } from '../../errors/customErrors';

export class AuditController {
  // --- Cycles ---

  public static async createCycle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorEmployeeId = req.user?.employeeId;
      if (!creatorEmployeeId) {
        throw new BadRequestError('User context missing');
      }

      const cycle = await AuditService.createCycle(req.body, creatorEmployeeId);
      sendSuccess(res, cycle, 'Audit cycle created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getCycleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cycle = await AuditService.getCycleById(req.params.id as string);
      sendSuccess(res, cycle);
    } catch (error) {
      next(error);
    }
  }

  public static async getAllCycles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cycles = await AuditService.getAllCycles();
      sendSuccess(res, cycles);
    } catch (error) {
      next(error);
    }
  }

  public static async lockCycle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cycle = await AuditService.lockCycle(req.params.id as string);
      sendSuccess(res, cycle, 'Audit cycle has been locked and closed successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Assignments & Items ---

  public static async assignAuditor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assignment = await AuditService.assignAuditor(req.body);
      sendSuccess(res, assignment, 'Auditor assigned and department inventory auto-populated', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAssignmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assignment = await AuditService.getAssignmentById(req.params.id as string);
      sendSuccess(res, assignment);
    } catch (error) {
      next(error);
    }
  }

  public static async verifyItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auditorEmployeeId = req.user?.employeeId;
      if (!auditorEmployeeId) {
        throw new BadRequestError('User context missing');
      }

      const item = await AuditService.verifyItem(req.params.itemId as string, req.body, auditorEmployeeId);
      sendSuccess(res, item, 'Audit item verification recorded successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Discrepancies ---

  public static async resolveDiscrepancy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resolverEmployeeId = req.user?.employeeId;
      if (!resolverEmployeeId) {
        throw new BadRequestError('User context missing');
      }

      const discrepancy = await AuditService.resolveDiscrepancy(req.params.id as string, req.body, resolverEmployeeId);
      sendSuccess(res, discrepancy, 'Audit discrepancy resolved successfully');
    } catch (error) {
      next(error);
    }
  }
}
export default AuditController;
