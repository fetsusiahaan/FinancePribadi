export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    next();
  };
}
