import { Request, Response, NextFunction } from 'express';
import { AllocationService } from './service';
import { sendSuccess } from '../../utils/responseFormatter';
import { getPaginationOptions } from '../../utils/pagination';
import { AllocationStatus } from '@prisma/client';
import { BadRequestError } from '../../errors/customErrors';
import { ROLES } from '../../constants/appConstants';

export class AllocationController {
  public static async allocate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allocatorUserId = req.user?.userId;
      if (!allocatorUserId) {
        throw new BadRequestError('User context missing');
      }

      const allocation = await AllocationService.allocateAsset(req.body, allocatorUserId);
      sendSuccess(res, allocation, 'Asset allocated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = getPaginationOptions(req.query.page, req.query.limit);
      const status = req.query.status as AllocationStatus | undefined;

      // A plain Employee can only ever see their own records — ignore any
      // employeeId they pass in and force it to themselves. Managers/Admins
      // keep the ability to filter by any employeeId (or see everyone).
      const isPrivileged = req.user?.roles?.some((r) => r !== ROLES.EMPLOYEE);
      const employeeId = isPrivileged
        ? (req.query.employeeId as string | undefined)
        : req.user?.userId;

      const allocations = await AllocationService.getAllAllocations(pagination, employeeId, status);
      sendSuccess(res, allocations);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allocation = await AllocationService.getAllocationById(req.params.id as string);
      sendSuccess(res, allocation);
    } catch (error) {
      next(error);
    }
  }

  public static async returnAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const receivedByEmployeeId = req.user?.userId;
      if (!receivedByEmployeeId) {
        throw new BadRequestError('User context missing');
      }

      const returnRecord = await AllocationService.returnAsset(req.body, receivedByEmployeeId);
      sendSuccess(res, returnRecord, 'Asset returned successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestedByEmployeeId = req.user?.userId;
      if (!requestedByEmployeeId) {
        throw new BadRequestError('User context missing');
      }

      const request = await AllocationService.createTransferRequest(req.body, requestedByEmployeeId);
      sendSuccess(res, request, 'Asset transfer request submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async handleTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deciderEmployeeId = req.user?.userId;
      if (!deciderEmployeeId) {
        throw new BadRequestError('User context missing');
      }

      const { action } = req.body;
      const request = await AllocationService.handleTransferRequest(req.params.id as string, action, deciderEmployeeId);
      sendSuccess(res, request, `Transfer request has been ${action}ed successfully`);
    } catch (error) {
      next(error);
    }
  }
}
export default AllocationController;
