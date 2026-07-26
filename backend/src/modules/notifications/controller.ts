import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './service';
import { sendSuccess } from '../../utils/responseFormatter';
import { getPaginationOptions } from '../../utils/pagination';
import { BadRequestError } from '../../errors/customErrors';

export class NotificationController {
  public static async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorEmployeeId = req.user?.employeeId;
      const notification = await NotificationService.sendNotification(req.body, creatorEmployeeId);
      sendSuccess(res, notification, 'Notification sent successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        throw new BadRequestError('User context missing');
      }

      const pagination = getPaginationOptions(req.query.page, req.query.limit);
      const unreadOnly = req.query.unreadOnly === 'true';

      const notifications = await NotificationService.getEmployeeNotifications(employeeId, pagination, unreadOnly);
      sendSuccess(res, notifications);
    } catch (error) {
      next(error);
    }
  }

  public static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        throw new BadRequestError('User context missing');
      }

      const recipient = await NotificationService.markRead(req.params.id as string, employeeId);
      sendSuccess(res, recipient, 'Notification marked as read successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        throw new BadRequestError('User context missing');
      }

      await NotificationService.markAllRead(employeeId);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }
}
export default NotificationController;
