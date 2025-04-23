import User from "../models/user.js";
import {Message}from "../models/message.js";
import { v2 as cloudinary } from "cloudinary";
import { getReceiverSocketId } from "../lib/socket.js";

export const getUsers = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUser } })
      .select("-password -__v")
      .lean();

    const onlineUsers = req.app.locals.userSocketMap || {};
    const usersWithStatus = users.map(user => ({
      ...user,
      isOnline: !!onlineUsers[user._id.toString()]
    }));

    res.status(200).json({ users: usersWithStatus });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
    .sort({ createdAt: 1 })
    .populate('senderId', 'username profilePicture')
    .populate('receiverId', 'username profilePicture');

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ error: "Failed to load messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { message, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    console.log("sendMessage function executed");
    console.log("Message:", message);
    console.log("Image:", image);
    console.log("Receiver ID:", receiverId);
    console.log("Sender ID:", senderId);

    // Check if req.io is available
    console.log("Socket.io instance:", req.io); 

    if (!message?.trim() && !image) {
      return res.status(400).json({ error: "Message content required" });
    }

    let imageUrl = "";
    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image, {
        folder: 'chat_attachments',
        quality: 'auto:good'
      });
      imageUrl = uploadedResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: message?.trim(),
      image: imageUrl
    });

    const savedMessage = await newMessage.save();
    console.log("Message saved:", savedMessage);

    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'username profilePicture')
      .populate('receiverId', 'username profilePicture')
      .lean(); // Convert to plain object

    // Check if req.io is available
    if (!req.io) {
      console.error("Socket.io instance is undefined!");
      return res.status(500).json({ error: "Socket.io instance is not available" });
    }

    const io = req.io;
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    console.log("Receiver Socket ID:", receiverSocketId);
    console.log("Sender Socket ID:", senderSocketId);

    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", populatedMessage);
    if (senderSocketId) io.to(senderSocketId).emit("newMessage", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};






