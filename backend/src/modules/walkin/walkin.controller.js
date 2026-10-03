import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { WalkinService } from "./walkin.service.js";

export class WalkinController {
    // GET /api/walkin/employee-lookup
    static employeeLookup = asyncHandler(async (req, res) => {
        const data = await WalkinService.employeeLookup(req.validated.query.query);
        return sendSuccess(res, data, data ? "Employee found" : "Employee not found");
    });

    // GET /api/walkin/visitor-lookup
    static visitorLookup = asyncHandler(async (req, res) => {
        const data = await WalkinService.visitorLookup(req.validated.query.query);
        return sendSuccess(res, data, "Visitors retrieved successfully");
    });

    // POST /api/walkin/register-visitor
    static registerVisitor = asyncHandler(async (req, res) => {
        const data = await WalkinService.registerVisitor(req.validated.body, req.user.USERID);
        return sendSuccess(res, data, "Visitor registered successfully", 201);
    });

    // GET /api/walkin/active-menu
    static activeMenu = asyncHandler(async (req, res) => {
        const { canteenId, ctypeCode } = req.validated.query;
        const data = await WalkinService.getActiveMenu(canteenId, ctypeCode);
        return sendSuccess(res, data, "Active menu fetched successfully");
    });

    // POST /api/walkin/serve
    static serveWalkin = asyncHandler(async (req, res) => {
        const data = await WalkinService.serveWalkin(req.validated.body, req.user.USERID);
        return sendSuccess(res, data, "Walk-in meal served successfully", 201);
    });
}
