import { Request, Response, NextFunction } from 'express';
import { AssetService } from './service';
import { sendSuccess } from '../../utils/responseFormatter';
import { EmployeeRepository } from '../employees/repository';
import { getPaginationOptions } from '../../utils/pagination';
import { AssetStatus } from '@prisma/client';
import { getFileUrl } from '../../utils/fileUpload';
import { BadRequestError } from '../../errors/customErrors';

export class AssetController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = req.user?.userId
        ? await EmployeeRepository.findByUserId(req.user.userId)
        : null;
      const asset = await AssetService.createAsset(req.body, employee?.id);
      sendSuccess(res, asset, 'Asset registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await AssetService.getAssetById(req.params.id as string);
      sendSuccess(res, asset);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = getPaginationOptions(req.query.page, req.query.limit);
      const filters = {
        search: req.query.search as string | undefined,
        status: req.query.status as AssetStatus | undefined,
        categoryId: req.query.categoryId as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        locationId: req.query.locationId as string | undefined,
      };

      const assets = await AssetService.getAllAssets(pagination, filters);
      sendSuccess(res, assets);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const changedByEmployeeId = req.user?.userId;
      const reason = req.body.statusChangeReason as string | undefined;

      const asset = await AssetService.updateAsset(req.params.id as string, req.body, changedByEmployeeId, reason);
      sendSuccess(res, asset, 'Asset details updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AssetService.deleteAsset(req.params.id as string);
      sendSuccess(res, null, 'Asset deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async addImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file uploaded');
      }

      const imageUrl = getFileUrl(req.file.filename);
      const caption = req.body.caption as string | undefined;
      const isPrimary = req.body.isPrimary === 'true' || req.body.isPrimary === true;

      const image = await AssetService.addAssetImage(req.params.id as string, imageUrl, caption, isPrimary);
      sendSuccess(res, image, 'Asset image added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No document file uploaded');
      }

      const fileUrl = getFileUrl(req.file.filename);
      const documentName = req.body.documentName || req.file.originalname;
      const documentType = req.body.documentType || 'other';
      const fileSizeBytes = req.file.size;
      const employeeId = req.user?.userId;

      const doc = await AssetService.addAssetDocument(
        req.params.id as string,
        documentName,
        documentType,
        fileUrl,
        fileSizeBytes,
        employeeId
      );
      sendSuccess(res, doc, 'Asset document added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getDepreciation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dep = await AssetService.getDepreciation(req.params.id as string);
      sendSuccess(res, dep);
    } catch (error) {
      next(error);
    }
  }
}
export default AssetController;
