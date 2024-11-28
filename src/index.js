import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

connectDB();
dotenv.config();


const app = express();

const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",  // Frontend URL
  credentials: true,  // Allow sending cookies
}));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);  // Fix the route here

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
