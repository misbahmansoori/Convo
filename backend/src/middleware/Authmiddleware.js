import httpStatus from "http-status";
import { User } from "../models/userModel.js";

const authenticateToken = async (req, res, next) => {
  try {
    // Look for token in Headers (Bearer), Query params, or Body
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token || req.body.token;

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Access Denied: No token provided" });
    }

    // Check database for the user owning this token
    const user = await User.findOne({ token: token });

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired token" });
    }

    // Attach the user object securely to the request so controllers can use it
    req.user = user;
    
    // Move on to the actual controller function
    next(); 
  } catch (error) {
    console.error("Middleware Auth Error:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Authentication error" });
  }
};

export default authenticateToken;