import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();
connectDB();


const app = express();

const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use("api/messages", messageRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
