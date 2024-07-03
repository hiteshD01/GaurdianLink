const authorizeRoles = (...roles) => {
    return (req, res, next) => {
      console.log("Request Object:", req.user);
      const { role } = req.user;
  
      if (!role || !roles.includes(role)) {
        return res.status(403).json({
          message: "Access denied. You do not have permission to access this resource.",
        });
      }
  
      next();
    };
  };
  
  module.exports = authorizeRoles;
  