import { getCanteens as getCanteensService } from "./canteen.service.js";

export const getCanteens = async (req, res, next) => {
  try {
    const canteens = await getCanteensService({
      CENTERID: req.query.CENTERID || null,
    });
    
    return res.status(200).json({
      SUCCESS: true,
      MESSAGE: "Canteens retrieved successfully",
      DATA: canteens,
    });
  } catch (error) {
    next(error);
  }
};
