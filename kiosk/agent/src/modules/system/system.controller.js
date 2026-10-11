import * as SystemService from "./system.service.js";
import * as SyncService from "../sync/sync.service.js";
import { sendSuccess } from "../../common/responses/apiResponse.js";

export const getHealthController = async (req, res, next) => {
  try {
    const health = SystemService.getSystemHealth();
    return sendSuccess(res, health, "Kiosk terminal healthy");
  } catch (error) {
    next(error);
  }
};

export const triggerSyncController = async (req, res, next) => {
  try {
    const pushResult = await SyncService.pushOutboxBatch();
    const pullResult = await SyncService.pullBootstrapPackage();
    return sendSuccess(
      res,
      { push: pushResult, pull: pullResult },
      "Manual synchronization completed"
    );
  } catch (error) {
    next(error);
  }
};
