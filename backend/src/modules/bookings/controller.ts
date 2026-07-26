import { Request, Response, NextFunction } from 'express';
import { BookingService } from './service';
import { sendSuccess } from '../../utils/responseFormatter';
import { getPaginationOptions } from '../../utils/pagination';
import { BadRequestError } from '../../errors/customErrors';
import { ROLES } from '../../constants/appConstants';

export class BookingController {
  // --- Resources ---

  public static async createResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resource = await BookingService.createResource(req.body);
      sendSuccess(res, resource, 'Bookable resource registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getResourceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resource = await BookingService.getResourceById(req.params.id as string);
      sendSuccess(res, resource);
    } catch (error) {
      next(error);
    }
  }

  public static async getAllResources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resources = await BookingService.getAllResources();
      sendSuccess(res, resources);
    } catch (error) {
      next(error);
    }
  }

  // --- Bookings ---

  public static async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        throw new BadRequestError('User context missing');
      }

      const booking = await BookingService.createBooking(req.body, employeeId);
      sendSuccess(res, booking, 'Resource booked successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await BookingService.getBookingById(req.params.id as string);
      sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  public static async getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = getPaginationOptions(req.query.page, req.query.limit);
      const resourceId = req.query.resourceId as string | undefined;
      const employeeId = req.query.employeeId as string | undefined;

      const bookings = await BookingService.getAllBookings(pagination, resourceId, employeeId);
      sendSuccess(res, bookings);
    } catch (error) {
      next(error);
    }
  }

  public static async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = req.user?.employeeId;
      const roles = req.user?.roles || [];
      if (!employeeId) {
        throw new BadRequestError('User context missing');
      }

      const isAdmin = roles.includes(ROLES.ADMIN) || roles.includes(ROLES.ASSET_MANAGER);
      const cancelled = await BookingService.cancelBooking(req.params.id as string, req.body.cancelledReason, employeeId, isAdmin);
      
      sendSuccess(res, cancelled, 'Booking cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}
export default BookingController;
