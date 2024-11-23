import express from "express";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }

    // Check if the user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create a new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate JWT
    const token = generateToken(newUser._id);

    // Set the token as a cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevent access via client-side scripts
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "none", // Adjust for cross-origin requests
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
    });

    // Send success response
    res.status(201).json({
      message: "User created successfully",
      token, // Optionally include the token in the response
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }

    // Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check if the password is correct

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken(user._id);

    // Set the token as a cookie

    res.cookie("token", token, {
      httpOnly: true, // Prevent access via client-side scripts
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "none", // Adjust for cross-origin requests
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
    });

    // Send success response
    res.status(200).json({
      message: "User logged in successfully",
      token, // Optionally include the token in the response
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "User logged out successfully" });
};

export const update = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    const userId = req.user._id;

    if (!profilePicture) {
      return res.status(400).json({ error: "Please provide an image" });
    }

    const uploadedResponse = await cloudinary.uploader.upload(profilePicture);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: uploadedResponse.secure_url },
      { new: true }
    );

    res
      .status(200)
      .json({
        message: "Profile picture updated successfully",
        user: updatedUser,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const check = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}



