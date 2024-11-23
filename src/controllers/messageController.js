import User from "../models/user.js";
import Message from "../models/message.js";
import { v2 as cloudinary } from "cloudinary";

export const getUsers = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUser } }).select(
      "-password"
    );

    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
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
    });

    res.status(200).json({ messages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { message, Image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl = "";
    if (Image) {
      const uploadedResponse = await cloudinary.uploader.upload(Image);
      imageUrl = uploadedResponse.url;
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      message,
      Image: imageUrl,
    });

    await newMessage.save();
    res.status(200).json({ message: "Message sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};
