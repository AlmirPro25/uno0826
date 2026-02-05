
import { Request, Response, NextFunction } from 'express';
import * as assetService from '../services/asset.service';

export const getFleet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fleet = await assetService.getAllAssets();
    res.json(fleet);
  } catch (error) {
    next(error);
  }
};

export const getAssetDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const asset = await assetService.getAssetById(id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (error) {
    next(error);
  }
};
