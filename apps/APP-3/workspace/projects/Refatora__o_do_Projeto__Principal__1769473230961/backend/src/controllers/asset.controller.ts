
import { Request, Response } from 'express';
import { AssetService } from '../services/asset.service';
import { LockdownSchema } from '../models/validation';

export const listAssets = async (req: Request, res: Response) => {
  try {
    const assets = await AssetService.getAllAssets();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
};

export const getAssetDetails = async (req: Request, res: Response) => {
  try {
    const asset = await AssetService.getAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: "ASSET_LOST" });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
};

export const triggerLockdown = async (req: Request, res: Response) => {
  try {
    // Validar ID
    LockdownSchema.parse({ assetId: req.params.id });
    
    const result = await AssetService.initiateLockdown(req.params.id);
    res.json({
      success: true,
      timestamp: new Date(),
      status: result.status
    });
  } catch (error) {
    res.status(500).json({ error: "PROTOCOL_FAILURE", details: error });
  }
};

export const getManifests = async (req: Request, res: Response) => {
  try {
    const docs = await AssetService.getAssetManifest(req.params.id);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "VAULT_ACCESS_ERROR" });
  }
};
