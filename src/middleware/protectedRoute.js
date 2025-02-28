import jwt from "jsonwebtoken";
import User from "../models/user.js";

const protectedRoute = async (req, res, next) => {
  try {
    console.log("Cookies:", req.cookies);
    const token = req.cookies.jwt ;
    console.log("Token:", token);
    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);
   
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error during token verification:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default protectedRoute;
