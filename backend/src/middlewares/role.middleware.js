import ApiError from "../utils/apiError.js";

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role (${req.user?.role}) is not allowed to access this resource`
      );
    }
    next();
  };
};

export default authorizeRoles;
