import { app, server, io } from "./lib/socket.js"; // Import io
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

// Initialize environment variables and database
dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// Attach io instance to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Log environment variables for verification
console.log('MongoDB URI:', process.env.MONGO_URI);
console.log('JWT Secret:', process.env.JWT_SECRET);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
