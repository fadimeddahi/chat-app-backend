import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  message: {
    type: String,
    required: function() {
      return !this.image; // Message is required if no image
    }
  },
  image: { // Changed from Image to image
    type: String,
    default: ""
  }
}, { timestamps: true });

export const Message = mongoose.model("Message", messageSchema);