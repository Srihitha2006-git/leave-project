const User = require("../models/User");

const requireRole = (...roles) => async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ message: "User id missing" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { requireRole };