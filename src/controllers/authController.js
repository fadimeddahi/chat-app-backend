// controllers/authController.js
import express from "express";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import cloudinary from "../lib/cloudinary.js";
import { Readable } from "stream";

// SIGNUP
export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create new user
    const newUser = await User.create({ name, email, password: hashedPassword });
    console.log(newUser);

    // Generate JWT and set cookie (adjust cookie name as desired)
    const token = generateToken(newUser._id);
    console.log(token);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: false,
    });

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      profilePic: newUser.profilePic, // might be undefined initially
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGIN
// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare passwords - use synchronous version for consistency with signup
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token and set cookie - make consistent with signup
    const token = generateToken(user._id);
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    

    // Return user data just like in signup
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || "", // Ensure this isn't undefined
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  // Adjust cookie name to match signup/login if needed.
  res.clearCookie("jwt");
  res.status(200).json({ message: "User logged out successfully" });
};

// UPDATE PROFILE (Upload Profile Picture)
export const updateProfile = async (req, res) => {
  try {
    console.log("User Object in Request:", req.user);
    console.log("Request Body:", req.body);

    // Use the key "profilePic" consistently
    const { profilePic } = req.body;
    const userId = req.user?._id;
    if (!userId) {
      console.error("No user ID found in request");
      return res.status(400).json({ error: "Invalid request" });
    }
    if (!profilePic) {
      console.error("No profile picture provided");
      return res.status(400).json({ error: "Please provide an image" });
    }

    // Trim and validate the Base64 string
    const trimmed = profilePic.trim();
    const matches = trimmed.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches) {
      console.error("Invalid image format received. First 100 chars:", trimmed.slice(0, 100));
      return res.status(400).json({ error: "Invalid image format" });
    }
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    console.log("Buffer length:", buffer.length);

    // Upload using Cloudinary's upload_stream
    const uploadFromBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profile_pictures", resource_type: "auto" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return reject(error);
            }
            resolve(result);
          }
        );
        // Pipe the buffer stream to Cloudinary
        Readable.from(buffer).pipe(stream);
      });
    };

    console.log("Uploading image to Cloudinary via stream...");
    const uploadResponse = await uploadFromBuffer(buffer);
    console.log("Cloudinary Upload Response:", uploadResponse);

    // Update the user's profilePic field in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    ).lean();

    if (!updatedUser) {
      console.error("User not found in database");
      return res.status(404).json({ error: "User not found" });
    }
    console.log("Updated User Data:", updatedUser);
    res.status(200).json({
      message: "Profile picture updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// CHECK AUTHENTICATION
export const check = async (req, res) => {
  try {
    console.log("Checking authentication...");
    // Fetch full user data from MongoDB and include createdAt
    const user = await User.findById(req.user._id).select("name email profilePic createdAt");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log("Authenticated User:", user);
    res.status(200).json({ user });
  } catch (error) {
    console.error("Auth Check Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
